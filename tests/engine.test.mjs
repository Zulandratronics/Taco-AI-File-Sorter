import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const PROFILES = require("../web/profiles.js");
const {
  shouldIgnorePath,
  classifyFiles,
  generateBashScript,
  generatePowerShellScript,
} = require("../web/engine.js");

test("protected paths and hidden files are ignored", () => {
  assert.equal(shouldIgnorePath(".git/config"), true);
  assert.equal(shouldIgnorePath("proj/node_modules/a.js"), true);
  assert.equal(shouldIgnorePath(".tacosort-manifest-2026.json"), true);
  assert.equal(shouldIgnorePath("Downloads/invoice_2026.pdf"), false);
});

test("classification, duplicate detection, and collision resolution work", () => {
  const files = [
    { id: "1", name: "Invoice Acme.pdf", rel_path: "Invoice Acme.pdf", size: 1200, mtime_ms: 1730000000000, fast_hash: "aaaa1111", snippet: "invoice total" },
    { id: "2", name: "invoice_acme.pdf", rel_path: "sub/invoice_acme.pdf", size: 1200, mtime_ms: 1730000000000, fast_hash: "aaaa1111", snippet: "invoice total" },
    { id: "3", name: "esp32_pcb.kicad_pcb", rel_path: "esp32_pcb.kicad_pcb", size: 800, mtime_ms: 1730000000000, fast_hash: "bbbb2222", snippet: "schematic" },
  ];

  const items = classifyFiles(files, PROFILES.general_productivity, "original_clean");
  assert.equal(items.length, 3);
  assert.equal(items[0].category, "Finance & Invoices");
  assert.equal(items[1].is_duplicate, true);
  assert.notEqual(items[0].dest_rel, items[1].dest_rel);
});

test("exported Bash and PowerShell scripts safely single-quote special filenames", () => {
  const files = [
    { id: "1", name: "report_$(whoami)_O'Connor.txt", rel_path: "report_$(whoami)_O'Connor.txt", size: 50, mtime_ms: 1730000000000, fast_hash: "cccc3333", snippet: "strategy memo" },
  ];
  const items = classifyFiles(files, PROFILES.general_productivity);
  const bash = generateBashScript(items, "general_productivity");
  const ps1 = generatePowerShellScript(items, "general_productivity");

  assert.ok(bash.includes("'report_$(whoami)_O'\"'\"'Connor.txt'"));
  assert.ok(ps1.includes("'report_$(whoami)_O''Connor.txt'"));
});