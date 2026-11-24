import { render } from 'solid-js/web'
import { FileUpload } from '../../../packages/ready/solid/FileUpload'
import { record } from './state'

render(() => <form>
  <FileUpload label="Attachments" accept={['.txt']} maxFiles={2} maxFileSize={8} onFilesChange={record} />
  <FileUpload label="Locked" triggerLabel="Add file" disabled />
  <output data-files />
</form>, document.querySelector('#app')!)
