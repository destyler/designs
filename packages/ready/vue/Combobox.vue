<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { Combobox as Primitive, createListCollection, useFieldContext } from '@destyler-ui/vue'
import { comboboxOptions, comboboxPosition, comboboxText, comboboxTranslations, filterCombobox, selectedCombobox, type ComboboxProps } from '../Combobox'
import { describeField } from '../switch-description'

const props = withDefaults(defineProps<Omit<ComboboxProps, 'onValueChange'>>(), { disabled: undefined })
const emit = defineEmits<{ 'update:value': [value: string]; valueChange: [value: string] }>()
const local = ref(props.defaultValue ?? '')
const query = ref<string | null>(null)
const open = ref(false)
const highlight = ref<string | null>(null)
const id = useId()
const field = useFieldContext()
const text = computed(() => comboboxText(props.label, props.emptyMessage))
const description = computed(() => describeField(id, props.description, undefined, field?.value?.ariaDescribedby))
const options = computed(() => comboboxOptions(props.options))
const selected = computed(() => selectedCombobox(options.value, props.value ?? local.value))
const items = computed(() => filterCombobox(options.value, query.value))
const collection = computed(() => createListCollection({ items:items.value }))
// Vue's v0.0.5 declaration only allows a string or omission. The core uses
// null to clear the previous highlight; omission would retain a stale key.
const primitiveHighlight = computed(() =>
  (items.value.some(item => item.value === highlight.value) ? highlight.value : null) as unknown as string | undefined,
)
const valueKeys = computed(() => selected.value ? [selected.value.value] : [])
function change({ value }: { value: string[] }) {
  const next = value[0] ?? ''
  if (props.value === undefined) local.value = next
  query.value = null
  emit('update:value', next)
  emit('valueChange', next)
}
function highlightChange({ highlightedValue }: { highlightedValue: string | null }) { highlight.value = highlightedValue }
function inputChange({ inputValue }: { inputValue: string }) { query.value = inputValue }
function openChange({ open: next }: { open: boolean }) {
  open.value = next
  if (!next) query.value = null
}
</script>

<template>
  <div class="rd-component rd-combobox">
    <Primitive.Root :collection="collection" :model-value="valueKeys" :input-value="query ?? selected?.label ?? ''"
      :highlighted-value="primitiveHighlight"
      @highlight-change="highlightChange" :disabled="disabled" :placeholder="placeholder" selection-behavior="preserve" :positioning="comboboxPosition" :translations="comboboxTranslations"
      @input-value-change="inputChange" @value-change="change" @open-change="openChange">
      <Primitive.Label>{{ text.label }}</Primitive.Label>
      <Primitive.Control>
        <Primitive.Input :aria-describedby="description.describedBy" />
        <Primitive.ClearTrigger :tabindex="0"><span aria-hidden="true">×</span></Primitive.ClearTrigger>
        <Primitive.Trigger><span aria-hidden="true">⌄</span></Primitive.Trigger>
      </Primitive.Control>
      <Primitive.Positioner>
        <Primitive.Content :aria-label="text.label">
          <Primitive.Item v-for="item in items" :key="item.value" :item="item">
            <Primitive.ItemText>{{ item.label }}</Primitive.ItemText>
            <Primitive.ItemIndicator aria-hidden="true">✓</Primitive.ItemIndicator>
          </Primitive.Item>
        </Primitive.Content>
        <p v-if="open && !items.length" role="status" aria-live="polite" class="rd-combobox-empty">{{ text.emptyMessage }}</p>
      </Primitive.Positioner>
    </Primitive.Root>
    <p v-if="description.hasDescription" :id="description.descriptionId" class="rd-description">{{ props.description }}</p>
  </div>
</template>
