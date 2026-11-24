<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import { Dynamic as Primitive } from '@destyler-ui/vue';
import { addDynamicTag, dynamicHint, dynamicTranslations, resolveDynamic, type DynamicProps } from '../Dynamic';

defineOptions({ inheritAttrs: false });
const props = defineProps<Omit<DynamicProps, 'onValueChange'>>();
const emit = defineEmits<{ valueChange: [value: readonly string[]] }>();
const hintId = useId();
const rejected = ref(false);
const config = computed(() => resolveDynamic(props));
function change({ value }: { value: string[] }) {
  rejected.value = false;
  emit('valueChange', [...value]);
}
</script>

<template>
  <Primitive.Root class="rd-component rd-dynamic" :default-value="config.defaultValue" :disabled="disabled"
    :name="name" :max="config.maxTags" :max-length="config.maxLength" :validate="config.validate" delimiter=""
    :editable="false" :translations="dynamicTranslations" @value-invalid="rejected = true" @value-change="change">
    <Primitive.Label>{{ label }}</Primitive.Label>
    <Primitive.Control>
      <Primitive.Context v-slot="api">
        <Primitive.Item v-for="(value, index) in api.value" :key="value" :value="value" :index="index">
          <Primitive.ItemPreview>
            <Primitive.ItemText>{{ value }}</Primitive.ItemText>
            <Primitive.ItemDeleteTrigger><span aria-hidden="true">×</span></Primitive.ItemDeleteTrigger>
          </Primitive.ItemPreview>
        </Primitive.Item>
        <Primitive.Input :aria-describedby="hintId" enterkeyhint="done" />
        <button class="rd-dynamic-add" type="button" :disabled="disabled || api.count >= config.maxTags || !api.inputValue"
          @click="addDynamicTag(api, config.maxTags)">Add</button>
        <Primitive.ClearTrigger>Clear all</Primitive.ClearTrigger>
        <span aria-hidden="true" class="rd-dynamic-count">{{ api.count }}/{{ config.maxTags }}</span>
      </Primitive.Context>
    </Primitive.Control>
    <p class="rd-dynamic-hint" :id="hintId">{{ dynamicHint }} Limit: {{ config.maxTags }}.</p>
    <p class="rd-dynamic-error" role="status">{{ rejected ? 'Use a unique tag within the length limit.' : '' }}</p>
    <Primitive.HiddenInput />
  </Primitive.Root>
</template>
