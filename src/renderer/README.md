# Renderer Module

This directory will contain the PixiJS isometric cube renderer in future milestones.

Responsibilities:
- PixiJS Application lifecycle
- Isometric cube drawing
- Grid-to-screen coordinate conversion
- Puzzle fade-in/fade-out animations

The renderer must never:
- Calculate scores
- Generate puzzles
- Validate answers
- Store gameplay state

All HUD elements, timers, and player panels are React components (in components/),
not part of this rendering module.
