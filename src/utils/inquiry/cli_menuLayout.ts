import { ask } from "../prompt.js";

export async function makeMenu(title: string, content: string, defaultOpt: string) {
  return await ask(`${('--' + title).padEnd(30, '-')}${content}What to Do Now ? `, defaultOpt);
}