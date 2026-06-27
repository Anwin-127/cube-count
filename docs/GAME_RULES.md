# GAME_RULES.md

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
> - UI_GUIDELINES.md
> - ARCHITECTURE.md

---

# 1. Purpose

This document defines the gameplay rules of Cube Count.

It acts as the single source of truth for every gameplay mechanic implemented within the application.

Any gameplay changes should first be reflected in this document before implementation.

---

# 2. Game Overview

Cube Count is a local multiplayer brain-training game focused on:

- Spatial reasoning
- Observation
- Memory
- Speed
- Accuracy

Players are shown a 3D isometric cube structure for a limited amount of time.

Once the structure disappears, each player must determine the total number of cubes that were present.

Both players answer simultaneously.

The player with the lowest accumulated recorded time after all rounds wins.

---

# 3. Core Gameplay Philosophy

The game should reward:

- Careful observation
- Fast thinking
- Accurate counting

The game should never reward:

- Guessing
- Random button pressing
- Memorizing puzzle layouts

Every mechanic should reinforce the central challenge:

"Count accurately under time pressure."

---

# 4. Supported Game Modes

Version 1 supports two modes.

## Practice Mode

Single player.

Unlimited rounds.

Statistics are recorded.

No winner.

No opponent.

---

## Local Multiplayer

Two players.

Shared screen.

Shared puzzle.

Independent answer timers.

Winner determined after all rounds.

No networking.

---

# 5. Board Rules

Board Size

5 × 5

The board size never changes during gameplay.

Future versions may support additional sizes.

Version 1 always uses a fixed 5×5 grid.

---

# 6. Puzzle Structure

Each puzzle consists of cube stacks.

Each board cell stores a stack height.

Example

2 1 0 3 1

0 2 1 1 0

1 3 2 0 2

0 1 1 2 1

2 0 3 1 0

Each value represents the height of one stack.

The total cube count equals the sum of every stack.

The renderer visualizes this data only.

The renderer never performs gameplay calculations.

---

# 7. Puzzle Generation Rules

Every generated puzzle must satisfy the following:

- Connected appearance
- Visually balanced
- No floating cubes
- No impossible structures
- Suitable for the selected difficulty
- Procedurally generated

Avoid layouts that appear completely random or unrealistic.

Generated puzzles should resemble intentionally designed brain-training puzzles.

---

# 8. Puzzle Display Phase

Each round begins by displaying the puzzle.

Players may only observe.

Players cannot answer during this phase.

The display timer starts immediately.

When the timer reaches zero:

- The puzzle disappears.
- The answer phase begins.

---

# 9. Display Time Modes

Two display modes exist.

## Fixed

Puzzle display time never changes.

Example

10 seconds every round.

---

## Progressive

Puzzle display time decreases every five levels.

Example

Levels 1–5

10 seconds

Levels 6–10

8 seconds

Levels 11–15

6 seconds

Levels 16–20

5 seconds

The progression schedule should remain configurable.

---

# 10. Difficulty Rules

Difficulty never changes board size.

The board always remains:

5 × 5

Difficulty increases through:

- Taller cube stacks
- More overlapping cubes
- More hidden cubes
- Greater height variation
- More visually complex structures
- Optional display time reduction

Difficulty should never feel unfair.

The challenge should come from observation rather than randomness.

---

# 11. Answer Phase

Once the puzzle disappears, both players begin answering simultaneously.

Players do not type numbers.

Instead, each player controls an answer counter using dedicated keyboard controls.

Both players may answer at the same time.

Each player has an independent timer.

Submitting immediately locks that player's answer.

Submitted answers cannot be modified.

The round ends when:

- Both players have submitted, or
- The maximum answer time expires.

---

# 12. Keyboard Controls

Gameplay is designed to be fully playable using only the keyboard.

No mouse interaction is required during gameplay.

Both players answer simultaneously using dedicated controls.

The controls are intentionally separated to allow comfortable two-player gameplay on a single keyboard.

All keyboard bindings are configurable through GameConfig. The bindings listed below represent the default configuration.

---

## Player 1 Controls

Increase Answer by 1

A

Increase Answer by 10

W

Decrease Answer by 1

S

Submit Answer

Left Shift

---

## Player 2 Controls

Increase Answer by 1

L

Increase Answer by 10

O

Decrease Answer by 1

K

Submit Answer

Right Shift

---

### Example

Suppose the player wants to answer:

47

