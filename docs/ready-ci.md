# Ready CI

The branch and main tree had no `.github/workflows` definitions when this check
was added. The PR head also returned no pull-request-triggered workflow runs.
That explains the missing repository-defined checks; it does not establish the
state of organization Actions policy, billing or required branch-protection rules.

`Ready CI` runs on every pull request (including drafts), pushes to main, and
manual dispatch once the workflow is available on the default branch. There are
no path filters or draft exclusions. The job installs the committed lockfile,
builds the existing style artifacts, runs the full Node regression suite with two file workers, checks the Ready
React/Vue/Solid/Svelte types, then builds all four Ready demos.

```sh
npm ci --no-audit --no-fund
npm run build:designs
npm run test:ci
npm run check:ready
npm run build:ready
```

Node 24 is the CI runtime line; the job log records the exact installed patch.
The lockfile pins repository dependency resolution. The two official GitHub
Actions are pinned by commit, and npm caches download data rather than replacing
`npm ci` with a reused node_modules tree. Existing `npm test` is unchanged; the
CI-specific command bounds worker concurrency for the memory-heavy framework
compilation fixtures. The preliminary `build:designs` prevents the existing
vanilla-extract artifact regression from silently skipping in a clean checkout.

## Coverage and limits

The test suite includes real component simulations, separate-process SSR and
hydration, static theme/contrast checks and current-tarball builds imported by
package subpath for each framework. The tarball test reuses the locked repository
runtime dependencies. It is not the separate opt-in fresh per-framework install
matrix, which remains available through `verify-ready-clean-consumers.mjs`.

Opt-in architectural investigations and pre-hydration observations are not
silently promoted into passing acceptance checks. Real browser/assistive-
technology acceptance, external preview creation and deployment are not run.
A green job means these commands passed, not that the product's remaining
[delivery gates](./ready-delivery-status.md) are closed.

## Permissions and first-run checks

The workflow uses `pull_request`, not `pull_request_target`, with only
`contents: read`. Checkout does not persist credentials. It does not request
secrets, OIDC, deployments, write permissions, package publication or repository
settings changes. It neither makes this check mandatory nor changes Actions
settings or branch protection.

After pushing, inspect the run for the exact new commit. A missing or queued run
is not a pass. Repository/organization policies, GitHub App workflow-write
permission, runner availability or billing may require an owner decision. Report
that specific state rather than assuming adding YAML enabled every service-side
setting. Official action behavior: [checkout](https://github.com/actions/checkout)
and [setup-node](https://github.com/actions/setup-node).
