import os,subprocess,time,urllib.request,urllib.error,json,http.cookiejar,tempfile,shutil
from pathlib import Path
src=Path(__file__).resolve().parent
with tempfile.TemporaryDirectory() as d:
 for name in ['studio.py','security.py','index.html','marker_detector.py']:shutil.copy(src/name,d)
 env=os.environ.copy();env.update(MOAFILM_BOOTSTRAP_ADMIN='1',PORT='18990')
 proc=subprocess.Popen(['python','studio.py'],cwd=d,env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 try:
  time.sleep(1)
  def client():return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
  admin=client();customer=client();guest=client()
  def call(c,path,data=None):
   raw=None if data is None else json.dumps(data).encode()
   req=urllib.request.Request('http://127.0.0.1:18990'+path,data=raw,headers={'Content-Type':'application/json'} if raw else {})
   try:
    with c.open(req,timeout=15) as r:return r.status,json.loads(r.read()) if path.startswith('/api/') else None
   except urllib.error.HTTPError as e:return e.code,json.loads(e.read())
  assert call(guest,'/api/templates')[0]==401
  assert call(admin,'/api/register',{'email':'admin@example.com','password':'long-password-123'})[0]==200
  assert call(customer,'/api/register',{'email':'customer@example.com','password':'long-password-123'})[0]==200
  assert call(admin,'/api/login',{'email':'admin@example.com','password':'long-password-123'})[1]['user']['role']=='admin'
  assert call(customer,'/api/login',{'email':'customer@example.com','password':'long-password-123'})[1]['user']['role']=='customer'
  assert call(customer,'/api/template',{})[0]==403
  assert call(customer,'/api/checkout/mock',{'template_id':'notreal'})[0]==400
  assert call(admin,'/api/me')[1]['role']=='admin'
  assert call(customer,'/api/me')[1]['role']=='customer'
  assert call(customer,'/api/job/'+'a'*32)[0]==404
  assert call(customer,'/api/logout',{})[0]==200
  assert call(customer,'/api/templates')[0]==401
  print('PASS: guest denied, admin bootstrap, customer role, admin-only writes, mock order validation, job isolation, logout')
 finally:proc.terminate();proc.wait(timeout=5)
 if proc.stdout:proc.stdout.close()
 if proc.stderr:proc.stderr.close()
