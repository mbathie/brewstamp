"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// MUST be first: loads .env.local into process.env before any import below
// reads it at module-load time (e.g. lib/stripe.ts via the billing cron).
require("./src/lib/load-env");
const http_1 = require("http");
const url_1 = require("url");
const next_1 = __importDefault(require("next"));
const ws_1 = require("ws");
const crypto_1 = require("crypto");
const drip_cron_1 = require("./src/lib/drip-cron");
const billing_cron_1 = require("./src/lib/billing-cron");
const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);
// Explicitly pin Next's project dir so the workspace root can't drift up to
// a parent (which was resolving `tailwindcss` from the wrong place in dev).
// Use process.cwd() not __dirname — in production this file is compiled to
// dist/server.js, where __dirname would point at <project>/dist instead of
// the project root and Next.js wouldn't find the .next build output.
//
// Note: don't pass `hostname` to next(). It sets Next's canonical hostname
// used to reconstruct URLs from req.url, and pinning it to 0.0.0.0 caused
// post-login redirects to land on 0.0.0.0:3000 instead of localhost:3000.
// The HTTP server still binds to all interfaces by default (see listen
// below) so phones on the same LAN can still reach the dev server.
const app = (0, next_1.default)({ dev, port, dir: process.cwd() });
const channels = new Map();
function getOrCreateChannel(shopCode) {
    if (!channels.has(shopCode)) {
        channels.set(shopCode, { merchant: null, customers: new Map() });
    }
    return channels.get(shopCode);
}
// Broadcast merchant online/offline state to every customer connected to
// this shop's channel. The customer UI uses this to surface "shop is
// offline right now" instead of having stamp requests silently hang.
function broadcastMerchantPresence(shopCode, online) {
    const channel = channels.get(shopCode);
    if (!channel)
        return;
    const payload = JSON.stringify({ type: "presence", merchant: online });
    for (const ws of channel.customers.values()) {
        if (ws.readyState === ws_1.WebSocket.OPEN)
            ws.send(payload);
    }
}
app.prepare().then(() => {
    const handle = app.getRequestHandler();
    const server = (0, http_1.createServer)((req, res) => {
        const parsedUrl = (0, url_1.parse)(req.url, true);
        // Set brewstamp_id cookie for /s/ routes if not present
        if (parsedUrl.pathname?.startsWith("/s/")) {
            const cookies = req.headers.cookie || "";
            const hasId = cookies.split(";").some((c) => c.trim().startsWith("brewstamp_id="));
            if (!hasId) {
                const id = (0, crypto_1.randomUUID)();
                const maxAge = 60 * 60 * 24 * 365 * 5; // 5 years
                const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
                res.setHeader("Set-Cookie", `brewstamp_id=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`);
            }
        }
        handle(req, res, parsedUrl);
    });
    // Use noServer mode so we control which upgrades go to ws vs Next.js HMR
    const wss = new ws_1.WebSocketServer({ noServer: true });
    // Next.js (esp. v16 dev mode) attaches its own `upgrade` listener lazily,
    // sometimes before we add ours, sometimes after, and may re-attach during
    // HMR. If both listeners run, Next's destroys the socket on unknown paths
    // (including /_ws). Removing its listener once isn't enough. Instead we
    // intercept at `server.emit` so /_ws upgrades are handled exclusively by
    // us and never propagate to any other listener. Non-/_ws upgrades (HMR)
    // pass through unchanged.
    const origEmit = server.emit.bind(server);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    server.emit = function (event, ...args) {
        if (event === "upgrade") {
            const [req, socket, head] = args;
            const url = new URL(req.url, `http://${req.headers.host}`);
            if (url.pathname === "/_ws") {
                wss.handleUpgrade(req, socket, head, (ws) => {
                    wss.emit("connection", ws, req);
                });
                return true;
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return origEmit(event, ...args);
    };
    wss.on("connection", (ws, req) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const shopCode = url.searchParams.get("shop");
        const role = url.searchParams.get("role"); // "merchant" | "customer"
        const clientId = url.searchParams.get("clientId");
        if (!role || !shopCode) {
            ws.close(1008, "Missing required parameters");
            return;
        }
        // Heartbeat: the periodic ping below keeps the connection alive through
        // idle proxy timeouts (DigitalOcean closes quiet WebSockets), and the pong
        // marks the socket alive so the sweep can terminate ones that have gone
        // away without a clean close (e.g. a phone that dropped off Wi-Fi).
        ws.isAlive = true;
        ws.on("pong", () => {
            ws.isAlive = true;
        });
        const channel = getOrCreateChannel(shopCode);
        if (role === "merchant") {
            channel.merchant = ws;
            // Tell any waiting customers the shop just came online.
            broadcastMerchantPresence(shopCode, true);
        }
        else if (role === "customer" && clientId) {
            channel.customers.set(clientId, ws);
        }
        ws.on("message", (raw) => {
            try {
                const msg = JSON.parse(raw.toString());
                handleMessage(shopCode, role, clientId, msg);
            }
            catch {
                // ignore malformed messages
            }
        });
        ws.on("error", (err) => console.error(`[ws] error ${role}/${shopCode}: ${err.message}`));
        ws.on("close", () => {
            // Only clear the reference if this socket is still the current one.
            // A newer connection may have already replaced it (e.g. React Strict
            // Mode double-mount or fast reconnect), and we must not null it out.
            if (role === "merchant" && channel.merchant === ws) {
                channel.merchant = null;
            }
            else if (clientId && channel.customers.get(clientId) === ws) {
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
    // Sweep all sockets every 30s: terminate any that didn't pong since the last
    // sweep, and ping the rest. Terminating a dead merchant socket also clears
    // its channel reference (via the "close" handler) so presence stays honest
    // and the next connection can register cleanly.
    const HEARTBEAT_INTERVAL = 30000;
    const heartbeat = setInterval(() => {
        wss.clients.forEach((ws) => {
            const live = ws;
            if (live.isAlive === false) {
                ws.terminate();
                return;
            }
            live.isAlive = false;
            try {
                ws.ping();
            }
            catch {
                // socket already gone; the sweep will terminate it next round
            }
        });
    }, HEARTBEAT_INTERVAL);
    wss.on("close", () => clearInterval(heartbeat));
    function handleMessage(shopCode, role, clientId, msg) {
        const channel = channels.get(shopCode);
        if (!channel)
            return;
        switch (msg.type) {
            case "stamp-request:new":
                // Customer created a stamp request, forward to merchant
                if (channel.merchant && channel.merchant.readyState === ws_1.WebSocket.OPEN) {
                    channel.merchant.send(JSON.stringify(msg));
                }
                break;
            case "stamp-request:approved":
            case "stamp-request:rejected": {
                // Merchant responded to a request, forward to the specific customer
                const customerId = msg.customerId;
                const customerWs = channel.customers.get(customerId);
                if (customerWs && customerWs.readyState === ws_1.WebSocket.OPEN) {
                    customerWs.send(JSON.stringify(msg));
                }
                break;
            }
            case "stamp-request:cancelled-by-customer":
                // Customer closed their tab / navigated away while waiting for the
                // attendant — let the merchant clear the modal instead of staring at
                // a request that will never resolve.
                if (channel.merchant && channel.merchant.readyState === ws_1.WebSocket.OPEN) {
                    channel.merchant.send(JSON.stringify(msg));
                }
                break;
        }
    }
    server.listen(port, () => {
        console.log(`> Ready on http://localhost:${port}`);
        (0, drip_cron_1.startDripCron)();
        (0, billing_cron_1.startBillingCron)();
    });
});
