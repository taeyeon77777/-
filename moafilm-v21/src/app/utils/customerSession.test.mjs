import assert from 'node:assert/strict';
import {createCustomerSession,setSessionText,setSessionPhoto,validateSession,getCustomerRenderProject,customerFieldSummary,serializeSession,parseSession} from './customerSession.compiled.mjs';
const project={version:1,id:'t1',name:'테스트',scenes:[{id:'s1',name:'장면',bg:{type:'solid',color:'#fff'},elements:[{id:'a',type:'text',text:'원본',x:1,y:1,w:20,h:20,rotation:0,opacity:1},{id:'b',type:'photo_zone',x:1,y:1,w:20,h:20,rotation:0,opacity:1}],scene:{duration:5,transition:'fade',transitionDuration:.5,musicVolume:.8}}]};
let s=createCustomerSession('t1');assert.equal(customerFieldSummary(project,s).filledPhotos,0);
s=setSessionText(s,'a','신랑 신부');s=setSessionPhoto(s,'b','data:image/png;base64,AAAA');assert.deepEqual(validateSession(project,s),[]);
const result=getCustomerRenderProject(project,s);assert.equal(result.scenes[0].elements[0].text,'신랑 신부');assert.equal(result.scenes[0].elements[1].customerPhoto,'data:image/png;base64,AAAA');assert.equal(project.scenes[0].elements[0].text,'원본');
assert.deepEqual(parseSession(serializeSession(s)),s);assert.equal(customerFieldSummary(project,s).filledPhotos,1);
assert.throws(()=>getCustomerRenderProject({...project,id:'other'},s));assert.throws(()=>parseSession('{"values":{}}'));
console.log('customerSession: 9 assertions passed');
