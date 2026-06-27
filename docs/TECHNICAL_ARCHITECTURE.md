# TECHNICAL_ARCHITECTURE.md

> Project: Cube Count
>
> Version: 1.0
>
> Status: Draft
>
> Last Updated: 2026-06-26
>
> Related Documents:
>
> - PROJECT_SPEC.md
> - GAME_RULES.md
> - DESIGN_SYSTEM.md

---

# 1. Purpose

This document defines the software architecture of Cube Count.

It describes how the application should be organized internally.

The goal is to produce a clean, modular, maintainable, and extensible codebase.

Implementation should always follow this document unless an approved architectural improvement is made.

---

# 2. Architectural Philosophy

Cube Count should be developed using clean architecture principles.

Primary goals:

- Separation of concerns
- High cohesion
- Low coupling
- Predictable data flow
- Strong typing
- Reusable modules
- Easy testing

The application should remain understandable even as new features are added.

---

# 3. Core Principles

Every module should have one responsibility.

Rendering should not contain gameplay logic.

Gameplay logic should not know how rendering works.

UI components should never contain business logic.

Configuration should be centralized.

Dependencies should always point inward toward the game engine.

---

# 4. High-Level Architecture

The application consists of six major systems.

User Interface

↓

Game Engine

↓

Puzzle Generator

↓

Renderer

↓

Input Manager

↓

Utilities

Each system should remain as independent as possible.

---

# 5. Data Flow

The application should use one-way data flow.

Player Input

↓

Input Manager

↓

Game Engine

↓

Game State

↓

Renderer

↓

Screen

The renderer never modifies game state.

Only the Game Engine is allowed to change game state.

---

# 6. Folder Structure

Recommended structure:

src/

components/

engine/

renderer/

input/

models/

hooks/

utils/

config/

assets/

styles/

types/

Each folder should have a clearly defined purpose.

---

# 7. Engine

The engine contains all gameplay logic.

Responsibilities include:

- Round management
- Score calculation
- Timing
- State updates
- Winner calculation
- Rule enforcement

The engine should never render graphics.

---

# 8. Renderer

The renderer is responsible only for drawing.

Responsibilities:

- Render cubes
- Update animations
- Draw timers
- Draw UI state
- Display results

The renderer should never:

- Calculate scores
- Generate puzzles
- Validate answers
- Store gameplay state

It simply renders data.

---

# 9. Puzzle Generator

The Puzzle Generator owns puzzle creation.

Responsibilities:

- Generate height maps
- Generate puzzle seeds
- Calculate cube totals
- Determine puzzle complexity

It should return immutable puzzle data.

The Puzzle Generator should never know about players, timers, or UI.

---

# 10. Input Manager

The Input Manager translates keyboard events into game actions.

Example

Keyboard

↓

"A"

↓

PLAYER_INCREMENT

↓

Game Engine

The rest of the application should never check keyboard keys directly.

This makes controls configurable without changing gameplay logic.

---

# 11. Game State

The entire application should have a single source of truth.

The Game State stores:

- Current round
- Current puzzle
- Player answers
- Timers
- Match statistics
- Configuration

No duplicate game state should exist elsewhere.

---

# 12. Configuration

Configuration should live in one location.

Examples:

- Display time
- Difficulty
- Number of rounds
- Maximum answer time
- Keyboard mappings

Gameplay systems should read from configuration rather than hardcoded values.

---

# 13. Dependency Rules

Allowed dependencies:

UI

↓

Engine

↓

Puzzle Generator

↓

Utilities

Renderer

↓

Utilities

Input Manager

↓

Engine

Forbidden dependencies:

Renderer → Engine mutations

UI → Puzzle Generator

Puzzle Generator → UI

Renderer → Puzzle Generator

The dependency graph should remain acyclic.

---

# 14. Error Handling

All modules should fail gracefully.

Never crash the application because of invalid input.

Expected errors should produce user-friendly messages.

Unexpected errors should be logged for debugging.

---

# 15. Architecture Goals

The architecture should make it easy to add:

- New game modes
- Additional puzzle generators
- Themes
- Animations
- New renderers
- Accessibility improvements

without rewriting existing systems.

---

# 16. Game State Machine

Cube Count should be implemented as a finite state machine.

At any moment, the application must exist in exactly one state.

The allowed states are:

HOME

↓

SETTINGS

↓

GENERATING_PUZZLE

↓

DISPLAYING_PUZZLE

↓

ANSWER_PHASE

↓

VALIDATING

↓

ROUND_RESULTS

↓

FINAL_RESULTS

Transitions should always follow this sequence.

The application must never skip states unless explicitly defined.

This prevents invalid UI combinations and simplifies debugging.

---

# 17. State Responsibilities

## HOME

Displays the main menu.

No game logic runs.

---

## SETTINGS

Allows players to configure:

