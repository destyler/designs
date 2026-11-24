import { mount } from 'svelte'
import Demo from './Demo.svelte'
import '../../../packages/ready/theme.css'
import '../demo.css'
for (const id of ['default', 'midnight']) mount(Demo, { target: document.getElementById(id)! })
