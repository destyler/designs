<script>
  import { Switch, Dialog } from '@destyler-ui/svelte'
  let { styles } = $props()
  const c = styles.classes
</script>
<section class={styles.themes.light}>
  <Switch.Root id="ssr-switch" class={c.switchRoot}>
    <Switch.Label class={c.switchLabel}>Notifications</Switch.Label>
    <Switch.Control class={c.switchControl}><Switch.Thumb class={c.switchThumb} /></Switch.Control>
    <Switch.HiddenInput role="switch" />
  </Switch.Root>
  <Dialog.Root id="ssr-dialog">
    <Dialog.Trigger class={c.button}>Open settings</Dialog.Trigger>
    <Dialog.Backdrop class={c.dialogBackdrop} />
    <Dialog.Positioner class={c.dialogPositioner}>
      <Dialog.Content class={c.dialogContent}>
        <Dialog.Title class={c.dialogTitle}>Settings</Dialog.Title>
        <Dialog.Description class={c.dialogDescription}>Dialog description</Dialog.Description>
        <Dialog.CloseTrigger class={c.dialogClose}>Close</Dialog.CloseTrigger>
      </Dialog.Content>
    </Dialog.Positioner>
  </Dialog.Root>
</section>
