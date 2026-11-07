import coverage from '../shared/shadcn-coverage.json'
import type { Family } from './registry'

/** Shared by the real frame bootstrap and its query/readiness contract test. */
export function resolveFrameRequest(search: string) {
  const query = new URLSearchParams(search)
  const requested = query.get('component') ?? 'checkbox'
  const valid = Object.hasOwn(coverage, requested)
  const family: Family = valid ? requested as Family : 'checkbox'
  const theme: 'light' | 'dark' = query.get('theme') === 'dark' ? 'dark' : 'light'
  return { requested, valid, family, theme }
}
