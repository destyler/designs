import { QrCode as Primitive } from '@destyler-ui/react'
import { prepareQRCode, qrEncoding, type QRCodeProps } from '../QRCode'

export function QRCode(props: QRCodeProps) {
  const { value, label, size } = prepareQRCode(props)
  return <Primitive.Root className="rd-component rd-qr-code" value={value} encoding={qrEncoding}>
    <Primitive.Frame role="img" aria-label={label} width={size} height={size} shapeRendering="crispEdges" style={{ backgroundColor: '#fff' }}>
      <Primitive.Pattern fill="#111827" />
    </Primitive.Frame>
  </Primitive.Root>
}
