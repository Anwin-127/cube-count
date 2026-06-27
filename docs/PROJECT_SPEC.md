# Cube Count

> **Version:** 1.0 (Draft)
>
> **Project Status:** Planning
>
> **Project Type:** Browser-Based Brain Training Game
>
> **Primary Platform:** Desktop Web Browser
>
> **Repository:** cube-count

---

# 1. Project Overview

## Vision

Cube Count is a modern browser-based brain-training game focused on improving spatial reasoning, observation speed, and mental visualization.

Players are briefly shown a 3D isometric structure composed of stacked cubes arranged on a fixed 5×5 grid. After the structure disappears, players must determine the total number of cubes they observed.

Unlike traditional quiz games, Cube Count rewards both **accuracy** and **speed**. Every correct answer records the player's actual response time, while incorrect answers receive the maximum allowed time penalty. After all rounds are completed, the player with the lowest accumulated time wins.

The gameplay should feel clean, calm, and mentally engaging rather than fast-paced or chaotic.

---

# 2. Design Philosophy

Cube Count is designed around five core principles.

## 2.1 Simplicity

The interface should never overwhelm the player.

Everything unnecessary should be removed.

The puzzle itself must always remain the visual focus.

---

## 2.2 Fairness

Every player must receive the exact same puzzle.

Difficulty should never depend on luck.

Generated puzzles should be visually balanced and consistently solvable.

---

## 2.3 Skill-Based Gameplay

Winning should depend on:

- Observation
- Spatial reasoning
- Memory
- Accuracy
- Decision speed

The game should never reward random guessing.

---

## 2.4 Maintainability

The software should be modular.

Business logic must remain independent from rendering.

Every major system should be replaceable without affecting unrelated components.

---

## 2.5 Extensibility

Although the first version focuses only on local gameplay, the architecture should support future additions without requiring major rewrites.

Examples include:

- Online multiplayer
- Daily challenges
- Leaderboards
- Statistics
- Additional puzzle types

These features are **future considerations only** and should not be implemented in the MVP.

---

# 3. Project Goals

The primary goals are:

- Build a polished browser game.
- Demonstrate clean software architecture.
- Create reusable game systems.
- Generate puzzles procedurally.
- Maintain consistent visual quality.
- Deliver smooth gameplay.
- Keep the codebase easy to extend.

---

# 4. Non-Goals

The following are intentionally excluded from Version 1.

❌ Backend server

❌ User authentication

❌ Online multiplayer

❌ Database

❌ Accounts

❌ Leaderboards

❌ Cloud saves

❌ Microtransactions

❌ Advertisements

❌ Mobile application

❌ Touch-first interface

These features may be considered after the MVP but should not influence current implementation.

---

# 5. Target Audience

Cube Count is intended for players who enjoy:

- Brain training games
- Puzzle games
- Mental challenges
- Competitive local multiplayer
- Casual educational games

The experience should appeal to teenagers and adults alike.

---

# 6. Core Gameplay

Each round follows a simple sequence.

1. Generate a puzzle.

2. Display the puzzle.

3. Hide the puzzle.

4. Allow players to submit answers.

5. Validate answers.

6. Record completion times.

7. Reveal the correct answer.

8. Advance to the next round.

The winner is determined after all rounds have been completed.

---

# 7. Core Gameplay Rules

Players must determine:

> **The total number of cubes contained within the displayed structure.**

Only one answer is submitted per round.

Changing an answer after submission is not allowed.

Players are encouraged to balance speed and accuracy.

Guessing should always carry risk because an incorrect answer receives the maximum time penalty.

---

# 8. Success Criteria

The MVP will be considered successful if it satisfies the following:

- Clean architecture.
- Stable gameplay.
- Accurate puzzle generation.
- Correct answer validation.
- Smooth rendering.
- Consistent UI.
- Good performance.
- Modular codebase.
- Easy future expansion.

---

# 9. Technical Goals

The software should prioritize:

- Readability
- Maintainability
- Testability
- Reusability
- Separation of concerns
- Strong TypeScript typing
- Modular architecture

The implementation should resemble production-quality software rather than a prototype.

---

# 10. Technology Stack

Frontend

- React
- TypeScript
- Vite

Rendering

- PixiJS (preferred)

Alternative

- HTML5 Canvas

Styling

