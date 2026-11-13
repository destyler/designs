<script lang="ts">
  import { sampleImage } from './sample-image'
  import { AspectRatio } from '@destyler-ui/svelte/aspect-ratio'
</script>

<main style="width: 100%; max-width: 384px;">
  <AspectRatio.Root ratio={16 / 9}>
    <AspectRatio.Content>
      <img
        src={sampleImage}
        alt="Geometric illustration"
        style="width: 100%; height: 100%; object-fit: cover;"
      />
    </AspectRatio.Content>
  </AspectRatio.Root>
</main>
