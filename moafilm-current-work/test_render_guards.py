import unittest
from unittest.mock import patch
import studio

class RenderGuards(unittest.TestCase):
 def test_render_slots_are_bounded(self):
  self.assertTrue(studio.RENDER_SLOTS.acquire(blocking=False))
  self.assertTrue(studio.RENDER_SLOTS.acquire(blocking=False))
  try:self.assertFalse(studio.RENDER_SLOTS.acquire(blocking=False))
  finally:
   studio.RENDER_SLOTS.release();studio.RENDER_SLOTS.release()
 def test_render_slots_recover_after_release(self):
  self.assertTrue(studio.RENDER_SLOTS.acquire(blocking=False))
  studio.RENDER_SLOTS.release()
  self.assertTrue(studio.RENDER_SLOTS.acquire(blocking=False))
  studio.RENDER_SLOTS.release()
