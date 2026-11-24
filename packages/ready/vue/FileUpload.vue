<script setup lang="ts">
import { computed, useId } from 'vue'
import { FileUpload as Primitive } from '@destyler-ui/vue'
import { fileUploadOptions, fileUploadStatus, fileUploadTranslations, returnFileUploadFocus, type FileUploadProps } from '../FileUpload'

const props = withDefaults(defineProps<Omit<FileUploadProps, 'onFilesChange'>>(), { disabled: undefined })
defineOptions({ inheritAttrs: false })
const emit = defineEmits<{ filesChange: [files: readonly File[]] }>()
const id = useId()
const config = computed(() => fileUploadOptions(props))
function change({ acceptedFiles }: { acceptedFiles: File[] }) {
  emit('filesChange', [...acceptedFiles])
}
</script>

<template>
  <Primitive.Root class="rd-component rd-file-upload" role="group" :aria-label="label" :accept="config.accept" :max-files="config.maxFiles"
    :max-file-size="config.maxFileSize" :disabled="disabled" :allow-drop="false" :prevent-document-drop="false"
    :translations="fileUploadTranslations" @file-change="change">
    <Primitive.Label>{{ label }}</Primitive.Label>
    <Primitive.HiddenInput />
    <Primitive.Trigger :aria-label="`${config.triggerLabel}: ${label}`">{{ config.triggerLabel }}</Primitive.Trigger>
    <Primitive.Context v-slot="{ acceptedFiles, rejectedFiles }">
      <Primitive.ItemGroup v-if="acceptedFiles.length">
        <Primitive.Item v-for="(file, index) in acceptedFiles" :key="index" :file="file" :id="`${id}-item-${index}`">
          <Primitive.ItemName :id="`${id}-name-${index}`">{{ file.name }}</Primitive.ItemName>
          <Primitive.ItemDeleteTrigger @click="returnFileUploadFocus($event.currentTarget)">Remove</Primitive.ItemDeleteTrigger>
        </Primitive.Item>
      </Primitive.ItemGroup>
      <p class="rd-file-upload-status" role="status">{{ fileUploadStatus(acceptedFiles.length, rejectedFiles) }}</p>
    </Primitive.Context>
  </Primitive.Root>
</template>
