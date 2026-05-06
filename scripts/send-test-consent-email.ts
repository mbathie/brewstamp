import "dotenv/config";
import { sendCustomerConsentEmail } from "../src/lib/email";

async function main() {
  const result = await sendCustomerConsentEmail({
    to: "mbathie@gmail.com",
    shopName: "Bennett St Dairy",
    location: "Bondi, Sydney",
  });
  console.log(result);
  process.exit(result.success ? 0 : 1);
}

main();
