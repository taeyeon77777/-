export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);
  if (!(/^\/api\//.test(url.pathname) || /^\/(backgrounds|outputs)\//.test(url.pathname))) {
    return context.next();
  }
  const backend = context.env.MOAFILM_BACKEND_URL;
  if (!backend || !/^https:\/\//.test(backend)) return new Response(JSON.stringify({error:'MOAFILM_BACKEND_URL 미설정'}), {status:503,headers:{'Content-Type':'application/json'}});
  const target = new URL(url.pathname + url.search, backend);
  const headers = new Headers(request.headers);
  headers.delete('host');
  // Only forward same-origin browser writes; normalize Origin for backend CSRF validation.
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const incomingOrigin = request.headers.get('Origin');
    if (incomingOrigin && incomingOrigin !== url.origin) {
      return new Response(JSON.stringify({error:'허용되지 않은 요청 출처'}), {status:403,headers:{'Content-Type':'application/json'}});
    }
    headers.set('Origin', url.origin);
  }
  const init = {method:request.method,headers,redirect:'manual'};
  if (request.method !== 'GET' && request.method !== 'HEAD') init.body = request.body;
  const response = await fetch(target, init);
  return new Response(response.body, {status:response.status,headers:response.headers});
}
