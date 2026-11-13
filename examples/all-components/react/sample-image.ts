// Embedded artwork keeps previews independent of remote image hosts.
const colors = ['#fbbf24', '#38bdf8', '#c084fc', '#fb7185', '#a3e635']
export function createSampleImage(index = 0) {
  const color = colors[index % colors.length]
  return 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="${color}"/><stop offset="1" stop-color="#f472b6"/></linearGradient></defs><rect width="640" height="400" fill="url(#sky)"/><circle cx="${450 - index * 45}" cy="115" r="60" fill="#fef3c7"/><path d="M0 360L170 130l135 170 120-125 215 200v25H0Z" fill="#0f766e"/><path d="M0 400l230-200 190 200Z" fill="#134e4a"/></svg>`)
}
export const sampleImage = createSampleImage()
