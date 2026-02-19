import { build } from "esbuild";

await build({
  entryPoints: ["src/cli.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "out/cli.js",
  target: "node18",
  treeShaking: true,
  banner: {
    //js: "#!/usr/bin/env node"
  }
});
