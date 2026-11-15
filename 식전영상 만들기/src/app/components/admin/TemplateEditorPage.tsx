/**
 * 관리자 템플릿 디자인 편집기 — 캔바/미리캔버스 스타일
 * 텍스트·도형·사진존·스티커·배경을 자유롭게 배치해 템플릿을 제작합니다
 */

import { useRef, useState, useCallback, useEffect } from "react";
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
}

/* ═══════════════════════════════════
   localStorage
═══════════════════════════════════ */
const TMPL_KEY = "moafilm_template_design";

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

const FONTS = ["Pretendard","Georgia","Times New Roman","Arial","Courier New","Impact"];
const STICKERS = ["🌸","🌹","🌷","💐","🌿","🍃","✨","⭐","💫","🎀","🎊","🎉","💍","💒","💕","💖","💝","🕊️","🌙","☁️","🫧","🪷","🌾","🧁","🍰","📸","🎬","🎵","🎶","❤️","🤍","🤎","🩷","🩶"];
const FRAME_STYLES: {key: El["frameStyle"], label: string}[] = [
  {key:"square",   label:"사각형"},
  {key:"rounded",  label:"둥근 사각"},
  {key:"circle",   label:"원형"},
  {key:"polaroid", label:"폴라로이드"},
];
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
  const [selId, setSelId]     = useState<string|null>(null);
  const [tool,  setTool]      = useState<ElType|"select">("select");
  const [editingId, setEditingId] = useState<string|null>(null);
  const [showStickers, setShowStickers] = useState(false);
  const [showLayers,   setShowLayers]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [drag, setDrag]       = useState<{
    kind:"move"|"resize"; id:string;
    sx:number; sy:number; ox:number; oy:number; ow:number; oh:number;
  }|null>(null);

  const canvasRef  = useRef<HTMLDivElement>(null);
  const selEl = template.elements.find(e=>e.id===selId)??null;

  /* 템플릿 전환 */
  useEffect(()=>{
    const name = CATEGORIES.flatMap(c=>c.templates).find(t=>t.id===selTemplateId)?.name??"";
    const saved = loadTemplate(selTemplateId);
    setTemplate(saved ?? { id:selTemplateId, name, bg:defaultBg(), elements:[] });
    setSelId(null); setEditingId(null);
  },[selTemplateId]);

  /* 저장 */
  const persist = useCallback((t: Template)=>{
    saveTemplate(t); setSaved(true); setTimeout(()=>setSaved(false),1500);
  },[]);

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
    if(tool==="select") { setSelId(null); return; }
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
  const renderEl=(el:El)=>{
    const isSel=el.id===selId;
    const isEdit=el.id===editingId;
    const border=isSel?"2px solid #3b82f6":"2px solid transparent";
    const shadow=isSel?"0 0 0 1px rgba(59,130,246,0.4)":"none";

    const common:React.CSSProperties={
      position:"absolute", left:`${el.x}%`, top:`${el.y}%`,
      width:`${el.w}%`, height:`${el.h}%`,
      transform:`rotate(${el.rotation}deg)`,
      opacity:el.opacity, cursor:tool==="select"?"move":"crosshair",
      border, boxShadow:shadow, boxSizing:"border-box",
      zIndex:isSel?100:undefined,
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
        onMouseDown={e=>{ if(tool==="select"){ onElDown(e,el.id,"move"); } }}
        onClick={e=>{ e.stopPropagation(); if(tool==="select") setSelId(el.id); }}
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
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      upd({ bg: { ...template.bg, type: "image", imageDataUrl: dataUrl } });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  /* 배경 CSS */
  const bgCss: React.CSSProperties = template.bg.type==="image"
    ? { backgroundImage:`url(${template.bg.imageDataUrl})`, backgroundSize:"cover", backgroundPosition:"center" }
    : template.bg.type==="gradient"
    ? {background:`linear-gradient(${template.bg.angle??135}deg, ${template.bg.color}, ${template.bg.color2??"#ffffff"})`}
    : {background:template.bg.color};

  return(
    <div style={{display:"flex",width:"100vw",height:"100vh",background:"#0c0c14",color:"#fff",overflow:"hidden",fontFamily:"Pretendard,sans-serif"}}>

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
          <div style={{fontSize:"0.65rem",fontWeight:700,color:"#555"}}>{template.name}</div>
        </div>

        {/* 캔버스 */}
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:24,overflow:"hidden",background:"#0c0c14"}}>
          <div ref={canvasRef}
            style={{position:"relative",aspectRatio:"16/9",width:"100%",maxWidth:820,
              borderRadius:8,overflow:"visible",boxShadow:"0 8px 48px rgba(0,0,0,0.7)",
              cursor:tool==="select"?"default":"crosshair",userSelect:"none",
              containerType:"inline-size",
              ...bgCss}}
            onClick={onCanvasClick}
          >
            {template.elements.map(el=>renderEl(el))}
          </div>
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
              <input ref={bgImgInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleBgImageUpload}/>
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
