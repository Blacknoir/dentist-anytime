import { defineConfig } from "vitest/config"
import path from "path"

// The tests never touch the production database: they use the isolated
// Postgres of the test environment (see tests/README.md).
const testDatabaseUrl =
    process.env.TEST_DATABASE_URL || "postgresql://dentora:dentora_test@localhost:5433/dentora_test?schema=public"

export default defineConfig({
    resolve: {
        alias: {
            "@": path.resolve(import.meta.dirname, "./src"),
            "server-only": path.resolve(import.meta.dirname, "./tests/mocks/server-only.ts"),
            "next/server": path.resolve(import.meta.dirname, "./tests/mocks/next-server.ts"),
        },
    },
    test: {
        environment: "node",
        globals: true,
        include: ["tests/**/*.test.ts"],
        setupFiles: ["./tests/setup.ts"],
        env: {
            DATABASE_URL: testDatabaseUrl,
            AUTH_SECRET: "test-secret-for-the-lab-tests",
            LAB_FILE_ENCRYPTION_KEY: "test-encryption-key",
            LAB_EVIDENCE_SECRET: "test-evidence-secret",
            NEXT_PUBLIC_APP_URL: "http://localhost:3000",
            LAB_STORAGE_PROVIDER: "db",
        },
        sequence: {
            hooks: "list",
        },
        fileParallelism: false,
        testTimeout: 30000,
    },
})
