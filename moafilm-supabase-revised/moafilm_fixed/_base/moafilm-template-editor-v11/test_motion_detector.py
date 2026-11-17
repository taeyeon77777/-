import unittest,tempfile
from pathlib import Path
import cv2,numpy as np
from marker_detector import detect_video

class MotionDetectorTests(unittest.TestCase):
 def test_moving_marker_generates_keyframes(self):
  with tempfile.TemporaryDirectory() as tmp:
   path=Path(tmp)/'motion.mp4'
   out=cv2.VideoWriter(str(path),cv2.VideoWriter_fourcc(*'mp4v'),10,(320,180))
   for i in range(40):
    frame=np.zeros((180,320,3),dtype=np.uint8)
    x=40+i*2
    cv2.rectangle(frame,(x,40),(x+100,140),(0,255,0),-1)
    out.write(frame)
   out.release()
   r=detect_video(path)
   self.assertEqual(len(r['slots']),1,r)
   slot=r['slots'][0]
   self.assertTrue(slot['moving'])
   self.assertGreaterEqual(len(slot['keyframes']),2)
   self.assertLessEqual(len(slot['keyframes']),30)
   self.assertGreater(slot['keyframes'][-1]['x'],slot['keyframes'][0]['x'])
if __name__=='__main__':unittest.main()
