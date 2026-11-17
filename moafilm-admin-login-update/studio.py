#!/usr/bin/env python3
"""MoaFilm Canva background MP4 template studio. Local-only, not a payment service."""
import base64, json, re, subprocess, uuid, threading, time, shutil, mimetypes, os, hmac, smtplib, ssl, email.message, math, tempfile
import security
from marker_detector import detect_video
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse, unquote
from PIL import Image
ROOT=Path(os.environ.get('MOAFILM_DATA_DIR',str(Path(__file__).resolve().parent)))
ROOT.mkdir(parents=True,exist_ok=True)
for p in ('templates','backgrounds','photos','outputs','jobs','music','scenes'): (ROOT/p).mkdir(exist_ok=True)
HOST=os.environ.get('MOAFILM_HOST','127.0.0.1'); PORT=int(os.environ.get('PORT','8890'))
FONT='/usr/share/fonts/truetype/nanum/NanumGothic.ttf'
if not Path(FONT).exists():FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
JOBS={}
RENDER_SLOTS=threading.BoundedSemaphore(max(1,int(os.environ.get("MOAFILM_MAX_RENDERS","2"))))
# In-memory abuse guard: per-IP and per-account buckets. For multi-worker deployment,
# replace with a shared Redis-backed limiter.
RATE_LOCK=threading.Lock()
RATE={}
def check_rate(key,limit,window=300):
 now=time.monotonic()
 with RATE_LOCK:
  hits=[x for x in RATE.get(key,[]) if now-x<window]
  if len(hits)>=limit:
   RATE[key]=hits
   return False
  hits.append(now);RATE[key]=hits
  if len(RATE)>10000:
   for k in list(RATE)[:2000]:
    if not RATE[k] or RATE[k][-1]<now-window:RATE.pop(k,None)
  return True

def reconcile_interrupted_jobs():
 """Do not falsely report interrupted in-memory renders as still running."""
 count=0
 for path in (ROOT/'jobs').glob('*.json'):
  if not re.fullmatch(r'[a-f0-9]{32}\.json',path.name):continue
  try:
   j=json.loads(path.read_text(encoding='utf-8'))
   if j.get('status') in ('queued','running'):
    j.update(status='error',error='서버 재시작으로 렌더링이 중단되었습니다. 다시 생성해 주세요.',progress=0)
    tmp=path.with_suffix('.tmp');tmp.write_text(json.dumps(j,ensure_ascii=False),encoding='utf-8');tmp.replace(path)
    count+=1
  except (OSError,ValueError,TypeError):pass
 return count
def send_email(to,subject,body):
 host=os.environ.get('MOAFILM_SMTP_HOST')
 if not host:raise ValueError('이메일 발송 설정이 없습니다 (SMTP)')
 msg=email.message.EmailMessage();msg['From']=os.environ['MOAFILM_SMTP_FROM'];msg['To']=to;msg['Subject']=subject;msg.set_content(body)
 with smtplib.SMTP(host,int(os.environ.get('MOAFILM_SMTP_PORT','587')),timeout=15) as smtp:
  smtp.starttls(context=ssl.create_default_context())
  smtp.login(os.environ['MOAFILM_SMTP_USER'],os.environ['MOAFILM_SMTP_PASSWORD'])
  smtp.send_message(msg)
def persist_job(jobid):
 path=ROOT/'jobs'/(jobid+'.json');tmp=path.with_suffix('.tmp')
 tmp.write_text(json.dumps(JOBS[jobid],ensure_ascii=False));tmp.replace(path)
def probe(path):
 p=subprocess.run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)],capture_output=True,text=True,check=True,timeout=20)
 d=json.loads(p.stdout);v=next(s for s in d['streams'] if s['codec_type']=='video');return {'width':v['width'],'height':v['height'],'duration':float(d['format']['duration']),'fps':v.get('r_frame_rate','')}
