<script setup lang="ts">
import { ref } from 'vue'
import { Checkbox, Select, Dialog } from '../../../packages/ready/vue'
const checked = ref(false), value = ref(''), open = ref(false)
const options = [{ label: 'Starter', value: 'starter' }, { label: 'Studio', value: 'studio' }, { label: 'Enterprise', value: 'enterprise', disabled: true }]
</script>
<template><div class="rd-demo"><Checkbox name="updates" label="Email me product updates" v-model:checked="checked" /><Select name="plan" label="Workspace plan" :options="options" v-model:value="value" /><Dialog trigger="Review settings" title="Your workspace" description="Your choices stay with you when the theme changes." v-model:open="open"><p>Plan: {{ value || 'Not selected' }}</p><p>Updates: {{ checked ? 'Enabled' : 'Disabled' }}</p></Dialog><p role="status">{{ checked ? 'Updates enabled' : 'Updates disabled' }} · {{ value || 'No plan selected' }}</p></div></template>
