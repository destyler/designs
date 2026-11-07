<script module lang="ts">
  import type { SliderRootProps } from '@destyler-ui/svelte/slider'

  export interface BasicProps extends SliderRootProps {}
</script>

<script lang="ts">
  import { Slider } from '@destyler-ui/svelte/slider'

  let { value = $bindable([-20, 20]), min = -50, max = 50, ...props }: BasicProps = $props()
</script>

<Slider.Root {min} {max} bind:value {...props}>
  <Slider.Label>Quantity:</Slider.Label>
  <Slider.ValueText />
  <Slider.Control>
    <Slider.Track>
      <Slider.Range />
    </Slider.Track>
    {#each value as _, index (index)}
      <Slider.Thumb {index}>
        <Slider.DraggingIndicator />
        <Slider.HiddenInput />
      </Slider.Thumb>
    {/each}
  </Slider.Control>

</Slider.Root>
