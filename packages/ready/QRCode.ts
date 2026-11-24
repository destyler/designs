import { validateAccessibleText } from './accessible-text'

export interface QRCodeProps {
  /** Nonblank Unicode text, at most 256 UTF-8 bytes; encoded locally and unchanged. */
  value: string
  /** The SVG image's accessible name. */
  label: string
  /** Preferred display size in CSS pixels, from 96 to 512. Defaults to 256. */
  size?: number
}

export const qrEncoding = { border: 4, ecc: 'M' } as const

export function prepareQRCode({ value, label, size = 256 }: QRCodeProps) {
  validateAccessibleText(label, 'QRCode', 'label')
  if (typeof value !== 'string') throw new TypeError('Ready QRCode: value must be nonblank Unicode text.')
  // Reject oversized input before allocating a UTF-8 buffer or invoking the encoder.
  if (value.length > 256) throw new RangeError('Ready QRCode: value must be at most 256 UTF-8 bytes.')
  if (!value.trim() || /[\uD800-\uDFFF]/u.test(value)) throw new TypeError('Ready QRCode: value must be nonblank Unicode text.')
  if (new TextEncoder().encode(value).byteLength > 256) throw new RangeError('Ready QRCode: value must be at most 256 UTF-8 bytes.')
  if (!Number.isInteger(size) || size < 96 || size > 512) throw new RangeError('Ready QRCode: size must be an integer from 96 to 512.')
  return { value, label, size }
}