def check_template(t):
 if not isinstance(t,dict) or not re.fullmatch('[a-f0-9]{12}',str(t.get('id',''))):raise ValueError('템플릿 ID 오류')
 if not isinstance(t.get('name'),str) or not 1<=len(t['name'])<=100:raise ValueError('템플릿 이름 오류')
 bg=ROOT/'backgrounds'/(t['id']+'.mp4')
 if not bg.is_file():raise ValueError('배경 영상 없음')
 if not isinstance(t.get('duration'),(int,float)) or not 1<=t['duration']<=180:raise ValueError('영상 길이 1~180초')
 if t.get('scenes') and (not isinstance(t['scenes'],list) or len(t['scenes'])>30):raise ValueError('장면 목록 오류')
 keys=set()
 for s in t.get('slots',[]):
  if not isinstance(s,dict) or s.get('type') not in ('photo','text'):raise ValueError('레이어 유형 오류')
  for k in ('x','y','w','h','start','end'):
   if isinstance(s.get(k),bool) or not isinstance(s.get(k),(int,float)) or not math.isfinite(s[k]):raise ValueError('레이어 좌표 오류')
  if not (0<=s['x']<1 and 0<=s['y']<1 and 0<s['w']<=1-s['x']+1e-8 and 0<s['h']<=1-s['y']+1e-8 and 0<=s['start']<s['end']<=t['duration']+1e-6):raise ValueError('레이어 위치·시간 오류')
  if not isinstance(s.get('key'),str) or not re.fullmatch('[a-zA-Z_][a-zA-Z0-9_]{0,30}',s['key']):raise ValueError('레이어 키 오류')
  if s['key'] in keys:raise ValueError('레이어 식별자가 중복됩니다: '+s['key'])
  keys.add(s['key'])
  # Upload guidance is UI metadata, never passed into the video renderer.
  for field in ('guide_title','guide_description'):
   if field in s and (not isinstance(s[field],str) or len(s[field])>(120 if field=='guide_title' else 600)):
    raise ValueError('고객 안내 문구 길이 오류')
  if 'required' in s and not isinstance(s['required'],bool):raise ValueError('필수 여부 오류')
  kfs=s.get('keyframes',[])
  if not isinstance(kfs,list) or len(kfs)>30:raise ValueError('키프레임 개수 오류')
  last=-1
  for kf in kfs:
   if not isinstance(kf,dict) or any(isinstance(kf.get(z),bool) or not isinstance(kf.get(z),(int,float)) or not math.isfinite(kf[z]) for z in ('time','x','y')):raise ValueError('키프레임 형식 오류')
   if not (s['start']<=kf['time']<=s['end'] and kf['time']>last and 0<=kf['x']<=1-s['w']+1e-8 and 0<=kf['y']<=1-s['h']+1e-8):raise ValueError('키프레임 시간·좌표 오류')
   last=kf['time']
 return t
def save_data_url(data,path,limit,kind):
 if not isinstance(data,str) or ',' not in data:raise ValueError('업로드 데이터 오류')
 raw=base64.b64decode(data.split(',',1)[1],validate=True)
 if not raw or len(raw)>limit:raise ValueError('파일 용량 제한 초과')
 path.write_bytes(raw)
 try:
  if kind=='video':
   p=probe(path)
   if not 1<=p['duration']<=180 or p['width']>3840 or p['height']>2160 or abs(p['width']/p['height']-16/9)>.03:raise ValueError('16:9 MP4, 1~180초만 지원')
  else:
   with Image.open(path) as im:
    im.verify()
 except Exception:
  path.unlink(missing_ok=True);raise
 return raw
