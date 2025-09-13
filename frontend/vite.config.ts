import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.http2" });
// 또는 dotenv.config({ path: ".env.http2" });

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    https: {
      key: process.env.SSL_KEY_FILE
        ? fs.readFileSync(process.env.SSL_KEY_FILE)
        : undefined,
      cert: process.env.SSL_CRT_FILE
        ? fs.readFileSync(process.env.SSL_CRT_FILE)
        : undefined,
    },
  },
});
