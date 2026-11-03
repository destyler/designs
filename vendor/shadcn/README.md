# Pinned shadcn/ui source

These files come from [shadcn-ui/ui](https://github.com/shadcn-ui/ui) at commit
`4aaea19d9cff3e0908e12a8c1d504b8c5ec34610` (retrieved 2026-11-03).
The seven files in `new-york-v4/ui/`, `themes.ts`, `upstream-globals.css`, and
`LICENSE` preserve the retrieved source bytes. Source URLs, byte counts, and
SHA-256 digests are recorded in `../../docs/shadcn-sources.json`.

## License and redistribution

Copyright (c) 2023 shadcn. The upstream code is MIT licensed. Keep the full
copyright and permission notice in `LICENSE` with copies or substantial
adaptations, including distributions of the derived recipes. Generated source
headers point to this notice; a header alone does not replace the full notice.
Other dependencies, including Lucide icons, retain their own licenses.

## Derived files and scope

`zinc.css` mechanically transcribes the light and dark Zinc entry from
`themes.ts`; it is a derived stylesheet, not an upstream file. The application
generator changes only its root selectors to the `data-design="shadcn"`
boundary and updates the license reference. All token values remain unchanged.
`upstream-globals.css` is retained for theme-mapping provenance. Do not import
it wholesale: it includes website-specific imports, sources, and layout rules.

`scripts/extract-shadcn-recipes.mjs` extracts upstream slot classes and the
default CVA variants into `examples/shadcn/styles/recipes.ts`. This example
does not implement all upstream CVA variants. The untouched `sourceRecipes`
and adapted `recipes` are both emitted. The only recipe substitutions are:

- Tabs trigger: `data-[state=active]` becomes `data-[selected]`.
- Switch and checkbox control: `focus-visible:` becomes
  `data-[focus-visible]:`, `disabled:` becomes `data-[disabled]:`, and
  `aria-invalid:` becomes `data-[invalid]:`.

These changes connect identical visual classes to Destyler's behavior states.
They do not by themselves prove DOM-state compatibility, accessibility,
computed-style equality, or screenshot parity; browser tests cover those.
Demo layout, copy, and composition are application code rather than an
upstream shadcn demo. Preserve that distinction in descriptions of fidelity.

## Imports and reference rendering

The vendored React source depends on `react`, `radix-ui`,
`class-variance-authority`, `lucide-react`, and the `cn` utility alias. Dialog
imports Button through `@/registry/new-york-v4/ui/button`. Vite aliases resolve
these paths without editing upstream files. `themes.ts` is provenance data
and imports a type from `shadcn/schema`; it need not be bundled at runtime.

The reference panel renders these actual vendored components. The React and
Vue adapters instead use the published `@destyler-ui/react` and
`@destyler-ui/vue` primitives, with the generated style recipes.

Run `node --test test/shadcn-source.test.mjs` to check file integrity,
deterministic generation, selector-only adaptation, exact theme values, and
the reference/adapter import boundaries. The generator check runs in a
temporary directory and does not rewrite the application under test.