def make_scene_background(t,jobid):
 """Build one video from sequential clips, with optional 0.5s crossfades."""
 scenes=t.get('scenes') or []
 if not scenes:return ROOT/'backgrounds'/(t['id']+'.mp4'),float(t['duration']),False
 clips=[]
 for scene in scenes:
  sid=scene.get('id','')
  if not re.fullmatch(r'[a-f0-9]{12}',sid):raise ValueError('장면 ID 오류')
  f=ROOT/'scenes'/(t['id']+'-'+sid+'.mp4')
  if not f.is_file():raise ValueError('장면 파일 없음')
  d=float(scene.get('duration',0))
  if not 1<=d<=180:raise ValueError('장면 길이 오류')
  clips.append((f,d))
 if len(clips)>30:raise ValueError('장면 최대 30개')
 transition=t.get('transition','cut')
 if transition not in ('cut','fade'):raise ValueError('전환 방식 오류')
 fade=0.5 if transition=='fade' and len(clips)>1 else 0
 total=sum(d for _,d in clips)-fade*(len(clips)-1)
 if total>180 or total<1:raise ValueError('전체 길이 1~180초')
 args=['ffmpeg','-hide_banner','-loglevel','error','-y']
 for f,_ in clips:args+=['-i',str(f)]
 filters=[]
 for i,(_,d) in enumerate(clips):
  filters.append(f'[{i}:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,trim=duration={d},setpts=PTS-STARTPTS,fps=30,settb=AVTB,format=yuv420p[s{i}]')
 if fade:
  cur='s0'; elapsed=clips[0][1]
  for i in range(1,len(clips)):
   label=f'm{i}';offset=round(elapsed-fade,3)
   filters.append(f'[{cur}][s{i}]xfade=transition=fade:duration={fade}:offset={offset}[{label}]')
   cur=label;elapsed+=clips[i][1]-fade
 else:
  cur='joined';filters.append(''.join(f'[s{i}]' for i in range(len(clips)))+f'concat=n={len(clips)}:v=1:a=0[{cur}]')
 out=ROOT/'jobs'/(jobid+'-joined.mp4')
 args+=['-filter_complex',';'.join(filters),'-map',f'[{cur}]','-an','-c:v','libx264','-preset','ultrafast','-crf','23','-pix_fmt','yuv420p','-t',str(total),str(out)]
 subprocess.run(args,check=True,capture_output=True,timeout=900)
 return out,total,True

