<script lang="ts">
  import Toast from '../../../packages/ready/svelte/Toast.svelte'
  import { controller } from './state'
</script>

<main><button id="outside" type="button">Outside</button>
  <Toast {controller} label="Activity" /><button id="after" type="button">After</button></main>