- Tailwind CSS

State Management

- React Context or Zustand

Package Manager

- npm

Version Control

- Git

Repository

- GitHub

No backend technologies are required for Version 1.

---

# 11. Development Principles

Every implementation decision should follow these principles.

- Readability over cleverness.
- Composition over inheritance.
- Small reusable modules.
- Clear naming.
- Single responsibility.
- Strong typing.
- Minimal coupling.
- High cohesion.

Whenever multiple solutions exist, choose the one that produces cleaner architecture rather than shorter code.

---

# 12. AI Development Guidelines

This project will be developed with assistance from an AI coding agent.

The AI should behave like a senior software engineer.

The AI must never:

- Rewrite working systems unnecessarily.
- Mix UI with game logic.
- Introduce unnecessary complexity.
- Ignore existing documentation.
- Skip planning.

Before implementing any feature, the AI should first understand the project documentation.

If documentation is unclear, it should ask questions or propose options rather than making assumptions.

After each completed milestone, the AI should summarize:

- What was implemented.
- Why it was implemented that way.
- Any architectural decisions.
- Potential future improvements.

The AI should then wait for approval before proceeding.

---

# 13. Game Modes

Cube Count Version 1 supports two game modes.

## 13.1 Practice Mode

Practice Mode is designed for solo players who want to improve their observation and counting skills.

Characteristics:

- Single player
- Unlimited rounds
- No winner
- Personal statistics
- Configurable settings
- Instant feedback

Statistics should include:

- Average response time
- Accuracy percentage
- Fastest correct answer
- Current streak
- Best streak
- Total puzzles completed

---

## 13.2 Local Multiplayer

Local Multiplayer is the primary game mode for Version 1.

Characteristics:

- Two players
- Shared screen
- Turn-based answer submission
- Shared puzzle
- Shared timer
- Independent answer timers

Both players observe the exact same puzzle.

The game determines the winner using accumulated recorded time.

---

# 14. Game Configuration

The game should never rely on hardcoded values.

All configurable gameplay settings should exist inside a GameConfig model.

The GameConfig should include:

- Game Mode
- Number of Rounds
- Display Time Mode
- Initial Display Time
- Maximum Answer Time
- Puzzle Difficulty
- Maximum Stack Height
- Puzzle Seed (optional)

The UI should modify only the GameConfig.

Every game system should read configuration values from this model.

---

# 15. Supported Game Settings

## Number of Rounds

Supported values:

- 5
- 10
- 20

The default should be:

10 rounds

---

## Display Time Mode

Two display time modes should exist.

### Fixed

Puzzle display duration remains constant.

Example:

Every puzzle remains visible for 10 seconds.

---

### Progressive

Puzzle display duration decreases as levels increase.

Example:

Levels 1–5

10 seconds

Levels 6–10

8 seconds

Levels 11–15

6 seconds

Levels 16–20

5 seconds

The reduction schedule should remain configurable.

---

## Puzzle Difficulty

Supported values:

Easy

Medium

Hard

Difficulty should affect puzzle generation rather than puzzle size.

---

## Maximum Stack Height

This determines the tallest possible cube stack.

Recommended values:

Easy

Maximum height = 2

Medium

Maximum height = 3

Hard

Maximum height = 4

This value should remain configurable.

---

# 16. Difficulty Philosophy

Difficulty should never increase by making the board larger.

The board always remains:

5 × 5

Difficulty should instead increase by changing:

- Puzzle complexity
- Cube overlap
- Hidden cubes
- Height variation
- Reduced display time (optional)

This creates more interesting puzzles while keeping the game visually familiar.

---

# 17. Round Lifecycle

Every round follows the same sequence.

Step 1

Generate Puzzle

↓

Step 2

Render Puzzle

↓

Step 3

Display Countdown

↓

Step 4

Puzzle Disappears

↓

Step 5

Players Submit Answers

↓

Step 6

Validate Answers

↓

Step 7

Reveal Correct Answer

↓

Step 8

Record Times

↓

Step 9

Update Statistics

↓

Step 10

Proceed To Next Round

Every round must behave identically.

---

# 18. Scoring System

The game rewards both speed and accuracy.

If a player answers correctly:

Recorded Time = Actual Answer Time

Example:

Actual Time

4.62 seconds

Recorded Time

4.62 seconds

---

