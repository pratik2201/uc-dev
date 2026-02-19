:Shree Ganeshay Namah:<br />
# uc-dev


> CLI toolkit for UC project development

`uc-dev` is a command-line utility that helps manage UC-based projects by automating setup and designer build workflows.

⚠ Status: **Beta**

---

## Installation

### Global install (recommended)

```bash
npm install -g uc-dev
```
### Local install
```bash
npm install uc-dev
```
Commands
build

Generate designer files for the project.
```bash
uc-dev build
```
- this generate designer for all usercontrols and templates.
- also generate a single resource file that hold project's resurces (all used contents in string format except source code) that make easy for bundling.
- each resource will assigned uniqueid to access.

Use this command whenever designer files change.

---
`setup`<br>
Initializes a project for development.
```bash
uc-dev setup
```
What it does:
- Installs required dependencies (also done before build)
- Creates necessary directories
- Configures project paths
- Prepares development environment
- Run once when starting a new project.

---

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

Happy building 🚀