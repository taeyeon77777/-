"""Detect Canva #00FF00 placeholder rectangles from a separate guide MP4."""
import cv2, numpy as np

def _detect_color(path, color="photo", max_samples=360):
 cap=cv2.VideoCapture(str(path))
 if not cap.isOpened():raise ValueError('인식용 영상을 열 수 없습니다')
 fps=cap.get(cv2.CAP_PROP_FPS); count=cap.get(cv2.CAP_PROP_FRAME_COUNT)
 if fps<=0 or count<=0:raise ValueError('영상 시간 정보를 읽을 수 없습니다')
 duration=count/fps
 step=max(1,int(np.ceil(count/max_samples)))
 observations=[]
 try:
  for index in range(0,int(count),step):
   cap.set(cv2.CAP_PROP_POS_FRAMES,index)
   ok,frame=cap.read()
   if not ok:continue
   h,w=frame.shape[:2]
   # Saturated green marker, reject near-green decorations and small artifacts.
   hsv=cv2.cvtColor(frame,cv2.COLOR_BGR2HSV)
   ranges={"photo":([42,140,140],[78,255,255]),"name":([140,140,140],[175,255,255]),"date":([85,140,140],[105,255,255])}
   low,high=ranges[color]
   mask=cv2.inRange(hsv,np.array(low,np.uint8),np.array(high,np.uint8))
   kernel=np.ones((3,3),np.uint8)
   mask=cv2.morphologyEx(mask,cv2.MORPH_OPEN,kernel)
   n,labels,stats,_=cv2.connectedComponentsWithStats(mask)
   candidates=[]
   for x,y,bw,bh,area in stats[1:]:
    box_area=int(bw)*int(bh)
    if box_area < w*h*.012 or bw<20 or bh<20:continue
    fill=area/box_area
    if fill<.78:continue
    candidates.append({'x':round(int(x)/w,5),'y':round(int(y)/h,5),'w':round(int(bw)/w,5),'h':round(int(bh)/h,5),'fill':round(fill,3)})
   observations.append((index/fps,candidates))
 finally:cap.release()
 if not observations:return {'duration':duration,'slots':[],'warnings':['분석할 프레임이 없습니다']}
 # Temporal association: IoU > 0.35; short gaps tolerated, long gaps split.
 tracks=[];active=[];dt=step/fps
 def iou(a,b):
  x=max(a['x'],b['x']);y=max(a['y'],b['y']);r=min(a['x']+a['w'],b['x']+b['w']);bot=min(a['y']+a['h'],b['y']+b['h'])
  intersection=max(0,r-x)*max(0,bot-y)
  return intersection/max(1e-9,a['w']*a['h']+b['w']*b['h']-intersection)
 for t,candidates in observations:
  used=set();next_active=[]
  for track in active:
   best=-1;score=-1.0
   for j,c in enumerate(candidates):
    if j in used:continue
    val=iou(track['last'],c)
    # Allow fast marker movement without overlap, but limit the jump and size change.
    old=track['last']
    cx=old['x']+old['w']/2;cy=old['y']+old['h']/2
    nx=c['x']+c['w']/2;ny=c['y']+c['h']/2
    distance=((cx-nx)**2+(cy-ny)**2)**.5
    size_ratio=max(c['w']/old['w'],old['w']/c['w'],c['h']/old['h'],old['h']/c['h'])
    if val<.2 and (distance>.25 or size_ratio>1.6):continue
    score_candidate=val*2-distance-.08*(size_ratio-1)
    if score_candidate>score:best=j;score=score_candidate
   if best>=0:
    used.add(best);track['samples'].append((t,candidates[best]));track['last']=candidates[best];next_active.append(track)
   elif t-track['samples'][-1][0]<=dt*1.6:next_active.append(track)
   else:tracks.append(track)
  for j,c in enumerate(candidates):
   if j not in used:next_active.append({'samples':[(t,c)],'last':c})
  active=next_active
 tracks.extend(active)
 slots=[];warnings=[]
 for track in tracks:
  samples=track['samples']
  if len(samples)<max(2,int(.3/max(dt,.001))):continue
  start=max(0,samples[0][0]);end=min(duration,samples[-1][0]+dt)
  if end-start<.3:continue
  coords=np.array([[c[k] for k in ('x','y','w','h')] for _,c in samples])
  median=np.median(coords,axis=0);spread=np.max(np.abs(coords-median),axis=0)
  moving=bool(max(spread)>.018)
  resizing=bool(max(spread[2:])>.018)
  if resizing:warnings.append(f'{start:.1f}~{end:.1f}초: 사진 영역 크기가 변합니다. 현재 렌더러는 크기 키프레임을 지원하지 않아 수동 확인이 필요합니다')
  # Convert tracked moving markers to a bounded series of position keyframes.
  # The renderer supports at most 30 keyframes; retain endpoints and sample evenly.
  motion_points=[]
  if moving:
   indices=np.unique(np.linspace(0,len(samples)-1,min(25,len(samples)),dtype=int))
   for idx in indices:
    stamp,box=samples[int(idx)]
    motion_points.append({'time':round(float(stamp),3),'x':round(float(box['x']),5),'y':round(float(box['y']),5)})
   # Deduplicate rounded timestamps (very short/high-fps videos).
   motion_points=list({p['time']:p for p in motion_points}.values())
   if len(motion_points)<2:motion_points=[]
   warnings.append(f'{start:.1f}~{end:.1f}초: 움직이는 영역에 키프레임을 자동 생성했습니다. 미리보기 확인 필요')
  x,y,w,h=[float(v) for v in (coords[0] if motion_points else median)]
  x=max(0,min(x,.99));y=max(0,min(y,.99));w=max(.01,min(w,1-x));h=max(.01,min(h,1-y))
  confidence=round(min(1,len(samples)*dt/max(.001,end-start))*float(np.median([c['fill'] for _,c in samples])),2)
  slot={'type':'photo' if color=='photo' else 'text','x':round(x,4),'y':round(y,4),'w':round(w,4),'h':round(h,4),'start':round(start,3),'end':round(end,3),'confidence':confidence,'moving':moving,'resizing':resizing}
  if motion_points:
   # Use first tracked position as the starting point, avoiding jumps at slot start.
   slot['keyframes']=[p for p in motion_points if p['time']>start+1e-5 and p['time']<=end]
  slots.append(slot)
 slots.sort(key=lambda s:(s['start'],s['y'],s['x']))
 for i,s in enumerate(slots,1):s['key']=('photo' if color=='photo' else color)+str(i)
 if not slots and color=='photo':warnings.append('초록색(#00FF00) 사진 영역을 찾지 못했습니다')
 return {'duration':round(duration,3),'slots':slots,'warnings':warnings,'sample_interval':round(dt,3)}


def detect_video(path, max_samples=360):
    """Find color-coded photo, name and date slots in a Canva guide MP4."""
    results=[_detect_color(path,kind,max_samples) for kind in ('photo','name','date')]
    return {'duration':results[0]['duration'], 'slots':sorted([s for r in results for s in r['slots']],key=lambda s:(s['start'],s['y'],s['x'])), 'warnings':[w for r in results for w in r['warnings']], 'sample_interval':results[0]['sample_interval']}