- Game Mode
- Number of Rounds
- Difficulty
- Display Time Mode
- Display Time
- Maximum Answer Time

Starting a game transitions to:

GENERATING_PUZZLE

---

## GENERATING_PUZZLE

The Puzzle Generator creates a new puzzle.

Responsibilities:

- Generate puzzle seed
- Generate height map
- Calculate total cubes
- Calculate metadata

Once generation finishes:

Transition to

DISPLAYING_PUZZLE

---

## DISPLAYING_PUZZLE

The puzzle is rendered.

The display timer begins.

Players cannot interact.

When the timer expires:

Transition to

ANSWER_PHASE

---

## ANSWER_PHASE

Players may interact.

Responsibilities:

- Capture keyboard input
- Update answer counters
- Update player timers
- Lock submitted answers

The state ends when:

- Both players submit, or
- Maximum answer time expires

Transition to

VALIDATING

---

## VALIDATING

The Answer Validator compares:

Player Answers

↓

Correct Cube Count

Results are stored.

Transition to

ROUND_RESULTS

---

## ROUND_RESULTS

Display:

- Correct Answer
- Player Answers
- Correct / Incorrect
- Recorded Times
- Updated Totals

If additional rounds remain:

Transition to

GENERATING_PUZZLE

Otherwise:

Transition to

FINAL_RESULTS

---

## FINAL_RESULTS

Display:

- Winner
- Statistics
- Match Summary

Players may:

Play Again

↓

SETTINGS

or

Main Menu

↓

HOME

---

# 18. State Transition Rules

Only the Game Engine may change application state.

The Renderer may observe state.

The UI may request state changes.

The Input Manager may trigger events.

However, all transitions must pass through the Game Engine.

---

# 19. Event System

The engine should react to events.

Examples:

START_GAME

PUZZLE_GENERATED

DISPLAY_TIMER_FINISHED

PLAYER1_INCREMENT

PLAYER2_INCREMENT

PLAYER1_DECREMENT

PLAYER2_DECREMENT

PLAYER1_SUBMIT

PLAYER2_SUBMIT

ANSWER_PHASE_TIMEOUT

VALIDATION_COMPLETE

NEXT_ROUND

MATCH_FINISHED

UI components should dispatch events.

The engine decides what happens.

---

# 20. Input Flow

Keyboard

↓

Input Manager

↓

Game Event

↓

Game Engine

↓

Game State

↓

Renderer

The renderer never reads keyboard events directly.

---

# 21. Timer System

The application contains three independent timer types.

Display Timer

Controls puzzle visibility.

Answer Timer

One per player.

Measures response time.

Animation Timer

Used only for animations.

Gameplay timers should never depend on animation timing.

---

# 22. Game Loop

Each round follows:

Generate Puzzle

↓

Render Puzzle

↓

Display Countdown

↓

Hide Puzzle

↓

Accept Input

↓

Validate Answers

↓

Show Results

↓

Next Round

Every round follows the same deterministic sequence.

---

# 23. Puzzle Lifecycle

Puzzle Created

↓

Puzzle Rendered

↓

Puzzle Viewed

↓

Puzzle Hidden

↓

Answer Validation

↓

Puzzle Destroyed

↓

Generate Next Puzzle

Puzzle objects should be immutable.

---

# 24. Data Ownership

Every system owns its own data.

Puzzle Generator

Owns:

- Height Map
- Seed
- Cube Count

Game Engine

Owns:

- Game State
- Round
- Statistics
- Timers

Renderer

Owns:

- Animation State
- Visual Objects

Input Manager

Owns:

- Keyboard Mapping

Never duplicate ownership.

---

# 25. Separation of Concerns

Game Engine

Rules

Renderer

Graphics

Input Manager

Input

Puzzle Generator

Puzzle Creation

UI

Presentation

Utilities

Reusable helpers

Every module should remain focused on one responsibility.

---

# 26. Immutability

Generated puzzle data should never change.

Example:

Height Map

Seed

Cube Count

Difficulty Metadata

These values remain constant throughout the round.

Player-related data changes.

Puzzle data does not.

---

# 27. Configuration Management

Configuration should be loaded once.

Every system reads from GameConfig.

No module should create its own configuration values.

Examples:

Rounds

Difficulty

Display Time

Keyboard Mapping

Maximum Stack Height

Configuration should remain centralized.

---

# 28. Event Bus Architecture

Cube Count should use an Event Bus to facilitate communication between independent systems.

Systems should communicate by publishing and subscribing to events rather than calling each other directly whenever possible.

This reduces coupling and improves maintainability.

Architecture

Keyboard

↓

Input Manager

↓

Event Bus

↓

Game Engine

↓

Game State

↓

Renderer

Additional systems such as Audio, Analytics, or Achievements can later subscribe to the same events without modifying existing code.

---

# 29. Event Flow

