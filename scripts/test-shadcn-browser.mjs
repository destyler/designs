import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173'
const browser = await chromium.launch({ headless:true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH}: {}) })
const page = await browser.newPage({viewport:{width:1440,height:1100}})
const errors=[]
page.on('pageerror', e=>errors.push(e.message))
await page.goto(baseURL)
await page.getByRole('heading',{name:'One design. Real components.'}).waitFor()
for (const name of ['reference','react','vue']) {
  const panel=page.locator(`[data-demo="${name}"]`)
  const switchControl=panel.getByRole('switch',{name:'Marketing emails'})
  await switchControl.press('Space')
  assert.equal(await switchControl.evaluate(el=>'checked' in el ? el.checked : el.getAttribute('aria-checked')==='true'),true)
  await panel.getByRole('checkbox',{name:'Include helpful tips'}).press('Space')
  await panel.getByRole('tab',{name:'Notifications'}).press('ArrowRight')
  assert.equal(await panel.getByRole('tab',{name:'Security'}).getAttribute('aria-selected'),'true')
  assert.equal(await panel.getByRole('switch',{name:'Security alerts'}).isDisabled(),true)
  await panel.getByRole('tab',{name:'Security'}).press('ArrowLeft')
  const trigger=panel.getByRole('button',{name:'Review preferences'})
  for(const closing of ['Escape','Done']) {
    await trigger.click()
    const dialog=page.getByRole('dialog',{name:'Your preferences'})
    await dialog.waitFor({state:'visible'})
    assert.ok((await dialog.innerText()).includes('Marketing: on · Updates: on · Tips: off'))
    if(closing==='Escape') await dialog.press('Escape'); else await dialog.getByRole('button',{name:'Done'}).click()
    await dialog.waitFor({state:'hidden'})
    assert.equal(await trigger.evaluate(el=>document.activeElement===el),true)
  }
}
await page.getByRole('button',{name:'All dark',exact:true}).click()
const themes=await page.locator('.demo-surface').evaluateAll(els=>els.map(el=>getComputedStyle(el).getPropertyValue('--background')))
assert.equal(new Set(themes).size,1)
for(const name of ['react','vue']) {
  await page.locator(`[data-demo="${name}"]`).getByRole('button',{name:'Review preferences'}).click()
  const dialog=page.getByRole('dialog',{name:'Your preferences'})
  assert.equal((await dialog.evaluate(el=>getComputedStyle(el).getPropertyValue('--background'))).trim(),themes[0].trim())
  await dialog.press('Escape')
}
await mkdir('artifacts',{recursive:true})
await page.screenshot({path:'artifacts/shadcn-dark.png',fullPage:true})
await page.getByRole('button',{name:'All light',exact:true}).click()
await page.getByRole('button',{name:'Toggle Destyler Vue color mode'}).click()
assert.deepEqual(await page.locator('.demo-surface').evaluateAll(els=>els.map(el=>el.classList.contains('dark'))),[false,false,true])
await page.screenshot({path:'artifacts/shadcn-mixed.png',fullPage:true})
await page.setViewportSize({width:390,height:844})
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
await page.screenshot({path:'artifacts/shadcn-mobile.png',fullPage:true})
assert.deepEqual(errors,[])
await browser.close()
console.log('PASS: production-browser controls, keyboard tabs, repeat dialog close/Escape/focus restoration, dark portals, independent themes, mobile overflow, and console.')
