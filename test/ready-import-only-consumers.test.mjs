import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Window } from "happy-dom";
import { buildThemeContract } from "../scripts/build-ready-theme-contract.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
test(
  "Four native packed consumers build with unscoped, inherited and nested theme scenarios",
  { timeout: 120000 },
  async () => {
    const output = await mkdtemp(join(root, "node_modules/.theme-output-"));
    try {
      await buildThemeContract(output);
      for (const framework of ["react", "vue", "solid", "svelte"]) {
        const html = await readFile(
          join(output, framework, "index.html"),
          "utf8",
        );
        const win = new Window();
        win.document.body.innerHTML = html;
        const doc = win.document;
        assert.ok(doc.getElementById("unscoped"));
        assert.equal(
          doc.getElementById("unscoped").closest("[data-rd-theme]"),
          null,
        );
        assert.equal(
          doc.getElementById("custom").closest("[data-rd-theme]"),
          null,
        );
        assert.equal(
          doc.getElementById("nested").closest("[data-rd-theme]").dataset
            .rdTheme,
          "default",
        );
        assert.equal(
          doc.getElementById("nested-custom").closest("[data-rd-theme]").dataset
            .rdTheme,
          "midnight",
        );
        assert.ok(doc.getElementById("host-button"));
        const cssFiles = (
          await readdir(join(output, framework, "assets"))
        ).filter((x) => x.endsWith(".css"));
        const css = (
          await Promise.all(
            cssFiles.map((x) =>
              readFile(join(output, framework, "assets", x), "utf8"),
            ),
          )
        ).join("\n");
        assert.match(css, /var\(--rd-accent,\s*#3155d9\)/);
        assert.match(css, /var\(--rd-control-height,\s*42px\)/);
        assert.match(css, /var\(--rd-overlay-z,\s*40\)/);
        assert.doesNotMatch(css, /:root|@property/);
        await win.happyDOM.close();
      }
    } finally {
      await rm(output, { recursive: true, force: true });
    }
  },
);
