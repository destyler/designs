import { mount, unmount } from 'svelte'
import Fixture from './SvelteFixture.svelte'
import { expose } from './state'

const instance = mount(Fixture, { target: document.querySelector('#app')! })
expose(() => { void unmount(instance) })
