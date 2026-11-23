<script lang="ts">
  import FileUpload from '../../../packages/ready/svelte/FileUpload.svelte'
  import { record } from './state'
</script>

<form>
  <FileUpload label="Attachments" accept={['.txt']} maxFiles={2} maxFileSize={8} onFilesChange={record} />
  <FileUpload label="Locked" triggerLabel="Add file" disabled />
  <output data-files />
</form>
