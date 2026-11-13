<script lang="ts">
  import { Clipboard } from '@destyler-ui/svelte/clipboard'
  const value = 'https://destyler.org'
  let status = $state('Not copied')
  async function copy() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable')
      await navigator.clipboard.writeText(value)
      status = 'Copied'
    } catch { status = 'Copy unavailable. Select the link and copy it manually.' }
  }
</script>
<Clipboard.Root {value} class="parity-stack">
  <Clipboard.Label>Copy this link</Clipboard.Label>
  <Clipboard.Input readonly />
  <button type="button" class="parity-button" onclick={copy}>Copy link</button>
  <p role="status" class="parity-status">{status}</p>
</Clipboard.Root>
