import os,tempfile,subprocess,time,json,urllib.request,urllib.error,shutil,http.cookiejar
from pathlib import Path
src=Path(__file__).resolve().parent
with tempfile.TemporaryDirectory() as d:
 for n in ('studio.py','security.py','index.html','marker_detector.py'):shutil.copy(src/n,d)
 env=os.environ.copy();env.update(PORT='18991',MOAFILM_BOOTSTRAP_ADMIN='1',MOAFILM_DATA_DIR=d+'/persistent')
 proc=subprocess.Popen(['python','studio.py'],cwd=d,env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 try:
  time.sleep(1)
  def call(path,data):
   req=urllib.request.Request('http://127.0.0.1:18991'+path,data=json.dumps(data).encode(),headers={'Content-Type':'application/json'})
   try:
    with urllib.request.urlopen(req,timeout=8) as r:return r.status,json.loads(r.read())
   except urllib.error.HTTPError as e:return e.code,json.loads(e.read())
  assert call('/api/register',{'email':'a@example.com','password':'long-password-123'})[0]==200
  assert call('/api/password/forgot',{'email':'a@example.com'})[0]==200
  assert call('/api/password/reset',{'token':'wrong','password':'another-password-123'})[0]==400
  import sqlite3,hashlib
  db=sqlite3.connect(d+'/persistent/accounts.sqlite3')
  assert db.execute('select count(*) from password_resets').fetchone()[0]==1
  assert Path(d+'/persistent/accounts.sqlite3').exists()
  assert call('/api/login',{'email':'a@example.com','password':'long-password-123'})[0]==200
  print('PASS: persistent DB, forgot-password endpoint, invalid token rejected, login')
 finally:proc.terminate();proc.wait(timeout=5)
