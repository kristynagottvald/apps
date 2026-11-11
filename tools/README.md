# Home page clips

Every tile on the home page plays a 6 second looping clip (`<app>/thumb.webp`) and shows `<app>/thumb.png` when it is not playing, with reduced motion on, or while the clip loads. The still is the clip's first frame, which is also where the clip loops, so the tile fades between the two without a visible cut.

`record-clips.js` makes the clips. It opens each app in headless Chromium, runs a short scripted interaction the way a visitor would, records the page, crops it to 16:9 and encodes it as a 960x540 animated WebP at 12 fps, and saves its first frame as `thumb.png`. The last half second cross-fades into the first so the loop has no jump.

```bash
node tools/record-clips.js                       # every app
node tools/record-clips.js blog-banner-studio    # one app
```

- Needs Node, Playwright and ffmpeg built with libwebp. With a global Playwright install, run it as `NODE_PATH=$(npm root -g) node tools/record-clips.js`.
- `P5_LIB=/path/to/p5.min.js` serves p5 locally for Stop Building Demos on a machine that cannot reach cdnjs.
- Re-record an app's clip whenever its look changes.

## Adding an app

Add an entry to the `APPS` table in `record-clips.js`:

- `vp`: the viewport, `[width, height]`. The apps have a 49px nav bar on top, so 1280x769 gives a 1280x720 stage.
- `crop`: `[x, y, w, h]` in css pixels, 16:9, the part of the page that goes in the tile. An optional `setup(page)` can measure it and return the rectangle instead.
- `run(page)`: the timeline of actions, in milliseconds after the page is ready. Apps that animate on their own just wait. The clip is about 6.5 seconds long, and the start of the clip is the page before the first action, so leave the first 700ms or so alone.
- `ready`: extra milliseconds to wait before recording, for apps that need time to start.

Then add the app to `apps.json` with `thumbnail` (`thumb.png`) and `preview` (`thumb.webp`).
