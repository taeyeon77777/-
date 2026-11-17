import unittest, tempfile, subprocess, json
from pathlib import Path
import numpy as np, cv2
from marker_detector import detect_video

class CanvaWorkflow(unittest.TestCase):
 def test_three_color_slots_and_no_guide_in_clean_video(self):
  with tempfile.TemporaryDirectory() as d:
   d=Path(d);w,h=320,180
   for guide in (True,False):
    path=d/('guide.mp4' if guide else 'clean.mp4')
    writer=cv2.VideoWriter(str(path),cv2.VideoWriter_fourcc(*'mp4v'),10,(w,h))
    self.assertTrue(writer.isOpened())
    for i in range(30):
     a=np.full((h,w,3),[210,220,230],dtype=np.uint8)
     if guide:
      cv2.rectangle(a,(20,30),(100,140),(0,255,0),-1)
      cv2.rectangle(a,(120,30),(200,80),(255,0,255),-1)
      cv2.rectangle(a,(120,95),(220,145),(255,207,0),-1) # cyan BGR = (255,207,0) approximate #00CFFF
     writer.write(a)
    writer.release()
   r=detect_video(d/'guide.mp4');k=[s['key'] for s in r['slots']]
   self.assertEqual(len(k),3,r)
   self.assertEqual(sorted(s['type'] for s in r['slots']),['photo','text','text'])
   self.assertEqual(detect_video(d/'clean.mp4')['slots'],[])

if __name__=='__main__':unittest.main()
