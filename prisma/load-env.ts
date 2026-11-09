// Loads .env / .env.local before anything else (Prisma and the crypto helpers
// read their configuration from the environment at import time).
import { loadEnvConfig } from "@next/env"

loadEnvConfig(process.cwd())
