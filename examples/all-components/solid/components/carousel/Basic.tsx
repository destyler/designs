import { Carousel } from "@destyler-ui/solid";
export function Basic() {
  const images = ["4f46e5", "0f766e", "be123c", "b45309", "7e22ce"].map(
    (color) =>
      `data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 500 300%22%3E%3Crect width=%22500%22 height=%22300%22 fill=%22%23${color}%22/%3E%3Ccircle cx=%22250%22 cy=%22150%22 r=%2280%22 fill=%22%23a5b4fc%22/%3E%3C/svg%3E`,
  );
  return (
    <Carousel.Root>
      <Carousel.ItemGroup>
        {images.map((image, index) => (
          <Carousel.Item index={index}>
            <img
              src={image}
              alt={`Slide ${index + 1}`}
              style={{
                width: "100%",
                "aspect-ratio": "16 / 9",
                "object-fit": "cover",
                "border-radius": "6px",
              }}
            />
          </Carousel.Item>
        ))}
      </Carousel.ItemGroup>
      <Carousel.Control>
        <Carousel.PrevTrigger aria-label="Previous slide">
          ←
        </Carousel.PrevTrigger>
        <Carousel.NextTrigger aria-label="Next slide">→</Carousel.NextTrigger>
      </Carousel.Control>
    </Carousel.Root>
  );
}
