// Demo controls, not a styling runtime. Theme belongs to the document, so body portals inherit it.
document.querySelector<HTMLSelectElement>('#theme')!.addEventListener('change', event => {
  document.documentElement.dataset.theme = (event.target as HTMLSelectElement).value
})
document.querySelector<HTMLInputElement>('#tokens')!.addEventListener('change', event => {
  const on = (event.target as HTMLInputElement).checked
  for (const [name, value] of Object.entries({ '--dy-primary': '#7c3aed', '--dy-radius': '1rem', '--dy-input': '#fedcba', '--dy-background': '#f9fafb' })) {
    if (on) document.documentElement.style.setProperty(name, value)
    else document.documentElement.style.removeProperty(name)
  }
})

export {}
