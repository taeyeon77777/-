import os,sqlite3,hashlib,hmac,secrets,time
from contextlib import contextmanager
from pathlib import Path
DATA=Path(os.environ.get('MOAFILM_DATA_DIR',str(Path(__file__).resolve().parent)));DATA.mkdir(parents=True,exist_ok=True)
DB=DATA/'accounts.sqlite3'
@contextmanager
def db():
 c=sqlite3.connect(DB,timeout=15)
 try:
  c.row_factory=sqlite3.Row
  c.execute('PRAGMA journal_mode=WAL')
  with c:
   yield c
 finally:
  c.close()
def init():
 with db() as c:
  c.executescript('''CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,salt TEXT NOT NULL,hash TEXT NOT NULL,role TEXT NOT NULL);CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL,expires INTEGER NOT NULL);CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,template_id TEXT NOT NULL,status TEXT NOT NULL,created INTEGER NOT NULL);CREATE TABLE IF NOT EXISTS render_jobs(job_id TEXT PRIMARY KEY,user_id TEXT NOT NULL,order_id TEXT);CREATE TABLE IF NOT EXISTS password_resets(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL,expires INTEGER NOT NULL);CREATE TABLE IF NOT EXISTS email_verifications(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL,expires INTEGER NOT NULL);''')
def digest(password,salt):return hashlib.pbkdf2_hmac('sha256',password.encode(),bytes.fromhex(salt),350000).hex()
def register(email,password):
 email=email.strip().lower()
 if not 5<=len(email)<=254 or '@' not in email or len(password)<12 or len(password)>256:raise ValueError('이메일 또는 비밀번호 오류 (비밀번호 12자 이상)')
 with db() as c:
  if c.execute('SELECT 1 FROM users WHERE email=?',(email,)).fetchone():raise ValueError('이미 가입된 이메일')
  count=c.execute('SELECT count(*) FROM users').fetchone()[0]
  role='admin' if count==0 and os.environ.get('MOAFILM_BOOTSTRAP_ADMIN')=='1' else 'customer'
  uid=secrets.token_hex(16);salt=secrets.token_hex(16)
  c.execute('INSERT INTO users(id,email,salt,hash,role) VALUES(?,?,?,?,?)',(uid,email,salt,digest(password,salt),role))
 return {'id':uid,'email':email,'role':role}
def login(email,password):
 with db() as c:
  u=c.execute('SELECT * FROM users WHERE email=?',(email.strip().lower(),)).fetchone()
  if not u or not hmac.compare_digest(digest(password,u['salt']),u['hash']):raise ValueError('이메일 또는 비밀번호가 올바르지 않습니다')
  token=secrets.token_urlsafe(32);c.execute('INSERT INTO sessions VALUES(?,?,?)',(hashlib.sha256(token.encode()).hexdigest(),u['id'],int(time.time())+86400))
 return token,{'id':u['id'],'email':u['email'],'role':u['role']}
def current(cookie):
 from http.cookies import SimpleCookie
 try:
  jar=SimpleCookie();jar.load(cookie);token=jar['moafilm_session'].value
  with db() as c:
   u=c.execute('SELECT u.id,u.email,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires>?',(hashlib.sha256(token.encode()).hexdigest(),int(time.time()))).fetchone()
  return dict(u) if u else None
 except (KeyError,ValueError):return None
def logout(cookie):
 from http.cookies import SimpleCookie
 try:
  jar=SimpleCookie();jar.load(cookie);token=jar['moafilm_session'].value
  with db() as c:c.execute('DELETE FROM sessions WHERE token_hash=?',(hashlib.sha256(token.encode()).hexdigest(),))
 except (KeyError,ValueError):pass
init()

def create_token(email,table):
 if table not in ('password_resets','email_verifications'):raise ValueError('token type')
 with db() as c:
  u=c.execute('SELECT id FROM users WHERE email=?',(email.strip().lower(),)).fetchone()
  if not u:return None
  token=secrets.token_urlsafe(32)
  c.execute(f'INSERT INTO {table} VALUES(?,?,?)',(hashlib.sha256(token.encode()).hexdigest(),u['id'],int(time.time())+1800))
  return token

def reset_password(token,password):
 if not 12<=len(password)<=256:raise ValueError('비밀번호는 12자 이상이어야 합니다')
 with db() as c:
  h=hashlib.sha256(token.encode()).hexdigest()
  r=c.execute('SELECT user_id FROM password_resets WHERE token_hash=? AND expires>?',(h,int(time.time()))).fetchone()
  if not r:raise ValueError('만료되었거나 잘못된 링크입니다')
  salt=secrets.token_hex(16)
  c.execute('UPDATE users SET salt=?,hash=? WHERE id=?',(salt,digest(password,salt),r['user_id']))
  c.execute('DELETE FROM password_resets WHERE user_id=?',(r['user_id'],))
  c.execute('DELETE FROM sessions WHERE user_id=?',(r['user_id'],))

def verify_email(token):
 with db() as c:
  h=hashlib.sha256(token.encode()).hexdigest()
  r=c.execute('SELECT user_id FROM email_verifications WHERE token_hash=? AND expires>?',(h,int(time.time()))).fetchone()
  if not r:raise ValueError('만료되었거나 잘못된 링크입니다')
  c.execute('UPDATE users SET verified=1 WHERE id=?',(r['user_id'],))
  c.execute('DELETE FROM email_verifications WHERE user_id=?',(r['user_id'],))

def migrate():
 with db() as c:
  cols=[r['name'] for r in c.execute('PRAGMA table_info(users)')]
  if 'verified' not in cols:c.execute('ALTER TABLE users ADD COLUMN verified INTEGER NOT NULL DEFAULT 0')
migrate()
