# Apps repo

Each app is a folder with an `index.html` (single file, no build step) and a `thumb.png` (960×540).

**Whenever you add a new app, also add it to the homepage** (`/index.html`): copy an existing
`<a class="card">` block in `<main class="grid">` and put the new one **first** (cards are ordered newest first), point it at `<folder>/` and `<folder>/thumb.png`,
and add the app's `<nav>` "Apps / Back to all projects" bar linking to `../`.

**Every new or changed app must be live.** The site is GitHub Pages served from the default branch (`claude/epic-pasteur-fsjjc8`), so pushing a feature branch is not enough:
open a pull request into the default branch, merge it, and confirm the Pages deploy succeeded and the app and its homepage card are on the live site.
