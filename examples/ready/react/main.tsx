import { createRoot } from 'react-dom/client';
import { Demo } from './Demo';
import '../../../packages/ready/theme.css';
import '../demo.css';
for(const id of ['default','midnight']) createRoot(document.getElementById(id)!).render(<Demo/>);