Instead of pressing the increment key forty-seven times:

Player presses

W
W
W
W

↓

40

Then

A
A
A
A
A
A
A

↓

47

Finally

Left Shift

↓

Submit

The same applies to Player 2 using:

O

for +10

and

and

L

for +1.

This greatly reduces unnecessary key presses while maintaining the same gameplay mechanics.

# 13. Player Interface During Answer Phase

Each player has an independent answer panel.

The panel displays:

- Current Answer
- Running Timer
- Submission Status
- Keyboard Controls

Example

------------------------------------------------

Player 1

Answer

47

Timer

3.82 seconds

Controls

W (+10)

A (+1)

S (-1)

Left Shift (Submit)

Status

Waiting...

------------------------------------------------

Player 2

Answer

52

Timer

4.15 seconds

Controls

O (+10)

L (+1)

K (-1)

Right Shift (Submit)

Status

Submitted ✓

------------------------------------------------

After submission:

- The timer immediately stops.
- Keyboard controls become disabled.
- The answer remains visible.
- The status changes to "Submitted".

The player cannot modify their answer after submission.
---

# 14. Answer Counter Rules

Each player's answer counter starts at:

0

The counter may never become negative.

The following operations are supported:

+1

+10

-1

Every key press updates the answer immediately.

The answer should animate smoothly whenever it changes.

Example

22

↓

23

or

30

↓

40

The interface should always display the player's current answer.

There is no maximum answer value imposed by gameplay.

The answer counter should continue increasing as required by the generated puzzle.
---

# 15. Submission Rules

Players may submit their answer at any time during the answer phase.

Submitting immediately:

- Stops that player's timer.
- Locks that player's answer.
- Prevents further key input.
- Displays a "Submitted" indicator.

Players cannot undo a submission.

If the maximum answer time expires before a player submits:

- The player's current answer is automatically submitted.
- The player receives the maximum recorded time penalty.

---

# 16. Timer Rules

Each player has an independent answer timer.

The timer begins immediately after the puzzle disappears.

The timer stops when:

- The player submits, or
- Maximum answer time expires.

Default maximum answer time:

10 seconds

This value should remain configurable through GameConfig.

---

# 17. Validation Rules

The game validates answers only after the round has ended.

Validation is performed using the puzzle data generated by the Puzzle Generator.

Correct Answer

Player Answer == Total Cube Count

Incorrect Answer

Player Answer != Total Cube Count

No partial credit is awarded.

The renderer must never determine correctness.

---

# 18. Recorded Time

Correct Answer

Recorded Time = Actual Answer Time

Example

Maximum Time

10 seconds

Player submits

4.36 seconds

Correct

Recorded Time

4.36 seconds

---

Incorrect Answer

Recorded Time = Maximum Allowed Time

Example

Maximum Time

10 seconds

Player submits

2.08 seconds

Incorrect

Recorded Time

10 seconds

This discourages random guessing while rewarding careful observation.

---

# 19. End Of Round

After validation, the game displays a results screen.

The following information is revealed:

- Correct cube count
- Player 1 answer
- Player 2 answer
- Correct / Incorrect indicators
- Recorded times
- Updated total recorded times

Players may review the results before continuing.

The next round begins only after confirmation.

Default continue key:

Space

---

# 20. Round Flow

Each round follows this sequence.

Generate Puzzle

↓

Render Puzzle

↓

Display Puzzle

↓

Display Timer Counts Down

↓

Puzzle Disappears

↓

Answer Phase Begins

↓

Player Timers Start

↓

Players Submit Answers

↓

Validate Answers

↓

Reveal Results

↓

Update Statistics

↓

Next Round

Every round must follow this exact sequence.

---

# 21. Winning

After all rounds are completed:

The total recorded time for each player is calculated.

Winner = Lowest Total Recorded Time

Example

Player One

4.8

5.1

10

4.6

5.2

Total

29.7

Player Two

5.6

4.9

5.5

5.4

5.1

Total

26.5

Player Two wins.

---

# 22. Tie Breaking

If both players have identical recorded times:

Priority 1

Most Correct Answers

Priority 2

Fastest Correct Round

Priority 3

Sudden Death Round

These rules are deterministic.

---

# 23. Practice Mode Statistics

Practice Mode tracks:

- Total Puzzles Solved
- Correct Answers
- Incorrect Answers
- Accuracy Percentage
- Fastest Correct Answer
- Average Response Time
- Current Streak
- Best Streak

