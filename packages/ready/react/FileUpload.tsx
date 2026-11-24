import { useId } from 'react'
import { FileUpload as Primitive } from '@destyler-ui/react'
import { fileUploadOptions, fileUploadStatus, fileUploadTranslations, returnFileUploadFocus, type FileUploadProps } from '../FileUpload'

export function FileUpload(props: FileUploadProps) {
  const id = useId()
  const { triggerLabel, accept, maxFiles, maxFileSize } = fileUploadOptions(props)
  return <Primitive.Root className="rd-component rd-file-upload" role="group" aria-label={props.label} accept={accept} maxFiles={maxFiles} maxFileSize={maxFileSize}
    disabled={props.disabled} allowDrop={false} preventDocumentDrop={false} translations={fileUploadTranslations}
    onFileChange={({ acceptedFiles }) => props.onFilesChange?.([...acceptedFiles])}>
    <Primitive.Label>{props.label}</Primitive.Label>
    <Primitive.HiddenInput />
    <Primitive.Trigger aria-label={`${triggerLabel}: ${props.label}`}>{triggerLabel}</Primitive.Trigger>
    <Primitive.Context>{({ acceptedFiles, rejectedFiles }) => <>
      {acceptedFiles.length > 0 && <Primitive.ItemGroup>
        {acceptedFiles.map((file, index) => <Primitive.Item key={index} file={file} id={`${id}-item-${index}`}>
          <Primitive.ItemName id={`${id}-name-${index}`}>{file.name}</Primitive.ItemName>
          <Primitive.ItemDeleteTrigger onClick={event => returnFileUploadFocus(event.currentTarget)}>Remove</Primitive.ItemDeleteTrigger>
        </Primitive.Item>)}
      </Primitive.ItemGroup>}
      <p className="rd-file-upload-status" role="status">{fileUploadStatus(acceptedFiles.length, rejectedFiles)}</p>
    </>}</Primitive.Context>
  </Primitive.Root>
}
