// Self-contained illustrations avoid any network or third-party image requests.
export function slideImage(index: number) {
  const colors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#db2777']
  const color = colors[(index - 1) % colors.length]
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 300"><rect width="500" height="300" fill="${color}"/><circle cx="420" cy="70" r="100" fill="white" opacity=".15"/><path d="M0 300 140 120 260 240 340 140 500 300" fill="white" opacity=".25"/><text x="35" y="65" font-family="sans-serif" font-size="28" fill="white">Destyler / ${index}</text></svg>`)}`
}
export const exampleImage = slideImage(1)
