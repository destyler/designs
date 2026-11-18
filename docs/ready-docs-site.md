# Interactive component documentation

The documentation shell lives in `examples/ready-docs`. Each native framework
preview is compiled independently from the same source strings shown in the docs:
React, Vue, Solid and Svelte each have Checkbox, Select, Dialog and controlled
Select pages under `previews/<framework>/`. The shell mounts an iframe for the
selected framework. Switching frameworks destroys the old document; switching
themes sends a validated same-origin message and preserves component state.
Dialog overlays remain inside the preview viewport. This is real framework
execution, not proof that every browser/framework combination has been accepted.

The UI uses a component sidebar, one document section at a time and Preview/Code
controls, informed by the documentation hierarchy of shadcn/ui and the restrained
editorial navigation of Asuka. It does not copy either site's assets or components.

```sh
npm ci
npm run build:ready:docs
node --test test/ready-docs.test.mjs
```

The static output is `artifacts/ready-docs`; all asset URLs are relative. The
Ready CI workflow builds this site alongside component regressions, four-framework
types and demo builds. Keep component examples, prop tables, installation text
and limitations synchronized whenever the three-component pilot changes.

Deployment is a separate, authorized step. Upload the complete static output recursively (including all preview subdirectories) into
the existing `destyler-designs-prototype` project's Preview environment. Use a
per-deployment static configuration rather than the repository root's Astro
configuration (which builds the older gallery). Do not change project-wide build
settings, authentication protection, production aliases or Git connections.
The generated deployment URL may require the owner's Vercel login. A successful
build or deployment is not evidence that real-browser visual/accessibility QA
has passed.

The product entrance and documentation reading surface are separate layouts.
The documentation shell provides local component/page search (Command/Ctrl+K),
keyboard dismissal, a skip link, a responsive navigation drawer and persisted
light/dark appearance. Site appearance is independent of the component theme.
Geist is bundled locally rather than requested from a third-party font service.
The component package remains private/unpublished; the installation guide and
limitations page retain that status. A polished site is not a release-readiness claim.
