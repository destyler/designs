<script lang="ts">
  import Panel from './Panel.svelte'
  let { isolated = false }: { isolated?: boolean } = $props()
</script>
<main class="fixture-page">
  <div class="fixture-kicker">Destyler / Style pipeline proof</div>
  <h1>One behavior. Two style engines.</h1>
  <p class="fixture-intro">Real published Svelte Switch and Dialog primitives. Compare the existing Tailwind recipes with a precompiled vanilla-extract package, inside a consumer that runs only Svelte and UnoCSS plugins.</p>
  <nav><a href="../react/">React</a> · <a href="../vue/">Vue</a> · <a href="../solid/">Solid</a> · <a href="/">Existing comparison</a> · <a href="?isolated=1">Isolated vanilla-extract mode</a> · <a href="?">Comparison mode</a></nav>
  <div class="fixture-grid"><Panel id="svelte-vanilla" initialEngine="vanilla-extract" allowBaseline={!isolated} />{#if !isolated}<Panel id="svelte-tailwind" initialEngine="tailwind" />{/if}</div>
  <p class="fixture-note">Local proof only. No preferences are saved. Baseline CSS is compiled separately; the consumer has no Tailwind or vanilla-extract compiler plugin. Body portal creation is delayed until mounted; SSR results are reported separately.</p>
</main>
