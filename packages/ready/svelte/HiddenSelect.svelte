<script lang="ts">
 import { useSelectContext } from '@destyler-ui/svelte/select'
 import { useFieldContext } from '@destyler-ui/svelte/field'
 let {descriptionId,errorId,emptyId,invalid}:{descriptionId?:string;errorId?:string;emptyId?:string;invalid?:boolean}=$props()
 const select = useSelectContext()
 const field = useFieldContext()
</script>
<!-- The polymorphic primitive cannot serialize selected options for SSR.
     Retain its sole native control and all hidden-select/focus/reset attributes. -->
<select {...select().getHiddenSelectProps()} aria-invalid={(invalid??field?.()?.invalid)||undefined} aria-describedby={[...new Set([field?.()?.ariaDescribedby,descriptionId,errorId,emptyId].filter(Boolean).join(' ').split(/\s+/).filter(Boolean))].join(' ')||undefined}>
 {#if !select().collection.items.some(item=>select().value.includes(select().collection.getItemValue(item) ?? ''))}<option value="" selected></option>{/if}
 {#each select().collection.items as item}
  <option value={select().collection.getItemValue(item) ?? ''}
   disabled={select().collection.getItemDisabled(item)}
   selected={select().value.includes(select().collection.getItemValue(item) ?? '')}
  >{select().collection.stringifyItem(item)}</option>
 {/each}
</select>
