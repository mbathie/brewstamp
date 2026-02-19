import { createServer, IncomingMessage } from "http";
import { parse } from "url";
import next from "next";
import { WebSocketServer, WebSocket } from "ws";
import { Socket } from "net";
import { randomUUID } from "crypto";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });

interface ShopChannel {
  merchant: WebSocket | null;
  customers: Map<string, WebSocket>;
}

const channels = new Map<string, ShopChannel>();

function getOrCreateChannel(shopCode: string): ShopChannel {
  if (!channels.has(shopCode)) {
    channels.set(shopCode, { merchant: null, customers: new Map() });
  }
  return channels.get(shopCode)!;
}

app.prepare().then(() => {
  const handle = app.getRequestHandler();
  const upgrade = app.getUpgradeHandler();

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);

    // Set brewstamp_id cookie for /s/ routes if not present
    if (parsedUrl.pathname?.startsWith("/s/")) {
      const cookies = req.headers.cookie || "";
      const hasId = cookies.split(";").some((c) => c.trim().startsWith("brewstamp_id="));
      if (!hasId) {
        const id = randomUUID();
        const maxAge = 60 * 60 * 24 * 365 * 5; // 5 years
        const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
        res.setHeader(
          "Set-Cookie",
          `brewstamp_id=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`
        );
      }
    }

    handle(req, res, parsedUrl);
  });

  // Use noServer mode so we control which upgrades go to ws vs Next.js HMR
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req: IncomingMessage, socket: Socket, head: Buffer) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);

    // Only handle upgrades on our /_ws path — Turbopack won't touch this
    if (url.pathname === "/_ws") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    }
    // All other upgrades (HMR etc.) fall through to Next.js's own handler
  });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const shopCode = url.searchParams.get("shop")!;
    const role = url.searchParams.get("role"); // "merchant" | "customer"
    const clientId = url.searchParams.get("clientId");

    if (!role || !shopCode) {
      ws.close(1008, "Missing required parameters");
      return;
    }

    const channel = getOrCreateChannel(shopCode);

    if (role === "merchant") {
      channel.merchant = ws;
    } else if (role === "customer" && clientId) {
      channel.customers.set(clientId, ws);
    }

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        handleMessage(shopCode, role, clientId, msg);
      } catch {
        // ignore malformed messages
      }
    });

    ws.on("close", () => {
      if (role === "merchant") {
        channel.merchant = null;
      } else if (clientId) {
        channel.customers.delete(clientId);
      }

      // Clean up empty channels
      if (!channel.merchant && channel.customers.size === 0) {
        channels.delete(shopCode);
      }
    });

    // Send a connection acknowledgement
    ws.send(JSON.stringify({ type: "connected", role, shopCode }));
  });

  function handleMessage(
    shopCode: string,
    role: string,
    clientId: string | null,
    msg: any
  ) {
    const channel = channels.get(shopCode);
    if (!channel) return;

    switch (msg.type) {
      case "stamp-request:new":
        // Customer created a stamp request, forward to merchant
        if (channel.merchant && channel.merchant.readyState === WebSocket.OPEN) {
          channel.merchant.send(JSON.stringify(msg));
        }
        break;

      case "stamp-request:approved":
      case "stamp-request:rejected": {
        // Merchant responded to a request, forward to the specific customer
        const customerId = msg.customerId;
        const customerWs = channel.customers.get(customerId);
        if (customerWs && customerWs.readyState === WebSocket.OPEN) {
          customerWs.send(JSON.stringify(msg));
        }
        break;
      }
    }
  }

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
