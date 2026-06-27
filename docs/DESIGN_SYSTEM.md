# DESIGN_SYSTEM.md

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
> - ARCHITECTURE.md

---

# 1. Purpose

This document defines the complete visual language of Cube Count.

Its purpose is to ensure that every screen, component, animation and interaction follows a consistent design philosophy.

Developers and AI coding agents should treat this document as the primary source of truth for all user interface decisions.

---

# 2. Design Philosophy

Cube Count should feel like a premium brain-training application.

The interface should be:

- Calm
- Minimal
- Modern
- Elegant
- Focused
- Professional

The player should never feel overwhelmed.

The puzzle itself should always be the visual focus.

---

# 3. Inspiration

The attached Nintendo reference image should be treated as inspiration only.

Do NOT copy:

- Nintendo branding
- Logos
- Fonts
- Artwork
- Layouts

Instead capture the feeling:

- Clean
- Spacious
- Bright
- Highly readable
- Minimal distractions

The final product should feel original while achieving a similar level of visual quality.

---

# 4. Visual Identity

The visual identity should communicate:

Focus

↓

Observation

↓

Thinking

↓

Precision

↓

Speed

Avoid making the game resemble:

- Arcade games
- Mobile puzzle games
- Casino games
- Neon cyberpunk interfaces

Instead aim for:

Educational software

Premium productivity apps

Modern puzzle games

---

# 5. Design Principles

Every UI decision should satisfy these principles.

## Simplicity

Remove anything unnecessary.

Every element should have a purpose.

---

## Consistency

Spacing

Typography

Buttons

Animations

Cards

Colors

should remain consistent throughout the application.

---

## Readability

Large text.

High contrast.

Clear hierarchy.

Easy scanning.

---

## Focus

The puzzle should always receive the player's attention first.

Everything else should support it.

Never compete with it.

---

# 6. Color Palette

Background

#FFFFFF

Secondary Background

#F7F7F7

Primary Text

#222222

Secondary Text

#666666

Accent Green

#B8FF2C

Outline

#111111

Border

#DDDDDD

Success

#22C55E

Warning

#F59E0B

Error

#EF4444

Disabled

#CCCCCC

The exact cube green may be adjusted slightly to better match the provided reference image.

---

# 7. Typography

Preferred fonts

1.

Geist

2.

Inter

3.

Manrope

Fallback

sans-serif

Requirements

Large headings

Comfortable spacing

Excellent readability

Clean geometric appearance

Avoid:

Gaming fonts

Pixel fonts

Decorative fonts

---

# 8. Typography Scale

Hero Title

48px

Screen Title

36px

Section Title

28px

Body

18px

Secondary Body

16px

Caption

14px

Small Labels

12px

Maintain consistent line height.

Avoid oversized paragraphs.

---

# 9. Spacing System

Use an 8-point spacing system.

Examples

4

8

16

24

32

40

48

64

80

Never use arbitrary spacing values unless absolutely necessary.

---

# 10. Border Radius

Buttons

12px

Cards

16px

Panels

20px

Dialogs

24px

Avoid sharp edges.

Avoid excessive rounding.

---

# 11. Shadows

Use very soft shadows.

Example

Small

0 2px 8px rgba(0,0,0,0.08)

Medium

0 8px 24px rgba(0,0,0,0.10)

Avoid heavy shadows.

The interface should feel light.

---

# 12. Borders

Use subtle borders.

Primary Border

1px

#DDDDDD

Cube outlines should remain:

Thin

Black

High contrast

Exactly as inspired by the reference image.

---

# 13. White Space

The application should intentionally use generous white space.

Large empty areas improve focus.

Do not fill empty space simply because it exists.

Whitespace is considered part of the design.

---

# 14. Layout Philosophy

Each screen should have:

Header

↓

Primary Content

↓

Secondary Information

↓

Footer Actions

This structure should remain consistent throughout the application.

---

# 15. Overall Feel

If someone opens Cube Count for the first time,

they should think:

"This feels clean."

"This feels polished."

"This feels premium."

—not—

"This looks like a student React project."

The interface should demonstrate thoughtful design through restraint rather than excessive decoration.
---

# 16. Screen Layout Philosophy

Every screen should follow the same structural hierarchy.

────────────────────────────────────

Header

↓

Primary Content

↓

Secondary Information

↓

Primary Actions

────────────────────────────────────

Players should immediately understand where to look.

