<script lang="ts">
  import { AspectRatio } from '@destyler-ui/svelte/aspect-ratio'
</script>

<main style="width: 300px;">
  <AspectRatio.Root ratio={16 / 9}>
    <AspectRatio.Content>
      <img
        src="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22500%22%20height%3D%22300%22%3E%3Crect%20width%3D%22500%22%20height%3D%22300%22%20fill%3D%22%23386c86%22/%3E%3Ccircle%20cx%3D%22350%22%20cy%3D%2285%22%20r%3D%2245%22%20fill%3D%22%23ffd38a%22/%3E%3Cpath%20d%3D%22M0%20260L150%20100L310%20300H0%22%20fill%3D%22%23264953%22/%3E%3C/svg%3E"
        alt="Sunset"
        style="width: 100%; height: 100%; object-fit: cover;"
      />
    </AspectRatio.Content>
  </AspectRatio.Root>
</main>
