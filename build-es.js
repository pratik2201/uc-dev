import { build } from "esbuild";

await build({
  entryPoints: ["src/cli.ts"],
  
  bundle: true,
  treeShaking:true,
  platform: "node",
  format: "esm",
  outdir:"out",
  target: "node18" 
});
