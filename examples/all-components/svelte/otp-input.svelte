<script module lang="ts">
  import type { OtpInputRootProps } from '@destyler-ui/svelte/otp-input'

  export interface BasicProps extends OtpInputRootProps {}
</script>

<script lang="ts">
  import { OtpInput } from '@destyler-ui/svelte/otp-input'

  const props: BasicProps = $props()
  let value = $state<string[]>([])
</script>

<OtpInput.Root bind:value {...props}>
  <OtpInput.Label>Label</OtpInput.Label>
  <OtpInput.Control>
    {#each [0, 1, 2] as index (index)}
      <OtpInput.Input {index} />
    {/each}
  </OtpInput.Control>
  <OtpInput.HiddenInput />
<p role="status" class="parity-status">{value.join('').length}/3 characters</p></OtpInput.Root>
