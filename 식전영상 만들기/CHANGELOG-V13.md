# MoaFilm v13 — export reliability

1. Wall-clock frame scheduling to reduce duration drift.
2. Audio fade-out at completion.
3. AbortSignal cancellation and UI cancel control.
4. Recorder creation error handling and stream cleanup.
5. Validate nonempty output and abort state before saving; correct misleading UI copy.

Note: admin layer/animation parity with customer MP4 remains unimplemented. Browser and full build tests require dependencies.
