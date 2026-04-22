#!/usr/bin/env node
/* Run vsce package with dist-产物/<name>-<version>-<YYYYMMDD-HHmmss>.vsix */

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const pkg = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
);
const pad = (n) => String(n).padStart(2, "0");
const d = new Date();
const ts = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
const base = `${pkg.name}-${pkg.version}-${ts}.vsix`;
const outDir = path.join(root, "dist-产物");
const outFile = path.join(outDir, base);

fs.mkdirSync(outDir, { recursive: true });

const vsce = path.join(root, "node_modules", ".bin", "vsce");
execFileSync(vsce, ["package", "-o", outFile], { cwd: root, stdio: "inherit" });
