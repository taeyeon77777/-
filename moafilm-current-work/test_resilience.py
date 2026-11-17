import unittest, tempfile, json, time, pathlib
import studio
class ResilienceTests(unittest.TestCase):
 def test_rate_limit(self):
  key=('test',time.monotonic())
  self.assertTrue(studio.check_rate(key,2,300))
  self.assertTrue(studio.check_rate(key,2,300))
  self.assertFalse(studio.check_rate(key,2,300))
 def test_restart_reconciliation(self):
  with tempfile.TemporaryDirectory() as d:
   old=studio.ROOT;studio.ROOT=pathlib.Path(d);(studio.ROOT/'jobs').mkdir()
   try:
    ident='a'*32;f=studio.ROOT/'jobs'/(ident+'.json');f.write_text(json.dumps({'status':'running','progress':80}))
    self.assertEqual(studio.reconcile_interrupted_jobs(),1)
    self.assertEqual(json.loads(f.read_text())['status'],'error')
    self.assertEqual(studio.reconcile_interrupted_jobs(),0)
   finally:studio.ROOT=old
if __name__=='__main__':unittest.main()
