import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/humanscaleexplorer/",
  plugins: [react()],
  assetsInclude: ['**/*.glb'],
});
