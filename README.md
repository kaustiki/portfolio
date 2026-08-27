# Akurati Kaustiki — Portfolio

Terminal-style personal portfolio. Vanilla HTML, CSS and JavaScript — no build step,
no dependencies, no framework.

**Live:** https://kaustiki.github.io/portfolio_opencode/

---

## Running it locally

The scripts load as ES modules, so **a local server is required** — opening
`index.html` from the file system will not work (browsers block `type="module"`
over `file://`).

```bash
python3 serve.py
```

Then open <http://localhost:8000>. Stop it with `Ctrl+C`.

Use `serve.py` rather than `python3 -m http.server` — the plain module lets the
browser cache ES modules and CSS aggressively, so your edits appear not to take
effect. `serve.py` sends `no-store` on everything. Pass a port to change it:
`python3 serve.py 3000`.

If you ever do see a stale page, hard-refresh: **Ctrl+Shift+R** (Cmd+Shift+R on Mac).

---

## Project structure

```
portfoliov3/
├── index.html              # markup shell — all content is injected from data/
├── css/styles.css          # mobile-first, 600 / 900 / 1200px breakpoints
├── js/
│   ├── main.js             # renders every section from portfolioData
│   ├── terminal.js         # interactive terminal
│   ├── theme.js            # light/dark, remembers the choice
│   └── neural-pattern.js   # canvas background
├── data/portfolio.js       # ← EDIT THIS to change any content
└── assets/
    ├── kaustiki.jpg
    ├── akurati-kaustiki-resume.pdf
    └── akurati-kaustiki-mtech-dissertation.pdf
```

**All content lives in `data/portfolio.js`.** Nothing is hard-coded in the HTML —
edit that one file to change text, add a project, or reorder anything.

---

## Terminal commands

| Command | Description |
|---|---|
| `help` | List all commands |
| `whoami` | Name, role, current focus |
| `about` | The short version |
| `skills` | Technical skills by area |
| `experience` | Work history |
| `projects` | What I've built |
| `education` | Degrees and marks |
| `certifications` | Certifications and internships |
| `stats` | A few numbers |
| `resume` | Open the résumé PDF |
| `dissertation` | Open the M.Tech dissertation |
| `finearts` | Life outside code |
| `contact` | How to reach me |
| `theme` | Toggle light/dark |
| `clear` | Clear the screen |

Also: `ls`, `pwd`, `date`, `echo`, `history`, `sudo`.
**Tab** completes, **↑ / ↓** recall history, **Ctrl+L** clears.
Old-style commands (`df.info`, `projects.head()`, `theme.toggle()`) still work as aliases.

---

## Adding a project

Append to the `projects` array in `data/portfolio.js`:

```js
{
    id: "my-project",              // unique, used for the detail panel id
    title: "My Project",
    subtitle: "What kind of thing it is",
    org: "Where it was built",     // optional
    dates: "March 2026",
    category: "Backend",           // must be one of `categories` below
    featured: false,               // featured cards span the full width
    description: "One paragraph.",
    highlights: ["Bullet one.", "Bullet two."],          // optional
    detail: [{ heading: "…", body: "…" }],               // optional, collapsible
    tech: ["FastAPI", "PostgreSQL"],
    links: [{ label: "Repo", href: "https://…" }]        // optional
}
```

The project filter is driven by the fixed `categories` array — **not** by tech tags.
Keep that list to four or five entries; it is a filter, not an index.

---

## Deploying to GitHub Pages

The site is already static at the repo root, so no build is needed.

### One-time setup

1. Push `main` to GitHub (see below).
2. On GitHub, go to **Settings → Pages**.
3. Under **Source**, choose **Deploy from a branch**.
4. Set branch to **`main`** and folder to **`/ (root)`**, then **Save**.
5. Wait ~1 minute. The URL appears at the top of that same page.

### Publishing changes

```bash
git add -A
git commit -m "Update portfolio"
git push
```

Pages redeploys automatically on every push to `main`. Changes go live in about a minute.

### Notes

- `.nojekyll` is committed so GitHub serves the files as-is rather than running Jekyll.
- Every path in the site is **relative**, so it works both at
  `kaustiki.github.io/portfolio_opencode/` and at a bare domain.
- **Want `kaustiki.github.io` instead of `/portfolio_opencode`?** Rename the repo to
  exactly `kaustiki.github.io` (Settings → General → Repository name). Nothing in the
  code needs to change.
- **Custom domain?** Settings → Pages → Custom domain, then add a `CNAME` record at
  your registrar pointing to `kaustiki.github.io`.

---

## Browser support

Modern evergreen browsers. Uses ES modules, CSS custom properties, `color-mix()`,
`overflow: clip`, `IntersectionObserver` and `dvh` units.
