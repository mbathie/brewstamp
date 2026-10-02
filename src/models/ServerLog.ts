import mongoose from "mongoose";
import { SERVER_LOG_RETENTION_DAYS } from "../lib/server-log-pure";

// Server console output, kept for a week (src/lib/server-log.ts writes it).
// One document per flush: a gzipped JSON array of { t, l, m } lines plus
// per-level counts, so a reader can skip batches without unzipping them.
// The platform's own logs only keep a short tail, which is how a merchant's
// failed checkout went unexplained; this is the record to check instead.
const serverLogSchema = new mongoose.Schema(
  {
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    count: { type: Number, default: 0 },
    levels: {
      log: { type: Number, default: 0 },
      warn: { type: Number, default: 0 },
      error: { type: Number, default: 0 },
      http: { type: Number, default: 0 },
      notfound: { type: Number, default: 0 },
    },
    lines: { type: Buffer, required: true },
    bytes: { type: Number, default: 0 },
    commit: { type: String },
    host: { type: String },
  },
  { timestamps: true },
);

serverLogSchema.index({ from: -1 });
// Mongo's TTL monitor deletes each batch a week after its last line.
serverLogSchema.index({ to: 1 }, { expireAfterSeconds: SERVER_LOG_RETENTION_DAYS * 86_400 });

const ServerLog = mongoose.models.ServerLog || mongoose.model("ServerLog", serverLogSchema);
export default ServerLog;
