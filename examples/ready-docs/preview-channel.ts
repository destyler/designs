export function connectPreview(framework: string, component: string) {
 const apply=(theme:unknown)=>{if(theme==='default'||theme==='midnight')document.body.dataset.rdTheme=theme};
 apply(new URLSearchParams(location.search).get('theme'));
 window.addEventListener('message',event=>{
  if(event.source!==parent||event.origin!==location.origin||event.data?.type!=='ready-docs:theme')return;
  apply(event.data.theme);
 });
 parent.postMessage({type:'ready-docs:ready',framework,component},location.origin);
}
