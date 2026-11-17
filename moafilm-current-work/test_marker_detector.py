import unittest,tempfile,cv2,numpy as np
from pathlib import Path
from marker_detector import detect_video
class DetectorTests(unittest.TestCase):
 def make(self, mode):
  tmp=tempfile.TemporaryDirectory();path=Path(tmp.name)/'guide.mp4';writer=cv2.VideoWriter(str(path),cv2.VideoWriter_fourcc(*'mp4v'),10,(320,180))
  for i in range(40):
   frame=np.zeros((180,320,3),dtype=np.uint8)
   if mode=='one' and 10<=i<30:cv2.rectangle(frame,(64,36),(224,144),(0,255,0),-1)
   if mode=='tiny':cv2.rectangle(frame,(5,5),(9,9),(0,255,0),-1)
   if mode=='two' and i<20:cv2.rectangle(frame,(20,20),(140,140),(0,255,0),-1)
   if mode=='two' and i>=20:cv2.rectangle(frame,(170,20),(290,140),(0,255,0),-1)
   writer.write(frame)
  writer.release();return tmp,path
 def test_one_region(self):
  temp,path=self.make('one')
  with temp:
   r=detect_video(path);self.assertEqual(len(r['slots']),1);s=r['slots'][0];self.assertAlmostEqual(s['start'],1,delta=.15);self.assertAlmostEqual(s['end'],3,delta=.15);self.assertAlmostEqual(s['x'],.2,delta=.02)
 def test_noise_rejected(self):
  temp,path=self.make('tiny')
  with temp:self.assertEqual(len(detect_video(path)['slots']),0)
 def test_two_regions(self):
  temp,path=self.make('two')
  with temp:self.assertEqual(len(detect_video(path)['slots']),2)
if __name__=='__main__':unittest.main()
