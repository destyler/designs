<script lang="ts">
  import { Carousel } from '@destyler-ui/svelte/carousel'
  const images = Array.from({ length: 5 }, (_, index) => 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22500%22%20height%3D%22300%22%3E%3Crect%20width%3D%22500%22%20height%3D%22300%22%20fill%3D%22%23386c86%22/%3E%3Ccircle%20cx%3D%22350%22%20cy%3D%2285%22%20r%3D%2245%22%20fill%3D%22%23ffd38a%22/%3E%3Cpath%20d%3D%22M0%20260L150%20100L310%20300H0%22%20fill%3D%22%23264953%22/%3E%3C/svg%3E')
</script>

<Carousel.Root>
  <Carousel.Control>
    <Carousel.PrevTrigger>Previous</Carousel.PrevTrigger>
    <Carousel.NextTrigger>Next</Carousel.NextTrigger>
    <Carousel.AutoplayTrigger>
      <Carousel.Context>{#snippet render(api)}{api().isPlaying ? 'Pause' : 'Play'}{/snippet}</Carousel.Context>
    </Carousel.AutoplayTrigger>
  </Carousel.Control>
  <Carousel.IndicatorGroup>
    {#each images as _, index}<Carousel.Indicator {index} />{/each}
  </Carousel.IndicatorGroup>
  <Carousel.ItemGroup>
    {#each images as image, index}<Carousel.Item {index}><img src={image} alt="" style="height: 300px; width: 100%; object-fit: cover;" /></Carousel.Item>{/each}
  </Carousel.ItemGroup>
</Carousel.Root>
