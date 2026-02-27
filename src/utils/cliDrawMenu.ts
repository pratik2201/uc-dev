import readline from "node:readline";

export type MenuItem = {
  label: string;
  action?: () => Promise<void> | void;
  submenu?: CliMenu;
};

export class CliMenu {
  private items: MenuItem[];
  private title: string;
  private index = 0;
  private keyHandler?: (str: string, key: any) => void;

  constructor(title: string, items: MenuItem[]) {
    this.title = title;
    this.items = items;
  }

  async start(): Promise<void> {
    readline.emitKeypressEvents(process.stdin);

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }

    this.attachListener();
    this.draw();
  }

  private attachListener() {
    this.keyHandler = async (_: any, key: any) => {
      if (key.name === "up") {
        this.index = (this.index - 1 + this.items.length) % this.items.length;
        this.draw();
      }

      if (key.name === "down") {
        this.index = (this.index + 1) % this.items.length;
        this.draw();
      }

      if (key.name === "return") {
        await this.executeCurrent();
      }

      if (key.ctrl && key.name === "c") {
        process.exit();
      }
    };

    process.stdin.on("keypress", this.keyHandler);
  }

  private detachListener() {
    if (this.keyHandler) {
      process.stdin.removeListener("keypress", this.keyHandler);
    }
  }

  private async executeCurrent() {
    const selected = this.items[this.index];

    // 🔥 Disable menu controls
    this.detachListener();
    process.stdin.setRawMode(false);

    if (selected.submenu) {
      await selected.submenu.start();
    } else if (selected.action) {
      await selected.action();
    }

    // 🔥 Re-enable menu controls
    process.stdin.setRawMode(true);
    this.attachListener();
    this.draw();
  }

  private draw() {
    console.clear();
    console.log(`=== ${this.title} ===\n`);

    this.items.forEach((item, i) => {
      if (i === this.index) {
        console.log(`❯ \x1b[36m${item.label}\x1b[0m`);
      } else {
        console.log(`  ${item.label}`);
      }
    });

    console.log("\n↑ ↓ navigate • Enter select • Ctrl+C exit");
  }
}