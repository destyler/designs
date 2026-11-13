# Interactive component documentation

The documentation source lives in `examples/ready-docs`. It imports the actual
Ready React adapter and shared theme CSS; displayed controls are not imitations.
Framework code examples explain React, Vue, Solid and Svelte consumption. The
interactive renderer is React, not proof that every browser/framework combination
has been accepted.

```sh
npm ci
npm run build:ready:docs
node --test test/ready-docs.test.mjs
```

The static output is `artifacts/ready-docs`; all asset URLs are relative. The
Ready CI workflow builds this site alongside component regressions, four-framework
types and demo builds. Keep component examples, prop tables, installation text
and limitations synchronized whenever the three-component pilot changes.

Deployment is a separate, authorized step. Upload only this static output into
the existing `destyler-designs-prototype` project's Preview environment. Use a
per-deployment static configuration rather than the repository root's Astro
configuration (which builds the older gallery). Do not change project-wide build
settings, authentication protection, production aliases or Git connections.
The generated deployment URL may require the owner's Vercel login. A successful
build or deployment is not evidence that real-browser visual/accessibility QA
has passed.
