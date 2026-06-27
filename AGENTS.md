# AGENTS.md

# Cube Count AI Development Guide

This repository is developed using an AI coding agent.

This document defines how the AI should work while contributing to this project.

It has equal importance to the project documentation.

Always read this file before making changes.

---

# Primary Objective

Your objective is NOT to write code as quickly as possible.

Your objective is to build software that another senior engineer would enjoy maintaining.

Every implementation should prioritize:

- Clean Architecture
- Readability
- Maintainability
- Modularity
- Extensibility
- Simplicity

Never sacrifice architecture for speed.

---

# Documentation Hierarchy

Always follow documentation in this order.

1. AGENTS.md

2. docs/PROJECT_SPEC.md

3. docs/GAME_RULES.md

4. docs/DESIGN_SYSTEM.md

5. docs/TECHNICAL_ARCHITECTURE.md

6. docs/PUZZLE_ENGINE.md

If documentation conflicts, ask for clarification before implementing.

Never guess.

---

# Required Development Workflow

Before writing any code:

1. Read the documentation.

2. Understand the architecture.

3. Explain the implementation plan.

4. Identify risks.

5. Wait for approval if the change is significant.

Never immediately generate large amounts of code.

---

# Milestone-Based Development

Develop only ONE milestone at a time.

Every milestone must be fully functional before starting the next.

At the end of each milestone provide:

## Summary

What was completed.

## Architecture Decisions

Explain why the implementation was chosen.

## Files Modified

List every modified file.

## Technical Debt

Mention improvements that could be made later.

## Remaining Tasks

List the next milestone.

Then wait for approval.

---

# Architecture Rules

Business logic must never exist inside UI components.

Rendering code must never contain game logic.

Puzzle generation must be independent from rendering.

Game state should have a single source of truth.

Avoid circular dependencies.

Prefer composition over inheritance.

Keep modules loosely coupled.

---

# React Rules

Keep components small.

Separate presentation from logic.

Avoid deeply nested component trees.

Avoid prop drilling where practical.

Prefer reusable components.

Use TypeScript strictly.

Avoid using "any".

---

# Rendering Rules

The renderer is responsible only for drawing.

It should never:

- Calculate scores
- Generate puzzles
- Validate answers
- Store gameplay state

It should simply render data provided by the game engine.

---

# Puzzle Rules

The puzzle generator owns puzzle creation.

The renderer only visualizes puzzles.

The answer validator calculates correctness from puzzle data.

Never calculate answers from rendered graphics.

---

# Code Quality Rules

Write code that is:

- Readable
- Predictable
- Modular
- Reusable
- Well documented

Avoid:

Large files.

Large functions.

Duplicated code.

Hidden side effects.

Magic numbers.

Prefer descriptive names.

---

# File Modification Rules

Only modify files that are directly related to the requested task.

Never rewrite unrelated files.

Never rename folders without approval.

Never introduce new dependencies without explaining why.

---

# Error Handling

Never silently ignore errors.

Handle expected failures gracefully.

Provide meaningful error messages.

Avoid empty catch blocks.

---

# Performance

Optimize for clarity first.

Optimize for performance only after correctness.

Avoid unnecessary rendering.

Avoid unnecessary object creation.

Avoid unnecessary recalculation.

---

# UI Principles

The UI should remain:

Minimal

Clean

Calm

Modern

Professional

Educational

The puzzle should always be the visual focus.

Avoid unnecessary visual effects.

Do not redesign the application's visual identity unless requested.

Use the provided UI reference as inspiration.

Do not copy copyrighted artwork.

---

# Design Consistency

Maintain consistent:

Spacing

Typography

Button styles

Card styles

Animations

Border radius

Color palette

Visual hierarchy

Never mix multiple design styles.

---

# AI Behavior

If unsure:

Ask.

If multiple good solutions exist:

Present the options.

Recommend one.

Explain why.

Do not guess.

---

# Documentation Updates

Whenever architecture changes:

Update the relevant documentation.

Whenever a milestone finishes:

Update CHANGELOG.md.

Whenever an important architectural decision is made:

Update DECISIONS.md.

Documentation is part of the project.

Never let it become outdated.

---

# Git Philosophy

Assume every milestone represents one commit.

Keep changes focused.

Avoid large unrelated modifications.

---

# Things You Must Never Do

Do not overengineer.

Do not create unnecessary abstractions.

Do not optimize prematurely.

Do not duplicate logic.

Do not ignore documentation.

Do not mix responsibilities.

Do not silently change project architecture.

Do not rewrite working code unless requested.

Do not prioritize speed over quality.

---

# Definition of Success

The project is successful when:

- The architecture is clean.
- The code is maintainable.
- The UI is polished.
- The gameplay feels smooth.
- The project is easy to extend.
- Another engineer can understand the repository quickly.

Every implementation should move the project closer to this goal.
