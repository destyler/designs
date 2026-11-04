import { createRoot } from 'react-dom/client'
import { Panel } from './Panel'
import '../shared/app.css'
import '@destyler/designs-vanilla-extract-poc/styles.css'
import 'virtual:uno.css'
const isolated = new URLSearchParams(location.search).has('isolated')
if (!isolated) await import('../shared/baseline.generated.css')
createRoot(document.getElementById('app')!).render(<main className="fixture-page">
  <div className="fixture-kicker">Destyler / Style pipeline proof</div>
  <h1>One behavior. Two style engines.</h1>
  <p className="fixture-intro">Real published React Switch and Dialog primitives. Compare the existing Tailwind recipes with a precompiled vanilla-extract package, inside a consumer that runs only React and UnoCSS plugins.</p>
  <nav><a href="../vue/">Vue consumer</a> · <a href="../solid/">Solid consumer</a> · <a href="../svelte/">Svelte consumer</a> · <a href="/">Existing comparison</a> · <a href="?isolated=1">Isolated vanilla-extract mode</a> · <a href="?">Comparison mode</a></nav>
  <div className="fixture-grid"><Panel id="react-vanilla" initialEngine="vanilla-extract" allowBaseline={!isolated} />{!isolated && <Panel id="react-tailwind" initialEngine="tailwind" />}</div>
  <p className="fixture-note">Local proof only. No preferences are saved. Baseline CSS is compiled separately; the consumer has no Tailwind or vanilla-extract compiler plugin. Body portal creation is delayed until mounted; SSR results are reported separately.</p>
</main>)
