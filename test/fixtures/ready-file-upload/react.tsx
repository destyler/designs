import { createRoot } from 'react-dom/client'
import { FileUpload } from '../../../packages/ready/react/FileUpload'
import { record } from './state'

createRoot(document.querySelector('#app')!).render(<form>
  <FileUpload label="Attachments" accept={['.txt']} maxFiles={2} maxFileSize={8} onFilesChange={record} />
  <FileUpload label="Locked" triggerLabel="Add file" disabled />
  <output data-files />
</form>)
