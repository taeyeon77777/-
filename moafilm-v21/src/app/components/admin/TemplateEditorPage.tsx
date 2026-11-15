/**
 * 관리자 템플릿 디자인 편집기 — 캔바/미리캔버스 스타일
 * 텍스트·도형·사진존·스티커·배경을 자유롭게 배치해 템플릿을 제작합니다
 */

import { useRef, useState, useCallback, useEffect } from "react";
import { validateProject } from "../../utils/templateEngine";
import { createCustomerSession, serializeSession, parseSession, validateSession, getCustomerRenderProject } from "../../utils/customerSession";
import { allFields, emptyCustomerValues, setCustomerText, setCustomerPhoto, applyCustomerProject, completionRate, type CustomerValues } from "../../utils/customerBinding";
import {
  ArrowLeft, MousePointer, Type, Square, Circle as CircleIcon,
  Image as ImageIcon, Smile, Trash2, Copy, ChevronDown, ChevronRight,
  AlignLeft, AlignCenter, AlignRight, Italic,
  ArrowUp, ArrowDown, Layers,
  Minus, RotateCcw,
} from "lucide-react";

/* ═══════════════════════════════════
   데이터 타입
═══════════════════════════════════ */
type ElType = "text" | "rect" | "ellipse" | "photo_zone" | "sticker" | "line";

interface El {
  id: string; type: ElType;
  x: number; y: number; w: number; h: number;
  rotation: number; opacity: number;
  animation?: { effect: string; duration: number; delay: number; repeat: boolean };
  // 텍스트
  text?: string; fontSize?: number; fontFamily?: string; fontWeight?: number;
  color?: string; textAlign?: "left"|"center"|"right"; italic?: boolean;
  letterSpacing?: number; lineHeight?: number;
  // 도형
  fill?: string; stroke?: string; strokeWidth?: number; borderRadius?: number;
  // 사진존
  label?: string; frameStyle?: "square"|"rounded"|"circle"|"polaroid";
  // 스티커
  emoji?: string;
}

interface Bg {
  type: "solid"|"gradient"|"image"; color: string;
  color2?: string; angle?: number;
  imageDataUrl?: string;
}

interface Template {
  id: string; name: string;
  bg: Bg; elements: El[];
  scene?: { duration: number; transition: "cut"|"fade"|"slide"|"zoom"; transitionDuration: number; musicName?: string; musicVolume: number };
}

/* ═══════════════════════════════════
   localStorage
═══════════════════════════════════ */
const TMPL_KEY = "moafilm_template_design";
const SCENES_KEY = "moafilm_scene_pages_v8";
function readScenePages(id: string): Template[] | null {
  try { const pages = JSON.parse(localStorage.getItem(`${SCENES_KEY}_${id}`) ?? "null");
    return Array.isArray(pages) && pages.length ? pages : null; } catch { return null; }
}


function loadTemplate(id: string): Template | null {
  try { return JSON.parse(localStorage.getItem(`${TMPL_KEY}_${id}`) ?? "null"); }
  catch { return null; }
}
function saveTemplate(t: Template) {
  localStorage.setItem(`${TMPL_KEY}_${t.id}`, JSON.stringify(t));
}
function uid() { return `e${Date.now()}${Math.random().toString(36).slice(2,5)}`; }

/* ═══════════════════════════════════
   기본값 팩토리
═══════════════════════════════════ */
const defaultBg = (): Bg => ({ type: "solid", color: "#fdf6ef" });

function newEl(type: ElType, x=30, y=30): El {
  const base = { id: uid(), type, x, y, w: 30, h: 18, rotation: 0, opacity: 1 };
  switch (type) {
    case "text":       return { ...base, w:40, h:10, text:"텍스트를 입력하세요", fontSize:4, fontFamily:"Pretendard", fontWeight:400, color:"#1a1a1a", textAlign:"center", italic:false, letterSpacing:0, lineHeight:1.4 };
    case "rect":       return { ...base, fill:"#f8d7da", stroke:"#e06080", strokeWidth:1, borderRadius:8 };
    case "ellipse":    return { ...base, w:20, h:20, fill:"#d4e8ff", stroke:"#4a90d9", strokeWidth:1 };
    case "line":       return { ...base, w:40, h:2, fill:"none", stroke:"#c9a96e", strokeWidth:2 };
    case "photo_zone": return { ...base, w:32, h:40, label:"사진", frameStyle:"rounded", fill:"rgba(0,0,0,0.06)", stroke:"#aaa", strokeWidth:1.5 };
    case "sticker":    return { ...base, w:10, h:10, emoji:"🌸" };
    default:           return base;
  }
}

/* ═══════════════════════════════════
   카테고리
═══════════════════════════════════ */
const CATEGORIES = [
  { key:"wedding",       label:"💍 식전영상",        templates:[{id:"w1",name:"영원한 사랑"},{id:"w2",name:"우리의 이야기"},{id:"w3",name:"언제나 함께"},{id:"w4",name:"달콤한 추억"}] },
  { key:"firstbirthday", label:"🎂 돌잔치 식전영상",  templates:[{id:"b1",name:"첫 번째 생일"},{id:"b2",name:"무럭무럭 성장"}] },
  { key:"propose",       label:"💐 프로포즈 영상",    templates:[{id:"p1",name:"나와 결혼해줄래요"},{id:"p2",name:"영원히 당신 곁에"}] },
  { key:"parents",       label:"🙏 부모님 감사 편지", templates:[{id:"t1",name:"부모님께 드리는 편지"},{id:"t2",name:"함께한 소중한 시간"}] },
];

const ANIMATION_EFFECTS = [
  {id:"none",name:"없음"},{id:"fade-in",name:"서서히 나타나기"},{id:"fade-out",name:"서서히 사라지기"},
  {id:"slide-up",name:"아래에서 올라오기"},{id:"slide-down",name:"위에서 내려오기"},
  {id:"slide-left",name:"오른쪽에서 들어오기"},{id:"slide-right",name:"왼쪽에서 들어오기"},
  {id:"zoom-in",name:"확대 등장"},{id:"zoom-out",name:"축소 등장"},
  {id:"pop",name:"통통 튀기"},{id:"bounce",name:"바운스"},{id:"float",name:"둥둥 떠다니기"},
  {id:"pulse",name:"두근두근"},{id:"sway",name:"좌우 흔들기"},{id:"spin",name:"한 바퀴 회전"},
  {id:"blur-in",name:"선명해지기"},{id:"wipe",name:"왼쪽부터 나타나기"},
];
const ANIMATION_CSS = `
@keyframes moa-fade-in{from{opacity:0}to{opacity:1}}
@keyframes moa-fade-out{from{opacity:1}to{opacity:0}}
@keyframes moa-slide-up{from{opacity:0;translate:0 45%}to{opacity:1;translate:0 0}}
@keyframes moa-slide-down{from{opacity:0;translate:0 -45%}to{opacity:1;translate:0 0}}
@keyframes moa-slide-left{from{opacity:0;translate:45% 0}to{opacity:1;translate:0 0}}
@keyframes moa-slide-right{from{opacity:0;translate:-45% 0}to{opacity:1;translate:0 0}}
@keyframes moa-zoom-in{from{opacity:0;scale:.55}to{opacity:1;scale:1}}
@keyframes moa-zoom-out{from{opacity:0;scale:1.5}to{opacity:1;scale:1}}
@keyframes moa-pop{0%{scale:.2;opacity:0}65%{scale:1.15;opacity:1}100%{scale:1}}
@keyframes moa-bounce{0%,100%{translate:0 0}35%{translate:0 -24%}65%{translate:0 8%}}
@keyframes moa-float{0%,100%{translate:0 0}50%{translate:0 -12%}}
@keyframes moa-pulse{0%,100%{scale:1}50%{scale:1.12}}
@keyframes moa-sway{0%,100%{rotate:-6deg}50%{rotate:6deg}}
@keyframes moa-spin{from{rotate:0deg}to{rotate:360deg}}
@keyframes moa-blur-in{from{filter:blur(18px);opacity:0}to{filter:blur(0);opacity:1}}
@keyframes moa-wipe{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
`;
const FONTS = ["Pretendard","Georgia","Times New Roman","Arial","Courier New","Impact"];
const STICKERS = ["🌸","🌹","🌷","💐","🌿","🍃","✨","⭐","💫","🎀","🎊","🎉","💍","💒","💕","💖","💝","🕊️","🌙","☁️","🫧","🪷","🌾","🧁","🍰","📸","🎬","🎵","🎶","❤️","🤍","🤎","🩷","🩶"];
const FRAME_STYLES: {key: El["frameStyle"], label: string}[] = [
  {key:"square",   label:"사각형"},
  {key:"rounded",  label:"둥근 사각"},
  {key:"circle",   label:"원형"},
  {key:"polaroid", label:"폴라로이드"},
];
const sceneButton: React.CSSProperties = {background:"#343452",color:"white",padding:"7px 9px",border:0,borderRadius:6,cursor:"pointer",fontSize:10};
const BG_PRESETS = [
  "#ffffff","#fdf6ef","#fff0f5","#f0f5ff","#f0fff4","#fffbf0",
  "#fce4ec","#e8f5e9","#e3f2fd","#f3e5f5","#fff3e0","#e0f2f1",
  "#1a1a2e","#2d1b33","#0d1b2a","#1b2838","#2e1a1a","#1a2e1b",
];

