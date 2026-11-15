/** MoaFilm template operations. Pure functions; no server or storage dependency. */
export type ElementKind = 'text'|'rect'|'ellipse'|'photo_zone'|'sticker'|'line';
export type Transition = 'cut'|'fade'|'slide'|'zoom';
export interface Layer {id:string;type:ElementKind;x:number;y:number;w:number;h:number;rotation:number;opacity:number;text?:string;label?:string;animation?:{effect:string;duration:number;delay:number;repeat:boolean};locked?:boolean;hidden?:boolean;[key:string]:unknown}
export interface Scene {id:string;name:string;bg:{type:string;color:string;[key:string]:unknown};elements:Layer[];scene?:{duration:number;transition:Transition;transitionDuration:number;musicVolume:number;[key:string]:unknown}}
export interface Project {version:number;id:string;name:string;scenes:Scene[]}
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
const clone=<T>(x:T):T=>JSON.parse(JSON.stringify(x));
const id=()=>`m${Math.random().toString(36).slice(2,11)}`;
export const newProject=(name='새 영상'):Project=>({version:1,id:id(),name,scenes:[]}); // 1
export const newScene=(name='새 장면'):Scene=>({id:id(),name,bg:{type:'solid',color:'#ffffff'},elements:[],scene:{duration:5,transition:'fade',transitionDuration:.5,musicVolume:.8}}); // 2
export const addScene=(p:Project,s:Scene=newScene()):Project=>({...p,scenes:[...p.scenes,clone(s)]}); // 3
export const duplicateScene=(p:Project,sceneId:string):Project=>{const i=p.scenes.findIndex(s=>s.id===sceneId);if(i<0)return p;const s=clone(p.scenes[i]);s.id=id();s.name+=' 복사';s.elements=s.elements.map(e=>({...e,id:id()}));const scenes=[...p.scenes];scenes.splice(i+1,0,s);return {...p,scenes}}; // 4
export const removeScene=(p:Project,sceneId:string):Project=>({...p,scenes:p.scenes.filter(s=>s.id!==sceneId)}); // 5
export const moveScene=(p:Project,from:number,to:number):Project=>{if(from<0||to<0||from>=p.scenes.length||to>=p.scenes.length)return p;const scenes=[...p.scenes];scenes.splice(to,0,scenes.splice(from,1)[0]);return {...p,scenes}}; // 6
export const renameScene=(s:Scene,name:string):Scene=>({...s,name:name.trim().slice(0,100)||s.name}); // 7
export const setSceneDuration=(s:Scene,duration:number):Scene=>({...s,scene:{...sceneSettings(s),duration:clamp(duration,1,300)}}); // 8
export const setSceneTransition=(s:Scene,transition:Transition):Scene=>({...s,scene:{...sceneSettings(s),transition}}); // 9
export const setTransitionDuration=(s:Scene,duration:number):Scene=>({...s,scene:{...sceneSettings(s),transitionDuration:clamp(duration,0,3)}}); // 10
export const setSceneVolume=(s:Scene,volume:number):Scene=>({...s,scene:{...sceneSettings(s),musicVolume:clamp(volume,0,1)}}); // 11
export const addLayer=(s:Scene,layer:Layer):Scene=>({...s,elements:[...s.elements,clone(layer)]}); // 12
export const duplicateLayer=(s:Scene,layerId:string):Scene=>{const i=s.elements.findIndex(e=>e.id===layerId);if(i<0)return s;const elements=[...s.elements];elements.splice(i+1,0,{...clone(elements[i]),id:id()});return {...s,elements}}; // 13
export const removeLayer=(s:Scene,layerId:string):Scene=>({...s,elements:s.elements.filter(e=>e.id!==layerId)}); // 14
export const moveLayer=(s:Scene,from:number,to:number):Scene=>{if(from<0||to<0||from>=s.elements.length||to>=s.elements.length)return s;const elements=[...s.elements];elements.splice(to,0,elements.splice(from,1)[0]);return {...s,elements}}; // 15
export const updateLayer=(s:Scene,layerId:string,patch:Partial<Layer>):Scene=>({...s,elements:s.elements.map(e=>e.id===layerId&&!e.locked?{...e,...patch,id:e.id}:e)}); // 16
export const setLayerPosition=(s:Scene,layerId:string,x:number,y:number):Scene=>updateLayer(s,layerId,{x:clamp(x,0,100),y:clamp(y,0,100)}); // 17
export const setLayerSize=(s:Scene,layerId:string,w:number,h:number):Scene=>updateLayer(s,layerId,{w:clamp(w,1,100),h:clamp(h,1,100)}); // 18
export const setLayerRotation=(s:Scene,layerId:string,rotation:number):Scene=>updateLayer(s,layerId,{rotation:((rotation%360)+360)%360}); // 19
export const setLayerOpacity=(s:Scene,layerId:string,opacity:number):Scene=>updateLayer(s,layerId,{opacity:clamp(opacity,0,1)}); // 20
export const setLayerAnimation=(s:Scene,layerId:string,effect:string,duration:number,delay:number,repeat=false):Scene=>updateLayer(s,layerId,{animation:{effect,duration:clamp(duration,.1,30),delay:clamp(delay,0,300),repeat}}); // 21
export const toggleLayerLock=(s:Scene,layerId:string):Scene=>({...s,elements:s.elements.map(e=>e.id===layerId?{...e,locked:!e.locked}:e)}); // 22
export const toggleLayerVisibility=(s:Scene,layerId:string):Scene=>({...s,elements:s.elements.map(e=>e.id===layerId?{...e,hidden:!e.hidden}:e)}); // 23
export const setBackgroundColor=(s:Scene,color:string):Scene=>({...s,bg:{type:'solid',color}}); // 24
export const listPhotoZones=(s:Scene):Layer[]=>s.elements.filter(e=>e.type==='photo_zone'); // 25
export const listEditableText=(s:Scene):Layer[]=>s.elements.filter(e=>e.type==='text'); // 26
export const totalDuration=(p:Project):number=>p.scenes.reduce((n,s)=>n+sceneSettings(s).duration,0); // 27
export const applyCustomerText=(s:Scene,replacements:Record<string,string>):Scene=>({...s,elements:s.elements.map(e=>e.type==='text'&&Object.prototype.hasOwnProperty.call(replacements,e.id)?{...e,text:replacements[e.id]}:e)}); // 28
export const validateProject=(p:Project):string[]=>{const errors:string[]=[];if(!p||!Array.isArray(p.scenes))return ['장면 목록이 없습니다'];if(p.scenes.length>300)errors.push('장면은 최대 300개입니다');const ids=new Set<string>();for(const s of p.scenes){if(!s.id||ids.has(s.id))errors.push('장면 ID가 중복되거나 비어 있습니다');ids.add(s.id);const d=sceneSettings(s).duration;if(!Number.isFinite(d)||d<1||d>300)errors.push(`${s.name}: 재생 시간 오류`);const layerIds=new Set<string>();for(const e of s.elements){if(!e.id||layerIds.has(e.id))errors.push(`${s.name}: 레이어 ID 오류`);layerIds.add(e.id);if([e.x,e.y,e.w,e.h,e.opacity,e.rotation].some(v=>!Number.isFinite(v)))errors.push(`${s.name}: 레이어 숫자 오류`);}}return errors}; // 29
export const serializeProject=(p:Project):string=>{const errors=validateProject(p);if(errors.length)throw new Error(errors.join('; '));return JSON.stringify(p)}; // 30
export const parseProject=(json:string):Project=>{const p=JSON.parse(json) as Project;const errors=validateProject(p);if(errors.length)throw new Error(errors.join('; '));return p}; // 31
function sceneSettings(s:Scene):NonNullable<Scene['scene']>{return {duration:5,transition:'fade',transitionDuration:.5,musicVolume:.8,...s.scene}}
