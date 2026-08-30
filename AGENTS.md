# Portfolio Project - Akurati Kaustiki

## Quick Reference

| Item | Location |
|------|----------|
| Owner | Akurati Kaustiki (Computer Science Engineer, M.Tech AI/ML) |
| Goal | Attract recruiters/employers in AI/ML, backend systems |
| Content | `plans/data.md` |
| Tech Stack | `plans/requirements.md` (Plain HTML/CSS/JS) |
| Design System | `plans/design.md` |
| Implementation | `plans/todo.md` |

## Tech Stack
- **HTML5** - Semantic markup
- **CSS3** - Custom properties for theming
- **Vanilla JavaScript** - ES6+ modules
- **JetBrains Mono** - Single font for everything

## Workflow

### Phase Execution (One at a time)

For each phase, follow this sequence:

1. **Read `plans/todo.md`** - Identify the next incomplete phase (first phase with unchecked items)
2. **Read `plans/requirements.md`** - Understand technical requirements for that phase
3. **Read `plans/design.md`** - Ensure design constraints are followed
4. **Implement** - Build all todo items for the current phase
5. **Report completion** - Summarize what was implemented
6. **STOP and wait** - Wait for user to test manually
7. **Handle response**:
   - If user says "test pass" or "working" → Update `plans/todo.md` (check off completed items), then proceed to next phase
   - If user requests improvements → Execute improvements, then repeat from step 6

**CRITICAL**: 
- Never proceed to next phase without explicit user approval
- Always update todo.md after phase is approved
- Follow design.md constraints strictly (monochrome, JetBrains Mono, minimal animations)

### Design Constraints
All implementations must follow `plans/design.md`:
- Pure monochrome (black/white only)
- JetBrains Mono font only
- Minimal animations (no bouncy/spinning)
- Code-like components (4px radius max)
- No gradients, shadows, or decorative elements

## Hero Section - Terminal Commands

| Command | Output |
|---------|--------|
| `help()` | List all available commands |
| `ak.info` | Name, title, short description |
| `education.head()` | Education entries |
| `experience.head()` | Work experience |
| `skills.head()` | Technical skills |
| `projects.head()` | Featured projects |
| `finearts.head()` | Fine arts categories |
| `contact.head()` | Contact information |
| `clear` | Clear terminal |
| `theme.toggle()` | Switch light/dark mode |

## Sections (in order)
1. Hero (with terminal)
2. About
3. Skills
4. Experience
5. Projects
6. Fine Arts
7. Education
8. Certifications
9. Contact

## File Structure
```
/
├── index.html
├── css/styles.css
├── js/main.js
├── js/terminal.js
├── js/theme.js
├── data/portfolio.js
└── assets/
```
