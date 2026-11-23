<script lang="ts">
  import type { Snippet } from 'svelte'
  import { Label as Primitive } from '@destyler-ui/svelte/label'
  import type { LabelProps } from '../Label'

  const props: LabelProps & { children?: Snippet } = $props()
</script>

<Primitive.Root class="rd-component" for={props.for}>
  {@render props.children?.()}
</Primitive.Root>
