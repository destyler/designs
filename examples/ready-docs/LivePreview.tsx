import {useEffect,useRef,useState} from 'react';
import type {Framework} from './content';
export function LivePreview({framework,component,theme,active=true}:{framework:Framework;component:string;active?:boolean;theme:'default'|'midnight'}){
 const frame=useRef<HTMLIFrameElement>(null);
 const [attempt,setAttempt]=useState(0),[status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
 const currentTheme=useRef(theme);currentTheme.current=theme;
 const path=`./previews/${framework.toLowerCase()}/${component.toLowerCase()}.html`;
 // Theme updates do not navigate the frame: user selections remain intact.
 const sendTheme=()=>frame.current?.contentWindow?.postMessage({type:'ready-docs:theme',theme:currentTheme.current},window.location.origin);
 useEffect(()=>{if(!active)return;setStatus('loading');const timer=setTimeout(()=>setStatus('error'),15000);
 const receive=(event:MessageEvent)=>{if(event.source!==frame.current?.contentWindow||event.origin!==window.location.origin||event.data?.type!=='ready-docs:ready'||event.data.framework!==framework||event.data.component!==component.toLowerCase())return;clearTimeout(timer);setStatus('ready');sendTheme()};
 window.addEventListener('message',receive);return()=>{clearTimeout(timer);window.removeEventListener('message',receive)};
 },[framework,component,attempt,active]);
 useEffect(sendTheme,[theme]);
 if(!active)return null;
 return <div className="live-frame"><iframe key={`${path}-${attempt}`} ref={frame} src={path} title={`${framework} ${component} 交互预览`} onLoad={sendTheme}/>{status!=='ready'&&<div className="frame-status" role="status">{status==='loading'?`正在加载 ${framework}…`:<>预览未能加载。<button type="button" onClick={()=>setAttempt(x=>x+1)}>重试</button></>}</div>}</div>;
}
