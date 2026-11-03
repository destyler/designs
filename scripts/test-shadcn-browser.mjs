import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { mkdir, readFile } from 'node:fs/promises'

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173'
const browser = await chromium.launch({ headless:true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH}: {}) })
const context = await browser.newContext({viewport:{width:1440,height:1100}})
const page = await context.newPage()
const errors=[]
page.on('pageerror', e=>errors.push(e.message))
const panel = name => page.locator(`.demo-panel[data-demo="${name}"]`)
const checked = control => control.evaluate(el=>'checked' in el ? el.checked : el.getAttribute('aria-checked')==='true')
const background = locator => locator.evaluate(el=>getComputedStyle(el).getPropertyValue('--background').trim())
const activeFramework = async name => {
  await page.getByLabel('Destyler framework',{exact:true}).selectOption(name)
  await panel(name).getByRole('switch',{name:'Marketing emails'}).waitFor()
  assert.equal(await page.locator('.demo-panel').count(),2,'Exactly two demos are mounted')
  assert.equal(await panel('reference').count(),1,'Reference stays mounted')
  const inactive=name==='react'?'vue':'react'
  assert.equal(await panel(inactive).count(),0,'Other framework is unmounted')
  assert.equal(await page.locator(`[data-portal-owner="${inactive}"]`).count(),0,'Unmount cleans up inactive framework portals')
}
const exerciseControls = async name => {
  const root=panel(name)
  const marketing=root.getByRole('switch',{name:'Marketing emails'})
  const initial=await checked(marketing)
  await marketing.press('Space')
  assert.equal(await checked(marketing),!initial,`${name}: keyboard switch`)
  const tips=root.getByRole('checkbox',{name:'Include helpful tips'})
  const initialTips=await checked(tips)
  await tips.press('Space')
  assert.equal(await checked(tips),!initialTips,`${name}: keyboard checkbox`)
  await root.getByRole('tab',{name:'Notifications'}).press('ArrowRight')
  assert.equal(await root.getByRole('tab',{name:'Security'}).getAttribute('aria-selected'),'true')
  assert.equal(await root.getByRole('switch',{name:'Security alerts'}).isDisabled(),true)
  await root.getByRole('tab',{name:'Security'}).press('ArrowLeft')
  assert.equal(await root.getByRole('tab',{name:'Notifications'}).getAttribute('aria-selected'),'true')
  const trigger=root.getByRole('button',{name:'Review preferences'})
  for(const closing of ['Escape','Done','Escape','Done']) {
    await trigger.click()
    const dialog=page.getByRole('dialog',{name:'Your preferences'})
    await dialog.waitFor({state:'visible'})
    assert.equal(await dialog.count(),1,'No leaked dialogs from prior framework')
    assert.ok((await dialog.innerText()).includes(`Marketing: ${!initial?'on':'off'} · Updates: on · Tips: ${!initialTips?'on':'off'}`))
    assert.equal(await background(dialog),await background(root.locator('.demo-surface')),`${name}: portal inherits its owner theme`)
    if(closing==='Escape') await dialog.press('Escape'); else await dialog.getByRole('button',{name:'Done'}).click()
    await dialog.waitFor({state:'hidden'})
    assert.equal(await trigger.evaluate(el=>document.activeElement===el),true,`${name}: focus restored after ${closing}`)
  }
}
try {
  await page.goto(baseURL)
  await page.getByRole('heading',{name:'One design. Two implementations.'}).waitFor()
  await activeFramework('react')
  const referenceNode=await panel('reference').elementHandle()
  await exerciseControls('reference')
  for(const name of ['react','vue','react','vue']) {
    await activeFramework(name)
    assert.equal(await referenceNode.evaluate(el=>el.isConnected),true,'Framework switching preserves reference instance')
    await exerciseControls(name)
  }
  await page.getByRole('button',{name:'All light',exact:true}).click()
  await page.getByRole('button',{name:'Toggle Destyler Vue color mode'}).click()
  assert.deepEqual(await page.locator('.demo-surface').evaluateAll(els=>els.map(el=>el.classList.contains('dark'))),[false,true])
  await activeFramework('react')
  assert.deepEqual(await page.locator('.demo-surface').evaluateAll(els=>els.map(el=>el.classList.contains('dark'))),[false,false])
  await activeFramework('vue')
  assert.deepEqual(await page.locator('.demo-surface').evaluateAll(els=>els.map(el=>el.classList.contains('dark'))),[false,true],'Hidden framework retains its own color mode')
  await exerciseControls('vue')
  await mkdir('artifacts',{recursive:true})
  await page.screenshot({path:'artifacts/shadcn-mixed.png',fullPage:true})
  await page.getByRole('button',{name:'All dark',exact:true}).click()
  for(const name of ['react','vue']) {
    await activeFramework(name)
    const themes=await page.locator('.demo-surface').evaluateAll(els=>els.map(el=>getComputedStyle(el).getPropertyValue('--background').trim()))
    assert.equal(new Set(themes).size,1)
    assert.ok(await panel(name).locator('.demo-surface').evaluate(el=>el.classList.contains('dark')))
    await exerciseControls(name)
  }
  await page.screenshot({path:'artifacts/shadcn-dark.png',fullPage:true})

  const toggle=page.getByRole('button',{name:'View CSS',exact:true})
  assert.equal(await toggle.getAttribute('aria-expanded'),'false')
  assert.equal(await page.locator('#css-inspector').isVisible(),false)
  await toggle.press('Enter')
  const inspector=page.locator('#css-inspector')
  await inspector.waitFor({state:'visible'})
  const source=inspector.locator('[data-testid="css-source"]')
  for(const name of ['Theme tokens','Component classes','Compiled CSS','Vue adapter']) {
    const tab=inspector.getByRole('tab',{name,exact:true})
    await tab.click()
    assert.equal(await tab.getAttribute('aria-selected'),'true')
    await source.waitFor()
    if(name==='Compiled CSS') {
      await page.waitForFunction(()=>{
        const text=document.querySelector('[data-testid="css-source"]')?.textContent
        return text && !text.startsWith('Loading') && text.includes('{')
      })
      const urls=await page.locator('link[rel="stylesheet"]').evaluateAll(links=>links.map(link=>link.href).filter(href=>new URL(href).origin===location.origin))
      assert.ok(urls.length,'Production uses a real stylesheet asset')
      const texts=await Promise.all(urls.map(async url=>{
        const response=await context.request.get(url)
        assert.equal(response.ok(),true)
        assert.match(response.headers()['content-type'],/text\/css/)
        return response.text()
      }))
      assert.equal(await source.textContent(),texts.join('\n'),'Compiled view is exactly the applied stylesheet, not a sample')
      assert.equal(await inspector.locator('.code-filename').innerText(),'Applied production stylesheet')
      if(urls.length===1) assert.equal(await inspector.getByRole('link',{name:'Download CSS'}).getAttribute('href'),urls[0])
    } else {
      const file=await inspector.locator('.code-filename').innerText()
      const link=inspector.getByRole('link',{name:'Open source on GitHub'})
      assert.equal(await link.getAttribute('href'),`https://github.com/destyler/designs/blob/prototype/cloud-scoped-themes/examples/shadcn/${file}`)
      if(name!=='Component classes') assert.equal(await source.textContent(),await readFile(`examples/shadcn/${file}`,'utf8'),`${file}: displayed source equals actual file`)
    }
    assert.ok((await source.innerText()).trim().length>20,`${name}: actual source is present`)
  }
  await inspector.getByRole('tab',{name:'Component classes',exact:true}).click()
  const classesTab=inspector.getByRole('tab',{name:'Component classes',exact:true})
  await classesTab.press('ArrowLeft')
  const tokensTab=inspector.getByRole('tab',{name:'Theme tokens',exact:true})
  assert.equal(await tokensTab.getAttribute('aria-selected'),'true')
  assert.equal(await tokensTab.evaluate(el=>document.activeElement===el),true,'Inspector arrow keys move selection and focus')
  await tokensTab.press('End')
  assert.equal(await inspector.getByRole('tab',{name:'Vue adapter',exact:true}).getAttribute('aria-selected'),'true')
  await inspector.getByRole('tab',{name:'Vue adapter',exact:true}).press('Home')
  assert.equal(await tokensTab.getAttribute('aria-selected'),'true')
  await classesTab.click()
  const recipes=inspector.getByLabel('Component recipe',{exact:true})
  const recipeSources=new Set()
  for(const recipe of ['tabs','switch','checkbox','dialog','card','button','label']) {
    await recipes.selectOption(recipe)
    const text=await source.innerText()
    const groups=JSON.parse(text)
    for(const entries of Object.values(groups)) {
      assert.ok(Object.keys(entries).length>0)
      assert.ok(Object.keys(entries).every(key=>key===recipe || key.startsWith(recipe+'-')),'Recipe filters only the selected component')
    }
    recipeSources.add(text)
  }
  assert.equal(recipeSources.size,7,'Every component exposes its own recipe')
  await activeFramework('react')
  await inspector.getByRole('tab',{name:'React adapter',exact:true}).click()
  assert.equal(await inspector.getByRole('tab',{name:'Vue adapter',exact:true}).count(),0)
  assert.match(await source.innerText(),/react|React/)
  await activeFramework('vue')
  await inspector.getByRole('tab',{name:'Vue adapter',exact:true}).click()
  assert.match(await source.innerText(),/vue|Vue/)
  await inspector.getByRole('tab',{name:'Theme tokens',exact:true}).click()
  const copy=inspector.getByRole('button',{name:'Copy source',exact:true})
  let clipboardSupported=true
  try { await context.grantPermissions(['clipboard-read','clipboard-write']) } catch { clipboardSupported=false }
  await copy.click()
  if(clipboardSupported) assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),await source.innerText(),'Copy returns the displayed source')
  else console.log('SKIP: this browser does not support clipboard permissions; testing failure feedback below.')
  await page.evaluate(()=>Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:async()=>{throw new Error('Clipboard denied in test')}}))
  await copy.click()
  await inspector.getByRole('status').filter({hasText:'Clipboard unavailable'}).waitFor()
  assert.ok(await source.isVisible(),'Clipboard failure leaves selectable source available')
  await page.setViewportSize({width:390,height:844})
  for(const name of ['react','vue']) {
    await activeFramework(name)
    for(const tab of ['Theme tokens','Component classes','Compiled CSS',`${name==='react'?'React':'Vue'} adapter`]) {
      await inspector.getByRole('tab',{name:tab,exact:true}).click()
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${name}/${tab}: no mobile page overflow`)
    }
  }
  await page.screenshot({path:'artifacts/shadcn-mobile.png',fullPage:true})
  assert.deepEqual(errors,[])
  console.log('PASS: two-column conditional mounting, repeated React/Vue switching, keyboard controls, repeated dialog close/focus, owner-themed portals, independent themes, CSS inspector/copy, mobile overflow, and browser errors.')
} finally {
  await browser.close()
}
