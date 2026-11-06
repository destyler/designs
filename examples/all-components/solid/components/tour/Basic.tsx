import { DemoTour } from './tour'

export function Basic() {
  return (
    <main>
      <DemoTour />
      <div class="tour">
        <div class="steps__container">
          <h3 id="step-1">Step 1: Explore components</h3>
          <p>The tour highlights real elements in this example.</p>
          <h3 id="step-2">Step 2: Try interactions</h3>
          <p>Use Next, Previous, Close, or Escape. Start again at any time.</p>
          <h3 id="step-3">Step 3: Build something</h3>
          <p>All examples use the published Destyler primitives.</p>
        </div>
      </div>
    </main>
  )
}