def run_render(jobid,t,photos,values):
 job=JOBS[jobid]; job.update(status='running',progress=2)
 out=ROOT/'outputs'/(jobid+'.mp4')
 temp=[]
 try:
  W,H=1920,1080; duration=float(t['duration'])
  bg,duration,joined=make_scene_background(t,jobid)
  if joined:temp.append(bg)
  args=['ffmpeg','-hide_banner','-loglevel','error','-y','-stream_loop','-1','-i',str(bg)]
  # Optional separate soundtrack. The original Canva background audio is kept if no separate track is provided.
  music=ROOT/'music'/(t['id']+'.mp3')
  use_music=music.is_file()
  bg_has_audio=(not joined) and any(x.get('codec_type')=='audio' for x in json.loads(subprocess.run(['ffprobe','-v','error','-show_streams','-of','json',str(bg)],capture_output=True,text=True,check=True).stdout)['streams'])
  if use_music:args+=['-stream_loop','-1','-i',str(music)]
  audio_index=1 if use_music else 0

  filters=['[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30,trim=duration='+str(duration)+',setpts=PTS-STARTPTS[v0]']
  current='v0';index=2 if use_music else 1
  for s in t['slots']:
   if s['type']=='photo':
    key=s['key'];src=photos.get(key)
    if not src:
     if s.get('required',True):raise ValueError('사진 누락: '+key)
     continue
    f=ROOT/'photos'/(jobid+'-'+key+'.png');save_data_url(src,f,12_000_000,'image');temp.append(f)
    args+=['-loop','1','-framerate','30','-i',str(f)]
    w=max(2,round(s['w']*W/2)*2);h=max(2,round(s['h']*H/2)*2)
    filters.append(f'[{index}:v]scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},format=yuva420p,setsar=1[p{index}]')
    x=round(s['x']*W);y=round(s['y']*H)
    kfs=s.get('keyframes',[])
    if kfs:
     def motion(axis,dim):
      pts=[(float(s['start']),round(s[axis]*dim))]+[(float(k['time']),round(k[axis]*dim)) for k in kfs]
      pts=sorted(dict(pts).items())
      expr=str(pts[-1][1])
      for j in range(len(pts)-2,-1,-1):
       a,b=pts[j],pts[j+1]
       delta=b[0]-a[0]
       lerp=f'({a[1]}+({b[1]}-{a[1]})*(t-{a[0]})/{delta})' if delta>0 else str(a[1])
       expr=f'if(lt(t,{b[0]}),{lerp},{expr})'
      return expr.replace(',',r'\,')
     ox,oy=motion('x',W),motion('y',H)
    else:ox,oy=str(x),str(y)
    filters.append(f'[{current}][p{index}]overlay=x={ox}:y={oy}:eval=frame:enable=\'between(t,{s["start"]},{s["end"]})\':shortest=0[v{index}]')
    current='v'+str(index);index+=1
   else:
    content=str(values.get(s['key'],''))[:100]
    if not content:continue
    textfile=ROOT/'jobs'/(jobid+'-'+s['key']+'.txt');textfile.write_text(content,encoding='utf-8');temp.append(textfile)
    x=round(s['x']*W);y=round(s['y']*H);fontsize=max(14,min(150,round(s['h']*H*.6)))
    safe=str(textfile).replace('\\','/').replace(':','\\:').replace("'","\\'")
    filters.append(f'[{current}]drawtext=fontfile={FONT}:textfile={safe}:fontsize={fontsize}:fontcolor=white:borderw=2:bordercolor=black@0.65:x={x}:y={y}:enable=\'between(t,{s["start"]},{s["end"]})\'[v{index}]')
    current='v'+str(index);index+=1
  args+=['-filter_complex',';'.join(filters),'-map','['+current+']']
  if use_music or bg_has_audio:args+=['-map',f'{audio_index}:a:0','-c:a','aac','-b:a','192k','-af',f'afade=t=out:st={max(0,duration-2)}:d={min(2,duration)}']
  else:args+=['-an']
  args+=['-t',str(duration),'-c:v','libx264','-preset','ultrafast','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart','-progress','pipe:1','-nostats',str(out)]
  # Drain progress on a separate thread and redirect stderr to a file to avoid pipe deadlocks.
  with tempfile.TemporaryFile(mode='w+t',encoding='utf-8') as errors:
   p=subprocess.Popen(args,stdout=subprocess.PIPE,stderr=errors,text=True)
   job['pid']=p.pid
   def drain_progress():
    try:
     for line in p.stdout:
      if line.startswith('out_time_ms='):
       try:job['progress']=min(99,max(2,int(float(line.split('=',1)[1])/1e6/duration*100)))
       except (ValueError,ZeroDivisionError):pass
    finally:p.stdout.close()
   reader=threading.Thread(target=drain_progress,daemon=True)
   reader.start()
   try:rc=p.wait(timeout=900)
   except subprocess.TimeoutExpired:
    p.kill();p.wait();raise RuntimeError('영상 제작 시간 제한(15분)을 초과했습니다')
   finally:reader.join(timeout=5)
   errors.seek(0);err=errors.read()[-1200:]
  if rc:raise RuntimeError('FFmpeg 출력 실패: '+err)
  meta=probe(out)
  if meta['width']!=1920 or meta['height']!=1080 or abs(meta['duration']-duration)>.15:raise RuntimeError('결과 영상 검증 실패')
  job.update(status='done',progress=100,download='/outputs/'+jobid+'.mp4',meta=meta);persist_job(jobid)
 except Exception as e:
  out.unlink(missing_ok=True);job.update(status='error',error=str(e));persist_job(jobid)
 finally:
  for f in temp:f.unlink(missing_ok=True)
