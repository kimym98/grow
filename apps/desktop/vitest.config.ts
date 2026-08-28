import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "jsdom",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", "dist/**", ".next/**"],
  },
})
