import { render } from 'solid-js/web'
import { Panel } from './Panel'
import { Showcase } from './Showcase'
import '../shared/app.css'
import '@destyler/designs-vanilla-extract-poc/styles.css'
import 'virtual:uno.css'
const showcase = new URLSearchParams(location.search).has('showcase')
const isolated = new URLSearchParams(location.search).has('isolated')
if (!isolated && !showcase) await import('../shared/baseline.generated.css')
render(() => showcase ? <Showcase/> : <main class="fixture-page">
  <div class="fixture-kicker">Destyler / Style pipeline proof</div>
  <h1>One behavior. Two style engines.</h1>
  <p class="fixture-intro">Real published Solid Switch and Dialog primitives. Compare the existing Tailwind recipes with a precompiled vanilla-extract package, inside a consumer that runs only Solid and UnoCSS plugins.</p>
  <nav><a href="../react/">React consumer</a> · <a href="../vue/">Vue consumer</a> · <a href="../svelte/">Svelte consumer</a> · <a href="/">Existing comparison</a> · <a href="?isolated=1">Isolated vanilla-extract mode</a> · <a href="?">Comparison mode</a></nav>
  <div class="fixture-grid"><Panel id="solid-vanilla" initialEngine="vanilla-extract" allowBaseline={!isolated} />{!isolated && <Panel id="solid-tailwind" initialEngine="tailwind" />}</div>
  <p class="fixture-note">Local proof only. No preferences are saved. Baseline CSS is compiled separately; the consumer has no Tailwind or vanilla-extract compiler plugin. Body portal creation is delayed until mounted; SSR results are reported separately.</p>
</main>, document.getElementById('app')!)
