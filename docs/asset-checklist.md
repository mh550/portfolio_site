# Asset checklist

Screenshots and recordings the site is waiting for, one section per project. Nothing here is faked in the meantime
(spec D11): until a file exists, the page carries authored diagrams instead. M9 extends this list for every project.

## HitList (`/projects/hit-list`)

No screenshots exist yet (no public build: Expo Go only; none in the repo). Plan: `docs/plans/2026-10-18-M6-hit-list.md`
§ Media.

- Capture on the iPhone, in Expo Go, at spots in public places only: no home address, no spot whose location
  should stay private, the blue "you are here" dot off or out of frame. Name every spot that shows (an untitled
  label carries its town), keep the list's distances from giving away where you live, and frame the map so street
  names near home are out of view. Portrait PNG screenshots of
  1. **Spots, List view** with 3 or more spots (distance column visible),
  2. **Spots, Map view** (pins, a cluster if one shows),
  3. **Quick Add** (the camera → review step),
  4. **a spot's detail screen** (photos, title, tags),

  or instead a **15 s screen recording** (MP4, H.264, no audio) of Quick Add → save → the spot in the list.
- Destination: `public/projects/hit-list/` (e.g. `01-list.png` … `04-detail.png`, or `quick-add.mp4`), each
  image under ~120 KB after compression (as the media-server shots are).
- Once the simplification is built, capture the edit screen with the speed scale too; until then, label any
  shot of the old form "before the simplification".
- The `media` entry to add to the hit-list project's `detail` in `src/lib/data/projects.ts` (D29: with `width` and
  `height` the gallery shows phone shots uncropped, three across from `sm`):

  ```ts
  media: [
    { type: 'image', src: '/projects/hit-list/01-list.png', alt: 'The Spots list on an iPhone: …', caption: '…', width: 1179, height: 2556 },
    // … one entry per shot; a recording is { type: 'video', src: '/projects/hit-list/quick-add.mp4', alt: '…', caption: '…' }
  ],
  ```

  `width`/`height` are the file's own pixels (1179 × 2556 is an iPhone 15/16 screenshot; read them with
  `file` or an image viewer). Then replace the "no media" test in `src/__tests__/lib/case-study-hit-list.test.ts`
  (`hit-list media (D11)`) with checks on the new files, as `case-study-home-media-server.test.ts` does.