If a player answers incorrectly:

Recorded Time = Maximum Allowed Time

Example:

Maximum Allowed Time

10 seconds

Player Answers

2.14 seconds

Incorrect

Recorded Time

10 seconds

This discourages random guessing.

---

# 19. Determining The Winner

After all rounds are completed:

Total Recorded Time is calculated.

Winner = Lowest Total Recorded Time

Example

Player One

4.3

5.2

10

6.4

4.8

Total

30.7

Player Two

5.8

4.7

6.3

7.1

5.9

Total

29.8

Player Two wins.

---

# 20. Tie Breaking Rules

If both players have identical recorded times:

Priority 1

Most Correct Answers

Priority 2

Fastest Correct Answer

Priority 3

Sudden Death Round

These rules should remain deterministic.

---

# 21. User Interface Philosophy

The interface should feel calm.

It should never resemble a flashy arcade game.

The puzzle should always be the center of attention.

The interface should maximize readability while minimizing distractions.

Players should immediately understand:

- Current round
- Remaining display time
- Answer input
- Results

without unnecessary visual clutter.

---

# 22. Visual Inspiration

The attached reference image serves as visual inspiration only.

The application must not copy Nintendo assets or branding.

Instead, the UI should capture the following qualities:

- Minimalism
- Large whitespace
- Clean layout
- Bright fluorescent cubes
- Thin black outlines
- Modern typography
- High readability
- Smooth animations
- Simple transitions

The overall appearance should feel polished and premium.

---

# 23. Functional Requirements

The application must support:

✓ Practice Mode

✓ Local Multiplayer

✓ Procedural Puzzle Generation

✓ Configurable Settings

✓ Difficulty Scaling

✓ Timer System

✓ Answer Validation

✓ Statistics

✓ Results Screen

✓ Replay Capability

---

# 24. Non-Functional Requirements

The application should be:

Responsive

Fast

Smooth

Accessible

Easy to maintain

Strongly typed

Modular

Extensible

Readable

Well documented

Performance should remain smooth on modern desktop browsers.

---

# 25. User Stories

As a player,

I want to quickly start a game

so I can immediately begin playing.

---

As a player,

I want configurable difficulty

so I can challenge myself.

---

As a player,

I want my response time recorded

so speed matters.

---

As a player,

I want statistics

so I can track my improvement.

---

As a developer,

I want modular systems

so future features can be added without major rewrites.

---

# 26. Acceptance Criteria

Version 1 is complete when:

- The game can generate puzzles.
- Every puzzle renders correctly.
- Players can answer.
- Answers are validated correctly.
- Timers work correctly.
- Difficulty settings function correctly.
- Statistics update correctly.
- Results screen identifies the correct winner.
- The application maintains a clean and polished UI.
- The codebase remains modular and maintainable.

---

# 27. User Experience Principles

The experience should feel similar to solving a physical puzzle rather than playing a traditional video game.

The application should encourage focus and concentration.

Every interaction should feel deliberate and responsive.

The game should never overwhelm players with unnecessary effects or distractions.

Primary UX goals:

- Fast navigation
- Minimal clicks
- Immediate feedback
- Clear hierarchy
- High readability
- Smooth interactions

The puzzle must always remain the primary focus of every gameplay screen.

---

# 28. Visual Design Principles

The overall design language should be:

- Minimal
- Modern
- Professional
- Calm
- Educational
- Premium

The application should resemble a high-quality productivity application rather than an arcade game.

Avoid:

- Flashy effects
- Neon glows
- Heavy gradients
- Excessive shadows
- Overly colorful interfaces
- Visual clutter

Instead prioritize:

- Large whitespace
- Consistent spacing
- Flat surfaces
- Rounded corners
- Simple animations
- Strong typography

---

# 29. Color Palette

Background

White

#FFFFFF

Secondary Background

#F7F7F7

Primary Text

#222222

Secondary Text

#666666

Primary Accent

Bright Fluorescent Lime

Approximate

#B8FF2C

Cube Outline

#111111

Success

#22C55E

Warning

#F59E0B

Error

#EF4444

The exact green may be adjusted slightly to better match the provided UI reference.

---

# 30. Typography

Typography should feel clean and modern.

Preferred fonts:

1. Geist
2. Inter
3. Manrope

Requirements:

