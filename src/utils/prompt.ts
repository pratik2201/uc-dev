import { TemplateMaker } from "ap-shared-core/out/template/TemplateMaker.js";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

export function ask(question: string, def?: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const hint = def ? ` (${def})` : "";

  return new Promise(resolve => {
    rl.question(`${question}${hint}: `, ans => {
      rl.close();
      resolve(ans.trim() || def || "");
    });
  });
}

export async function askYesNo(
  question: string,
  def = true,
  autoYes = false
): Promise<boolean> {
  if (autoYes) return true;

  const hint = def ? "Y/n" : "y/N";
  const ans = (await ask(`${question} [${hint}]`)).toLowerCase();

  if (!ans) return def;
  return ans.startsWith("y");
}
export function runTemplate(tptPath: string, importmeta: string, row: any) {
  const tpath = resolve(dirname(fileURLToPath(importmeta)), tptPath);
  let tptContent = readFileSync(tpath, 'utf8');
  const tmaker = new TemplateMaker();
  const callback = tmaker.compileTemplate(tptContent);
  return callback(row);
}
// import readline from "node:readline";
// export function ask(question: string, def: string): Promise<string> {
//     const rl = readline.createInterface({
//         input: process.stdin,
//         output: process.stdout
//     });

//     return new Promise(resolve => {
//         rl.question(`${question} (${def}): `, answer => {
//             rl.close();
//             resolve(answer.trim() || def);
//         });
//     });
// }

// export function askYesNo(question: string, def = true): Promise<boolean> {
//     const hint = def ? "Y/n" : "y/N";

//     return ask(`${question} [${hint}]`, "").then(v => {
//         if (!v) return def;
//         return v.toLowerCase().startsWith("y");
//     });
// }