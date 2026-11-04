<script setup lang="ts">
import Panel from './Panel.vue'
defineProps<{ isolated: boolean }>()
</script>
<template>
  <main class="fixture-page">
    <div class="fixture-kicker">Destyler / Style pipeline proof</div>
    <h1>One behavior. Two style engines.</h1>
    <p class="fixture-intro">Real published Vue Switch and Dialog primitives. Compare the existing Tailwind recipes with a precompiled vanilla-extract package, inside a consumer that runs only Vue and UnoCSS plugins.</p>
    <nav><a href="../react/">React consumer</a> · <a href="../solid/">Solid consumer</a> · <a href="../svelte/">Svelte consumer</a> · <a href="/">Existing comparison</a> · <a href="?isolated=1">Isolated vanilla-extract mode</a> · <a href="?">Comparison mode</a></nav>
    <div class="fixture-grid"><Panel id="vue-vanilla" initial-engine="vanilla-extract" :allow-baseline="!isolated" /><Panel v-if="!isolated" id="vue-tailwind" initial-engine="tailwind" /></div>
    <p class="fixture-note">Local proof only. No preferences are saved. Baseline CSS is compiled separately; the consumer has no Tailwind or vanilla-extract compiler plugin. Body portal creation is delayed until mounted; SSR results are reported separately.</p>
  </main>
</template>
