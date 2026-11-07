import { useState } from 'react'
import { FileUpload } from '@destyler-ui/react'

export function Basic() {
  const [_files, setFiles] = useState<string[]>([])

  return (
    <FileUpload.Root onFileChange={details => setFiles(details.acceptedFiles.map(f => f.name))}>
      <FileUpload.Dropzone>
        <FileUpload.Label>Drag your file(s) here</FileUpload.Label>
      </FileUpload.Dropzone>
      <FileUpload.Trigger>Choose file(s)</FileUpload.Trigger>
      <FileUpload.ClearTrigger>Clear</FileUpload.ClearTrigger>
      <FileUpload.ItemGroup>
        <FileUpload.Context>
          {api => (
            <>
              {api.acceptedFiles.map(file => (
                <FileUpload.Item key={file.name} file={file}>
                  <FileUpload.ItemPreview>
                    <FileUpload.ItemPreviewImage />
                  </FileUpload.ItemPreview>
                  <FileUpload.ItemName>{file.name}</FileUpload.ItemName>
                  <FileUpload.ItemSizeText>{api.getFileSize(file)}</FileUpload.ItemSizeText>
                  <FileUpload.ItemDeleteTrigger>Remove</FileUpload.ItemDeleteTrigger>
                </FileUpload.Item>
              ))}
            </>
          )}
        </FileUpload.Context>
      </FileUpload.ItemGroup>
      <FileUpload.HiddenInput />
    </FileUpload.Root>
  )
}
