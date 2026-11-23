<script lang="ts">
  import { FileUpload as Primitive } from '@destyler-ui/svelte/file-upload'
  import { fileUploadOptions, fileUploadStatus, fileUploadTranslations, returnFileUploadFocus, type FileUploadProps } from '../FileUpload'

  const props: FileUploadProps = $props()
  const id = $props.id()
  const config = $derived(fileUploadOptions(props))
</script>

<Primitive.Root class="rd-component rd-file-upload" role="group" aria-label={props.label} accept={config.accept} maxFiles={config.maxFiles} maxFileSize={config.maxFileSize}
  disabled={props.disabled} allowDrop={false} preventDocumentDrop={false} translations={fileUploadTranslations}
  onFileChange={({ acceptedFiles }) => props.onFilesChange?.([...acceptedFiles])}>
  <Primitive.Label>{props.label}</Primitive.Label>
  <Primitive.HiddenInput />
  <Primitive.Trigger aria-label={`${config.triggerLabel}: ${props.label}`}>{config.triggerLabel}</Primitive.Trigger>
  <Primitive.Context>
    {#snippet render(upload)}
      {#if upload().acceptedFiles.length}
        <Primitive.ItemGroup>
          {#each upload().acceptedFiles as file, index}
            <Primitive.Item {file} id={`${id}-item-${index}`}>
              <Primitive.ItemName id={`${id}-name-${index}`}>{file.name}</Primitive.ItemName>
              <Primitive.ItemDeleteTrigger onclick={event => returnFileUploadFocus(event.currentTarget)}>Remove</Primitive.ItemDeleteTrigger>
            </Primitive.Item>
          {/each}
        </Primitive.ItemGroup>
      {/if}
      <p class="rd-file-upload-status" role="status">{fileUploadStatus(upload().acceptedFiles.length, upload().rejectedFiles)}</p>
    {/snippet}
  </Primitive.Context>
</Primitive.Root>
