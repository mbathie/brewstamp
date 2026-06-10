// Load environment variables (.env, .env.local, …) into process.env BEFORE
// any boot-time import that reads them at module-load time — notably
// lib/stripe.ts, which is pulled in by the billing cron at server startup.
//
// Next.js loads these files for request handlers, but the custom server in
// server.ts imports the cron modules before Next initialises, so without this
// the Stripe client constructs with an undefined key and the process crashes.
// This module is imported FIRST in server.ts so it runs ahead of those
// imports. Using @next/env keeps resolution identical to Next's runtime.
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