/* ═══════════════════════════════════
   메인 컴포넌트
═══════════════════════════════════ */
export function TemplateEditorPage({ onBack }: { onBack: ()=>void }) {
  const [selTemplateId, setSelTemplateId] = useState("w1");
  const [openCats, setOpenCats] = useState(new Set(["wedding"]));
  const [template, setTemplate] = useState<Template>(() => ({
    id: "w1", name: "영원한 사랑", bg: defaultBg(), elements: [],
  }));
  const [scenePages, setScenePages] = useState<Template[]>([]);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [selId, setSelId]     = useState<string|null>(null);
  const [tool,  setTool]      = useState<ElType|"select">("select");
  const [editingId, setEditingId] = useState<string|null>(null);
  const [showStickers, setShowStickers] = useState(false);
  const [showLayers,   setShowLayers]   = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [moviePlaying, setMoviePlaying] = useState(false);
  const [movieSceneIndex, setMovieSceneIndex] = useState(0);
  const [movieElapsed, setMovieElapsed] = useState(0);
  const [sceneTransitionKey, setSceneTransitionKey] = useState(0);
  const [musicUrl, setMusicUrl] = useState<string|null>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const scene = template.scene ?? {duration:8,transition:"fade" as const,transitionDuration:0.6,musicVolume:0.7};
  const updateScene = (patch: Partial<NonNullable<Template["scene"]>>) => upd({scene:{...scene,...patch}});
  const activeSceneIndexRef = useRef(activeSceneIndex);
  activeSceneIndexRef.current = activeSceneIndex;
  const [saved, setSaved]     = useState(false);
  const [customerTest, setCustomerTest] = useState(false);
  const [customerValues, setCustomerValues] = useState<CustomerValues>(emptyCustomerValues);
  const [importError, setImportError] = useState("");
  const templateImportRef = useRef<HTMLInputElement>(null);
  const customerImportRef = useRef<HTMLInputElement>(null);
  const [transferMessage, setTransferMessage] = useState("");
  const [drag, setDrag]       = useState<{
    kind:"move"|"resize"; id:string;
    sx:number; sy:number; ox:number; oy:number; ow:number; oh:number;
  }|null>(null);

  const canvasRef  = useRef<HTMLDivElement>(null);
  const selEl = template.elements.find(e=>e.id===selId)??null;
  // 타임라인은 요소별 지연/재생 시간을 공유하는 단일 애니메이션 데이터에 연결됩니다.
  const timelineDuration = Math.max(scene.duration, ...template.elements.map(el =>
    (el.animation?.delay ?? 0) + (el.animation?.duration ?? 0)), 0);
  const applyAnimationPreset = (preset: "entrance" | "romantic" | "lively") => {
    const effects = preset === "entrance" ? ["fade-in", "slide-up", "zoom-in"]
      : preset === "romantic" ? ["fade-in", "float", "blur-in"]
      : ["pop", "bounce", "slide-left"];
    upd({elements:template.elements.map((el, i) => ({...el, animation:{
      effect: effects[i % effects.length], duration: preset === "romantic" ? 2.2 : 1.1,
      delay: +(i * 0.35).toFixed(2), repeat: false
    }}))});
    setPreview(false);
  };


  /* 템플릿 전환 */
  useEffect(()=>{
    const name = CATEGORIES.flatMap(c=>c.templates).find(t=>t.id===selTemplateId)?.name??"";
    const saved = loadTemplate(selTemplateId);
    const first = saved ?? { id:selTemplateId, name, bg:defaultBg(), elements:[] };
    const pages = readScenePages(selTemplateId) ?? [first];
    setScenePages(pages);
    setActiveSceneIndex(0);
    setTemplate(pages[0]);
    setSelId(null); setEditingId(null);
    setMusicUrl(null);
    setMoviePlaying(false);
  },[selTemplateId]);

  /* 저장 */
  const persist = useCallback((t: Template)=>{
    saveTemplate(t);
    setScenePages(prev => {
      if (!prev.length) return prev;
      const next = prev.map((page,i) => i===activeSceneIndexRef.current ? t : page);
      try { localStorage.setItem(`${SCENES_KEY}_${selTemplateId}`, JSON.stringify(next)); } catch { /* storage quota */ }
      return next;
    });
    setSaved(true); setTimeout(()=>setSaved(false),1500);
  },[selTemplateId]);

  const chooseScene = (index: number) => {
    if (index < 0 || index >= scenePages.length) return;
    setTemplate(scenePages[index]); setActiveSceneIndex(index);
    setSelId(null); setPreview(false); setEditingId(null);
  };
  const addScene = () => {
    const nextScene: Template = {id:selTemplateId, name:template.name, bg:{...template.bg}, elements:[], scene:{...scene}};
    const next = [...scenePages, nextScene];
    setScenePages(next); setActiveSceneIndex(next.length-1); setTemplate(nextScene);
    localStorage.setItem(`${SCENES_KEY}_${selTemplateId}`, JSON.stringify(next));
    setSelId(null); setPreview(false);
  };
  const duplicateScene = () => {
    const copy: Template = JSON.parse(JSON.stringify(template));
    copy.elements = copy.elements.map(e => ({...e,id:uid()}));
    const next = [...scenePages.slice(0,activeSceneIndex+1),copy,...scenePages.slice(activeSceneIndex+1)];
    setScenePages(next); setActiveSceneIndex(activeSceneIndex+1); setTemplate(copy);
    localStorage.setItem(`${SCENES_KEY}_${selTemplateId}`, JSON.stringify(next));
    setSelId(null); setPreview(false);
  };
  const deleteScene = () => {
    if(scenePages.length <= 1) return;
    const next = scenePages.filter((_,i) => i!==activeSceneIndex);
    const index = Math.min(activeSceneIndex,next.length-1);
    setScenePages(next); setActiveSceneIndex(index); setTemplate(next[index]);
    localStorage.setItem(`${SCENES_KEY}_${selTemplateId}`, JSON.stringify(next));
    setSelId(null); setPreview(false);
  };
  const shiftScene = (direction: -1|1) => {
    const target=activeSceneIndex+direction;
    if(target<0||target>=scenePages.length)return;
    const next=[...scenePages];
    [next[activeSceneIndex],next[target]]=[next[target],next[activeSceneIndex]];
    setScenePages(next);setActiveSceneIndex(target);
    localStorage.setItem(`${SCENES_KEY}_${selTemplateId}`,JSON.stringify(next));
  };

  const upd = useCallback((patch: Partial<Template>)=>{
    setTemplate(prev=>{ const next={...prev,...patch}; persist(next); return next; });
  },[persist]);

  const updEl = useCallback((id:string, patch:Partial<El>)=>{
    setTemplate(prev=>{
      const els = prev.elements.map(e=>e.id===id?{...e,...patch}:e);
      const next = {...prev,elements:els}; persist(next); return next;
    });
  },[persist]);

  /* 캔버스 클릭 → 새 요소 추가 */
  const onCanvasClick = (e: React.MouseEvent)=>{
    if(preview || tool==="select") { setSelId(null); return; }
    const r = canvasRef.current!.getBoundingClientRect();
    const x = ((e.clientX-r.left)/r.width)*100;
    const y = ((e.clientY-r.top)/r.height)*100;
    const el = newEl(tool as ElType, x-15, y-9);
    const next = {...template, elements:[...template.elements, el]};
    setTemplate(next); persist(next);
    setSelId(el.id); setTool("select");
  };

  /* 드래그 시작 */
  const onElDown=(e:React.MouseEvent, id:string, kind:"move"|"resize")=>{
    e.stopPropagation(); e.preventDefault();
    const el=template.elements.find(x=>x.id===id); if(!el)return;
    setSelId(id);
    setDrag({kind,id,sx:e.clientX,sy:e.clientY,ox:el.x,oy:el.y,ow:el.w,oh:el.h});
  };

  /* 드래그 이동 */
  useEffect(()=>{
    if(!drag)return;
    const mm=(e:MouseEvent)=>{
      const r=canvasRef.current?.getBoundingClientRect(); if(!r)return;
      const dx=((e.clientX-drag.sx)/r.width)*100;
      const dy=((e.clientY-drag.sy)/r.height)*100;
      setTemplate(prev=>({...prev,elements:prev.elements.map(el=>{
        if(el.id!==drag.id)return el;
        if(drag.kind==="move") return{...el,x:Math.max(-10,drag.ox+dx),y:Math.max(-5,drag.oy+dy)};
        return{...el,w:Math.max(3,drag.ow+dx),h:Math.max(2,drag.oh+dy)};
      })}));
    };
    const mu=()=>{ setTemplate(t=>{ persist(t); return t; }); setDrag(null); };
    window.addEventListener("mousemove",mm);
    window.addEventListener("mouseup",mu);
    return()=>{ window.removeEventListener("mousemove",mm); window.removeEventListener("mouseup",mu); };
  },[drag,persist]);

  const delEl=(id:string)=>{ upd({elements:template.elements.filter(e=>e.id!==id)}); setSelId(null); };
  const dupEl=(id:string)=>{
    const el=template.elements.find(e=>e.id===id); if(!el)return;
    const copy={...el,id:uid(),x:el.x+3,y:el.y+3};
    const next={...template,elements:[...template.elements,copy]};
    setTemplate(next); persist(next); setSelId(copy.id);
  };
  const moveLayer=(id:string,dir:1|-1)=>{
    const els=[...template.elements];
    const i=els.findIndex(e=>e.id===id);
    const j=i+dir; if(j<0||j>=els.length)return;
    [els[i],els[j]]=[els[j],els[i]];
    upd({elements:els});
  };

  /* 렌더링 헬퍼 */
  const previewProject = {version:1,id:selTemplateId,name:template.name,scenes:scenePages.map((p,i)=>({id:`scene-${i}`,name:p.name,bg:p.bg,elements:(i===activeSceneIndex?template:p).elements,scene:p.scene}))};
  const customerSession = {...createCustomerSession(previewProject.id),values:customerValues};
  const customerErrors = customerTest ? validateSession(previewProject,customerSession) : [];
  const downloadCustomerTest = () => {
    if(customerErrors.length){setTransferMessage(customerErrors.join('; '));return;}
    const blob = new Blob([serializeSession(customerSession)],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='moafilm-customer-test.json';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    setTransferMessage('고객 테스트 데이터 파일을 저장했습니다. 사진이 포함되므로 파일 공유에 주의하세요.');
  };
  const importCustomerTest = async (event:React.ChangeEvent<HTMLInputElement>) => {
    const file=event.target.files?.[0];event.target.value='';if(!file)return;
    if(file.size>15*1024*1024){setTransferMessage('고객 테스트 파일은 15MB 이하여야 합니다.');return;}
    try {const session=parseSession(await file.text());const errors=validateSession(previewProject,session);
      if(errors.length)throw new Error(errors.join('; '));
      setCustomerValues(session.values);setTransferMessage('고객 테스트 데이터를 불러왔습니다.');
    } catch(error){setTransferMessage(error instanceof Error?error.message:'파일 불러오기 실패');}
  };
  const customerFields = allFields(previewProject);
  const customerPreview = customerTest ? applyCustomerProject(previewProject,customerValues).scenes[activeSceneIndex] : null;
  const renderEl=(el:El)=>{
    const isSel=!preview && !customerTest && el.id===selId;
    const isEdit=el.id===editingId;
    const border=isSel?"2px solid #3b82f6":"2px solid transparent";
    const shadow=isSel?"0 0 0 1px rgba(59,130,246,0.4)":"none";

    const anim=el.animation;
    const effect=anim?.effect??"none";
    const animStyle:React.CSSProperties = preview && effect!=="none" ? {
      animationName:`moa-${effect}`,
      animationDuration:`${Math.max(0.2,anim?.duration??1)}s`,
      animationDelay:`${Math.max(0,anim?.delay??0)}s`,
      animationIterationCount:anim?.repeat?"infinite":1,
      animationFillMode:"both",
      animationTimingFunction:"ease-in-out",
    } : {};
    const common:React.CSSProperties={
      position:"absolute", left:`${el.x}%`, top:`${el.y}%`,
      width:`${el.w}%`, height:`${el.h}%`,
      transform:`rotate(${el.rotation}deg)`,
      opacity:el.opacity, cursor:tool==="select"?"move":"crosshair",
      border, boxShadow:shadow, boxSizing:"border-box",
      zIndex:isSel?100:undefined, ...animStyle,
    };

    const inner: React.ReactNode = (()=>{
      switch(el.type){
        case "text":
          return(
            <div
              contentEditable={isEdit}
              suppressContentEditableWarning
              onDoubleClick={()=>setEditingId(el.id)}
              onBlur={e=>{ setEditingId(null); updEl(el.id,{text:e.currentTarget.textContent??""})}}
              style={{
                width:"100%",height:"100%",outline:"none",cursor:isEdit?"text":"inherit",
                fontFamily:el.fontFamily,fontWeight:el.fontWeight,fontSize:`${el.fontSize}cqw`,
                color:el.color,textAlign:el.textAlign,fontStyle:el.italic?"italic":"normal",
                letterSpacing:`${el.letterSpacing}em`,lineHeight:el.lineHeight,
                whiteSpace:"pre-wrap",wordBreak:"break-word",display:"flex",alignItems:"center",justifyContent:
                  el.textAlign==="center"?"center":el.textAlign==="right"?"flex-end":"flex-start",
              }}
            >{el.text}</div>
          );
        case "rect":
          return <div style={{width:"100%",height:"100%",background:el.fill,border:`${el.strokeWidth}px solid ${el.stroke}`,borderRadius:el.borderRadius,boxSizing:"border-box"}}/>;
        case "ellipse":
          return <div style={{width:"100%",height:"100%",background:el.fill,border:`${el.strokeWidth}px solid ${el.stroke}`,borderRadius:"50%",boxSizing:"border-box"}}/>;
        case "line":
          return <div style={{width:"100%",height:el.strokeWidth,background:el.stroke,borderRadius:99,marginTop:`calc(50% - ${(el.strokeWidth??2)/2}px)`}}/>;
        case "photo_zone":
          if (customerTest && customerValues.photos[el.id]) return <img src={customerValues.photos[el.id]} alt={el.label||"고객 사진"} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:el.frameStyle==="circle"?"50%":el.frameStyle==="rounded"?"12px":0}}/>;
          return(
            <div style={{
              width:"100%",height:"100%",
              background:el.fill,border:`${el.strokeWidth??1.5}px dashed ${el.stroke}`,
              borderRadius:el.frameStyle==="circle"?"50%":el.frameStyle==="rounded"?"12px":el.frameStyle==="polaroid"?"4px":"0",
              boxSizing:"border-box",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,
              paddingBottom:el.frameStyle==="polaroid"?"18%":"0",
            }}>
              <ImageIcon size={18} color={el.stroke} opacity={0.5}/>
              <span style={{fontSize:"0.55rem",color:el.stroke,fontWeight:600,opacity:0.7}}>{el.label}</span>
            </div>
          );
        case "sticker":
          return <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:`${Math.min(el.w,el.h)*0.6}cqw`}}>{el.emoji}</div>;
        default: return null;
      }
    })();

    return(
      <div key={el.id} style={common}
        onMouseDown={e=>{ if(!preview && tool==="select"){ onElDown(e,el.id,"move"); } }}
        onClick={e=>{ e.stopPropagation(); if(!preview && tool==="select") setSelId(el.id); }}
      >
        {inner}
        {isSel&&tool==="select"&&(
          <>
            {/* 8방향 리사이즈 핸들 */}
            {([
              ["nw","nw-resize",-5,-5,undefined,undefined],
              ["ne","ne-resize",-5,undefined,undefined,-5],
              ["sw","sw-resize",undefined,-5,undefined,undefined],
              ["se","se-resize",undefined,undefined,-5,-5],
            ] as const).map(([k,cur,t,l,b,r])=>(
              <div key={k} onMouseDown={e=>{e.stopPropagation();onElDown(e,el.id,"resize");}}
                style={{position:"absolute",width:10,height:10,background:"#fff",border:"2px solid #3b82f6",borderRadius:2,cursor:cur,zIndex:200,
                  top:t,left:l,bottom:b,right:r}}/>
            ))}
            {/* 삭제 버튼 */}
            <button onClick={e=>{e.stopPropagation();delEl(el.id);}}
              style={{position:"absolute",top:-20,right:0,background:"#ef4444",border:"none",borderRadius:4,color:"#fff",width:18,height:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
              <Trash2 size={10}/>
            </button>
            {/* 복제 버튼 */}
            <button onClick={e=>{e.stopPropagation();dupEl(el.id);}}
              style={{position:"absolute",top:-20,right:22,background:"#6366f1",border:"none",borderRadius:4,color:"#fff",width:18,height:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
              <Copy size={10}/>
            </button>
          </>
        )}
      </div>
    );
  };

  /* 캔바 이미지 업로드 */
  const bgImgInputRef = useRef<HTMLInputElement>(null);
  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if(!file) return;
    setImportError("");
    if (!(["image/png", "image/jpeg", "image/webp"].includes(file.type))) {
      setImportError("PNG, JPG, WebP 이미지 파일만 가져올 수 있습니다. MP4는 현재 배경으로 지원하지 않습니다.");
      e.target.value = "";
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setImportError("이미지가 4MB를 초과합니다. Canva에서 파일 크기를 줄여 다시 다운로드해 주세요. 현재 배경은 브라우저에 임시 저장됩니다.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setImportError("파일을 읽지 못했습니다. 다시 선택해 주세요.");
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      try { upd({ bg: { ...template.bg, type: "image", imageDataUrl: dataUrl } }); }
      catch { setImportError("브라우저 저장 공간이 부족합니다. 더 작은 이미지를 사용해 주세요."); }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  /* JSON 파일은 디자인 요소/사진 영역을 포함합니다. 다른 브라우저로 옮길 때 사용합니다. */
  const exportTemplate = () => {
    const currentScenes = scenePages.map((page,i) => i === activeSceneIndex ? template : page);
    const errors = validateProject({version:1,id:template.id,name:template.name,scenes:currentScenes.map((page,i)=>({
      id:`${template.id}-scene-${i}`,name:page.name,bg:page.bg,elements:page.elements,
      scene:page.scene
    }))});
    if (errors.length) { setTransferMessage(`템플릿 검사 실패: ${errors.slice(0,3).join(', ')}`); return; }
    const blob = new Blob([JSON.stringify({ format: "moafilm-template", version: 2, template, scenes: scenePages.map((page,i) => i === activeSceneIndex ? template : page) }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `moafilm-${template.id}-${Date.now()}.json`;
    a.click(); URL.revokeObjectURL(url);
    setTransferMessage("템플릿 JSON 파일을 저장했습니다. 고객에게 공개된 것은 아닙니다.");
  };
  const importTemplate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) { setTransferMessage("파일이 너무 큽니다 (최대 6MB)."); return; }
    try {
      const parsed = JSON.parse(await file.text());
      const t = parsed?.format === "moafilm-template" ? parsed.template : parsed;
      if (!t || !Array.isArray(t.elements) || !t.bg || typeof t.name !== "string" ||
          !t.elements.every((el: unknown) => !!el && typeof el === "object" &&
          typeof (el as El).type === "string" && typeof (el as El).x === "number" && typeof (el as El).y === "number")) {
        throw new Error("모아필름 템플릿 파일 형식이 아닙니다.");
      }
      const validScene = (page: any): page is Template => !!page && typeof page === "object" &&
        !!page.bg && ["solid","gradient","image"].includes(page.bg.type) &&
        Array.isArray(page.elements) && page.elements.length <= 500 &&
        page.elements.every((el: any) => el && ["text","rect","ellipse","photo_zone","sticker","line"].includes(el.type) &&
          [el.x,el.y,el.w,el.h].every((n: unknown) => typeof n === "number" && Number.isFinite(n)));
      const rawPages = parsed?.format === "moafilm-template" && Array.isArray(parsed.scenes) ? parsed.scenes : [t];
      if (!rawPages.length || rawPages.length > 200 || !rawPages.every(validScene)) throw new Error("장면 데이터가 올바르지 않습니다.");
      const pages: Template[] = rawPages.map((page: Template) => ({ ...page, id: selTemplateId, name: template.name }));
      const next = pages[0];
      try {
        localStorage.setItem(`${SCENES_KEY}_${selTemplateId}`, JSON.stringify(pages));
        saveTemplate(next);
      } catch { throw new Error("저장 공간이 부족합니다. 이미지 용량을 줄여 주세요."); }
      setScenePages(pages); setActiveSceneIndex(0); setTemplate(next); setSelId(null);
      setTransferMessage(`${pages.length}개 장면을 불러왔습니다. 현재 브라우저에만 저장됩니다.`);
    } catch (err) {
      setTransferMessage(`가져오기 실패: ${err instanceof Error ? err.message : "파일을 확인하세요."}`);
    }
  };

  // 전체 장면 재생: 현재 장면의 재생시간에 맞춰 다음 장면으로 이동합니다.
  // 이 미리보기는 브라우저용이며 MP4 렌더링을 의미하지 않습니다.
  useEffect(() => {
    if (!moviePlaying || !scenePages.length) return;
    const duration = Math.max(0.5, scenePages[movieSceneIndex]?.scene?.duration ?? 8);
    const startedAt = performance.now();
    setMovieElapsed(0);
    const interval = window.setInterval(() => {
      setMovieElapsed(Math.min(duration, (performance.now() - startedAt) / 1000));
    }, 100);
    const timer = window.setTimeout(() => {
      if (movieSceneIndex + 1 >= scenePages.length) {
        setMoviePlaying(false);
        musicRef.current?.pause();
      } else {
        const next = movieSceneIndex + 1;
        setMovieSceneIndex(next);
        setActiveSceneIndex(next);
        setTemplate(scenePages[next]);
        setPreviewKey(k => k + 1);
        setSceneTransitionKey(k => k + 1);
      }
    }, duration * 1000);
    return () => { window.clearTimeout(timer); window.clearInterval(interval); };
  }, [moviePlaying, movieSceneIndex, scenePages]);

  const playWholeMovie = () => {
    if (!scenePages.length) return;
    setMoviePlaying(false);
    setPreview(true);
    setSelId(null);
    setTool("select");
    setMovieSceneIndex(0);
    setActiveSceneIndex(0);
    setTemplate(scenePages[0]);
    setPreviewKey(k => k + 1);
    setMovieElapsed(0);
    setSceneTransitionKey(k => k + 1);
    if (musicRef.current && musicUrl) {
      musicRef.current.currentTime = 0;
      musicRef.current.volume = Math.max(0, Math.min(1, scenePages[0]?.scene?.musicVolume ?? 0.7));
      void musicRef.current.play().catch(() => setTransferMessage("음악 자동 재생이 차단되었습니다. 음악 재생 버튼을 눌러주세요."));
    }
    // 시작 시 상태를 한 번에 반영합니다.
    setMoviePlaying(true);
  };
  const stopWholeMovie = () => {
    setMoviePlaying(false);
    setMovieElapsed(0);
    setPreview(false);
    musicRef.current?.pause();
    if (musicRef.current) musicRef.current.currentTime = 0;
  };

  // 장면을 전환할 때 음악 볼륨도 현재 장면의 설정에 맞춥니다.
  useEffect(() => {
    if (moviePlaying && musicRef.current) {
      musicRef.current.volume = Math.max(0, Math.min(1, scenePages[movieSceneIndex]?.scene?.musicVolume ?? 0.7));
    }
  }, [moviePlaying, movieSceneIndex, scenePages]);

  /* 배경 CSS */
  const bgCss: React.CSSProperties = template.bg.type==="image"
    ? { backgroundImage:`url(${template.bg.imageDataUrl})`, backgroundSize:"cover", backgroundPosition:"center" }
    : template.bg.type==="gradient"
    ? {background:`linear-gradient(${template.bg.angle??135}deg, ${template.bg.color}, ${template.bg.color2??"#ffffff"})`}
    : {background:template.bg.color};

  // 장면이 바뀔 때 새 장면에 적용되는 입장 전환. 컷은 즉시 표시합니다.
  const currentTransition = moviePlaying && movieSceneIndex > 0
    ? (scenePages[movieSceneIndex - 1]?.scene?.transition ?? "cut") : "cut";
  const currentTransitionSeconds = Math.max(0, Math.min(2,
    scenePages[movieSceneIndex - 1]?.scene?.transitionDuration ?? 0));
  const sceneEntranceStyle: React.CSSProperties = currentTransition === "cut" || currentTransitionSeconds === 0
    ? {} : {animation: `moafilm-scene-${currentTransition} ${currentTransitionSeconds}s ease-out both`};

  return(
    <div style={{display:"flex",width:"100vw",height:"100vh",background:"#0c0c14",color:"#fff",overflow:"hidden",fontFamily:"Pretendard,sans-serif"}}>

      <style>{ANIMATION_CSS}</style>
      {/* ══ 왼쪽: 템플릿 목록 ══ */}
      <div style={{width:190,background:"#111118",borderRight:"1px solid #1e1e28",display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"11px 13px",borderBottom:"1px solid #1e1e28",display:"flex",alignItems:"center",gap:8}}>
          <button onClick={onBack} style={{background:"none",border:"none",color:"#777",cursor:"pointer",padding:4,display:"flex"}}>
            <ArrowLeft size={15}/>
          </button>
          <div>
            <div style={{fontSize:"0.72rem",fontWeight:700}}>템플릿 편집기</div>
            <div style={{fontSize:"0.52rem",color:"#555"}}>관리자 전용</div>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
          {CATEGORIES.map(cat=>(
            <div key={cat.key}>
              <button onClick={()=>setOpenCats(p=>{const n=new Set(p);n.has(cat.key)?n.delete(cat.key):n.add(cat.key);return n;})}
                style={{width:"100%",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",color:"#888",fontSize:"0.6rem",fontWeight:700}}>
                {cat.label}
                {openCats.has(cat.key)?<ChevronDown size={10}/>:<ChevronRight size={10}/>}
              </button>
              {openCats.has(cat.key)&&cat.templates.map(t=>{
                const isSel=t.id===selTemplateId;
                const hasDes=!!loadTemplate(t.id);
                return(
                  <button key={t.id} onClick={()=>setSelTemplateId(t.id)}
                    style={{width:"100%",background:isSel?"rgba(59,130,246,0.12)":"none",border:"none",borderLeft:isSel?"2px solid #3b82f6":"2px solid transparent",cursor:"pointer",padding:"7px 12px 7px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontSize:"0.67rem",color:isSel?"#fff":"#888",fontWeight:isSel?600:400,textAlign:"left",flex:1}}>{t.name}</span>
                    {hasDes&&<span style={{fontSize:"0.52rem"}}>✅</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{padding:"10px 10px",borderTop:"1px solid #252533",display:"grid",gap:6}}>
          <button onClick={()=>{setCustomerTest(v=>!v);setPreview(false);setSelId(null)}} style={{background:customerTest?"#a14e78":"#314b43",color:"white",border:0,borderRadius:6,padding:8,cursor:"pointer",fontSize:12}}>{customerTest?"고객 테스트 종료":"고객 입력 테스트"}</button>
          {customerTest && <div style={{display:"grid",gap:6,maxHeight:240,overflowY:"auto",padding:5,background:"#1e1e2b",borderRadius:6}}>
            <div style={{fontSize:11,color:"#ddd"}}>사진 입력률 {completionRate(previewProject,customerValues)}% · 현재 장면을 바로 미리봅니다</div>
            {customerFields.map(f=><label key={f.sceneId+f.layerId} style={{fontSize:10,color:"#ddd",display:"grid",gap:3}}>{f.label} ({f.kind==="photo"?"사진":"문구"})
              {f.kind==="text"?<input value={customerValues.texts[f.layerId]??""} onChange={e=>setCustomerValues(v=>setCustomerText(v,f.layerId,e.target.value))} style={{width:"100%",color:"#111",padding:5}}/>:<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>8*1024*1024){setTransferMessage("사진은 8MB 이하만 사용할 수 있습니다.");return;}const reader=new FileReader();reader.onload=()=>setCustomerValues(v=>setCustomerPhoto(v,f.layerId,String(reader.result)));reader.readAsDataURL(file)}} style={{fontSize:10,width:"100%"}}/>}
            </label>)}
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              <button type="button" onClick={downloadCustomerTest} style={{background:"#3d536c",color:"white",border:0,borderRadius:5,padding:6,fontSize:10}}>테스트 입력 저장</button>
              <button type="button" onClick={()=>customerImportRef.current?.click()} style={{background:"#3d536c",color:"white",border:0,borderRadius:5,padding:6,fontSize:10}}>테스트 입력 불러오기</button>
              <button type="button" onClick={()=>setCustomerValues(emptyCustomerValues())} style={{background:"#50363f",color:"white",border:0,borderRadius:5,padding:6,fontSize:10}}>입력 초기화</button>
              <input ref={customerImportRef} type="file" accept=".json,application/json" onChange={importCustomerTest} style={{display:"none"}}/>
            </div>
            <div style={{fontSize:10,color:customerErrors.length?"#fda4af":"#a7f3d0"}}>{customerErrors.length?customerErrors.join('; '):'현재 입력값 형식 검사 통과'}</div>
            <div style={{fontSize:10,color:"#aaa"}}>관리자 테스트 전용입니다. 고객 계정·서버 저장·MP4 출력은 연결되지 않았습니다. 테스트 파일에는 고객 사진이 포함될 수 있습니다.</div>
          </div>}
          <button onClick={exportTemplate} style={{background:"#30476c",color:"#fff",border:0,borderRadius:6,padding:8,cursor:"pointer",fontSize:12}}>템플릿 파일 내보내기</button>
          <button onClick={()=>templateImportRef.current?.click()} style={{background:"#252536",color:"#fff",border:0,borderRadius:6,padding:8,cursor:"pointer",fontSize:12}}>템플릿 파일 가져오기</button>
          <input ref={templateImportRef} type="file" accept=".json,application/json" style={{display:"none"}} onChange={importTemplate}/>
          {transferMessage && <div role="status" style={{fontSize:11,color:"#d4d4dd",lineHeight:1.4}}>{transferMessage}</div>}
          <div style={{fontSize:10,color:"#a8a8b8",lineHeight:1.5}}>현재 저장은 이 브라우저에만 적용됩니다. 고객 공개 및 관리자 인증은 별도 서버 연동이 필요합니다.</div>
        </div>
        <div style={{padding:"7px 12px",borderTop:"1px solid #1e1e28",fontSize:"0.55rem",color:saved?"#4ade80":"#444"}}>
          {saved?"✓ 저장됨":"변경 시 자동 저장"}
        </div>
      </div>

      {/* ══ 가운데 ══ */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>

        {/* 상단 툴바 */}
        <div style={{background:"#111118",borderBottom:"1px solid #1e1e28",padding:"7px 14px",display:"flex",alignItems:"center",gap:6,flexShrink:0,flexWrap:"wrap"}}>

          {/* 도구 그룹 */}
          {[
            {t:"select"  ,icon:<MousePointer size={14}/>, label:"선택"},
            {t:"text"    ,icon:<Type size={14}/>,         label:"텍스트"},
            {t:"rect"    ,icon:<Square size={14}/>,       label:"사각형"},
            {t:"ellipse" ,icon:<CircleIcon size={14}/>,   label:"원"},
            {t:"line"    ,icon:<Minus size={14}/>,        label:"선"},
            {t:"photo_zone",icon:<ImageIcon size={14}/>,  label:"사진 존"},
          ].map(({t,icon,label})=>(
            <button key={t} onClick={()=>setTool(t as any)} title={label}
              style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:7,border:"none",cursor:"pointer",
                background:tool===t?"#3b82f6":"#1e1e2e",color:tool===t?"#fff":"#aaa",fontSize:"0.62rem",fontWeight:600}}>
              {icon}{label}
            </button>
          ))}

          {/* 스티커 */}
          <div style={{position:"relative"}}>
            <button onClick={()=>setShowStickers(p=>!p)}
              style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:7,border:"none",cursor:"pointer",background:showStickers?"#a855f7":"#1e1e2e",color:showStickers?"#fff":"#aaa",fontSize:"0.62rem",fontWeight:600}}>
              <Smile size={14}/> 스티커
            </button>
            {showStickers&&(
              <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,background:"#1e1e2e",border:"1px solid #333",borderRadius:10,padding:8,display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,zIndex:200,width:220,boxShadow:"0 8px 24px rgba(0,0,0,0.5)"}}>
                {STICKERS.map(em=>(
                  <button key={em} onClick={()=>{
                    const el=newEl("sticker",30,30); el.emoji=em;
                    const next={...template,elements:[...template.elements,el]};
                    setTemplate(next); persist(next); setSelId(el.id); setTool("select"); setShowStickers(false);
                  }}
                    style={{background:"none",border:"none",cursor:"pointer",fontSize:"1.2rem",padding:3,borderRadius:6,transition:"background 0.1s"}}
                    onMouseEnter={e=>(e.currentTarget.style.background="#333")}
                    onMouseLeave={e=>(e.currentTarget.style.background="none")}
                  >{em}</button>
                ))}
              </div>
            )}
          </div>

          {/* 레이어 */}
          <button onClick={()=>setShowLayers(p=>!p)}
            style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:7,border:"none",cursor:"pointer",background:showLayers?"#f59e0b":"#1e1e2e",color:showLayers?"#fff":"#aaa",fontSize:"0.62rem",fontWeight:600}}>
            <Layers size={14}/> 레이어
          </button>

          <div style={{flex:1}}/>
          <button onClick={()=>{setPreview(p=>!p);setPreviewKey(k=>k+1);setTool("select");setSelId(null);}}
            style={{background:preview?"#db2777":"#2563eb",color:"#fff",border:0,borderRadius:7,padding:"7px 12px",cursor:"pointer",fontSize:12,fontWeight:700}}>
            {preview?"■ 편집으로 돌아가기":"▶ 애니메이션 미리보기"}
          </button>
          <button onClick={moviePlaying?stopWholeMovie:playWholeMovie} style={{background:moviePlaying?"#7f1d1d":"#155e75",color:"white",border:0,borderRadius:7,padding:"7px 10px",cursor:"pointer",fontSize:12}}>{moviePlaying?"■ 전체 재생 중지":"▶ 전체 장면 재생"}</button>
          {preview&&<button onClick={()=>setPreviewKey(k=>k+1)} style={{background:"#252536",color:"#fff",border:0,borderRadius:7,padding:"7px 10px",cursor:"pointer",fontSize:12}}>↻ 다시 재생</button>}
          <div style={{fontSize:"0.65rem",fontWeight:700,color:"#555"}}>{template.name}</div>
        </div>

        <style>{`@keyframes moafilm-scene-fade {from{opacity:0}to{opacity:1}}
          @keyframes moafilm-scene-slide {from{opacity:0;transform:translateX(100%)}to{opacity:1;transform:translateX(0)}}
          @keyframes moafilm-scene-zoom {from{opacity:0;transform:scale(1.18)}to{opacity:1;transform:scale(1)}}`}</style>
        {/* 캔버스 */}
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:24,overflow:"hidden",background:"#0c0c14"}}>
          <div key={moviePlaying ? `scene-${sceneTransitionKey}` : "edit-canvas"} ref={canvasRef}
            style={{position:"relative",aspectRatio:"16/9",width:"100%",maxWidth:820,
              borderRadius:8,overflow:"visible",boxShadow:"0 8px 48px rgba(0,0,0,0.7)",
              cursor:tool==="select"?"default":"crosshair",userSelect:"none",
              containerType:"inline-size",
              ...bgCss, ...(moviePlaying ? sceneEntranceStyle : {})}}
            onClick={onCanvasClick}
          >
            {<div key={previewKey} style={{position:"absolute",inset:0,pointerEvents:preview||customerTest?"none":"auto"}}>{(customerPreview?.elements??template.elements).map(el=>renderEl(el as El))}</div>}
          </div>
        </div>
        {moviePlaying && <div role="status" aria-live="polite" style={{background:"#17212e",padding:"7px 14px",fontSize:12,color:"#f9a8d4"}}>
          전체 영상 재생 · {movieSceneIndex + 1}/{scenePages.length}장면 · {movieElapsed.toFixed(1)} / {(scenePages[movieSceneIndex]?.scene?.duration ?? 8).toFixed(1)}초
          <div style={{height:4,background:"#334155",marginTop:5,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(100,movieElapsed/Math.max(0.5,scenePages[movieSceneIndex]?.scene?.duration??8)*100)}%`,background:"#f472b6"}}/></div>
        </div>}
        {/* 요소별 애니메이션 타임라인: 선택하면 오른쪽 속성에서 정확한 시간 조절 */}
        <div style={{background:"#13131e",borderTop:"1px solid #303044",padding:"10px 14px",maxHeight:215,overflowY:"auto",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:8,flexWrap:"wrap"}}>
            <strong style={{fontSize:12}}>🎞 애니메이션 타임라인 · {timelineDuration.toFixed(1)}초</strong>
            <div style={{display:"flex",gap:5}}>
              {([ ["entrance","차분한 등장"], ["romantic","로맨틱"], ["lively","경쾌하게"] ] as const).map(([id,label]) =>
                <button key={id} onClick={()=>applyAnimationPreset(id)} title="모든 요소에 순차 효과 적용"
                  style={{background:"#30304b",border:"1px solid #454563",borderRadius:5,color:"#fff",fontSize:10,padding:"5px 8px",cursor:"pointer"}}>{label}</button>)}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7,fontSize:10,color:"#cbd5e1"}}>
            <span style={{width:95}}>🎬 장면</span>
            <div style={{height:16,flex:1,background:"#29293a",borderRadius:4,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${Math.min(100,scene.duration/timelineDuration*100)}%`,background:"#a78bfa"}}/>
            </div>
            <span style={{width:75,textAlign:"right"}}>{scene.duration.toFixed(1)}초</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7,fontSize:10,color:"#cbd5e1"}}>
            <span style={{width:95}}>🎵 음악</span>
            <div style={{height:16,flex:1,background:"#29293a",borderRadius:4,overflow:"hidden"}}>
              {scene.musicName&&<div style={{height:"100%",background:"#34d399",width:"100%",paddingLeft:6,color:"#052e16"}}>♪ {scene.musicName}</div>}
            </div>
            <span style={{width:75,textAlign:"right"}}>{scene.musicName?"선택됨":"없음"}</span>
          </div>
          {template.elements.length===0 ? <div style={{fontSize:11,color:"#888"}}>텍스트·사진·도형을 추가하면 이곳에 시간 막대가 표시됩니다.</div> :
            template.elements.map((el,i)=>{
              const a=el.animation;
              const delay=a?.delay??0;
              const duration=a?.effect && a.effect!=="none" ? (a.duration??1.2) : 0;
              return <button key={el.id} onClick={()=>{setPreview(false);setTool("select");setSelId(el.id);}}
                style={{display:"flex",width:"100%",alignItems:"center",gap:8,background:selId===el.id?"#272742":"transparent",border:"none",color:"#ddd",padding:"3px 4px",cursor:"pointer",textAlign:"left"}}>
                <span style={{width:95,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:10}}>{i+1}. {el.text||el.label||el.type}</span>
                <span style={{position:"relative",height:18,flex:1,background:"repeating-linear-gradient(90deg,#252535 0,#252535 calc(20% - 1px),#404054 calc(20% - 1px),#404054 20%)",borderRadius:3}}>
                  {duration>0&&<span style={{position:"absolute",top:2,bottom:2,left:`${delay/timelineDuration*100}%`,width:`${Math.min(duration/timelineDuration*100,100-delay/timelineDuration*100)}%`,background:selId===el.id?"#f472b6":"#6b9bff",borderRadius:3,minWidth:3}}/>}
                </span>
                <span style={{width:75,fontSize:10,color:"#999",textAlign:"right"}}>{duration?`${delay.toFixed(1)}–${(delay+duration).toFixed(1)}s`:"효과 없음"}</span>
              </button>;
            })}
          <div style={{fontSize:10,color:"#818198",marginTop:5}}>막대를 클릭해 요소를 선택한 후 오른쪽에서 효과·지연·시간을 조절하세요.</div>
        </div>
      </div>

      {/* ══ 오른쪽: 속성 패널 ══ */}
      <div style={{width:260,background:"#111118",borderLeft:"1px solid #1e1e28",display:"flex",flexDirection:"column",flexShrink:0,overflowY:"auto"}}>

        {/* 레이어 목록 */}
        {showLayers&&(
          <div style={{borderBottom:"1px solid #1e1e28"}}>
            <div style={{padding:"8px 12px",fontSize:"0.6rem",fontWeight:700,color:"#888",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              레이어
              <button onClick={()=>setShowLayers(false)} style={{background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:"0.6rem"}}>닫기</button>
            </div>
            {[...template.elements].reverse().map((el,i)=>(
              <div key={el.id} onClick={()=>{setSelId(el.id);setTool("select");}}
                style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",cursor:"pointer",borderLeft:el.id===selId?"2px solid #3b82f6":"2px solid transparent",background:el.id===selId?"rgba(59,130,246,0.1)":"transparent",borderBottom:"1px solid #181820"}}>
                <span style={{fontSize:"0.8rem"}}>{el.type==="text"?"T":el.type==="photo_zone"?"📷":el.type==="sticker"?el.emoji:"□"}</span>
                <span style={{flex:1,fontSize:"0.62rem",color:"#aaa",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {el.type==="text"?el.text?.slice(0,16):el.type==="photo_zone"?`사진 존 · ${el.label}`:el.type==="sticker"?`스티커 ${el.emoji}`:el.type}
                </span>
                <button onClick={e=>{e.stopPropagation();moveLayer(el.id,-1);}} style={{background:"none",border:"none",color:"#555",cursor:"pointer",padding:1}}><ArrowUp size={10}/></button>
                <button onClick={e=>{e.stopPropagation();moveLayer(el.id,1);}} style={{background:"none",border:"none",color:"#555",cursor:"pointer",padding:1}}><ArrowDown size={10}/></button>
              </div>
            ))}
          </div>
        )}

        <Section title={`🎞️ 장면 관리 (${scenePages.length}개)`}>
          <div style={{display:"grid",gap:7}}>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {scenePages.map((page,i)=><button key={i} onClick={()=>chooseScene(i)}
                style={{border:i===activeSceneIndex?"1px solid #f472b6":"1px solid #454563",background:i===activeSceneIndex?"#713f65":"#252538",color:"white",padding:"7px 9px",borderRadius:6,cursor:"pointer",fontSize:11}}>
                {i+1}장면 · {page.scene?.duration ?? 8}초
              </button>)}
            </div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              <button onClick={addScene} style={sceneButton}>+ 새 장면</button>
              <button onClick={duplicateScene} style={sceneButton}>복제</button>
              <button onClick={()=>shiftScene(-1)} disabled={activeSceneIndex===0} style={sceneButton}>← 순서</button>
              <button onClick={()=>shiftScene(1)} disabled={activeSceneIndex===scenePages.length-1} style={sceneButton}>순서 →</button>
              <button onClick={deleteScene} disabled={scenePages.length<=1} style={sceneButton}>삭제</button>
            </div>
            <div style={{fontSize:10,color:"#aaa"}}>현재 {activeSceneIndex+1}번째 장면을 편집 중입니다. 장면마다 배경·요소·애니메이션·시간을 별도로 저장합니다.</div>
            <div style={{fontSize:11,color:"#f9a8d4"}}>전체 영상 길이: {scenePages.reduce((total,p)=>total+(p.scene?.duration??8),0).toFixed(1)}초 (전환 겹침 미반영)</div>
          </div>
        </Section>
        <Section title="🎬 장면·전환·음악">
          <div style={{display:"grid",gap:9,fontSize:11,color:"#ddd"}}>
            <label>장면 길이: {scene.duration.toFixed(1)}초
              <input aria-label="장면 길이" type="range" min="2" max="30" step="0.5" value={scene.duration} onChange={e=>updateScene({duration:Number(e.target.value)})} style={{width:"100%"}}/>
            </label>
            <label>다음 장면으로 넘어가는 효과
              <select aria-label="장면 전환" value={scene.transition} onChange={e=>updateScene({transition:e.target.value as any})} style={{display:"block",width:"100%",background:"#252538",color:"white",padding:7,borderRadius:6,marginTop:4}}>
                <option value="cut">바로 전환</option><option value="fade">부드럽게 전환</option><option value="slide">옆으로 밀기</option><option value="zoom">확대 전환</option>
              </select>
            </label>
            <label>전환 길이: {scene.transitionDuration.toFixed(1)}초
              <input aria-label="전환 길이" type="range" min="0" max="2" step="0.1" value={scene.transitionDuration} onChange={e=>updateScene({transitionDuration:Number(e.target.value)})} style={{width:"100%"}}/>
            </label>
            <button onClick={()=>musicInputRef.current?.click()} style={{background:"#343452",color:"white",padding:9,border:0,borderRadius:7,cursor:"pointer"}}>🎵 음악 파일 선택 (MP3/WAV/OGG)</button>
            <input ref={musicInputRef} type="file" accept="audio/mpeg,audio/wav,audio/ogg" style={{display:"none"}} onChange={e=>{
              const f=e.target.files?.[0]; if(!f)return;
              if(!["audio/mpeg","audio/wav","audio/x-wav","audio/ogg"].includes(f.type)){setTransferMessage("지원하지 않는 음악 형식입니다.");return;}
              if(f.size>25*1024*1024){setTransferMessage("음악 파일은 25MB 이하만 선택할 수 있습니다.");return;}
              const url=URL.createObjectURL(f); setMusicUrl(prev=>{if(prev)URL.revokeObjectURL(prev);return url;});
              updateScene({musicName:f.name});
            }}/>
            <label>음악 볼륨: {Math.round(scene.musicVolume*100)}%
              <input aria-label="음악 볼륨" type="range" min="0" max="1" step="0.05" value={scene.musicVolume} onChange={e=>updateScene({musicVolume:Number(e.target.value)})} style={{width:"100%"}}/>
            </label>
            {musicUrl&&<audio ref={musicRef} src={musicUrl} controls style={{width:"100%"}} onVolumeChange={e=>{if(Math.abs(e.currentTarget.volume-scene.musicVolume)>0.01)updateScene({musicVolume:e.currentTarget.volume});}}/>}
            <div style={{fontSize:10,color:"#a1a1aa",lineHeight:1.6}}>장면 설정은 템플릿에 저장됩니다. 선택한 음악 파일은 이 브라우저 세션에서만 미리 들을 수 있으며, 재접속 후 재업로드가 필요합니다. 전환 효과는 데이터 설정 단계로, 여러 장면의 실제 전환 재생과 MP4 반영은 아직 구현되지 않았습니다.</div>
          </div>
        </Section>

        {/* ── Canva 무료 연동: 디자인 파일을 수동으로 가져오기 ── */}
        <Section title="Canva 무료 연결">
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            <button onClick={()=>window.open("https://www.canva.com/", "_blank", "noopener,noreferrer")}
              style={{width:"100%",padding:"10px",background:"#7c3aed",color:"white",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:"0.72rem"}}>
              ① Canva에서 디자인 만들기 ↗
            </button>
            <div style={{fontSize:"0.64rem",color:"#a1a1aa",lineHeight:1.6}}>
              Canva 무료 계정에서 16:9 디자인 제작 → 공유 → 다운로드 → PNG 또는 JPG로 저장하세요.
            </div>
            <button onClick={()=>{upd({bg:{...template.bg,type:"image"}}); bgImgInputRef.current?.click();}}
              style={{width:"100%",padding:"10px",background:"#1d4ed8",color:"white",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:"0.72rem"}}>
              ② Canva 디자인 가져오기 (PNG/JPG)
            </button>
            <input ref={bgImgInputRef} type="file" accept="image/png,image/jpeg,image/webp" style={{display:"none"}} onChange={handleBgImageUpload}/>
            {importError && <div role="alert" style={{color:"#fca5a5",fontSize:"0.64rem",lineHeight:1.5}}>{importError}</div>}
            <div style={{fontSize:"0.61rem",color:"#a1a1aa",lineHeight:1.6}}>
              ③ 위의 '사진 존' 도구로 고객 사진이 들어갈 자리를 배치하세요. 이 기능은 Canva 계정 API 연동이 아니라 파일 가져오기 방식입니다.
            </div>
          </div>
        </Section>

        {/* ── 배경 설정 ── */}
        <Section title="배경">
          <Row label="배경 유형">
            <SegBtn options={[{v:"image",l:"📷 이미지"},{v:"solid",l:"단색"},{v:"gradient",l:"그라디언트"}]}
              value={template.bg.type}
              onChange={v=>upd({bg:{...template.bg,type:v as any}})}/>
          </Row>

          {/* 이미지 배경 */}
          {template.bg.type==="image"&&(
            <div>
              <button onClick={()=>bgImgInputRef.current?.click()}
                style={{width:"100%",padding:"10px",border:"2px dashed #3b82f6",borderRadius:8,background:"rgba(59,130,246,0.08)",color:"#60a5fa",fontSize:"0.68rem",cursor:"pointer",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                📁 캔바 이미지 업로드 (PNG/JPG)
              </button>
              {template.bg.imageDataUrl&&(
                <div style={{marginTop:8,position:"relative",borderRadius:6,overflow:"hidden",border:"1px solid #333"}}>
                  <img src={template.bg.imageDataUrl} alt="bg" style={{width:"100%",display:"block",aspectRatio:"16/9",objectFit:"cover"}}/>
                  <button onClick={()=>upd({bg:{...template.bg,imageDataUrl:undefined,type:"solid"}})}
                    style={{position:"absolute",top:4,right:4,background:"rgba(0,0,0,0.7)",border:"none",borderRadius:4,color:"#fff",padding:"2px 6px",fontSize:"0.58rem",cursor:"pointer"}}>
                    삭제
                  </button>
                </div>
              )}
              {!template.bg.imageDataUrl&&(
                <div style={{marginTop:6,fontSize:"0.58rem",color:"#555",lineHeight:1.7}}>
                  캔바에서 내보낸 PNG·JPG를 업로드하면<br/>캔버스 배경으로 사용됩니다
                </div>
              )}
            </div>
          )}

          {/* 단색/그라디언트 */}
          {template.bg.type!=="image"&&<>
            <Row label="색상 1">
              <ColorInput value={template.bg.color} onChange={v=>upd({bg:{...template.bg,color:v}})}/>
            </Row>
            {template.bg.type==="gradient"&&<>
              <Row label="색상 2">
                <ColorInput value={template.bg.color2??"#ffffff"} onChange={v=>upd({bg:{...template.bg,color2:v}})}/>
              </Row>
              <Row label={`각도 ${template.bg.angle??135}°`}>
                <input type="range" min={0} max={360}
                  value={template.bg.angle??135}
                  onChange={e=>upd({bg:{...template.bg,angle:+e.target.value}})}
                  style={{width:"100%",accentColor:"#3b82f6"}}/>
              </Row>
            </>}
            <div style={{display:"flex",flexWrap:"wrap",gap:5,padding:"4px 0"}}>
              {BG_PRESETS.map(c=>(
                <div key={c} onClick={()=>upd({bg:{type:"solid",color:c}})}
                  style={{width:22,height:22,borderRadius:5,background:c,cursor:"pointer",border:template.bg.color===c?"2px solid #3b82f6":"2px solid transparent",boxSizing:"border-box"}}/>
              ))}
            </div>
          </>}
        </Section>

        {/* ── 선택된 요소 속성 ── */}
        {!selEl&&(
          <div style={{padding:20,textAlign:"center",color:"#444",fontSize:"0.65rem",lineHeight:1.8}}>
            요소를 클릭해서 선택하거나<br/>
            상단 도구로 새 요소를 추가하세요
          </div>
        )}

        {selEl&&(
          <>
            {/* 공통: 위치·크기·회전·불투명도 */}
            <Section title="위치 · 크기">
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                <NumInput label="X %" value={selEl.x} onChange={v=>updEl(selEl.id,{x:v})}/>
                <NumInput label="Y %" value={selEl.y} onChange={v=>updEl(selEl.id,{y:v})}/>
                <NumInput label="너비 %" value={selEl.w} onChange={v=>updEl(selEl.id,{w:v})}/>
                <NumInput label="높이 %" value={selEl.h} onChange={v=>updEl(selEl.id,{h:v})}/>
              </div>
              <Row label={`회전 ${selEl.rotation.toFixed(0)}°`}>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <input type="range" min={-180} max={180} step={1}
                    value={selEl.rotation}
                    onChange={e=>updEl(selEl.id,{rotation:+e.target.value})}
                    style={{flex:1,accentColor:"#3b82f6"}}/>
                  <button onClick={()=>updEl(selEl.id,{rotation:0})} style={{background:"none",border:"none",color:"#555",cursor:"pointer",padding:2,display:"flex"}}>
                    <RotateCcw size={11}/>
                  </button>
                </div>
              </Row>
              <Row label={`불투명도 ${Math.round(selEl.opacity*100)}%`}>
                <input type="range" min={0} max={1} step={0.01}
                  value={selEl.opacity}
                  onChange={e=>updEl(selEl.id,{opacity:+e.target.value})}
                  style={{width:"100%",accentColor:"#3b82f6"}}/>
              </Row>
            </Section>

            <Section title="✨ 요소 애니메이션">
              <Row label="움직임 효과">
                <select value={selEl.animation?.effect??"none"}
                  onChange={e=>updEl(selEl.id,{animation:{effect:e.target.value,duration:selEl.animation?.duration??1.2,delay:selEl.animation?.delay??0,repeat:selEl.animation?.repeat??false}})}
                  style={{width:"100%",background:"#1a1a22",border:"1px solid #343444",color:"#fff",fontSize:12,padding:8,borderRadius:6}}>
                  {ANIMATION_EFFECTS.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </Row>
              {(selEl.animation?.effect??"none")!=="none"&&<>
                <Row label={`재생 시간 ${selEl.animation?.duration??1.2}초`}>
                  <input type="range" min="0.2" max="10" step="0.1" value={selEl.animation?.duration??1.2}
                    onChange={e=>updEl(selEl.id,{animation:{...selEl.animation!,duration:+e.target.value}})} style={{width:"100%"}}/>
                </Row>
                <Row label={`시작 지연 ${selEl.animation?.delay??0}초`}>
                  <input type="range" min="0" max="10" step="0.1" value={selEl.animation?.delay??0}
                    onChange={e=>updEl(selEl.id,{animation:{...selEl.animation!,delay:+e.target.value}})} style={{width:"100%"}}/>
                </Row>
                <label style={{display:"flex",alignItems:"center",gap:7,fontSize:12,color:"#ddd"}}>
                  <input type="checkbox" checked={selEl.animation?.repeat??false}
                    onChange={e=>updEl(selEl.id,{animation:{...selEl.animation!,repeat:e.target.checked}})}/> 계속 반복
                </label>
              </>}
              <div style={{fontSize:11,color:"#aaa",lineHeight:1.5}}>상단의 ▶ 미리보기에서 효과를 확인하세요. 설정은 템플릿 JSON에도 저장됩니다. 현재 최종 MP4 렌더링과의 일치는 별도 연결이 필요합니다.</div>
            </Section>

            {/* 텍스트 전용 */}
            {selEl.type==="text"&&(
              <Section title="텍스트">
                <div style={{padding:"4px 0"}}>
                  <label style={lbl}>내용 (캔버스에서 더블클릭으로 직접 편집)</label>
                  <textarea value={selEl.text??""} rows={3}
                    onChange={e=>updEl(selEl.id,{text:e.target.value})}
                    style={{width:"100%",background:"#1a1a22",border:"1px solid #2a2a36",color:"#fff",fontSize:"0.7rem",padding:"6px 8px",borderRadius:6,outline:"none",resize:"vertical",boxSizing:"border-box"}}/>
                </div>
                <Row label="폰트">
                  <select value={selEl.fontFamily??"Pretendard"}
                    onChange={e=>updEl(selEl.id,{fontFamily:e.target.value})}
                    style={{width:"100%",background:"#1a1a22",border:"1px solid #2a2a36",color:"#fff",fontSize:"0.68rem",padding:"5px 7px",borderRadius:6,outline:"none"}}>
                    {FONTS.map(f=><option key={f}>{f}</option>)}
                  </select>
                </Row>
                <Row label={`크기 ${selEl.fontSize??4}cqw`}>
                  <input type="range" min={1} max={20} step={0.5}
                    value={selEl.fontSize??4}
                    onChange={e=>updEl(selEl.id,{fontSize:+e.target.value})}
                    style={{width:"100%",accentColor:"#3b82f6"}}/>
                </Row>
                <Row label="굵기">
                  <SegBtn options={[{v:"300",l:"얇게"},{v:"400",l:"기본"},{v:"600",l:"중간"},{v:"700",l:"굵게"},{v:"900",l:"검정"}]}
                    value={String(selEl.fontWeight??400)}
                    onChange={v=>updEl(selEl.id,{fontWeight:+v})}/>
                </Row>
                <Row label="정렬">
                  <div style={{display:"flex",gap:4}}>
                    {([["left",<AlignLeft size={13}/>],["center",<AlignCenter size={13}/>],["right",<AlignRight size={13}/>]] as const).map(([v,ico])=>(
                      <button key={v} onClick={()=>updEl(selEl.id,{textAlign:v})}
                        style={{flex:1,padding:"5px 0",border:"none",borderRadius:6,cursor:"pointer",
                          background:selEl.textAlign===v?"#3b82f6":"#1e1e2e",color:selEl.textAlign===v?"#fff":"#888",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {ico}
                      </button>
                    ))}
                  </div>
                </Row>
                <Row label="스타일">
                  <button onClick={()=>updEl(selEl.id,{italic:!selEl.italic})}
                    style={{padding:"5px 12px",border:"none",borderRadius:6,cursor:"pointer",background:selEl.italic?"#3b82f6":"#1e1e2e",color:selEl.italic?"#fff":"#888",fontSize:"0.65rem",display:"flex",alignItems:"center",gap:4}}>
                    <Italic size={12}/> 기울기
                  </button>
                </Row>
                <Row label="글자색">
                  <ColorInput value={selEl.color??"#000"} onChange={v=>updEl(selEl.id,{color:v})}/>
                </Row>
                <Row label={`자간 ${selEl.letterSpacing??0}em`}>
                  <input type="range" min={-0.1} max={0.5} step={0.01}
                    value={selEl.letterSpacing??0}
                    onChange={e=>updEl(selEl.id,{letterSpacing:+e.target.value})}
                    style={{width:"100%",accentColor:"#3b82f6"}}/>
                </Row>
                <Row label={`줄간격 ${selEl.lineHeight??1.4}`}>
                  <input type="range" min={0.8} max={3} step={0.1}
                    value={selEl.lineHeight??1.4}
                    onChange={e=>updEl(selEl.id,{lineHeight:+e.target.value})}
                    style={{width:"100%",accentColor:"#3b82f6"}}/>
                </Row>
              </Section>
            )}

            {/* 도형 전용 */}
            {(selEl.type==="rect"||selEl.type==="ellipse")&&(
              <Section title="도형 스타일">
                <Row label="채우기 색">
                  <ColorInput value={selEl.fill??"#fff"} onChange={v=>updEl(selEl.id,{fill:v})}/>
                </Row>
                <Row label="테두리 색">
                  <ColorInput value={selEl.stroke??"#000"} onChange={v=>updEl(selEl.id,{stroke:v})}/>
                </Row>
                <Row label={`테두리 두께 ${selEl.strokeWidth??1}px`}>
                  <input type="range" min={0} max={20}
                    value={selEl.strokeWidth??1}
                    onChange={e=>updEl(selEl.id,{strokeWidth:+e.target.value})}
                    style={{width:"100%",accentColor:"#3b82f6"}}/>
                </Row>
                {selEl.type==="rect"&&<Row label={`모서리 ${selEl.borderRadius??0}px`}>
                  <input type="range" min={0} max={100}
                    value={selEl.borderRadius??0}
                    onChange={e=>updEl(selEl.id,{borderRadius:+e.target.value})}
                    style={{width:"100%",accentColor:"#3b82f6"}}/>
                </Row>}
              </Section>
            )}

            {/* 선 전용 */}
            {selEl.type==="line"&&(
              <Section title="선 스타일">
                <Row label="색상">
                  <ColorInput value={selEl.stroke??"#000"} onChange={v=>updEl(selEl.id,{stroke:v})}/>
                </Row>
                <Row label={`두께 ${selEl.strokeWidth??2}px`}>
                  <input type="range" min={1} max={20}
                    value={selEl.strokeWidth??2}
                    onChange={e=>updEl(selEl.id,{strokeWidth:+e.target.value})}
                    style={{width:"100%",accentColor:"#3b82f6"}}/>
                </Row>
              </Section>
            )}

            {/* 사진 존 전용 */}
            {selEl.type==="photo_zone"&&(
              <Section title="사진 존">
                <Row label="레이블">
                  <input type="text" value={selEl.label??""}
                    onChange={e=>updEl(selEl.id,{label:e.target.value})}
                    style={{width:"100%",background:"#1a1a22",border:"1px solid #2a2a36",color:"#fff",fontSize:"0.7rem",padding:"5px 8px",borderRadius:6,outline:"none",boxSizing:"border-box"}}/>
                </Row>
                <Row label="프레임 모양">
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
                    {FRAME_STYLES.map(f=>(
                      <button key={f.key} onClick={()=>updEl(selEl.id,{frameStyle:f.key})}
                        style={{padding:"5px 0",border:"none",borderRadius:6,cursor:"pointer",fontSize:"0.6rem",
                          background:selEl.frameStyle===f.key?"#3b82f6":"#1e1e2e",color:selEl.frameStyle===f.key?"#fff":"#888"}}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </Row>
                <Row label="테두리 색">
                  <ColorInput value={selEl.stroke??"#aaa"} onChange={v=>updEl(selEl.id,{stroke:v})}/>
                </Row>
              </Section>
            )}

            {/* 스티커 전용 */}
            {selEl.type==="sticker"&&(
              <Section title="스티커">
                <div style={{display:"flex",flexWrap:"wrap",gap:5,padding:"4px 0"}}>
                  {STICKERS.map(em=>(
                    <button key={em} onClick={()=>updEl(selEl.id,{emoji:em})}
                      style={{background:selEl.emoji===em?"#3b82f6":"#1e1e2e",border:"none",borderRadius:6,cursor:"pointer",fontSize:"1.1rem",padding:"3px 5px",
                        outline:selEl.emoji===em?"2px solid #60a5fa":"none"}}>
                      {em}
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {/* 공통 액션 */}
            <div style={{padding:"10px 14px",display:"flex",gap:6,borderTop:"1px solid #1e1e28",flexWrap:"wrap"}}>
              <button onClick={()=>dupEl(selEl.id)}
                style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:4,padding:"6px",borderRadius:7,border:"1px solid #2a2a36",background:"#1e1e2e",color:"#aaa",fontSize:"0.6rem",cursor:"pointer"}}>
                <Copy size={11}/> 복제
              </button>
              <button onClick={()=>delEl(selEl.id)}
                style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:4,padding:"6px",borderRadius:7,border:"1px solid #3a1a1a",background:"#2a1010",color:"#f87171",fontSize:"0.6rem",cursor:"pointer"}}>
                <Trash2 size={11}/> 삭제
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── 서브 컴포넌트 ── */
const lbl: React.CSSProperties = {fontSize:"0.55rem",color:"#666",display:"block",marginBottom:3,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"};

function Section({title,children}:{title:string,children:React.ReactNode}){
  return(
    <div style={{borderBottom:"1px solid #1e1e28"}}>
      <div style={{padding:"8px 14px 4px",fontSize:"0.58rem",fontWeight:700,color:"#666",textTransform:"uppercase",letterSpacing:"0.08em"}}>{title}</div>
      <div style={{padding:"4px 14px 12px",display:"flex",flexDirection:"column",gap:8}}>{children}</div>
    </div>
  );
}

function Row({label,children}:{label:string,children:React.ReactNode}){
  return(
    <div>
      <label style={lbl}>{label}</label>
      {children}
    </div>
  );
}

function NumInput({label,value,onChange}:{label:string,value:number,onChange:(v:number)=>void}){
  return(
    <div>
      <label style={lbl}>{label}</label>
      <input type="number" step="0.5" value={value.toFixed(1)}
        onChange={e=>onChange(+e.target.value||0)}
        style={{width:"100%",background:"#1a1a22",border:"1px solid #2a2a36",color:"#fff",fontSize:"0.68rem",padding:"5px 7px",borderRadius:6,outline:"none",boxSizing:"border-box"}}/>
    </div>
  );
}

function ColorInput({value,onChange}:{value:string,onChange:(v:string)=>void}){
  return(
    <div style={{display:"flex",gap:6,alignItems:"center"}}>
      <input type="color" value={value} onChange={e=>onChange(e.target.value)}
        style={{width:32,height:28,border:"1px solid #2a2a36",borderRadius:6,cursor:"pointer",background:"none",padding:2}}/>
      <input type="text" value={value} onChange={e=>onChange(e.target.value)}
        style={{flex:1,background:"#1a1a22",border:"1px solid #2a2a36",color:"#fff",fontSize:"0.68rem",padding:"5px 8px",borderRadius:6,outline:"none"}}/>
    </div>
  );
}

function SegBtn({options,value,onChange}:{options:{v:string,l:string}[],value:string,onChange:(v:string)=>void}){
  return(
    <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
      {options.map(o=>(
        <button key={o.v} onClick={()=>onChange(o.v)}
          style={{flex:1,minWidth:0,padding:"5px 4px",border:"none",borderRadius:6,cursor:"pointer",fontSize:"0.58rem",fontWeight:600,
            background:value===o.v?"#3b82f6":"#1e1e2e",color:value===o.v?"#fff":"#888"}}>
          {o.l}
        </button>
      ))}
    </div>
  );
}
