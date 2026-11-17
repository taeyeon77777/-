import unittest, tempfile, os, json, math
from pathlib import Path
import studio
class AuditFixes(unittest.TestCase):
 def test_nan_rejected(self):
  old=studio.ROOT
  with tempfile.TemporaryDirectory() as d:
   studio.ROOT=Path(d);(studio.ROOT/'backgrounds').mkdir();(studio.ROOT/'backgrounds'/'abcdef123456.mp4').write_bytes(b'x')
   base={'id':'abcdef123456','name':'test','duration':5,'slots':[{'type':'photo','key':'photo1','x':float('nan'),'y':0,'w':.2,'h':.2,'start':0,'end':2}]}
   with self.assertRaises(ValueError):studio.check_template(base)
  studio.ROOT=old
 def test_infinite_keyframe_rejected(self):
  old=studio.ROOT
  with tempfile.TemporaryDirectory() as d:
   studio.ROOT=Path(d);(studio.ROOT/'backgrounds').mkdir();(studio.ROOT/'backgrounds'/'abcdef123456.mp4').write_bytes(b'x')
   base={'id':'abcdef123456','name':'test','duration':5,'slots':[{'type':'photo','key':'photo1','x':0,'y':0,'w':.2,'h':.2,'start':0,'end':2,'keyframes':[{'time':1,'x':float('inf'),'y':0}]}]}
   with self.assertRaises(ValueError):studio.check_template(base)
  studio.ROOT=old
if __name__=='__main__':unittest.main()
