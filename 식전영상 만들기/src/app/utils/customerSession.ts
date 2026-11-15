import type { Project } from './templateEngine';
import { allFields, applyCustomerProject, emptyCustomerValues, validateCustomerValues, type CustomerValues } from './customerBinding';

export type CustomerSession = { templateId:string; values:CustomerValues; updatedAt:string };
export function createCustomerSession(templateId:string):CustomerSession {
  if (!templateId.trim()) throw new Error('템플릿 ID가 필요합니다');
  return {templateId,values:emptyCustomerValues(),updatedAt:new Date().toISOString()};
}
export function setSessionText(s:CustomerSession,id:string,text:string):CustomerSession {
  return {...s,values:{...s.values,texts:{...s.values.texts,[id]:text.slice(0,500)}},updatedAt:new Date().toISOString()};
}
export function setSessionPhoto(s:CustomerSession,id:string,photo:string):CustomerSession {
  return {...s,values:{...s.values,photos:{...s.values.photos,[id]:photo}},updatedAt:new Date().toISOString()};
}
export function validateSession(p:Project,s:CustomerSession):string[] {
  const errors=validateCustomerValues(p,s.values);
  if(s.templateId!==p.id)errors.push('템플릿 ID가 일치하지 않습니다');
  return errors;
}
export function getCustomerRenderProject(p:Project,s:CustomerSession):Project {
  const errors=validateSession(p,s);
  if(errors.length)throw new Error(errors.join('; '));
  return applyCustomerProject(p,s.values);
}
export function customerFieldSummary(p:Project,s:CustomerSession) {
  const fields=allFields(p);return {total:fields.length,photos:fields.filter(f=>f.kind==='photo').length,filledPhotos:fields.filter(f=>f.kind==='photo'&&!!s.values.photos[f.layerId]).length};
}
export function serializeSession(s:CustomerSession):string {return JSON.stringify(s)}
export function parseSession(json:string):CustomerSession {
  const s=JSON.parse(json);
  if(!s||typeof s.templateId!=='string'||!s.values||typeof s.values.texts!=='object'||typeof s.values.photos!=='object'||Array.isArray(s.values.texts)||Array.isArray(s.values.photos))throw new Error('고객 작업 파일이 올바르지 않습니다');
  return s;
}
