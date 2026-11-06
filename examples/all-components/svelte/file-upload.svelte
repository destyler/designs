<script lang="ts">
  import { FileUpload } from '@destyler-ui/svelte/file-upload'

</script>

<FileUpload.Root>
  <FileUpload.Dropzone>
    <FileUpload.Label>Drag your file(s) here</FileUpload.Label>
  </FileUpload.Dropzone>
  <FileUpload.Trigger>Choose file(s)</FileUpload.Trigger>
  <FileUpload.ClearTrigger>Clear</FileUpload.ClearTrigger>
  <FileUpload.ItemGroup>
    <FileUpload.Context>
      {#snippet render(api)}
        {#each api().acceptedFiles as file (`${file.name}-${file.lastModified}`)}
          <FileUpload.Item {file}>
            <FileUpload.ItemPreview>
              <FileUpload.ItemPreviewImage />
            </FileUpload.ItemPreview>
            <FileUpload.ItemName>{file.name}</FileUpload.ItemName>
            <FileUpload.ItemSizeText>{api().getFileSize(file)}</FileUpload.ItemSizeText>
            <FileUpload.ItemDeleteTrigger>Remove</FileUpload.ItemDeleteTrigger>
          </FileUpload.Item>
        {/each}
      {/snippet}
    </FileUpload.Context>
  </FileUpload.ItemGroup>
  <FileUpload.HiddenInput />
</FileUpload.Root>
