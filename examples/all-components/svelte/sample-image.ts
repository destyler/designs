/** Same local illustration as the Destyler gallery; no third-party image request. */
export function makeSampleImage(color = '4f46e5') {
  return `data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 500 300%22%3E%3Crect width=%22500%22 height=%22300%22 fill=%22%23${color}%22/%3E%3Ccircle cx=%22250%22 cy=%22150%22 r=%2280%22 fill=%22%23a5b4fc%22/%3E%3C/svg%3E`
}
export const sampleImage = makeSampleImage()
