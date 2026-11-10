# Malagha — Belated Birthday 👼

A one-page, angel-themed belated birthday wish (and apology for the delay).

## Run it locally

```bash
cd ~/Documents/personel/malagha
python3 -m http.server 5173 --directory public
# open http://localhost:5173
```

## What's on the page

1. **Hero** — gold nimbus and layered wings, her name in gold leaf.
2. **The apology** — a wax-sealed envelope you tap to open the letter.
3. **Bouquet** — red and white roses in 3D, drag to turn them.
4. **Scripture** — Psalm 91.
5. **Seven wishes** — card grid, engraved SVG glyphs.
6. **Memories** — photographs drifting past in two lanes, opposite ways.
   Nothing to scroll. Touch one and it opens.
7. **Make a wish** — a pale cake you blow out (click/tap).
8. **Closing note.**

## What's wired up

| thing | where | notes |
|---|---|---|
| Cinematic intro | `extras.js` §1 | types a line, bursts, reveals the name letter by letter. Plays once per tab (sessionStorage), skippable, auto-ends after 9s no matter what. |
| Smooth scrolling | `extras.js` §2 | Lenis. `script.js` calls `window.__scrollTo()` so the two don't fight over anchors. |
| Custom cursor | `extras.js` §3 | grows over anything clickable. Desktop/fine-pointer only. |
| Magnetic buttons | `extras.js` §4 | buttons lean toward the cursor. |
| Tilting cards | `extras.js` §5 | vanilla-tilt on the seven wishes. |
| Confetti | `extras.js` §6 | on the name reveal, on blow-out, on pinning a wish. |
| Live counter | `extras.js` §7 | **off until you set `CONFIG.birthDate`** — see below. |
| Music | `extras.js` §8 | plays `public/audio/music.mp3` once if it's there, otherwise a pad it synthesises itself. Toggle, bottom right. Starts on click (browsers block autoplay). |
| Blow into the mic | `extras.js` §9 | asks permission, listens for a loud bottom-heavy burst. Clicking still works. |
| Easter egg | `extras.js` §10 | type her nickname anywhere. |
| Drifting photos | `extras.js` §11 | two lanes, opposite directions, ~33 px/s. Hover or focus a lane and it holds still. |
| Lightbox | `extras.js` §11 | opens on the thumbnail already in memory and sharpens, so it never shows an empty frame. Arrows, swipe, Esc. |
| 3D cake | `cake3d.js` | Three.js. Falls back to the old CSS cake if WebGL is unavailable. |
| 3D bouquet | `bouquet3d.js` | Three.js, below the letter. 13 roses, ~377 petals, two draw calls. Drag to spin, lets go into a slow drift. Stops rendering when scrolled off screen. Hides its own section if WebGL is missing. |

Libraries load from CDN (GSAP, canvas-confetti, vanilla-tilt, Lenis, Three.js).
Every one is optional — if a CDN is blocked the page still works, just plainer.

## Two things you have to fill in

Both live in the `CONFIG` block at the top of `public/extras.js`:

```js
const CONFIG = {
  birthDate: null,        // "2001-04-17" or "2001-04-17T09:20"
  nickname: "malagha",    // typing this unlocks the secret note
};
```

- **`birthDate`** — the "you've been here for X days" section stays hidden
  until you set this. I don't know her date of birth, so I left it null
  rather than guess.
- **`nickname`** — defaults to her name. Change it to whatever only she'd type.

## Look & feel

`style.css` is the structural base, `art.css` the art direction (near-black
ground, deep violet glow, gold leaf), `extras.css` the newer pieces.
Nothing on the page is an emoji — every mark is drawn SVG, including the
wings, the seven wish glyphs and the drifting feathers.

Retheming is mostly `:root` at the top of `art.css`:
`--gold` / `--gold-2` (leaf), `--orchid` / `--violet` / `--plum` (the purple),
`--night` / `--deep` (ground), `--vline` (violet hairlines).

## The music

Put your track here:

```
public/audio/music.mp3
```

