<script setup lang="ts">
import { computed } from 'vue'
import { QrCode as Primitive } from '@destyler-ui/vue'
import { prepareQRCode, qrEncoding, type QRCodeProps } from '../QRCode'

const props = defineProps<QRCodeProps>()
const code = computed(() => prepareQRCode(props))
</script>

<template>
  <Primitive.Root class="rd-component rd-qr-code" :model-value="code.value" :encoding="qrEncoding">
    <Primitive.Frame role="img" :aria-label="code.label" :width="code.size" :height="code.size" shape-rendering="crispEdges" style="background-color:#fff">
      <Primitive.Pattern fill="#111827" />
    </Primitive.Frame>
  </Primitive.Root>
</template>
