<script lang="ts">
  import { ToggleGroup as Primitive } from '@destyler-ui/svelte/toggle-group'
  import { toggleGroupModel, type ToggleGroupProps } from '../ToggleGroup'

  let props: ToggleGroupProps = $props()
  const model = $derived(toggleGroupModel(props))
</script>

<div class="rd-component rd-toggle-group">
  <Primitive.Root aria-label={model.label} aria-disabled={model.disabled || undefined}
    {...(model.disabled ? { tabindex: -1 } : {})}
    multiple rovingFocus value={model.value} defaultValue={model.defaultValue}
    disabled={model.disabled} orientation={props.orientation} loopFocus={props.loopFocus}
    onValueChange={({ value }) => props.onValueChange?.(value)}>
    {#each props.items as item (item.value)}
      <Primitive.Item value={item.value} disabled={item.disabled}>{item.label}</Primitive.Item>
    {/each}
  </Primitive.Root>
</div>
