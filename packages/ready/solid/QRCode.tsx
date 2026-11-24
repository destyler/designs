import { createMemo } from 'solid-js'
import { QrCode as Primitive } from '@destyler-ui/solid/qr-code'
import { prepareQRCode, qrEncoding, type QRCodeProps } from '../QRCode'

export function QRCode(props: QRCodeProps) {
  const code = createMemo(() => prepareQRCode(props))
  return <Primitive.Root class="rd-component rd-qr-code" value={code().value} encoding={qrEncoding}>
    <Primitive.Frame role="img" aria-label={code().label} width={code().size} height={code().size}
      shape-rendering="crispEdges" style={{ 'background-color': '#fff' }}>
      <Primitive.Pattern fill="#111827" />
    </Primitive.Frame>
  </Primitive.Root>
}
