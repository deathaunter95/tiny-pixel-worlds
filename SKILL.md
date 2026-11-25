---
name: tiny-pixel-worlds
description: Make a looping isometric pixel-art "tiny world" video (a beach, a station, a bakery) entirely in code with Claude. Everything is drawn by a small JavaScript pixel engine in a browser canvas, with no 3D app and no image model. The story is a timeline, the last frame equals the first so it loops forever, and it renders to a 1080x1920 reel. Use when someone asks for a pixel/isometric diorama, a tiny world, a looping pixel scene, or a reel like Framekind Labs' sandcastle beach.
---

# Tiny pixel worlds

The method behind @framekind.lab's sandcastle beach: a 20 s seamless loop of 594 lines of scene code on a ~350-line engine.

## What you get
- `engine/pxengine.js`: the pixel renderer, derived from [pixel-plays](https://github.com/amirmushichge/pixel-plays) by Amir Mushich (MIT, see `engine/LICENSE-pixel-plays.txt`). It provides:
  - orthographic iso camera (`project`), depth buffer;
  - hue-shifted colour ramps with Bayer dithering;
  - cast shadows, edge shading, wind for grass and leaves;
  - primitives: `sphere`, `capsule`, `box`, `growTree`, `figure`, `growGrass`.
- `examples/beach/index.html`: the full beach scene (palms, sea and swash, kids, sandcastle that gets washed away and rebuilt, crabs, kayak, gulls). Read it as the worked example.
- `tools/render.cjs`: stills, the loop check, and the video render (Playwright + ffmpeg).

## The method (do it in this order)
1. **One-line story with a turn.** For example: "two kids finish a sandcastle, a wave washes it away, they build it again." The turn is what makes people rewatch.
2. **Set the scene.** Copy the example and set `window.PP_SCENE = { W: 216, H: 384, S: 16, rot: 0|1 }` before loading the engine (portrait 9:16; `S` = world-to-pixel scale). Size the world so the smallest actor still reads at phone size (the beach uses a small slab, HALF 5.2 at S 16, so the kids and castle read).
3. **Make time a pure function.** Write `renderAt(t)` so every frame depends only on `t`, with no `Date.now()` and no state carried between frames. That makes renders deterministic and the loop checkable.
4. **Write the story as a timeline in seconds.** In the beach:
   - the wave runs up at 5.0 s and washes the castle 5.6-6.6 s;
   - the kids flee at 4.1 s and come back 7.6-8.8 s;
   - bucket towers go up at 10.4 / 11.2 / 12.8 / 13.8 s; the flag goes back at 17.3 s.

   Use eased ramps (`smooth(a, b, t)` in the example) so motion never snaps.
5. **Close the loop.** The state at `t = LOOP` must equal the state at `t = 0`. Run `node tools/render.cjs scene.html loop` until it prints 0 px. The wrap step should be about the size of a normal frame step, not a jump.
6. **Look at stills before rendering video.** `node tools/render.cjs scene.html stills 0,3,5.6,9,14 qa.png`. Check that every story beat reads at phone size. Small actors are the usual failure: our first crabs were invisible, so we scaled them 1.35-1.65x and made them redder.
7. **Render.** `node tools/render.cjs scene.html video out.mp4 600` gives 20 s at 30 fps, upscaled with nearest-neighbour so pixels stay sharp.
8. **Sound last.** Lay real recordings (CC0, e.g. freesound.org) on the same timeline: waves, gulls, kids, hand pats, sand. Keep the mix at about -14 LUFS.

## Changing a world after feedback
- **"Wrong angle":** `rot: 1` turns the whole world a quarter turn inside `project()`. Counter-rotate the light and shadow offsets so on-screen lighting stays the same, then re-lay out props with a screen-relative helper.
- **"Add X":** add it as its own `drawX(t)` with its own timeline. Check it never contradicts the rest (our crabs stay in their holes whenever the water is close).

## Rules
- Code only: no image model and no traced copyrighted art. Label posts as AI-made where the platform asks; Claude wrote the code.
- Keep the MIT notice of pixel-plays with the engine in anything you share.
