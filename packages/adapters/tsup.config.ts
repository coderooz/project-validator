import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/next-adapter.ts", "src/react-adapter.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2022",
  outDir: "dist",
  bundle: true,
  skipNodeModulesBundle: true,
});