- Large headings
- Comfortable spacing
- Excellent readability
- Consistent sizing
- No decorative fonts

Avoid gaming fonts.

---

# 31. Animation Guidelines

Animations should enhance usability.

Never distract the player.

Preferred animations:

- Fade In
- Fade Out
- Scale transitions
- Smooth number counting
- Soft button hover effects
- Gentle page transitions

Avoid:

- Flashing animations
- Excessive bounce
- Long transitions
- Particle systems
- Camera shake

Animations should generally remain below 300 milliseconds.

---

# 32. Accessibility

The application should remain accessible.

Requirements:

- High text contrast
- Keyboard navigation
- Visible focus indicators
- Large clickable targets
- Responsive layout
- Readable font sizes

Do not rely solely on color to communicate information.

---

# 33. Performance Goals

The application should feel instant.

Targets:

- Fast startup
- Smooth animations
- Stable rendering
- Efficient memory usage

The puzzle renderer should redraw only when necessary.

Avoid unnecessary re-renders.

---

# 34. Code Quality Requirements

Every piece of code should satisfy:

- Strong typing
- Clear naming
- Small functions
- Reusable modules
- Single responsibility
- Minimal duplication

Avoid "quick fixes."

Every implementation should be maintainable.

---

# 35. Project Folder Philosophy

Every folder should have a single responsibility.

Example:

engine/

Contains gameplay logic only.

renderer/

Contains rendering only.

ui/

Contains user interface only.

models/

Contains data models only.

utils/

Contains reusable helper functions.

Never mix responsibilities.

---

# 36. Documentation First Development

Documentation is considered part of the software.

Every major implementation should follow documentation.

If implementation reveals a better solution:

Do not silently change it.

Instead:

1. Explain the improvement.
2. Update the documentation.
3. Then implement it.

Documentation should always remain the source of truth.

---

# 37. AI Agent Workflow

The AI coding agent should behave like an experienced software engineer.

Before writing code:

- Read all documentation.
- Understand dependencies.
- Identify missing information.
- Ask questions if necessary.

Implementation order:

1. Architecture
2. Data Models
3. Puzzle Generator
4. Renderer
5. Game Engine
6. UI
7. Polish

Never skip directly to implementation without understanding the architecture.

---

# 38. Milestone Workflow

Every milestone should end with:

## Summary

Explain what was implemented.

## Architecture Decisions

Explain why this solution was chosen.

## Remaining Tasks

List unfinished work.

## Technical Debt

Mention anything that should be improved later.

Then wait for user approval before continuing.

---

# 39. Repository Rules

The AI must never:

- Delete working code without approval.
- Rewrite unrelated files.
- Rename folders unnecessarily.
- Introduce unused dependencies.
- Ignore existing architecture.
- Duplicate business logic.

Every change should have a clear purpose.

---

# 40. Future Roadmap (Not Part of MVP)

Possible future features include:

- Online multiplayer
- Daily challenges
- Replay mode
- Puzzle sharing
- Global leaderboard
- Achievement system
- Themes
- Custom puzzle editor
- Additional puzzle types
- AI-generated puzzle difficulty balancing

These features should NOT influence the MVP architecture beyond keeping the code extensible.

---

# 41. Repository Conventions

Follow consistent naming conventions.

Examples:

Components

PascalCase

Example:

GameBoard.tsx

Hooks

camelCase

Example:

useTimer.ts

Utilities

camelCase

Example:

calculateScore.ts

Constants

UPPER_SNAKE_CASE

Example:

MAX_DISPLAY_TIME

Interfaces

Prefix with "I" only if the project consistently follows that convention; otherwise, use descriptive names.

Choose one convention and keep it consistent.

---

# 42. Definition of Done

A feature is considered complete only if:

- It functions correctly.
- It is documented.
- It follows the architecture.
- It has no obvious bugs.
- It does not duplicate existing logic.
- It is readable.
- It is maintainable.
- It integrates cleanly with the rest of the project.

Working code alone is not considered "done."

---

# 43. Final Project Statement

Cube Count is intended to demonstrate high-quality software engineering as much as game development.

Every implementation decision should prioritize:

- Simplicity
- Readability
- Maintainability
- Scalability
- User Experience

The final product should feel like a polished, premium brain-training application with clean architecture, elegant visuals, and an enjoyable user experience.