The application should never contain multiple competing focal points.

---

# 17. Screen Navigation

Version 1 contains the following screens.

Home

↓

Game Settings

↓

Gameplay

↓

Round Results

↓

Final Results

↓

Home

Practice Mode follows the same structure but replaces the Final Results screen with Statistics.

Navigation should always feel predictable.

---

# 18. Home Screen

The Home screen should be extremely minimal.

Layout

────────────────────────────

Cube Count

Subtitle

Play

Practice

Settings

────────────────────────────

The game title should be the largest element.

Buttons should be centered.

Avoid unnecessary graphics.

The interface should immediately communicate simplicity.

---

# 19. Settings Screen

The settings screen should use grouped cards.

Example

Game Mode

Rounds

Difficulty

Display Time

Display Mode

Start Game

Each setting should have generous spacing.

Never overcrowd the screen.

---

# 20. Gameplay Screen

The gameplay screen is the most important screen.

Everything should support the puzzle.

Layout

────────────────────────────

Round Information

↓

Puzzle

↓

Player Panels

────────────────────────────

The puzzle should occupy approximately 60–70% of the visible area.

Everything else should support it.

---

# 21. Puzzle Placement

The puzzle should always remain centered.

Large empty space should surround it.

Never allow UI panels to visually compete with the puzzle.

The puzzle should always be the first thing players notice.

---

# 22. Player Panels

Player panels should appear beneath the puzzle.

Player 1

Answer

Timer

Status

Controls

----------------------

Player 2

Answer

Timer

Status

Controls

Both panels should have identical dimensions.

Neither player should receive visual priority.

---

# 23. Puzzle Display Phase

During puzzle viewing:

Only display:

Round

Display Timer

Puzzle

Nothing else should distract players.

Hide answer controls until the puzzle disappears.

---

# 24. Answer Phase

Once the puzzle disappears:

Answer panels fade into view.

Each player sees:

Current Answer

Current Timer

Submission Status

Keyboard Controls

The transition should feel smooth.

---

# 25. Results Screen

The Results screen should display:

Correct Cube Count

↓

Player 1 Result

↓

Player 2 Result

↓

Updated Match Score

↓

Continue

Do not overload this screen.

The objective is clarity.

---

# 26. Final Results Screen

At the end of the match display:

Winner

↓

Total Recorded Times

↓

Correct Answers

↓

Accuracy

↓

Play Again

↓

Main Menu

This screen should feel celebratory without becoming flashy.

---

# 27. Statistics Screen

Practice Mode should include:

Average Time

Accuracy

Fastest Answer

Current Streak

Best Streak

Total Puzzles Solved

Statistics should use clean cards.

Avoid tables.

---

# 28. HUD Principles

The HUD should display only essential information.

Round Number

Display Timer

Player Timers

Current Answers

Nothing else.

The HUD should never distract from gameplay.

---

# 29. Empty Space

Whitespace is intentional.

Never fill empty areas with decorative graphics.

Empty space improves concentration.

---

# 30. Responsive Behaviour

The primary target is desktop.

Minimum supported width

1280px

Preferred width

1440px+

The puzzle should scale proportionally.

Player panels should remain aligned.

Avoid stacking player panels vertically unless absolutely necessary.

---

# 31. Window Resizing

The application should gracefully handle resizing.

The puzzle should always remain centered.

The UI should never overlap the puzzle.

Maintain consistent spacing at every resolution.

---

# 32. Visual Hierarchy

Players should notice elements in this order:

1. Puzzle

2. Round Information

3. Player Panels

4. Timers

5. Controls

This hierarchy should remain consistent across every round.

---

# 33. Screen Consistency

Every screen should reuse the same:

Spacing

Typography

Buttons

Cards

Colors

Animations

Avoid redesigning components between screens.

Consistency improves usability.

---

# 34. Component Design System

Every reusable UI component should follow a consistent design language.

Components include:

- Buttons
- Cards
- Panels
- Dialogs
- Timers
- Counters
- Statistics Cards
- Navigation Buttons

No component should introduce a different visual style.

---

# 35. Buttons

Buttons should feel premium.

Requirements:

- Rounded corners
- Large click targets
- Comfortable padding
- Clear hover state
- Smooth transition

Primary Button

Background

Accent Green

Text

Dark Gray

Secondary Button

White

1px Border

Dark Text

Danger Button

Soft Red

Avoid glossy buttons.

Avoid gradients.

