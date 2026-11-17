import unittest,tempfile
from pathlib import Path
import cv2,numpy as np
from marker_detector import detect_video
class FastMarkerTests(unittest.TestCase):
 def make(self,folder,resize=False):
  path=Path(folder)/'fast.mp4';out=cv2.VideoWriter(str(path),cv2.VideoWriter_fourcc(*'mp4v'),10,(640,360))
  for i in range(30):
   f=np.zeros((360,640,3),np.uint8);x=15+i*16;w=90+int(i*1.5) if resize else 90
   cv2.rectangle(f,(x,80),(x+w,180),(0,255,0),-1);out.write(f)
  out.release();return path
 def test_fast_motion_stays_single_track(self):
  with tempfile.TemporaryDirectory() as d:
   result=detect_video(self.make(d));self.assertEqual(len(result['slots']),1,result);self.assertTrue(result['slots'][0]['moving'])
 def test_resize_warns_about_renderer_limit(self):
  with tempfile.TemporaryDirectory() as d:
   result=detect_video(self.make(d,True));self.assertEqual(len(result['slots']),1,result);self.assertTrue(result['slots'][0]['resizing']);self.assertTrue(any('크기' in w for w in result['warnings']))
if __name__=='__main__':unittest.main()
