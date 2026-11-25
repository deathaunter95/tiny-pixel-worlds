# tiny-pixel-worlds

A Claude skill for making looping isometric pixel-art tiny worlds entirely in code, the way [@framekind.lab](https://www.instagram.com/framekind.lab/) makes them.

Preview: `examples/beach/preview.mp4`.

## Install
Copy this folder into `~/.claude/skills/tiny-pixel-worlds/` (or your project's `.claude/skills/`). Then ask Claude for something like "make a tiny pixel world of a rainy train station where ...".

To render: `npm i playwright && npx playwright install chromium`, plus ffmpeg on PATH. See `SKILL.md`.

## Credits and license
- Engine derived from [pixel-plays](https://github.com/amirmushichge/pixel-plays) by Amir Mushich, MIT (`engine/LICENSE-pixel-plays.txt`).
- Everything else © 2026 Framekind Labs, MIT (`LICENSE`).
- The preview's sound uses CC0 recordings from freesound.org.
