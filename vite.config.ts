import devServer from "@hono/vite-dev-server";
import path from "path";
const __dirname = import.meta.dirname;
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { inspectAttr } from "kimi-plugin-inspect-react";

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const staticDemo = env.VITE_STATIC_DEMO === "true";

  return {
    base: env.VITE_BASE_PATH || "/",
    plugins: [
      ...(!staticDemo
        ? [devServer({ entry: "api/boot.ts", exclude: [/^\/(?!api\/).*$/] })]
        : []),
      ...(command === "serve" && mode !== "production" ? [inspectAttr()] : []),
      react(),
    ],
    server: {
      port: 3000,
    },
    resolve: {
      alias: [
        ...(staticDemo
          ? [
              {
                find: "@/providers/trpc",
                replacement: path.resolve(
                  __dirname,
                  "./src/lib/staticTrpc.tsx"
                ),
              },
            ]
          : []),
        { find: "@", replacement: path.resolve(__dirname, "./src") },
        {
          find: "@contracts",
          replacement: path.resolve(__dirname, "./contracts"),
        },
        { find: "@db", replacement: path.resolve(__dirname, "./db") },
        { find: "db", replacement: path.resolve(__dirname, "./db") },
      ],
    },
    envDir: path.resolve(__dirname),
    build: {
      outDir: path.resolve(__dirname, "dist/public"),
      emptyOutDir: true,
    },
  };
});
