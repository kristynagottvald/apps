# Sandbox

A personal lab for experimental **brand, web and motion** work. Each project is a small, self-contained exploration: a looping motion system, an interactive generator, a landing page or email concept, or a quick product mockup. Most are built around a brand's visual language (type, colour, grid, geometry) and push it into something that moves or that you can play with.

## See it live

**https://kristynagottvald.github.io/sandbox/**

The home page is the best way to browse. Every project is a tile that plays a 6 second looping preview, newest first. Click a tile to open the full project.

## What's in here

| Category | What it is | Projects |
| --- | --- | --- |
| **Motion** | Looping brand animations, explainers and screens, mostly pure CSS/JS/canvas | Search Robot, Thread Live Session, Grid Alphabet, Arrow Line Generator, Brand Audit Engine, Agentic Storefront Walkthrough, ILG Pixel Globe, Human / Tech Motion Loop, Workout Year in Review Reels, Clearco Logistics Motion, Grubclub Order, Stop Building Demos, Clearco Terrain, Clearco Target Frame |
| **Interactive Engine** | Generators with live controls for producing on-brand assets and motion variants | Grubclub Holiday Grid, Postmark Awards Motion Engine, Postmark Awards Ribbon Engine, Grubclub End Card Maker, Lifecycle Image Studio, Banner Template Studio, Blog Banner Studio |
| **Tools** | Small utilities for brand and marketing production | Thread Brand Guidelines, Location Hero, Conference Post Generator |
| **Landing Page** | Campaign landing page concepts | Clearco Attribution Guide, Clearco Logistics Guide |
| **Email** | Email design concepts | Grubclub Offer Emails |
| **Mockup** | Product and analytics UI mockups | Video Synopsis, A/B Test: PSC Page Variants |

`apps.json` is the source of truth for the full list, with a description of each project.

## How it's built

- **One folder per project**, each with a single `index.html`. No build step, no framework, no bundler; open the file and it runs.
- Each folder also has `thumb.webp` (the 6 second looping clip, 960×540) and `thumb.png` (its first frame) for the home page tile.
- The home page (`index.html`, `styles.css`, `script.js`) draws its tiles from `apps.json`, ordered newest first.
- Every project has a "Sandbox / Back to all projects" bar linking back to the home page.

## Adding or updating a project

1. Create `<folder>/index.html` with the back-to-home nav bar.
2. Add an entry at the **top** of `apps.json` (`id`, `title`, `category`, `url`, `thumbnail`, `preview`, `alt`).
3. Add the project to the table in `tools/record-clips.js` and record its clip; see [`tools/README.md`](tools/README.md). Re-record whenever the look changes.
4. Open a pull request into the default branch (`claude/epic-pasteur-fsjjc8`), merge it, and confirm the GitHub Pages deploy shows the project and its tile on the live site.
