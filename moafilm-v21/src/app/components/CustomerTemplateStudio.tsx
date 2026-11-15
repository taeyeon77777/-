import {useEffect,useRef,useState} from 'react';
import type {Project} from '../utils/templateEngine';
import {parseProject} from '../utils/templateEngine';
import {allFields,emptyCustomerValues,setCustomerPhoto,setCustomerText,type CustomerValues} from '../utils/customerBinding';
import {drawProjectFrame,loadProjectImages,exportProjectVideo,getTotalDuration} from '../utils/projectRenderer';

export function CustomerTemplateStudio({onBack}:{onBack:()=>void}){
 const [project,setProject]=useState<Project|null>(null),[values,setValues]=useState<CustomerValues>(emptyCustomerValues());
 const [time,setTime]=useState(0),[progress,setProgress]=useState(-1),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const canvas=useRef<HTMLCanvasElement>(null),controller=useRef<AbortController|null>(null);
 useEffect(()=>{if(!project||!canvas.current)return;let cancelled=false;loadProjectImages(project,values).then(images=>{if(!cancelled&&canvas.current){const ctx=canvas.current.getContext('2d');if(ctx)drawProjectFrame(ctx,project,values,images,time)}}).catch(e=>{if(!cancelled)setError(String(e.message))});return()=>{cancelled=true}},[project,values,time]);
 const readTemplate=async(file:File)=>{setError('');try{if(file.size>15*1024*1024)throw new Error('템플릿 JSON은 15MB 이하만 가능합니다');const data=parseProject(await file.text());if(!data.scenes.length)throw new Error('장면이 없는 템플릿입니다');setProject(data);setValues(emptyCustomerValues());setTime(0)}catch(e){setError(e instanceof Error?e.message:'파일을 읽을 수 없습니다')}};
 const readPhoto=async(id:string,file:File)=>{if(!file.type.startsWith('image/')){setError('이미지 파일만 업로드할 수 있습니다');return}if(file.size>15*1024*1024){setError('사진은 15MB 이하여야 합니다');return}const reader=new FileReader();reader.onload=()=>setValues(v=>setCustomerPhoto(v,id,String(reader.result)));reader.onerror=()=>setError('사진을 읽을 수 없습니다');reader.readAsDataURL(file)};
 const exportVideo=async()=>{if(!project)return;setBusy(true);setError('');setProgress(0);controller.current=new AbortController();try{const {blob,extension}=await exportProjectVideo(project,values,setProgress,controller.current.signal);const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`moafilm-${Date.now()}.${extension}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000)}catch(e){setError(e instanceof Error?e.message:'영상 출력 실패')}finally{setBusy(false);controller.current=null}};
 const fields=project?allFields(project):[];
 return <main style={{width:'min(1100px,100%)',minHeight:'100vh',background:'#fff',padding:24,overflow:'auto'}}>
 <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}><h2 style={{fontSize:22,fontWeight:800}}>모아필름 · 템플릿 제작 테스트</h2><button onClick={onBack}>돌아가기</button></header>
 <p style={{color:'#6b7280',marginBottom:12}}>관리자에서 내보낸 전체 장면 JSON을 불러와 사진·문구를 바꾸고 영상으로 출력합니다. 서버 저장·결제·로그인은 포함되지 않습니다.</p>
 <label style={{display:'block',padding:18,border:'2px dashed #dba4b3',borderRadius:12,marginBottom:20}}>템플릿 JSON 불러오기 <input type="file" accept=".json,application/json" onChange={e=>{const f=e.target.files?.[0];if(f)void readTemplate(f)}}/></label>
 {error&&<p role="alert" style={{color:'#b91c1c',marginBottom:12}}>{error}</p>}
 {project&&<div style={{display:'grid',gridTemplateColumns:'minmax(0,2fr) minmax(250px,1fr)',gap:20}}>
 <section><h3 style={{fontWeight:700,marginBottom:10}}>{project.name} · {project.scenes.length}장면</h3><canvas ref={canvas} width={1280} height={720} style={{width:'100%',background:'#fdf6ef',borderRadius:12}}/><input aria-label="재생 위치" type="range" min={0} max={getTotalDuration(project)} step={.1} value={time} onChange={e=>setTime(Number(e.target.value))} style={{width:'100%'}}/><p>{time.toFixed(1)} / {getTotalDuration(project).toFixed(1)}초</p><button disabled={busy} onClick={()=>void exportVideo()} style={{background:'#d97091',color:'white',padding:'12px 20px',borderRadius:8}}>영상 만들기 · 다운로드</button> {busy&&<button onClick={()=>controller.current?.abort()}>취소</button>}{progress>=0&&<p>출력 진행률 {progress}%</p>}</section>
 <section style={{maxHeight:650,overflow:'auto'}}><h3 style={{fontWeight:700,marginBottom:12}}>고객 입력 영역 ({fields.length})</h3>{fields.map(f=><label key={`${f.sceneId}:${f.layerId}`} style={{display:'block',marginBottom:16,fontSize:13}}>{f.label} ({f.kind==='photo'?'사진':'문구'}){f.kind==='photo'?<input type="file" accept="image/*" onChange={e=>{const file=e.target.files?.[0];if(file)void readPhoto(f.layerId,file)}}/>:<input style={{display:'block',border:'1px solid #ddd',padding:8,width:'100%'}} value={values.texts[f.layerId]||''} onChange={e=>setValues(v=>setCustomerText(v,f.layerId,e.target.value))}/>}</label>)}</section>
 </div>}
 </main>
}
