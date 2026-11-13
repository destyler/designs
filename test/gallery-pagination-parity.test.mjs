import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { paginationItems } from '../examples/all-components/react/pagination-items.ts'

test('Pagination application helpers stay identical across four source exports', async () => {
  const files = await Promise.all(['react', 'vue', 'solid', 'svelte'].map(fw => readFile(new URL(`../examples/all-components/${fw}/pagination-items.ts`, import.meta.url), 'utf8')))
  for (const file of files) assert.equal(file, files[0])
})
test('Pagination uses reference endpoint and neighbor windows on every page', () => {
  const expected = [
    [1,2,3,'…',10], [1,2,3,4,'…',10], [1,2,3,4,5,'…',10],
    [1,2,3,4,5,6,'…',10], [1,'…',3,4,5,6,7,'…',10],
    [1,'…',4,5,6,7,8,'…',10], [1,'…',5,6,7,8,9,10],
    [1,'…',6,7,8,9,10], [1,'…',7,8,9,10], [1,'…',8,9,10],
  ]
  for (let page=1; page<=10; page++) assert.deepEqual(paginationItems(page).map(item => item.type === 'page' ? item.value : '…'), expected[page-1])
})
