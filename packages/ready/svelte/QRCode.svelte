<script lang="ts">
  import { QrCode as Primitive } from '@destyler-ui/svelte/qr-code'
  import { prepareQRCode, qrEncoding, type QRCodeProps } from '../QRCode'

  const props: QRCodeProps = $props()
  const code = $derived(prepareQRCode(props))
</script>

<Primitive.Root class="rd-component rd-qr-code" value={code.value} encoding={qrEncoding}>
  <Primitive.Frame role="img" aria-label={code.label} width={code.size} height={code.size}
    shape-rendering="crispEdges" style="background-color:#fff">
    <Primitive.Pattern fill="#111827" />
  </Primitive.Frame>
</Primitive.Root>
