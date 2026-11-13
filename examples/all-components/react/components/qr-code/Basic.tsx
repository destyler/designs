import { sampleImage } from '../../sample-image'
import { QrCode } from '@destyler-ui/react'

export function Basic() {
  return (
    <QrCode.Root value="https://destyler.com">
      <QrCode.Frame>
        <QrCode.Pattern data-testid="pattern" />
      </QrCode.Frame>
      <QrCode.Overlay>
        <img src={sampleImage} alt="" />
      </QrCode.Overlay>
      <QrCode.DownloadTrigger fileName="qr-code.png" mimeType="image/png">
        Download
      </QrCode.DownloadTrigger>
    </QrCode.Root>
  )
}
