# Ready text customization

The pilot accepts translated strings directly. It does not include an i18n
framework, locale detection, translation dictionaries or RTL layout support.

| Text | Prop / data | Default | Empty string allowed? |
| --- | --- | --- | --- |
| Checkbox / Select description | `description` | None | Yes; whitespace-only also omitted |
| Checkbox / Select visible name | `label` | Required | No |
| Select option text | `options[].label` | Required | No |
| Select with no matched value | `placeholder` | `Choose an option` | Yes; its name still comes from label |
| Select with zero options | `emptyMessage` | `No options available` | No |
| Dialog opener / title | `trigger` / `title` | Required | No |
| Dialog description | `description` | None | Yes |
| Dialog close button | `closeLabel` | `Close` | No |
| Application validation error | `error` | None | Yes, to clear the error |

`closeLabel` and `emptyMessage` use the same non-whitespace validation as required
naming text, both initially and on reactive updates. Valid strings retain their
original text; no trimming or translation is applied. Native browser-generated
constraint-validation messages remain browser-localized; `error` is supplied by
the application. Ready's developer contract exceptions are not localized UI text.

## Example

The prop names are identical across adapters. In React/Solid:

```tsx
<Select label="套餐" options={plans} placeholder="请选择套餐"
  emptyMessage="暂无可选套餐" />
<Dialog trigger="打开设置" title="设置" closeLabel="关闭">内容</Dialog>
```

In Vue/Svelte use their normal template component syntax and existing event/model
conventions. For example, Vue passes `:options="plans"`; Svelte uses
`options={plans}`. Bind these props to your application's translation values to
update the text when its locale changes. No locale state is owned by Ready.

## Empty collection is not an option or a loading state

When `options.length === 0`, `emptyMessage` is visible next to the field, outside
the popup/listbox, whether the popup is open or closed. It is ordinary description
text, not a selectable item and not a live region. A stable ID is added to the
trigger/native select's `aria-describedby` alongside Field help and error text.
When options arrive, that description and reference are removed without changing
the field's label or fabricating a selection callback.

A nonempty collection with all options disabled is **not** empty. A requested
value missing from a nonempty collection uses the placeholder but does not show
`emptyMessage`. The native selected empty placeholder remains a form-state
implementation detail, not a business option. Applications may supply their own
loading wording, but fetching, loading/error state and live announcements are not
implemented by these string props.

## Verification limits

Four-framework compiled-component regressions check defaults, translated and
reactively updated text, blank-value rejection, close behavior, empty/populated
transitions, and description references without fake options or callbacks.
Empty-collection keyboard regressions dispatch ArrowUp/ArrowDown, Home/End and
Enter to the real components: they must not select a value or leave a dangling
`aria-activedescendant`; Escape closes the popup. After options arrive, the empty
description is removed while Field help/error associations remain. These are
simulated keyboard events, not real-browser keyboard or assistive-technology
acceptance tests.
The empty-message SSR→hydration checks preserve its node/ID and the error
association, then remove only the empty-message reference when options arrive.
They also expose an existing upstream Field limitation: helper text is present
in SSR HTML, but its automatic description reference is registered only after
client mount. SSR therefore links error+empty text; after hydration it also links
Field help. This pass does not fix or conceal that pre-hydration helper gap.

These are DOM text and naming-source checks in Happy DOM. They do not prove
screen-reader pronunciation/announcements, browser accessibility trees, text
layout in every language, font coverage, clipping or RTL behavior.

### Why Ready does not infer Field helper presence during SSR

In the pinned UI primitives, Field context exposes `ids.helperText` even when no
`Field.HelperText` is rendered. It does not expose a server-side presence flag.
Presence is discovered from mounted DOM and updated by a child-list observer.
Ready therefore cannot infer that an ancestor's helper exists from its ID alone:
adding that ID unconditionally would create dangling references for fields with
no helper or after conditional removal. Supplying `Field.Root` custom IDs names
parts; it does not declare their presence or repair the SSR association.

Ready keeps the upstream confirmed descriptions and adds only its own description,
error and empty-message IDs, whose rendered presence it knows. Four-framework regression
fixtures cover helper absence, client insertion/removal, and composition with
those own descriptions. This verifies the client lifecycle but does **not** fix
the SSR gap for a rendered ancestor helper. Adding another DOM observer inside
Ready cannot repair server HTML either.

For Ready-owned help that must be associated in server HTML, use the optional
`description` prop below. Repairing automatic ancestor Field helper inheritance
still requires an upstream declarative presence contract. Do not rely on that
automatic inheritance before JavaScript runs, including no-JavaScript output. Mutation of helper IDs without mounting or
removing nodes is not covered by the upstream child-list observer contract.


## Ready-owned Checkbox and Select descriptions

Pass optional plain-text `description` for ordinary field instructions without
assembling Field parts. Ready renders the text and associates its stable ID with
the control in the server HTML; hydration preserves the ID and updates the
association when the text is added or removed. Valid text is preserved exactly;
undefined, empty and whitespace-only text render no description and no reference.
It is not a label, live region, error or native validation message.

```tsx
<Checkbox label="接收通知" description="只发送重要更新。" />
<Select label="套餐" description="可以稍后更改。" options={plans} />
```

Vue/Svelte use the same prop with their normal component syntax. No Field wrapper
is required. A present upstream Field helper, own description, error and empty
message describe separate information and compose without duplicate ID tokens.
Do not supply the same words both in `description` and `Field.HelperText`: Ready
cannot infer whether two different text nodes are intentionally distinct, so it
does not deduplicate their content. Existing Field behavior is unchanged, including
its documented missing server-side helper reference.

Four-framework tests use real server rendering followed by simulated hydration,
plus dynamic description insertion, updates and removal alongside Field help,
errors and empty lists. They check ID references rather than actual screen-reader
speech or browser accessibility-tree output.
