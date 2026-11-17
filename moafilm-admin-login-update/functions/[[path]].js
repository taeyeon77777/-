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
    // The edge already checked browser Origin. Do not forward it to the internal
    // service: its origin allowlist is independent of the public Pages domain.
    headers.delete('Origin');
  }
  const init = {method:request.method,headers,redirect:'manual'};
  if (request.method !== 'GET' && request.method !== 'HEAD') init.body = request.body;
  try {
    const response = await fetch(target, init);
    if (!response.body && response.status !== 204 && response.status !== 304) {
      return new Response(JSON.stringify({error:'영상 서버가 빈 응답을 보냈습니다 (HTTP '+response.status+'). Render 로그와 메모리 사용량을 확인하세요.'}), {status:502,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
    }
    return new Response(response.body, {status:response.status,headers:response.headers});
  } catch (error) {
    console.error('MoaFilm backend proxy failed:', error);
    return new Response(JSON.stringify({error:'영상 서버 연결 실패. Render 서버가 재시작 중이거나 업로드 처리 중 연결이 끊어졌을 수 있습니다.'}), {status:502,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
  }
}
