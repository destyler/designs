import { createMemo, createUniqueId, For, Show } from 'solid-js'
import { FileUpload as Primitive } from '@destyler-ui/solid/file-upload'
import { fileUploadOptions, fileUploadStatus, fileUploadTranslations, returnFileUploadFocus, type FileUploadProps } from '../FileUpload'

export function FileUpload(props: FileUploadProps) {
  const id = createUniqueId()
  const config = createMemo(() => fileUploadOptions(props))
  return <Primitive.Root class="rd-component rd-file-upload" role="group" aria-label={props.label} accept={config().accept} maxFiles={config().maxFiles}
    maxFileSize={config().maxFileSize} disabled={props.disabled} allowDrop={false} preventDocumentDrop={false}
    translations={fileUploadTranslations} onFileChange={({ acceptedFiles }) => props.onFilesChange?.([...acceptedFiles])}>
    <Primitive.Label>{props.label}</Primitive.Label>
    <Primitive.HiddenInput />
    <Primitive.Trigger aria-label={`${config().triggerLabel}: ${props.label}`}>{config().triggerLabel}</Primitive.Trigger>
    <Primitive.Context>{upload => <>
      <Show when={upload().acceptedFiles.length > 0}><Primitive.ItemGroup>
        <For each={upload().acceptedFiles}>{(file, index) => <Primitive.Item file={file} id={`${id}-item-${index()}`}>
          <Primitive.ItemName id={`${id}-name-${index()}`}>{file.name}</Primitive.ItemName>
          <Primitive.ItemDeleteTrigger onClick={event => returnFileUploadFocus(event.currentTarget)}>Remove</Primitive.ItemDeleteTrigger>
        </Primitive.Item>}</For>
      </Primitive.ItemGroup></Show>
      <p class="rd-file-upload-status" role="status">{fileUploadStatus(upload().acceptedFiles.length, upload().rejectedFiles)}</p>
    </>}</Primitive.Context>
  </Primitive.Root>
}
