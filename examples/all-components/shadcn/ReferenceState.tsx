import coverage from '../shared/shadcn-coverage.json'

/** Honest absence state: never substitutes a native input for a missing primitive. */
export function ReferenceState({ family }: { family: keyof typeof coverage }) {
  const entry = coverage[family]
  return <section className="reference-absence" data-reference-state="none" aria-labelledby={`reference-missing-${family}`}>
    <p className="reference-eyebrow">No original shadcn counterpart</p>
    <h2 id={`reference-missing-${family}`}>{entry.title}</h2>
    <p>{entry.explanation}</p>
    <a href={entry.sourceUrls[0]} target="_blank" rel="noreferrer">Inspect the pinned upstream UI directory</a>
  </section>
}
