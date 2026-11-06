<script lang="ts">
  import type { TourRootProps, TourStepDetails } from '@destyler-ui/svelte/tour'
  import { Tour, useTour } from '@destyler-ui/svelte/tour'

  let target: HTMLButtonElement
  const props: Omit<TourRootProps, 'tour'> = $props()
  const id = $props.id()

  const steps: TourStepDetails[] = [
    {
      id: 'step-1',
      type: 'tooltip',
      title: 'Welcome',
      description: 'Welcome to the tour!',
      target: () => target,
      arrow: true,
      backdrop: true,
    },
  ]

  const tour = useTour({ id, steps })


</script>

<main>
  <button type="button" onclick={() => tour().start()}>Start tour</button>
  <button type="button" bind:this={target}>Target</button>

  <Tour.Root {tour} {...props}>
    <Tour.Backdrop />
    <Tour.Spotlight />
    <Tour.Positioner data-testid="positioner">
      <Tour.Content>
        <Tour.Arrow>
          <Tour.ArrowTip />
        </Tour.Arrow>
        <Tour.Title />
        <Tour.Description />
        <Tour.ProgressText />
        <Tour.Control>
          <Tour.ActionTrigger action={{ label: 'Prev', action: 'prev' }}>Prev</Tour.ActionTrigger>
          <Tour.ActionTrigger action={{ label: 'Next', action: 'next' }}>Next</Tour.ActionTrigger>
        </Tour.Control>
        <Tour.CloseTrigger>X</Tour.CloseTrigger>
      </Tour.Content>
    </Tour.Positioner>
  </Tour.Root>
</main>
