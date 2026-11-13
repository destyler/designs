import { render } from 'solid-js/web';
import { Demo } from './Demo';
import '../../../packages/ready/theme.css';
import '../demo.css';
for(const id of ['default','midnight']) render(()=> <Demo/>,document.getElementById(id)!);
