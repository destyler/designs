import { validateAccessibleText } from './accessible-text'

/**
 * A client-side file picker, not an uploader or a native form field.
 * Read accepted files via onFilesChange; there is no name, required, or automatic form reset.
 */
export interface FileUploadProps {
  label: string
  triggerLabel?: string
  disabled?: boolean
  /** MIME types/extensions in file input syntax. This is UX validation, not content verification. */
  accept?: string | readonly string[]
  maxFiles?: number
  /** Maximum bytes per file. Omit for no limit. */
  maxFileSize?: number
  onFilesChange?: (files: readonly File[]) => void
}

export function fileUploadOptions({ label, triggerLabel = 'Choose files', accept, maxFiles = 1,
  maxFileSize = Infinity }: FileUploadProps) {
  validateAccessibleText(label, 'FileUpload', 'label')
  validateAccessibleText(triggerLabel, 'FileUpload', 'triggerLabel')
  if (!Number.isSafeInteger(maxFiles) || maxFiles < 1) {
    throw new Error('Ready FileUpload: maxFiles must be a positive integer.')
  }
  if (maxFileSize !== Infinity && (!Number.isSafeInteger(maxFileSize) || maxFileSize < 0)) {
    throw new Error('Ready FileUpload: maxFileSize must be a nonnegative integer in bytes.')
  }
  return {
    triggerLabel,
    accept: typeof accept === 'string' ? accept : accept?.join(','),
    maxFiles,
    maxFileSize,
  }
}

export const fileUploadTranslations = { deleteFile: (file: File) => `Remove ${file.name}` }

const rejectionMessages: Record<string, string> = {
  FILE_INVALID_TYPE: 'unsupported file type',
  FILE_TOO_LARGE: 'file is too large',
  FILE_TOO_SMALL: 'file is too small',
  TOO_MANY_FILES: 'too many files',
  FILE_EXISTS: 'already selected',
}

export function fileUploadStatus(selected: number, rejections: readonly { file: File; errors: readonly string[] }[]) {
  const count = selected ? `${selected} ${selected === 1 ? 'file' : 'files'} selected.` : 'No files selected.'
  const notices = rejections.map(({ file, errors }) =>
    `${file.name}: ${errors.map(code => rejectionMessages[code] ?? 'file could not be selected').join(', ')}.`)
  return [count, ...notices].join(' ')
}

/** Don't strand keyboard focus on a button that is about to be removed. */
export function returnFileUploadFocus(button: EventTarget | null) {
  if (!(button instanceof HTMLElement) || button.ownerDocument.activeElement !== button) return
  button.closest('.rd-file-upload')?.querySelector<HTMLButtonElement>('[data-part="trigger"]')?.focus()
}