---

# 36. Cards

Cards should appear to float slightly above the background.

Properties

- White background
- Soft shadow
- Rounded corners
- Thin border
- Comfortable padding

Cards should never compete with the puzzle for attention.

---

# 37. Puzzle Rendering

The puzzle is the hero of the application.

Requirements

- Perfect isometric projection
- Bright fluorescent green cubes
- Thin black outlines
- Soft gray side faces
- Uniform lighting
- Crisp edges
- Clean rendering

Do not use realistic lighting.

Do not use textures.

Do not use reflections.

The appearance should remain simple and readable.

---

# 38. Cube Appearance

Every cube consists of:

Top Face

Bright Fluorescent Green

Left Face

Slightly darker green

Right Face

Soft gray-green

Outline

Black

Every cube should maintain identical proportions.

---

# 39. Animation Philosophy

Animations should support usability.

Never distract.

Preferred animations:

Fade

Scale

Slide

Opacity

Simple easing

Avoid:

Bounce

Elastic

Camera shake

Particles

Long animations

---

# 40. Animation Timing

Micro Interaction

100–150ms

Button Hover

150ms

Panel Transition

200ms

Screen Transition

250ms

Puzzle Fade

300ms

Animations should feel responsive.

---

# 41. Countdown Animation

Display Timer

Large

Centered

High Contrast

During the final three seconds:

3

2

1

Numbers may gently scale.

Avoid dramatic flashing.

---

# 42. Answer Counter Animation

Every answer update should animate smoothly.

Example

46

↓

47

The transition should be subtle.

Do not use spinning number wheels.

---

# 43. Results Animation

Correct Answers

Fade in

Green checkmark appears

Incorrect Answers

Fade in

Red cross appears

Winner

Gentle celebration

Examples

- Soft glow
- Slight scale
- Confetti (very subtle, optional)

Avoid loud celebrations.

---

# 44. Loading States

If any loading screen is required:

Use simple skeletons or a subtle spinner.

Avoid long loading animations.

Gameplay should begin quickly.

---

# 45. Iconography

Icons should be:

Minimal

Outlined

Consistent stroke width

Simple

Avoid colorful emoji-style icons.

Recommended libraries:

- Lucide
- Heroicons

---

# 46. Sound Design

Sound should be subtle.

Recommended sounds:

Button Click

Soft Tick

Answer Submit

Light Click

Correct

Soft Chime

Incorrect

Muted Error Tone

Winner

Short Success Melody

Sound should never become annoying.

---

# 47. Accessibility

Provide:

Keyboard navigation

High contrast

Large text

Visible focus states

Reduced motion support

Respect the user's operating system preference for reduced motion.

---

# 48. Responsive Behaviour

Primary Target

Desktop

Secondary Target

Large Tablets

Mobile support is not required for Version 1.

The interface should degrade gracefully on smaller screens.

---

# 49. Error States

Validation messages should be concise.

Examples

"Invalid Configuration"

"Unable to Generate Puzzle"

Avoid technical error messages unless debugging mode is enabled.

---

# 50. Empty States

Practice Statistics

"No games played yet."

Settings

"No custom settings saved."

Empty states should encourage interaction rather than leaving blank screens.

---

# 51. Theme Philosophy

Version 1 supports a single theme.

Light Theme

Future versions may include Dark Mode.

The architecture should make additional themes easy to add later.

---

# 52. Branding

Cube Count should establish its own identity.

Avoid copying Nintendo's branding.

The visual identity should communicate:

Focus

Precision

Intelligence

Modern Design

Calm Competition

---

# 53. UI Quality Checklist

Before a screen is considered complete, verify:

✓ Consistent spacing

✓ Consistent typography

✓ Correct colors

✓ Smooth animations

✓ Responsive layout

✓ Accessible

✓ Keyboard friendly

✓ Minimal visual clutter

✓ Puzzle remains the primary focus

---

# 54. Definition of Good Design

A screen is considered successful when:

Players immediately understand what to do.

The interface feels effortless.

Nothing appears out of place.

The puzzle naturally draws attention.

The experience feels polished and premium.

---

# 55. Final Design Statement

Cube Count should feel like a modern premium brain-training application.

The interface should be elegant through simplicity.

Every visual decision should reinforce focus, clarity, and confidence.

The design should never attempt to impress through complexity.

Instead, it should impress through refinement, consistency, and thoughtful attention to detail.

