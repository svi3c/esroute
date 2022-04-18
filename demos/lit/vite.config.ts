import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3002,
  },
  build: {
    lib: {
      entry: "src/demo.ts",
      formats: ["es"],
    },
    rollupOptions: {
      external: /^lit/,
    },
  },
});
