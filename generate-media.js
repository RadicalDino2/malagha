/* Scans public/memories/web and writes public/memories.json.
   A matching file in public/memories/thumbs is used as the small
   drifting version; the one in web/ is what the lightbox opens.

   File name becomes the caption:  "03-Beach day.webp"  ->  "Beach day"
   Names that are just a counter ("memories10", "IMG_2831", "Untitled")
   get no caption rather than a silly one.                              */
const fs = require("fs");
const path = require("path");

const pub = path.join(__dirname, "public");
const webDir = path.join(pub, "memories", "web");
const thumbDir = path.join(pub, "memories", "thumbs");

const img = /\.(jpe?g|png|gif|webp|avif)$/i;
const vid = /\.(mp4|webm|mov)$/i;
const junk = /^(untitled|image|photo|img|dsc|pxl|screenshot|memor\w*|childhood\w*)[\s._-]*\d*$/i;


/* ------------------------------------------------------------------
   Intrinsic size, read straight out of the file header. No deps, so
   this works the same on a build server as it does here. Returns null
   if the format isn't one it knows -- the page copes without it.      */
function dimensions(file) {
  let fd;
  try {
    fd = fs.openSync(file, "r");
    const buf = Buffer.alloc(65536);
    const n = fs.readSync(fd, buf, 0, buf.length, 0);
    const b = buf.subarray(0, n);

    /* PNG */
    if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47)
      return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };

    /* GIF */
    if (b.length > 10 && b.toString("ascii", 0, 3) === "GIF")
      return { w: b.readUInt16LE(6), h: b.readUInt16LE(8) };

    /* WebP: VP8 (lossy), VP8L (lossless), VP8X (extended) */
    if (b.length > 30 && b.toString("ascii", 0, 4) === "RIFF" &&
        b.toString("ascii", 8, 12) === "WEBP") {
      const kind = b.toString("ascii", 12, 16);
      if (kind === "VP8 ")
        return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
      if (kind === "VP8L") {
        const v = b.readUInt32LE(21);
        return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 };
      }
      if (kind === "VP8X")
        return {
          w: (b[24] | (b[25] << 8) | (b[26] << 16)) + 1,
          h: (b[27] | (b[28] << 8) | (b[29] << 16)) + 1,
        };
    }

    /* JPEG: walk the markers to the start-of-frame */
    if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
      let i = 2;
      while (i + 9 < b.length) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1];
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc)
          return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
        if (m === 0xd8 || (m >= 0xd0 && m <= 0xd9)) { i += 2; continue; }
        i += 2 + b.readUInt16BE(i + 2);
      }
    }
  } catch { /* unreadable: just skip the hint */ }
  finally { if (fd !== undefined) try { fs.closeSync(fd); } catch {} }
  return null;
}

const ls = (d) =>
  fs.existsSync(d)
    ? fs.readdirSync(d).filter((f) => img.test(f) || vid.test(f))
    : [];

const thumbs = new Set(ls(thumbDir));

const files = ls(webDir).sort((a, b) =>
  a.localeCompare(b, undefined, { numeric: true })
);

const list = files.map((f) => {
  const stem = f.replace(/\.[^.]+$/, "");
  const name = stem.replace(/^\d+[\s._-]*/, "").replace(/[_-]+/g, " ").trim();
  const thumb = [...thumbs].find((t) => t.replace(/\.[^.]+$/, "") === stem);
  const d = vid.test(f) ? null : dimensions(path.join(webDir, f));
  return {
    src: "memories/web/" + encodeURIComponent(f),
    thumb: thumb ? "memories/thumbs/" + encodeURIComponent(thumb) : null,
    type: vid.test(f) ? "video" : "image",
    caption: junk.test(name) ? "" : name,
    w: d ? d.w : null,
    h: d ? d.h : null,
  };
});

fs.writeFileSync(
  path.join(pub, "memories.json"),
  JSON.stringify(list, null, 2)
);
console.log(`Found ${list.length} memories`);
