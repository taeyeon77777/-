import type { Project, Scene, Layer } from './templateEngine';
import type { CustomerValues } from './customerBinding';

export function getDuration(scene:Scene):number { const value=scene.scene?.duration; return typeof value==='number' && Number.isFinite(value) ? Math.min(300,Math.max(1,value)) : 5; }
export function getTotalDuration(project:Project):number { return project.scenes.reduce((n,s)=>n+getDuration(s),0); }
export function locateScene(project:Project,time:number):{scene:Scene;index:number;local:number}|null {
  if (!project.scenes.length) return null;
  let elapsed=0;
  for(let i=0;i<project.scenes.length;i++) { const duration=getDuration(project.scenes[i]); if(time<elapsed+duration || i===project.scenes.length-1) return {scene:project.scenes[i],index:i,local:Math.max(0,time-elapsed)}; elapsed+=duration; }
  return null;
}
export function layerMotion(layer:Layer,time:number):{alpha:number;dx:number;dy:number;scale:number;rotate:number} {
  const a=layer.animation; const state={alpha:1,dx:0,dy:0,scale:1,rotate:0};
  if(!a || a.effect==='none')return state;
  const duration=Number.isFinite(a.duration) && a.duration>0 ? Math.max(.1,a.duration) : 1, delay=Number.isFinite(a.delay) ? Math.max(0,a.delay) : 0;
  if(time<delay)return {...state,alpha:0};
  const t=a.repeat ? ((time-delay)%duration)/duration : Math.min(1,(time-delay)/duration);
  const ease=1-Math.pow(1-t,3); const effect=a.effect.toLowerCase();
  if(effect.includes('fade'))state.alpha=ease;
  if(effect.includes('slide')||effect.includes('up'))state.dy=(1-ease)*80;
  if(effect.includes('down'))state.dy=-(1-ease)*80;
  if(effect.includes('left'))state.dx=(1-ease)*80;
  if(effect.includes('right'))state.dx=-(1-ease)*80;
  if(effect.includes('zoom')||effect.includes('scale')||effect.includes('pop'))state.scale=.65+.35*ease;
  if(effect.includes('bounce'))state.dy=-Math.abs(Math.sin(t*Math.PI*3))*(1-t)*35;
  if(effect.includes('rotate')||effect.includes('spin'))state.rotate=360*ease;
  if(effect.includes('shake'))state.dx=Math.sin(t*Math.PI*14)*(1-t)*14;
  if(effect.includes('float'))state.dy=Math.sin(t*Math.PI*2)*12;
  return state;
}
const safeColor=(c:unknown,fallback:string)=>typeof c==='string' && (/^#[0-9a-f]{3,8}$/i.test(c)||/^rgba?\([\d.,\s%]+\)$/i.test(c))?c:fallback;
export async function loadProjectImages(project:Project,values:CustomerValues,signal?:AbortSignal):Promise<Map<string,HTMLImageElement>> {
  const urls=new Set<string>();
  for(const scene of project.scenes){if(scene.bg.type==='image' && typeof scene.bg.imageDataUrl==='string')urls.add(scene.bg.imageDataUrl);
    for(const layer of scene.elements)if(layer.type==='photo_zone' && values.photos[layer.id])urls.add(values.photos[layer.id]);}
  const images=new Map<string,HTMLImageElement>();
  for(const url of urls){
    if(signal?.aborted)throw new Error('영상 제작 취소');
    const img=new Image();img.crossOrigin='anonymous';
    await new Promise<void>((resolve,reject)=>{
      let settled=false;
      const cleanup=()=>{clearTimeout(timer);img.onload=null;img.onerror=null;signal?.removeEventListener('abort',abort)};
      const finish=(error?:Error)=>{if(settled)return;settled=true;cleanup();if(error){img.src='';reject(error)}else resolve()};
      const abort=()=>finish(new Error('영상 제작 취소'));
      const timer=setTimeout(()=>finish(new Error('사진 로딩 시간 초과')),20000);
      img.onload=()=>finish();img.onerror=()=>finish(new Error('사진을 불러올 수 없습니다'));
      signal?.addEventListener('abort',abort,{once:true});
      if(signal?.aborted)abort();else img.src=url;
    });
    if(!img.naturalWidth||!img.naturalHeight)throw new Error('이미지 크기가 올바르지 않습니다');
    images.set(url,img);
  }
  return images;
}
function cover(ctx:CanvasRenderingContext2D,img:HTMLImageElement,x:number,y:number,w:number,h:number){const r=Math.max(w/img.naturalWidth,h/img.naturalHeight), iw=img.naturalWidth*r,ih=img.naturalHeight*r;ctx.drawImage(img,x+(w-iw)/2,y+(h-ih)/2,iw,ih)}
export function drawProjectFrame(ctx:CanvasRenderingContext2D,project:Project,values:CustomerValues,images:Map<string,HTMLImageElement>,time:number,width=1280,height=720):void {
  const loc=locateScene(project,time);ctx.clearRect(0,0,width,height);if(!loc)return;
  const {scene,local}=loc;ctx.fillStyle=safeColor(scene.bg.color,'#fdf6ef');ctx.fillRect(0,0,width,height);
  if(scene.bg.type==='gradient'){const g=ctx.createLinearGradient(0,0,width,height);g.addColorStop(0,safeColor(scene.bg.color,'#fff'));g.addColorStop(1,safeColor(scene.bg.color2,'#f5dce3'));ctx.fillStyle=g;ctx.fillRect(0,0,width,height)}
  if(scene.bg.type==='image'&&typeof scene.bg.imageDataUrl==='string'){const im=images.get(scene.bg.imageDataUrl);if(im)cover(ctx,im,0,0,width,height)}
  for(const layer of scene.elements){if(layer.hidden)continue;const x=layer.x/100*width,y=layer.y/100*height,w=layer.w/100*width,h=layer.h/100*height;
    const m=layerMotion(layer,local);ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,(Number.isFinite(layer.opacity)?layer.opacity:1)*m.alpha));ctx.translate(x+w/2+m.dx,y+h/2+m.dy);ctx.rotate(((layer.rotation||0)+m.rotate)*Math.PI/180);ctx.scale(m.scale,m.scale);
    const left=-w/2,top=-h/2;
    if(layer.type==='rect'||layer.type==='ellipse'){ctx.fillStyle=safeColor(layer.fill,'#f8d7da');ctx.beginPath();if(layer.type==='ellipse')ctx.ellipse(0,0,w/2,h/2,0,0,2*Math.PI);else ctx.rect(left,top,w,h);ctx.fill()}
    else if(layer.type==='line'){ctx.strokeStyle=safeColor(layer.stroke,'#c9a96e');ctx.lineWidth=Math.max(1,Number(layer.strokeWidth)||2);ctx.beginPath();ctx.moveTo(left,0);ctx.lineTo(-left,0);ctx.stroke()}
    else if(layer.type==='photo_zone'){const url=values.photos[layer.id];const im=url?images.get(url):undefined;ctx.beginPath();if(layer.frameStyle==='circle')ctx.ellipse(0,0,w/2,h/2,0,0,2*Math.PI);else ctx.rect(left,top,w,h);ctx.clip();if(im)cover(ctx,im,left,top,w,h);else{ctx.fillStyle='#e5dfe3';ctx.fillRect(left,top,w,h)}}
    else if(layer.type==='text'||layer.type==='sticker'){const raw=layer.type==='sticker'?String(layer.emoji||'🌸'):String(values.texts[layer.id]??layer.text??'');const fs=layer.type==='sticker'?Math.max(18,h*.7):Math.max(12,(Number(layer.fontSize)||4)/100*width);ctx.fillStyle=safeColor(layer.color,'#29252a');ctx.font=`${layer.italic?'italic ':''}${layer.fontWeight||400} ${fs}px sans-serif`;ctx.textAlign=layer.textAlign==='left'?'left':layer.textAlign==='right'?'right':'center';ctx.textBaseline='middle';ctx.fillText(raw.slice(0,300),ctx.textAlign==='left'?left:ctx.textAlign==='right'?w/2:0,0,w)}
    ctx.restore();
  }
}
export async function exportProjectVideo(project:Project,values:CustomerValues,progress:(n:number)=>void,signal?:AbortSignal):Promise<{blob:Blob;extension:'webm'|'mp4'}>{
  if(!project.scenes.length)throw new Error('장면이 없습니다');
  if(typeof window==='undefined'||!('MediaRecorder'in window))throw new Error('이 브라우저는 녹화를 지원하지 않습니다');
  if(signal?.aborted)throw new Error('영상 제작 취소');
  const duration=getTotalDuration(project);
  if(!Number.isFinite(duration)||duration<=0||duration>1800)throw new Error('전체 영상 길이는 30분 이하여야 합니다');
  const images=await loadProjectImages(project,values,signal);
  if(signal?.aborted)throw new Error('영상 제작 취소');
  const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('캔버스를 열 수 없습니다');
  if(typeof canvas.captureStream!=='function')throw new Error('캔버스 영상 출력 미지원');
  const stream=canvas.captureStream(30);
  const types=[['video/mp4;codecs=avc1.42E01E','mp4'],['video/webm;codecs=vp9','webm'],['video/webm','webm']] as const;
  let recorder:MediaRecorder|undefined;
  let timer:ReturnType<typeof setTimeout>|undefined;
  let onAbort:()=>void=()=>{};
  try{
    const selected=types.find(([mime])=>MediaRecorder.isTypeSupported(mime));
    if(!selected)throw new Error('지원하는 영상 형식이 없습니다');
    const chunks:Blob[]=[];
    recorder=new MediaRecorder(stream,{mimeType:selected[0]});
    const activeRecorder=recorder;
    const finished=new Promise<void>((resolve,reject)=>{
      activeRecorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
      activeRecorder.onstop=()=>resolve();
      activeRecorder.onerror=()=>reject(new Error('영상 녹화 오류'));
    });
    drawProjectFrame(ctx,project,values,images,0);
    activeRecorder.start(1000);
    const started=performance.now();
    await new Promise<void>((resolve,reject)=>{
      let settled=false;
      const finish=(error?:Error)=>{if(settled)return;settled=true;if(timer)clearTimeout(timer);signal?.removeEventListener('abort',onAbort);error?reject(error):resolve()};
      onAbort=()=>finish(new Error('영상 제작 취소'));
      signal?.addEventListener('abort',onAbort,{once:true});
      const tick=()=>{
        if(signal?.aborted){onAbort();return}
        try{
          const t=Math.min(duration,(performance.now()-started)/1000);
          drawProjectFrame(ctx,project,values,images,t);
          progress(Math.min(99,Math.round(t/duration*100)));
          if(t>=duration)finish();else timer=setTimeout(tick,33);
        }catch(e){finish(e instanceof Error?e:new Error('영상 프레임 생성 실패'))}
      };
      tick();
    });
    if(activeRecorder.state==='recording')activeRecorder.stop();
    await Promise.race([finished,new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error('영상 녹화 종료 시간 초과')),15000))]);
    if(signal?.aborted)throw new Error('영상 제작 취소');
    const blob=new Blob(chunks,{type:selected[0]});
    if(blob.size<1024)throw new Error('영상 파일 생성에 실패했습니다');
    progress(100);
    return {blob,extension:selected[1]};
  }finally{
    if(timer)clearTimeout(timer);
    signal?.removeEventListener('abort',onAbort);
    if(recorder&&recorder.state!=='inactive')recorder.stop();
    stream.getTracks().forEach(track=>track.stop());
  }
}
