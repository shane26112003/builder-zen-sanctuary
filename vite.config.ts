import { defineConfig, Plugin } from "vite";
import { createServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./public", "./server"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**"],
    },
  },
  build: {
    outDir: "dist/spa",
    rollupOptions: {
      input: {
        main: "./index.html",
        login: "./public/index.html",
        userType: "./public/user-type.html",
        booking: "./public/booking.html"
      },
    },
  },
  plugins: [expressPlugin()],
  publicDir: "public",
  root: ".",
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      const app = createServer();

      // Add Express app as middleware to Vite dev server
      server.middlewares.use(app);
    },
  };
}
