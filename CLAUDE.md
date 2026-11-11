# Sandbox repo

Each app is a folder with an `index.html` (single file, no build step), a `thumb.png` (960×540 still) and a `thumb.webp` (the 6 second looping home page clip, 960×540).

**Whenever you add a new app, also add it to the homepage.** The homepage (`/index.html`, laid out like the sketches site) draws its tiles from `/apps.json`:
add an entry at the **top** of the array (tiles are ordered newest first) with `id`, `title`, `category`, `url` (`<folder>/`), `thumbnail` (`<folder>/thumb.png`), `preview` (`<folder>/thumb.webp`) and `alt`.
Make the clip by adding the app to the table in `tools/record-clips.js` and running it (see `tools/README.md`), and re-record the clip whenever the app's look changes.
Also add the app's `<nav>` "Sandbox / Back to all projects" bar linking to `../`.

**Every new or changed app must be live.** The site is GitHub Pages served from the default branch (`claude/epic-pasteur-fsjjc8`), so pushing a feature branch is not enough:
open a pull request into the default branch, merge it, and confirm the Pages deploy succeeded and the app and its homepage tile are on the live site (https://kristynagottvald.github.io/sandbox/).