These statistics are displayed after each session.

---

# 24. Local Multiplayer Statistics

The game tracks:

Player 1

- Correct Answers
- Incorrect Answers
- Total Recorded Time
- Fastest Correct Answer

Player 2

- Correct Answers
- Incorrect Answers
- Total Recorded Time
- Fastest Correct Answer

Overall

- Winner
- Total Rounds
- Total Correct Answers
- Match Duration

---

# 25. Fairness Rules

Both players always receive:

- The same puzzle
- The same display time
- The same answer time
- The same difficulty

Neither player receives additional information.

During the answer phase, players cannot see whether the opponent's answer is correct.

The only visible opponent status is:

Waiting...

or

Submitted ✓

This prevents one player's result from influencing the other's decision.

---

# 26. Gameplay Philosophy

Cube Count rewards:

- Observation
- Memory
- Accuracy
- Speed

The game intentionally discourages:

- Guessing
- Random key presses
- Trial and error

Players should feel rewarded for developing better spatial reasoning rather than memorizing puzzles.

---

# 27. Accessibility Rules

Cube Count should remain fully playable without a mouse.

Requirements:

- Complete keyboard navigation
- High contrast UI
- Large readable typography
- Visible keyboard focus indicators
- Clear status messages
- Responsive layout

The gameplay should never depend on mouse accuracy.

---

# 28. Input Philosophy

Gameplay is intentionally designed around keyboard interaction.

The objective is to make gameplay feel similar to a console or handheld brain-training game.

Players should never need to:

- Type numbers
- Click text fields
- Use the mouse during gameplay

Instead, players adjust a visible answer counter before submitting.

This creates a faster, cleaner and more engaging experience.

---



# 29. Visual Feedback

Every important player action should provide immediate feedback.

Examples:

Increasing Answer

22

↓

23

Answer Submitted

Submitted ✓

Correct Answer

✓ Correct

Incorrect Answer

✗ Incorrect

Animations should remain subtle.

Feedback should never distract from gameplay.

---

# 30. Round Completion

A round is considered complete only when:

- Both players have submitted their answers, or
- The maximum answer time has expired.

If the timer expires before a player submits:

- The player's current answer is automatically locked.
- The recorded time becomes the maximum allowed time.
- The player cannot modify their answer afterwards.

The game then proceeds to validation.

---

# 31. Practice Mode Rules

Practice Mode has no winner.

Players may continue indefinitely.

The session ends only when the player chooses to exit.

Statistics update after every completed puzzle.

Difficulty settings remain configurable.

---

# 32. Local Multiplayer Rules

Both players compete using the same keyboard.

The game should ensure both players have equal opportunity.

Each player has:

- Independent answer counter
- Independent timer
- Independent submission state

The game never favors one player over another.

---

# 33. Replay Rules

After the final results screen, players may choose:

- Play Again
- Return to Main Menu

Choosing Play Again starts a completely new match.

New puzzles should be generated.

No previous scores carry over.

---

# 34. Statistics Reset

Starting a new multiplayer match resets:

- Total recorded times
- Correct answers
- Incorrect answers
- Round counters

Practice statistics should remain available until the application closes.

---

# 35. Game Configuration Rules

All gameplay values should come from GameConfig.

Examples include:

- Number of rounds
- Display time
- Display mode
- Maximum answer time
- Puzzle difficulty
- Maximum stack height

Gameplay systems must never use hardcoded values.

---

# 36. Future Compatibility

Version 1 intentionally excludes:

- Online multiplayer
- User accounts
- Leaderboards
- Databases
- Cloud saves

However, gameplay should remain deterministic so these features can be added later without changing the game rules.

Puzzle generation should support deterministic seeds for future expansion.

---

# 37. Gameplay Constraints

Version 1 assumptions:

- Desktop browsers only
- Keyboard input only during gameplay
- Single shared display
- Two local players maximum

These constraints simplify the MVP while leaving room for future enhancements.

---

# 38. Rule Modification Policy

Gameplay behaviour must never be changed only in code.

If gameplay changes:

1. Update this document.
2. Update PROJECT_SPEC.md if required.
3. Then implement the change.

Documentation remains the authoritative source of truth.

---

# 39. Definition of Fair Play

A fair game means:

- Identical puzzles
- Identical timers
- Identical controls
- Identical rules
- No hidden information
- No player advantage

Every mechanic should preserve competitive fairness.

---

