---
name: frontend-design
description: Create terminal-style, monochrome interfaces with code-like aesthetics. Use this skill when building components for the Akurati Kaustiki portfolio.
license: Complete terms in LICENSE.txt
---

This skill guides creation of terminal-style, monochrome interfaces for the Akurati Kaustiki portfolio. The aesthetic is restrained, code-like, and minimal - NOT bold or colorful.

## Design Direction

Before coding, understand the constraints:
- **Aesthetic**: Unified coder/terminal aesthetic - everything feels like code
- **Colors**: Pure monochrome (black/white only, NO accent colors)
- **Typography**: JetBrains Mono only - monospace throughout
- **Motion**: Minimal - code executes, things appear (no bouncy/spinning transitions)
- **Components**: Minimal, code-like (4px radius max)
- **Layout**: Clean, structured, data-visualization style

**CRITICAL**: This is a restrained, minimal aesthetic. NOT bold, colorful, or decorative.

## Frontend Guidelines

Focus on:
- **Typography**: JetBrains Mono only. Use weight variations (400, 600, 700) for hierarchy. Never use sans-serif fonts.
- **Color & Theme**: Pure monochrome. Light mode: #FFFFFF background, #000000 text. Dark mode: #000000 background, #FFFFFF text. No accent colors ever.
- **Motion**: Minimal animations. Fade in (200ms), hover (150ms), terminal blink (1s). No bouncy, spinning, or elaborate transitions.
- **Spatial Composition**: Clean grids, structured layouts, generous negative space. No asymmetry, overlap, or diagonal flow.
- **Backgrounds**: Solid colors only. Subtle neural network pattern (4% opacity) allowed on hero section. No gradients, textures, or decorative patterns.

## Forbidden Anti-Patterns

NEVER use:
- Any color other than black/white
- Sans-serif fonts (Inter, Roboto, Arial, system fonts)
- Rounded corners > 8px
- Gradients
- Shadows (except subtle pattern)
- Decorative elements (except neural network pattern)
- Carousels or sliders
- Overly polished "corporate" feel
- Bold, colorful, or maximalist aesthetics

## Implementation Qualit

Code must be:
- Production-grade and functional
- Clean, semantic HTML5
- CSS3 with custom properties for theming
- Vanilla JavaScript ES6+ modules
- Accessible and performant

Remember: Elegance comes from restraint and precision. Execute the terminal aesthetic with care - every detail should feel like code.
