# Apps repo

Each app is a folder with an `index.html` (single file, no build step) and a `thumb.png` (960×540).

**Whenever you add a new app, also add it to the homepage** (`/index.html`): copy an existing
`<a class="card">` block in `<main class="grid">` and put the new one **first** (cards are ordered newest first), point it at `<folder>/` and `<folder>/thumb.png`,
and add the app's `<nav>` "Apps / Back to all projects" bar linking to `../`.