That's the whole job — the page finds it and fades it in when the
speaker button is pressed. It plays **once**, not on a loop, and the
button returns to its off state when the track finishes. `.m4a`, `.ogg` and `.wav` work
too; if you use a different name or extension, change `CONFIG.music` at
the top of `public/extras.js` to match. `CONFIG.musicVolume` next to it
sets the level, 0 to 1 (it's at 0.55).

With the folder empty the page falls back to the pad it synthesises
itself and logs one line to the console, so nothing breaks in the
meantime.

A note in the hero asks her to go through the page before turning it
on. Edit it in `public/index.html`, the `<p class="musicnote">` under
the subtitle.

**Pick something you have the right to use.** A commercial track on a
public URL is someone else's copyright, even on a page only one person
is meant to see.

## Adding photos / videos

Originals live in `media-src/` and never get deployed (`.vercelignore`).
What goes on the site is a downscaled copy in `public/memories/`:

```
media-src/                    full-size originals, local only
public/memories/web/          max 1200px  — what the lightbox opens
public/memories/thumbs/       max 640px   — what drifts past
```

1. Drop the originals into `media-src/`.
2. Make the two web-sized copies:

```bash
for f in media-src/*.{jpg,jpeg,png}; do
  b=$(basename "${f%.*}")
  ffmpeg -y -i "$f" -vf "scale='min(1200,iw)':'min(1200,ih)':force_original_aspect_ratio=decrease" \
         -map_metadata -1 -q:v 72 "public/memories/web/$b.webp"
  ffmpeg -y -i "$f" -vf "scale='min(640,iw)':'min(640,ih)':force_original_aspect_ratio=decrease" \
         -map_metadata -1 -q:v 68 "public/memories/thumbs/$b.webp"
done
```

`-map_metadata -1` is the part that matters: it drops EXIF, so no camera
model and no GPS coordinates go up with the picture.

3. Rebuild the index:

```bash
node generate-media.js
```

It records each file's width and height by reading the file header
directly — no image library, so it behaves the same on a build server.
The page uses those to size the frame before the bytes arrive.

**Captions** come from the file name: `03-That cafe.webp` → "That cafe".
Names that are only a counter (`memories10`, `IMG_2831`, `Untitled`) get
no caption rather than a silly one. Videos work too — drop an `.mp4` in
`web/` and it plays in the lane and in the lightbox.

The Memories section hides itself if `memories.json` is empty.

## Things to edit

- `public/index.html` — the letter is marked `<!-- ✍️ EDIT THIS LETTER -->`,
  signed `— Dino`. The seven wishes and the closing line are plain text right below it.
- `public/art.css` — the palette lives in `:root` at the top. It overrides
  `style.css`, so edit colours here, not there. The wings are inline SVG in
  `index.html` (gradient `#fg` is gold at the shoulder, violet at the tips).

## Keeping the photographs off the open internet

Nothing here can stop a person who can open the page from saving what
they see. What you can control is **who gets to open it** and **how long
it stays up**. In rough order of how much they actually buy you:

**Already done**

- `media-src/` is in `.vercelignore`, so the full-resolution originals
  never leave this machine. Only the 1200px copies deploy.
- EXIF is stripped at conversion — no camera, no GPS (verified: the
  served files carry no metadata at all).
- `robots.txt` blocks every crawler, including GPTBot, ClaudeBot,
  Google-Extended, CCBot, PerplexityBot and Bytespider.
- `vercel.json` sends `X-Robots-Tag: noindex, noimageindex, noarchive`
  on every response, and `Referrer-Policy: no-referrer`. The header is
  the one that counts — `robots.txt` is a request, the header is an
  instruction, and it also covers anything linked from elsewhere.

Together these keep the photos out of Google Images and out of training
crawls. They do **not** stop anyone who has the link.

**If you want an actual lock**

- *Vercel's own password protection* (Project → Settings → Deployment
  Protection). One switch, properly enforced at the edge. It is a Pro
  feature, so it costs money.
- *A password gate you own* — `middleware.js` at the project root, 401
  until a cookie is set. Free on Hobby, maybe thirty lines, and it can
  carry an expiry date so the site stops serving anything after, say,
  the end of the month. Ask me and I'll write it.
- *Don't publish it at all* — zip `public/` and send it to her, or run
  it on your machine while you're both on a call. Unbeatable, and for a
  one-person birthday page it is not a silly option.

**Two things people get wrong**

- **Deleting isn't undoing.** Vercel keeps every past deployment at its
  own permanent URL. Take the photos out and redeploy and the previous
  deployment still serves them. You have to delete the old deployments
  as well, and that still won't reach anything already cached or saved.
- **Right-click blockers are theatre.** The file is in the browser;
  devtools, the network tab and a screenshot all still work. The page
  does set `draggable=false` and `user-select:none`, which stops an
  accidental drag-to-desktop and nothing more. Treat the link itself as
  the secret, because that is what it is.

## Deploy

Same setup as the other birthday site — Vercel, static:

```bash
npx vercel          # preview
npx vercel --prod   # live
```

`vercel.json` already points at `public/` and runs `generate-media.js` on build.
