<script setup lang="ts">
import { FileUpload } from '@destyler-ui/vue'

</script>

<template>
  <FileUpload.Root>
    <FileUpload.Dropzone>
      <FileUpload.Label>Drag your file(s) here</FileUpload.Label>
    </FileUpload.Dropzone>
    <FileUpload.Trigger>Choose file(s)</FileUpload.Trigger>
    <FileUpload.ClearTrigger>Clear</FileUpload.ClearTrigger>
    <FileUpload.ItemGroup>
      <FileUpload.Context v-slot="api">
        <FileUpload.Item v-for="file in api.acceptedFiles" :key="file.name as string" :file="file">
          <FileUpload.ItemPreview>
            <FileUpload.ItemPreviewImage />
          </FileUpload.ItemPreview>
          <FileUpload.ItemName>{{ file.name }}</FileUpload.ItemName>
          <FileUpload.ItemSizeText>{{ api.getFileSize(file) }}</FileUpload.ItemSizeText>
          <FileUpload.ItemDeleteTrigger>Remove</FileUpload.ItemDeleteTrigger>
        </FileUpload.Item>
      </FileUpload.Context>
    </FileUpload.ItemGroup>
    <FileUpload.HiddenInput />
  </FileUpload.Root>
</template>
