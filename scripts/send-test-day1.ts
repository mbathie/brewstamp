import "dotenv/config";
import { sendDay1WelcomeEmail } from "../src/lib/email";

async function main() {
  const result = await sendDay1WelcomeEmail({
    to: "mbathie@gmail.com",
    merchantName: "Mark",
    shopName: "Test Cafe",
  });
  console.log(result);
  process.exit(result.success ? 0 : 1);
}

main();
