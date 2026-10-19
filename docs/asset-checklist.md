# Asset checklist

Screenshots and recordings the site is waiting for, one section per project. Nothing here is faked in the meantime
(spec D11): until a file exists, the page carries authored diagrams instead. Every project that still lacks real media is below.

Every section ends with the same two steps: put the file in `public/projects/<slug>/` (compress; images under ~120 KB),
then add the `media` entry to that project's `detail` in `src/lib/data/projects.ts`. The `media` shape is
`{ type: 'image' | 'video', src, alt, caption?, width?, height? }`; with `width` and `height` set (the file's own pixels)
the gallery shows a phone shot uncropped, three across from `sm`. Run `npm test` afterwards: the content guard scans
`public/` and `src/` for hostnames, IPs, phone numbers and tokens.

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

## Agent harness (`/projects/agent-harness`)

Three captures; the page carries terminal renders and diagrams until they exist (evidence brief, last bullet of
"Show").

1. **`harness attach` in tmux**: the live driver pane mid-run, at phone-friendly width if you can (a 100-column
   terminal, cropped). Crop out the prompt line if it shows a hostname or path you would not publish.
2. **A phone INBOX.md edit**: the GitHub app editing `.harness/runs/<run>/INBOX.md` on the run branch (the `status:`
   line or an answer under `## Answers`). Portrait screenshot; no notifications or other apps visible.
3. **An ntfy notification** on the lock screen or in the shade. Blur or crop the topic name: the content guard
   rejects `ntfy.sh/` URLs and the topic is a secret.

Destination: `public/projects/agent-harness/` (`01-attach.png`, `02-inbox-edit.png`, `03-notification.png`). Entry,
for `projects.ts` under the `agent-harness` project's `detail`:

```ts
media: [
  { type: 'image', src: '/projects/agent-harness/01-attach.png', alt: 'harness attach: the driver in tmux …', caption: '…', width: 1200, height: 800 },
  { type: 'image', src: '/projects/agent-harness/02-inbox-edit.png', alt: 'INBOX.md open in the GitHub app on a phone …', caption: '…', width: 1179, height: 2556 },
],
```

## Home media server (`/projects/home-media-server`)

Already has three fake-data screenshots of the crates web client (`public/projects/home-media-server/`). Missing:
the real daily surface.

- **Amperfy on the phone**: the library or a playlist playing from the home server, portrait, now-playing bar
  visible. Use a playlist whose name you are happy to publish; no server address in Amperfy's settings screens, and
  no Spotify playlist links.
- Destination `public/projects/home-media-server/04-amperfy.png`; append to the existing `media` array:

  ```ts
  { type: 'image', src: '/projects/home-media-server/04-amperfy.png', alt: 'Amperfy on an iPhone playing …', caption: '…', width: 1179, height: 2556 },
  ```

  Then extend the media checks in `src/__tests__/lib/case-study-home-media-server.test.ts` to count four files.

## MAXX Potential projects (`/projects/linear-ai-workflow`, `/projects/paint-estimator`)

Only what you are allowed to share: ask MAXX first. A redacted or demo-data screenshot is fine; a customer name,
real bid, internal ticket text or API key is not. If nothing may be shared, leave these pages as they are (the
diagrams carry them).

- **linear-ai-workflow**: the Linear board or an issue template with names and ticket text blurred.
  Destination `public/projects/linear-ai-workflow/01-board.png`.
- **paint-estimator**: the estimator screen with sample numbers (not a real customer's job).
  Destination `public/projects/paint-estimator/01-estimate.png`.

Entry for either, under that project's `detail`:

```ts
media: [{ type: 'image', src: '/projects/<slug>/01-….png', alt: '…', caption: '…', width: 1440, height: 900 }],
```

Other projects (`ghl-jobtread-integration`, `ringcentral-jobtread-integration`, `mirrored-google-calendars`,
`cherished`) carry diagrams only; add media the same way if you have safe captures.
