# Ready naming text and description relationships

Checkbox and Select require a `label` with non-whitespace text. Each Select
option also requires non-whitespace `option.label`, including disabled entries.
Option labels are checked before collection creation, during SSR, initial client
rendering and reactive replacements. Equal nonblank labels with distinct values
remain allowed, and valid labels are not trimmed. Dialog requires
non-whitespace `trigger` and `title`. All four adapters reject missing, empty or
whitespace-only values with a specific Ready runtime error, including reactive
updates. Validation uses `trim()` only to detect emptiness; valid supplied text is
not rewritten. TypeScript's `string` alone cannot guarantee this condition.

This prevents an easy-to-miss defect: the previous components could expose empty
labels/button text while retaining valid-looking IDs and `aria-labelledby`
references. It does not invent a fallback name or use helper/error text as a
substitute. There is no separate icon-only or `aria-label` override API in this
pilot. Applications must provide useful, localized visible naming text before
rendering, rather than use a blank label during loading.

Optional `placeholder` and `description` may remain empty. A Select with an empty
placeholder still gets its name from its nonempty label. A Dialog without a
description still gets its name from its title. Its built-in close button retains
the literal English text `Close`; a localization API is not part of this change.

Field helper text and an application error are descriptions, not labels. Both
references coexist while an error is present; clearing the error removes only
that reference and retains the helper. Repeated controls in the same application
have distinct IDs and reference their own labels/descriptions. Independent Vue
application roots still require distinct `app.config.idPrefix` values as already
documented; these checks do not remove that requirement.

## Verification and limits

The regression fixtures compile the actual components in all four frameworks,
then inspect their DOM in Happy DOM. They check repeated-instance IDs, reference
resolution, nonempty label/button/title sources, dynamic text updates, helper and
error composition, and initial/dynamic rejection of blank mandatory text. Separate actual server
renderers running without DOM globals check blank option-label rejection and
preservation of valid text. These SSR tests do not imply browser acceptance.

These are DOM naming-source and association checks, **not** a complete accessible
name algorithm, browser accessibility-tree inspection or assistive-technology
acceptance. Non-whitespace text is necessary for this limited API but does not
prove that a name is meaningful, unique to the user, visually perceivable or
appropriately translated. The checks do not evaluate hidden-content rules, CSS
cascade, focus navigation or screen-reader announcements. Validation errors are
developer/data-contract errors, not field error messages or automatic recovery.
