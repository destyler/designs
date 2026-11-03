import { execFileSync } from 'node:child_process'
import { readFile, readdir, writeFile } from 'node:fs/promises'
const paths = execFileSync('npm',['ls','--omit=dev','--all','--parseable'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim().split('\n').slice(1)
let text = 'THIRD-PARTY NOTICES\n\nshadcn/ui\nSource: https://github.com/shadcn-ui/ui/tree/4aaea19d9cff3e0908e12a8c1d504b8c5ec34610\n\n'+await readFile('vendor/shadcn/LICENSE','utf8')
for(const path of [...new Set(paths)].sort()) {
  const pkg=JSON.parse(await readFile(path+'/package.json','utf8'))
  const licenses=(await readdir(path)).filter(name=>/^(license|licence|copying)(\..*)?$/i.test(name))
  text+=`\n\n========================================\n${pkg.name}@${pkg.version} (${pkg.license || 'see package'})\n`
  for(const license of licenses) text+='\n'+await readFile(path+'/'+license,'utf8')
}
await writeFile('public/THIRD_PARTY_NOTICES.txt',text)
console.log('Prepared upstream and runtime dependency license notices.')
