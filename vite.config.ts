import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Project Pages serves from /<repo>/ — keep asset paths relative to it.
  base: "/software-dev-sim-web/",
  plugins: [preact(), tailwindcss()],
});
