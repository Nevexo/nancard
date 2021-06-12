// Logging utility

import pino from "pino";

export const log = pino({
  name: "nancard-ledger",
  level: 10 || process.env.LOG_LEVEL
})