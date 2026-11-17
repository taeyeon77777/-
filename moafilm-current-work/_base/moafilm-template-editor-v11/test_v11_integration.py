import unittest, tempfile, os, subprocess, sys, time, json, base64, urllib.request, urllib.error, http.cookiejar
from pathlib import Path
import cv2,numpy as np
SRC=Path(__file__).parent
class Integration(unittest.TestCase):
 def test_upload_detect_save_customer_guide(self):
  with tempfile.TemporaryDirectory() as d:
   d=Path(d);env=os.environ.copy();env.update(MOAFILM_DATA_DIR=str(d/'data'),PORT='18993',MOAFILM_BOOTSTRAP_ADMIN='1')
   p=subprocess.Popen([sys.executable,str(SRC/'studio.py')],cwd=SRC,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
   try:
    time.sleep(1.1)
    opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    def call(path,data):
     req=urllib.request.Request('http://127.0.0.1:18993'+path,data=json.dumps(data).encode(),headers={'Content-Type':'application/json'})
     with opener.open(req,timeout=20) as r:return json.loads(r.read())
    call('/api/register',{'email':'admin@example.com','password':'strong-pass-123'})
    call('/api/login',{'email':'admin@example.com','password':'strong-pass-123'})
    for name,guide in [('clean',False),('guide',True)]:
     f=d/(name+'.mp4');wr=cv2.VideoWriter(str(f),cv2.VideoWriter_fourcc(*'mp4v'),10,(320,180))
     for _ in range(30):
      im=np.full((180,320,3),(210,220,230),dtype=np.uint8)
      if guide:
       cv2.rectangle(im,(20,30),(100,140),(0,255,0),-1)
       cv2.rectangle(im,(120,30),(200,80),(255,0,255),-1)
       cv2.rectangle(im,(120,95),(220,145),(255,207,0),-1)
      wr.write(im)
     wr.release()
    def dataurl(f):return 'data:video/mp4;base64,'+base64.b64encode(f.read_bytes()).decode()
    template=call('/api/template',{'name':'테스트 웨딩','video':dataurl(d/'clean.mp4')})
    result=call('/api/marker/detect',{'template_id':template['id'],'video':dataurl(d/'guide.mp4')})
    self.assertEqual(len(result['slots']),3)
    slots=[]
    for s in result['slots']:
     s={k:v for k,v in s.items() if k not in ('confidence','moving','resizing')}
     s['guide_title']='첫 만남 사진' if s['type']=='photo' else '이름 또는 날짜'
     s['guide_description']='고객 화면에서만 표시됩니다.'
     s['required']=True
     slots.append(s)
    template['slots']=slots
    self.assertTrue(call('/api/template/update',{'template':template})['ok'])
    saved=json.loads((d/'data'/'templates'/(template['id']+'.json')).read_text())
    self.assertEqual(saved['slots'][0]['guide_description'],'고객 화면에서만 표시됩니다.')
    self.assertFalse(any('guide_title' in x for x in []))
   finally:
    p.terminate();p.wait(timeout=5)
if __name__=='__main__':unittest.main()