# Supabase Auth: all credentials and role checks are verified on the backend.
import urllib.request, urllib.error
from http.cookies import SimpleCookie
SUPABASE_URL=os.environ.get('SUPABASE_URL','').rstrip('/')
SUPABASE_PUBLISHABLE_KEY=os.environ.get('SUPABASE_PUBLISHABLE_KEY','')
ADMIN_EMAIL=os.environ.get('MOAFILM_ADMIN_EMAIL','').strip().lower()
def supabase_call(endpoint, payload=None, access_token=None, method=None):
 if not SUPABASE_URL or not SUPABASE_PUBLISHABLE_KEY:raise ValueError('서버 Supabase 환경변수가 설정되지 않았습니다')
 headers={'apikey':SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json'}
 if access_token:headers['Authorization']='Bearer '+access_token
 data=json.dumps(payload).encode() if payload is not None else None
 req=urllib.request.Request(SUPABASE_URL+'/auth/v1/'+endpoint,data=data,headers=headers,method=method)
 try:
  with urllib.request.urlopen(req,timeout=12) as r:return json.loads(r.read())
 except urllib.error.HTTPError as e:
  try:message=json.loads(e.read()).get('msg') or '인증 실패'
  except Exception:message='인증 실패'
  raise ValueError(message) from None

def session_user(cookie):
 try:
  jar=SimpleCookie();jar.load(cookie);token=jar['moafilm_access'].value
  u=supabase_call('user',access_token=token)
  if not u.get('id') or not u.get('email'):return None
  email=u['email'].lower()
  return {'id':u['id'],'email':email,'role':'admin' if ADMIN_EMAIL and email==ADMIN_EMAIL and u.get('email_confirmed_at') else 'customer'}
 except Exception:return None

class Handler(BaseHTTPRequestHandler):
 def identity(self):return session_user(self.headers.get('Cookie',''))
 def require(self,admin=False):
  user=self.identity()
  if not user:self.send(401,{'error':'로그인이 필요합니다'});return None
  if admin and user['role']!='admin':self.send(403,{'error':'관리자 권한이 필요합니다'});return None
  return user
 def secure_headers(self):
  self.send_header('X-Content-Type-Options','nosniff');self.send_header('X-Frame-Options','DENY');self.send_header('Referrer-Policy','no-referrer');self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'")

 def send(self,code,obj):
  raw=json.dumps(obj,ensure_ascii=False).encode();self.send_response(code);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Content-Length',str(len(raw)));self.send_header('Cache-Control','no-store');self.secure_headers();self.end_headers();self.wfile.write(raw)
 def do_GET(self):
  path=unquote(urlparse(self.path).path)
  if path=='/api/me':return self.send(200,self.identity() or {'role':'guest'})
  if path=='/api/templates':
   if not self.require():return
   return self.send(200,[json.loads(f.read_text()) for f in (ROOT/'templates').glob('*.json')])
  if path.startswith('/api/job/'):
   user=self.require()
   if not user:return
   jobid=path.rsplit('/',1)[-1]
   with security.db() as c:owner=c.execute('SELECT user_id FROM render_jobs WHERE job_id=?',(jobid,)).fetchone()
   if not owner or owner['user_id']!=user['id']:return self.send(404,{'error':'작업 없음'})
   j=JOBS.get(jobid)
   if not j and (ROOT/'jobs'/(jobid+'.json')).is_file():j=json.loads((ROOT/'jobs'/(jobid+'.json')).read_text())
   return self.send(200,j) if j else self.send(404,{'error':'작업 없음'})
  if path=='/':file=ROOT/'index.html'
  elif path.startswith('/outputs/') and re.fullmatch(r'/outputs/[a-f0-9]{32}\.mp4',path):
   user=self.require()
   if not user:return
   jobid=path.split('/')[-1][:-4]
   with security.db() as c:owner=c.execute('SELECT user_id FROM render_jobs WHERE job_id=?',(jobid,)).fetchone()
   if not owner or owner['user_id']!=user['id']:return self.send(404,{'error':'파일 없음'})
   file=ROOT/path.lstrip('/')
  elif path.startswith('/backgrounds/') and re.fullmatch(r'/backgrounds/[a-f0-9]{12}\.mp4',path):
   if not self.require():return
   file=ROOT/path.lstrip('/')
  else:return self.send(404,{'error':'파일 없음'})
  if not file.is_file():return self.send(404,{'error':'파일 없음'})
  mime=mimetypes.guess_type(str(file))[0] or 'application/octet-stream';size=file.stat().st_size
  self.send_response(200);self.send_header('Content-Type',mime);self.send_header('Content-Length',str(size));self.secure_headers();self.end_headers()
  with file.open('rb') as f:shutil.copyfileobj(f,self.wfile)
 def do_POST(self):
  try:
   length=int(self.headers.get('Content-Length','0'))
   if not 0<length<=35_000_000:raise ValueError('요청 크기 제한 초과')
   origin=self.headers.get('Origin')
   if origin and origin not in (f'http://{HOST}:{PORT}',f'http://localhost:{PORT}',os.environ.get('MOAFILM_PUBLIC_ORIGIN','')):raise ValueError('허용되지 않은 요청 출처')
   data=json.loads(self.rfile.read(length));path=urlparse(self.path).path
   if path in ('/api/login','/api/register','/api/password/forgot','/api/password/reset','/api/email/verify'):
    ip=self.client_address[0]
    limits={'/api/login':(12,300),'/api/register':(5,3600),'/api/password/forgot':(5,3600),'/api/password/reset':(10,3600),'/api/email/verify':(10,3600)}
    limit,window=limits[path]
    email=str(data.get('email','')).strip().lower()[:254]
    if not check_rate(('ip',ip,path),limit,window) or (email and not check_rate(('email',email,path),limit*2,window)):
     return self.send(429,{'error':'요청이 너무 많습니다. 잠시 후 다시 시도하세요.'})
   if path=='/api/register':
    email=str(data.get('email','')).strip().lower();password=str(data.get('password',''))
    if email=='gin77777':email='gin77777@naver.com'
    if len(password)<12:raise ValueError('비밀번호는 12자 이상이어야 합니다')
    result=supabase_call('signup',{'email':email,'password':password})
    return self.send(200,{'ok':True,'email_verification_required':not bool(result.get('session')),'message':'회원가입 요청 완료. 이메일 인증 설정을 확인하세요.'})
   if path=='/api/login':
    email=str(data.get('email','')).strip().lower()
    if email=='gin77777':email='gin77777@naver.com'
    result=supabase_call('token?grant_type=password',{'email':email,'password':str(data.get('password',''))})
    token=result.get('access_token');u=result.get('user',{})
    if not token or not u.get('id'):raise ValueError('로그인 실패')
    raw=json.dumps({'user':{'id':u['id'],'email':u.get('email'),'role':'admin' if ADMIN_EMAIL and u.get('email','').lower()==ADMIN_EMAIL and u.get('email_confirmed_at') else 'customer'}},ensure_ascii=False).encode()
    self.send_response(200);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Content-Length',str(len(raw)));self.send_header('Cache-Control','no-store')
    self.send_header('Set-Cookie','moafilm_access='+token+'; HttpOnly; SameSite=Strict; Path=/; Max-Age='+str(min(3600,int(result.get('expires_in',3600))))+('; Secure' if os.environ.get('MOAFILM_HTTPS')=='1' else ''))
    self.secure_headers();self.end_headers();self.wfile.write(raw);return
   if path=='/api/logout':
    raw=b'{"ok":true}';self.send_response(200);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(raw)));self.send_header('Set-Cookie','moafilm_access=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'+('; Secure' if os.environ.get('MOAFILM_HTTPS')=='1' else ''));self.secure_headers();self.end_headers();self.wfile.write(raw);return
   if path=='/api/password/forgot':
    supabase_call('recover',{'email':str(data.get('email','')).strip()})
    return self.send(200,{'ok':True,'message':'계정이 존재하면 재설정 메일이 발송됩니다.'})
   if path=='/api/password/change':
    user=self.require()
    if not user:return
    new_password=str(data.get('new_password',''))
    if len(new_password)<12:raise ValueError('새 비밀번호는 12자 이상이어야 합니다')
    jar=SimpleCookie();jar.load(self.headers.get('Cookie',''))
    access=jar['moafilm_access'].value
    supabase_call('user',{'password':new_password},access_token=access,method='PUT')
    return self.send(200,{'ok':True,'message':'비밀번호가 변경되었습니다. 다음 로그인부터 새 비밀번호를 사용하세요.'})
   if path in ('/api/password/reset','/api/email/verify'):
    return self.send(400,{'error':'이메일 링크에서 인증 또는 비밀번호 변경을 진행하세요.'})
   user=self.require(admin=path in ('/api/template','/api/scene','/api/music','/api/template/update','/api/marker/detect'))
   if not user:return
   if path=='/api/marker/detect':
    ident=str(data.get('template_id',''))
    if not re.fullmatch(r'[a-f0-9]{12}',ident):raise ValueError('템플릿 ID 오류')
    template_path=ROOT/'templates'/(ident+'.json')
    if not template_path.is_file():raise ValueError('템플릿 없음')
    t=json.loads(template_path.read_text(encoding='utf-8'))
    tmp=ROOT/'jobs'/(uuid.uuid4().hex+'.guide.mp4')
    try:
     save_data_url(data.get('video'),tmp,25_000_000,'video')
     result=detect_video(tmp)
     if abs(result['duration']-float(t['duration']))>.25:raise ValueError('인식용 영상과 배경 영상 길이가 다릅니다 (허용 오차 0.25초)')
     clean_meta=probe(ROOT/'backgrounds'/(ident+'.mp4'));guide_meta=probe(tmp)
     if (clean_meta['width'],clean_meta['height'])!=(guide_meta['width'],guide_meta['height']):raise ValueError('인식용 영상과 배경 영상 해상도가 다릅니다')
     # Detection is a preview only; admin must confirm and save separately.
     return self.send(200,result)
    finally:tmp.unlink(missing_ok=True)
   if path=='/api/checkout/mock':
    ident=str(data.get('template_id',''))
    if not re.fullmatch('[a-f0-9]{12}',ident) or not (ROOT/'templates'/(ident+'.json')).is_file():raise ValueError('템플릿 없음')
    order=uuid.uuid4().hex
    with security.db() as c:c.execute('INSERT INTO orders VALUES(?,?,?,?,?)',(order,user['id'],ident,'mock_paid',int(time.time())))
    return self.send(200,{'order_id':order,'status':'mock_paid','real_charge':False})
   if path=='/api/template':
    ident=uuid.uuid4().hex[:12];bg=ROOT/'backgrounds'/(ident+'.mp4')
    save_data_url(data['video'],bg,25_000_000,'video')
    meta=probe(bg);t={'id':ident,'name':str(data.get('name','Canva 템플릿'))[:100],'duration':round(meta['duration'],3),'slots':[]}
    (ROOT/'templates'/(ident+'.json')).write_text(json.dumps(t,ensure_ascii=False,indent=2));return self.send(200,t)
   if path=='/api/scene':
    ident=data.get('template_id','')
    if not re.fullmatch('[a-f0-9]{12}',ident) or not (ROOT/'templates'/(ident+'.json')).is_file():raise ValueError('템플릿 없음')
    sid=uuid.uuid4().hex[:12]
    target=ROOT/'scenes'/(ident+'-'+sid+'.mp4')
    save_data_url(data['video'],target,25_000_000,'video')
    return self.send(200,{'id':sid,'duration':round(probe(target)['duration'],3)})
   if path=='/api/music':
    ident=data.get('template_id','')
    if not re.fullmatch('[a-f0-9]{12}',ident) or not (ROOT/'templates'/(ident+'.json')).is_file():raise ValueError('템플릿 없음')
    audio=data.get('audio','')
    if not isinstance(audio,str) or not audio.startswith('data:audio/'):raise ValueError('오디오 파일 형식 오류')
    target=ROOT/'music'/(ident+'.mp3')
    raw=base64.b64decode(audio.split(',',1)[1],validate=True)
    if len(raw)>20_000_000:raise ValueError('음원 20MB 제한')
    tmp=ROOT/'jobs'/(uuid.uuid4().hex+'.audio');tmp.write_bytes(raw)
    try:
     subprocess.run(['ffmpeg','-v','error','-y','-i',str(tmp),'-vn','-c:a','libmp3lame','-b:a','192k',str(target)],check=True,timeout=90,capture_output=True)
    finally:tmp.unlink(missing_ok=True)
    return self.send(200,{'ok':True})
   if path=='/api/template/update':
    t=check_template(data['template']);target=ROOT/'templates'/(t['id']+'.json')
    if not target.is_file():raise ValueError('등록되지 않은 템플릿입니다')
    tmp=ROOT/'jobs'/(uuid.uuid4().hex+'.template.tmp')
    try:
     tmp.write_text(json.dumps(t,ensure_ascii=False,indent=2),encoding='utf-8');tmp.replace(target)
    finally:tmp.unlink(missing_ok=True)
    return self.send(200,{'ok':True})
   if path=='/api/render':
    ident=data.get('template_id','')
    if not re.fullmatch('[a-f0-9]{12}',ident):raise ValueError('템플릿 ID 오류')
    t=check_template(json.loads((ROOT/'templates'/(ident+'.json')).read_text()))
    photos=data.get('photos',{});values=data.get('values',{})
    if not isinstance(photos,dict) or not isinstance(values,dict):raise ValueError('입력 형식 오류')
    required={s['key'] for s in t['slots'] if s['type']=='photo' and s.get('required',True)}
    required_text={s['key'] for s in t['slots'] if s['type']=='text' and s.get('required',True)}
    missing_text={k for k in required_text if not isinstance(values.get(k),str) or not values[k].strip()}
    if missing_text:raise ValueError('필수 문구 누락: '+', '.join(sorted(missing_text)))
    if required-set(photos):raise ValueError('사진 누락: '+', '.join(sorted(required-set(photos))))
    order_id=data.get('order_id')
    if user['role']!='admin':
     with security.db() as c:paid=c.execute('SELECT 1 FROM orders WHERE id=? AND user_id=? AND template_id=? AND status=?',(order_id,user['id'],ident,'mock_paid')).fetchone()
     if not paid:raise ValueError('테스트 결제 완료 후 렌더링할 수 있습니다')
    if not RENDER_SLOTS.acquire(blocking=False):return self.send(429,{'error':'영상 제작 요청이 많습니다. 잠시 후 다시 시도하세요.'})
    jobid=uuid.uuid4().hex
    try:
     JOBS[jobid]={'status':'queued','progress':0}
     persist_job(jobid)
     with security.db() as c:c.execute('INSERT INTO render_jobs VALUES(?,?,?)',(jobid,user['id'],order_id))
     def render_and_release():
      try:
       try:run_render(jobid,t,photos,values)
       except Exception as e:
        JOBS[jobid].update(status='error',error=str(e))
        persist_job(jobid)
      finally:RENDER_SLOTS.release()
     threading.Thread(target=render_and_release,daemon=True).start()
    except Exception:
     RENDER_SLOTS.release()
     JOBS.pop(jobid,None)
     (ROOT/'jobs'/(jobid+'.json')).unlink(missing_ok=True)
     raise
    return self.send(200,{'job_id':jobid})
   return self.send(404,{'error':'API 없음'})
  except Exception as e:return self.send(400,{'error':str(e)})
 def log_message(self,*a):pass
if __name__=='__main__':
 print(f'MoaFilm Canva Studio: http://{HOST}:{PORT}',flush=True)
 print('Interrupted jobs reconciled:',reconcile_interrupted_jobs(),flush=True)
 ThreadingHTTPServer((HOST,PORT),Handler).serve_forever()