Every gameplay action should become an event.

Example

Player presses Increment

↓

Input Manager

↓

PLAYER_INCREMENT event

↓

Event Bus

↓

Game Engine

↓

Update Player Answer

↓

Renderer receives updated state

↓

UI refreshes

The Input Manager never directly changes gameplay state.

---

# 30. Standard Events

The following events should exist.

Application

APP_STARTED

START_GAME

RETURN_TO_MENU

Game

ROUND_STARTED

ROUND_COMPLETED

MATCH_COMPLETED

Puzzle

PUZZLE_GENERATED

PUZZLE_RENDERED

PUZZLE_HIDDEN

Players

PLAYER1_INCREMENT

PLAYER1_DECREMENT

PLAYER1_SUBMIT

PLAYER2_INCREMENT

PLAYER2_DECREMENT

PLAYER2_SUBMIT

Timers

DISPLAY_TIMER_STARTED

DISPLAY_TIMER_FINISHED

ANSWER_TIMER_STARTED

ANSWER_TIMER_EXPIRED

Validation

ANSWERS_VALIDATED

RESULTS_DISPLAYED

Configuration

SETTINGS_CHANGED

These events represent game actions rather than implementation details.

---

# 31. Module Communication Rules

Modules should communicate through events whenever practical.

Input Manager

↓

Publishes Events

Game Engine

↓

Consumes Events

↓

Updates Game State

Renderer

↓

Observes Game State

↓

Renders Changes

The Renderer should never subscribe directly to keyboard input.

---

# 32. State Ownership

Each system owns its own data.

Input Manager

Owns

- Keyboard mappings
- Active key states

Puzzle Generator

Owns

- Puzzle seed
- Height map
- Cube metadata

Game Engine

Owns

- Current game state
- Current round
- Timers
- Scores
- Statistics

Renderer

Owns

- Rendered objects
- Animation state
- Camera
- Visual transitions

Audio System (Future)

Owns

- Sound playback
- Volume
- Music state

No system should modify another system's internal data directly.

---

# 33. Dependency Graph

Allowed dependencies

UI

↓

Game Engine

↓

Puzzle Generator

↓

Utilities

Renderer

↓

Utilities

Input Manager

↓

Event Bus

↓

Game Engine

Configuration

↓

All Systems

Forbidden dependencies

Renderer

✗ Puzzle Generator

Renderer

✗ Input Manager

Puzzle Generator

✗ Renderer

Puzzle Generator

✗ UI

UI

✗ Puzzle Generator

Input Manager

✗ Renderer

No circular dependencies should exist.

---

# 34. Recommended Source Structure

src/

app/

engine/

state/

events/

input/

renderer/

puzzle/

models/

config/

components/

hooks/

utils/

styles/

assets/

Each folder should have one clear responsibility.

---

# 35. Recommended Engine Structure

engine/

GameEngine

GameStateMachine

RoundManager

TimerManager

ScoreManager

AnswerValidator

StatisticsManager

ConfigurationManager

The Game Engine coordinates gameplay but delegates work to specialized managers.

---

# 36. Renderer Structure

renderer/

Renderer

CubeRenderer

AnimationManager

Camera

Effects

HUDRenderer

Renderer classes should only draw visuals.

They should never contain gameplay logic.

---

# 37. Puzzle System

puzzle/

PuzzleGenerator

DifficultyGenerator

SeedGenerator

PuzzleValidator

HeightMapGenerator

Each generator should remain deterministic.

Given the same seed and configuration, the same puzzle should always be generated.

---

# 38. Input System

input/

InputManager

KeyboardBindings

InputActions

InputState

The Input System converts physical keyboard keys into gameplay actions.

The rest of the application should never depend on physical keys.

Keyboard mappings should be configurable.

---

# 39. Future Scalability

The architecture should support future additions with minimal changes.

Examples

Online Multiplayer

AI Opponent

Replay System

Daily Challenges

Leaderboards

Themes

Additional Puzzle Types

Statistics Export

Accessibility Improvements

The MVP should not implement these features.

However, the architecture should not prevent them.

---

# 40. Technical Quality Checklist

Before implementing any feature, verify:

✓ Correct architecture

✓ Single responsibility

✓ Strong typing

✓ No duplicated logic

✓ Proper module ownership

✓ Clean dependency graph

✓ Readable code

✓ Maintainable structure

✓ Configurable behavior

✓ Well documented

---

# 41. Final Technical Statement

Cube Count should be implemented as a modular, event-driven application centered around a finite state machine.

The Game Engine is the single source of truth.

The Renderer displays state but never changes it.

The Puzzle Generator creates deterministic puzzle data.

The Input Manager translates keyboard input into game actions.

The Event Bus enables clean communication between systems.

Every implementation should prioritize clarity, maintainability, extensibility, and correctness over speed or unnecessary complexity.

