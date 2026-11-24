export function record(files: readonly File[]) {
  const output = document.querySelector('[data-files]')!
  output.textContent = JSON.stringify(files.map(({ name, size }) => ({ name, size })))
}
