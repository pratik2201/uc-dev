:Shree Ganeshay Namah:<br />
# 🚀 uc-dev


CLI Tool for building and scaffolding UC-based Electron projects

`uc-dev` helps you:
* Build designer files
* Configure project structure
* Generate Electron startup files
* Generate ucconfig.js
* Generate TypeScript config
* Quickly scaffold a ready-to-run UC project
---
📦 Installation
```bash
npm install -g uc-dev
```
Or use locally:
```bash
npm install --save-dev uc-dev
```
---
## 🛠 Commands

1️⃣ `uc-dev build`<br>

Builds designer files only.

```bash
uc-dev build
```

✔ Compiles designer<br>
✔ Prepares runtime-ready files

## 2️⃣ uc-dev setup

Launches interactive setup menu.

```bash
uc-dev setup
```
📋 MAIN MENU
```bash
--M A I N - M E N U-----------
  P = Parameters
  B = Build Designers
  G = Generate
  Q = Quit
What to Do Now ? (q):
```
### 🔹 P = Parameters 
Configure project directories and related settings:
src directory
out directory
resource directory
designer directory
other setup-related paths
These values are later used when generating files.

### 🔹 B = Build Designers

Shortcut for:  `uc-dev build`
### 🔹 G = Generate
Opens Generate Submenu
```bash
--G E N E R A T E-------------
  E = Electron Stuffs
  S = Sample Style1
  U = 'ucconfig.js' file
  V = '.vscode/settings.json' file
  T = 'tsconfig.json' for project
  A = Do All Above
  Q = Quit
What to Do Now ? (q):
  ```
### 🔹 E = Electron Stuffs
Generates starter Electron files:
- main process file
- preload file
- renderer starter
- basic window creation
- Quick start structure for Electron project.

### 🔹 S = Sample Style1

Generates:
Sample UserControl
Sample Template
Demo structure for understanding UC pattern

### 🔹 U = ucconfig.js

Generates ucconfig.js using values collected from Parameters section.

### 🔹 V = .vscode/settings.json

Generates VSCode settings for:
Better path resolution
Improved project visibility
Cleaner TypeScript experience

### 🔹 T = tsconfig.json

Generates recommended TypeScript configuration.
Optional — only if project uses TypeScript.

### 🔹 A = Do All Above

Runs everything:
- Electron Stuffs
- Sample
- ucconfig.js
- VSCode settings
- tsconfig
- Build designers

👉 Creates a ready-to-run project structure

🧠 Typical Workflow
First time project setup:
uc-dev setup

Go to P → configure parameters

Go to G → press A

Done ✅

Regular development build:
```bash
uc-dev build
```
📁 Project Structure (For Default Config)
```
src/
  designerFiles/
    Resources.ts
out/
ucconfig.js
tsconfig.json
```

Typical Workflow
```bash
uc-dev setup
uc-dev build
```
---
Development Notes

- Commands are designed to be safe to re-run
- Paths are resolved relative to the project
- No manual configuration required after setup

---

**LICENSE** <br>
MIT

**FEEDBACK** <br>
Report issues or suggestions to improve the CLI workflow.

**Github** <br>
[https://github.com/pratik2201/uc-dev.git](https://github.com/pratik2201/uc-dev.git)


**Youtube** <br>
As Soon As

Happy building 🚀