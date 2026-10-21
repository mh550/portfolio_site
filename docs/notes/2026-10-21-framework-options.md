# Framework options: a vintage OS, console or terminal base (P6-03)

P6-03 of the v3 run, 2026-10-21. v3 spec § 11, item 3: Michael is thinking about a base that looks like a vintage
OS, a game console or a CRT TV. This note lists six real open-source foundations, says what moving this site's
data layer onto each would take, and recommends one of three paths: **fork** (move the site onto it), **borrow**
(take the look as tokens and components, keep the site) or **stay** (change nothing). It pairs with
`docs/design/2026-10-21-design-directions.html` (P6-02, three retro directions, recommends 1, the terminal) and
`docs/design/2026-10-21-projects-showcase-options.html` (P6-01). Docs only: nothing here changes the site.

## The six candidates

Licence and last activity are read from each repo through the GitHub API (`gh api repos/<owner>/<repo>`:
`license.spdx_id`, `pushed_at`) and its `LICENSE` file on 2026-10-21; the stack from its `package.json` and file
tree (GitHub's language field says JavaScript for daedalOS, because of its `vendor/`, and MDX for WebTUI).
"Last activity" is the date of the last push to any branch.

| # | Project | Licence (from the repo) | Stack | Last activity | What it gives |
|---|---|---|---|---|---|
| 1 | daedalOS · <https://github.com/DustinBrett/daedalOS> (demo <https://dustinbrett.com>) | MIT | Next.js 16 Pages Router (`pages/_app.tsx`, one `pages/index.tsx`), React 19, styled-components 6, TypeScript; Jest + Playwright | 2026-10-10 | A whole desktop OS in the browser: draggable windows, taskbar, start menu, file explorer over BrowserFS and IndexedDB, a terminal, many built-in apps. A base to fork. |
| 2 | React95 (`@react95/core`) · <https://github.com/React95/React95> (docs <https://react95.github.io/React95/>) | MIT, with a line above it: "Windows and all associated images are the property of the Microsoft Corp and are not covered by this license" (so GitHub reports `NOASSERTION`) | React component library (`@react95/core` 10.0.6, peer `react >= 16.8.0`), styled with vanilla-extract; icons in `@react95/icons`; Vitest | 2026-10-20 | Windows 95 components: windows (`Frame`, `Modal`), title bars, buttons, inputs, a taskbar and start menu, the icon set. A retro UI kit. |
| 3 | 98.css · <https://github.com/jdan/98.css> (docs <https://jdan.github.io/98.css>) | MIT | One CSS file (npm `98.css` 0.1.21), no JavaScript; styles semantic HTML (`button`, `fieldset`, `.window`, `.title-bar`, tree views) | 2025-09-07 | Windows 98 look on plain markup, any framework. A retro UI kit. |
| 4 | NES.css · <https://github.com/nostalgic-css/NES.css> (docs <https://nostalgic-css.github.io/NES.css/>) | MIT | SCSS compiled to CSS (npm `nes.css` 2.3.0), class-based (`nes-btn`, `nes-container`), no JavaScript; ships no font and recommends Press Start 2P | 2024-01-17 | 8-bit console look: pixel borders, dialog boxes, buttons, progress bars, pixel icons. A retro UI kit. |
| 5 | M4TT72 Terminal · <https://github.com/m4tt72/terminal> (demo <https://term.fathi.me>) | MIT | Svelte 4, TypeScript, Vite, Tailwind 3; Vitest + Playwright | 2026-08-20 | A terminal-style website: a prompt, commands with history and Tab completion, themes. A terminal portfolio to fork. |
| 6 | WebTUI · <https://github.com/webtui/webtui> (docs <https://webtui.ironclad.sh>) | MIT | CSS library in a monorepo (`@webtui/css` 0.1.10, pre-1.0) imported into CSS `@layer base, utils, components`; attribute API (`box-="square"`, `size-="large"`); theme packages (Catppuccin, Gruvbox, Nord, Everforest, Vitesse, Osmium) | 2026-10-12 | Terminal UI on the web: box-drawing frames, buttons, inputs, a monospace grid. A retro UI kit for direction 1. |

URL check, `curl -sIL -o /dev/null -w '%{http_code}' <url>` on 2026-10-21 (no user agent; code after redirects):

```
200 https://github.com/DustinBrett/daedalOS
200 https://dustinbrett.com
200 https://github.com/React95/React95
200 https://react95.github.io/React95/
200 https://github.com/jdan/98.css
200 https://jdan.github.io/98.css
200 https://github.com/nostalgic-css/NES.css
200 https://nostalgic-css.github.io/NES.css/
200 https://github.com/m4tt72/terminal
200 https://term.fathi.me
200 https://github.com/webtui/webtui
200 https://webtui.ironclad.sh
200 https://github.com/ryokun6/ryos
200 https://github.com/ShizukuIchi/winXP
200 https://github.com/satnaing/terminal-portfolio
200 https://github.com/react95-io/React95
```

### Looked at and left out

- **ryOS** (<https://github.com/ryokun6/ryos>): a classic Mac OS desktop in the browser, active (pushed 2026-10-19),
  but AGPL-3.0: a fork would put the whole site under a network copyleft licence. Not worth that for a look.
- **winXP** (<https://github.com/ShizukuIchi/winXP>): a Windows XP desktop in React, MIT, last push 2023-11-18.
  daedalOS does the same job and is maintained.
- **satnaing/terminal-portfolio** (<https://github.com/satnaing/terminal-portfolio>): MIT, React 18 + Vite +
  styled-components, last push 2025-04-27. Closer to this site's stack than M4TT72's, but older and less active.
- **The older React95** (<https://github.com/react95-io/React95>, npm `react95` 4.0.0): MIT, last push 2024-01-14,
  needs styled-components as a peer. `@react95/core` (row 2) is the maintained one.
- **A CRT TV.** No maintained open-source web UI kit for a CRT TV turned up; the CRT look is a frame and a
  scanline overlay, which P6-02 direction 2 already draws in a few lines of CSS. cool-retro-term (cited in P6-02) is
  a desktop terminal emulator written in QML, not a web foundation.

## What this site is today (the cost of leaving it)

Read from the repo on 2026-10-21:

- `npx jest --silent 2>&1 | tail -5` prints `Test Suites: 100 passed, 100 total` and
  `Tests: 1859 passed, 1859 total` (the spec's "1115-test" figure is from before v3). 55 of the 100 test files
  render markup with Testing Library; the rest test data, contracts, routes and pure functions.
- The data layer is 8 files in `src/lib/data/`, 1969 lines (`wc -l`), with no React or Next.js import: 10 projects
  in `projects.ts` (4 with a `caseStudy`), `experience.ts`, `skills.ts`, `profile.ts`, `approach.ts`,
  `competencies.ts`, `concierge.ts`. It moves to any TypeScript stack unchanged; it would need a rewrite only in a
  non-TypeScript one.
- The case-study template is 6 Server Components in `src/components/projects/case-study/` plus the diagrams in
  `src/components/projects/diagrams/index.tsx`, styled with Tailwind 4.
- The concierge is `ConciergeProvider.tsx` (734 lines) and 11 more files in `src/components/concierge/`, over
  `src/lib/concierge/` (9 files, 592 lines, no React). The provider imports `usePathname` and `useRouter` from
  `next/navigation` (App Router) for the usher, and the token route is an App Router route handler with LiveKit
  pinned (D41).
- What the tests pin and a fork would have to win back: one page per route that a crawler and a print run can
  read (sitemap, Open Graph images, `/card`, the vCard), the reduced-motion and AA rules (brand.md), the content
  guard, contract v1 and v2 for the agent (D95), the usher's allowlist (D94), and the phone first: brand.md's third
  reader meets Michael at a conference "usually on a phone, for under a minute".

## Porting cost, per candidate

The hours below are estimates, not measurements. They assume the work runs the way this run does (Michael writes
the spec and reviews; agent sessions write the code and tests), that the data files are imported unchanged, and
that a test which renders markup is rewritten for the new markup rather than kept. They count engineering time to
reach today's behaviour, not the design work P6-02 already did.

### 1. daedalOS: fork, about 60–90 hours

1. Fork, remove the apps the site does not need (emulators, the media players, the browser), keep windows,
   taskbar and file explorer.
2. Add one app per section (About, Projects, Experience, Skills, Contact) that renders the current page bodies in a
   window, and a folder per project in its file system that opens the case study.
3. Bridge the styles: its components use styled-components and ours use Tailwind 4 classes, so either add Tailwind
   to its build (two styling systems side by side) or rewrite the case-study components, `ProjectCard` and the
   diagrams in styled-components.
4. Move the concierge: mount `ConciergeProvider` in `pages/_app.tsx`, swap `next/navigation` for `next/router`,
   move the token route to `pages/api/`, and change the usher from "push a route" to "open a window" (a new mapping
   from the contract's hrefs to windows, and its tests).
5. Win back one URL per page: daedalOS is one `pages/index.tsx`, so every project, `/card`, the sitemap and the Open
   Graph images need routes added beside the desktop, plus a phone layout (a desktop with draggable windows at
   390 px is the weakest first minute for the conference reader).
6. Rewrite the 55 markup test files and the harness checks (smoke, captures, print, contact, skills) for windows.

Next.js 16 allows `app/` beside `pages/`, so steps 4 and 5 could instead keep the token route, the project pages,
`/card`, the sitemap and the Open Graph images as App Router files; the price is a full page load whenever a visitor
crosses between the two routers, which ends the desktop's state, and the provider mounted in both.

Assumption behind the range: steps 3 and 5 are most of it; 60 if Tailwind is added beside styled-components and the
App Router pages are kept, 90 if the case-study components are rewritten and every route moves into the desktop.

### 2. React95 (`@react95/core`): borrow components, about 20–30 hours

1. Record a decision for a new runtime dependency (ground rule 9). Its styles ship as precompiled CSS
   (`*.css.ts.vanilla.css` in the 10.0.6 tarball), so no vanilla-extract plugin; but no file has `"use client"` and
   its index pulls in hook components (`Modal`, `Tabs`), so the site's Server Component pages need a small client
   re-export file to use it.
2. Wrap each page's content in its `Frame`/title bar, the concierge drawer in a `Modal`-style window, and keep every
   route and the data layer as they are.
3. Restyle the case-study components to the Windows 95 bevels with tokens, or use its buttons and inputs directly.
4. Update the markup tests that pin classes or structure (a subset of the 55).

Assumption: the routes, data, concierge logic and most tests do not move; the cost is the wrapper, the restyle and
the plugin question. The licence carve-out means no Windows imagery (logo, start-button flag) can be copied in.

### 3. 98.css: borrow the stylesheet, about 10–16 hours

1. Scope it: it styles bare elements (`body`, headings, links, buttons, inputs, fieldsets, tables), so imported
   globally it would restyle the whole site, pill and graph controls included. Copy the needed rules (window, title bar, bevelled button) into a `@layer`
   under a `.win98` class, keeping its MIT notice, rather than importing the file.
2. Apply the class to the page shell and the cards; keep Tailwind for layout.
3. Re-check AA: its defaults (`--surface: #c0c0c0` in its `style.css`) are a light theme, so the memory colours (D90) and
   every token would need a new contrast table.

Assumption: a look on the existing components, no new structure; the contrast pass is the uncertain half.

### 4. NES.css: borrow for one page, about 8–12 hours

1. Scope its classes to one page, for example `/projects/home-media-server` (the DJ crate pipeline), where P6-02 says a cartridge "could still
   appear once".
2. Add Press Start 2P through `next/font` (headings only, as P6-02 direction 2 uses it: "never in a sentence")
   and re-check the contrast on its palette.
3. Note the risk: the last push was 2024-01-17, so a bug in it is ours to fix.

Assumption: one page, no shared components changed.

### 5. M4TT72 Terminal: fork about 80–120 hours, or borrow the idea about 10–14 hours

Fork:
1. Rewrite every page, the case-study template and the diagrams in Svelte 4 (none of the React components move).
2. Rewrite the concierge provider and the panel in Svelte and re-derive its state machine and tests. The LiveKit
   calls already go through `livekit-client`; only `RoomAudio.tsx`'s `RoomAudioRenderer` (the one
   `@livekit/components-react` import, a React-only package) needs a hand-written `track.attach()` replacement.
3. Rebuild routing, the sitemap, the Open Graph images and the token route in SvelteKit or another server, since
   the project builds a single Vite app.
4. Port the 1859 tests to Vitest and the new markup.

Borrow instead: a `/terminal` route in this site where `help`, `ls projects`, `open <slug>` and `whoami` read the
existing data files and link to the real pages; or the concierge's text box drawn as a prompt. The data layer
already holds everything such commands would print.

Assumption: the fork range is a full rewrite of 45 component files and 11 pages, with the concierge the riskiest
part; the borrow range is one client component, its parser and its tests.

### 6. WebTUI: borrow, about 6–10 hours on top of P6-02's token pass

1. After P6-02's token-only pass (colours, IBM Plex, square radii), copy WebTUI's box rule
   (`packages/css/src/utils/box.css`) and its grid rule into `globals.css` with the MIT notice. Do not import
   `@webtui/css` whole: its `base` layer sets the `html, body` background (white by default) and a monospace font,
   and its `components` layer restyles every bare `button`, `input`, `pre`, `table` and `textarea`, the same global
   restyle as 98.css.
2. Settle the layer order: Tailwind 4 uses native layers (`theme, base, components, utilities`), so the copied rules
   go in `@layer components`, below `utilities`, or a utility class stops overriding them. (WebTUI keeps `box-` in
   its own `utils` layer; declared after Tailwind's import, that layer would land above `utilities`. If the package
   is ever imported, declare `@layer theme, base, utils, components, utilities;` once, before both imports.)
   Unlayered rules in `globals.css` beat every layer, so the copies must not be left unlayered.
3. Use the frame for the hero's boot log, the man-page `ProjectCard` and the concierge's tmux pane, the component
   steps P6-02 lists after the token pass.

Assumption: the look only; no route, data, concierge or test structure moves, and only tests that pin the touched
components' classes change.

## Recommendation: borrow, from WebTUI, in P6-02's direction 1

**Borrow; do not fork.** Every fork here costs more than building the look on the site, because what the site is
worth is not its look but its behaviour: 1859 tests pinning pages that crawl and print, the case-study template,
contract v1 and v2 for an agent built in another repo, the usher's allowlist, AA and reduced motion. daedalOS is
the only fork that keeps TypeScript and React, and it is a different router, a different styling system, one URL
and a desktop-first layout; M4TT72 Terminal is a different framework entirely. Either spends 60–120 hours (above)
to get back to where the site is now, before any of the new look ships.

**Not stay either.** Michael finds the site bland (v3 spec § 11), and P6-02 shows the look can change in one
token-only PR that changes no component's markup.

**Pairs with direction 1, the terminal.** WebTUI (row 6) is the closest kit to it: MIT, active, plain CSS, no
JavaScript, and its box-drawing frames are the border of the window chrome direction 1 draws; the title bar stays ours. The order:

1. P6-02's token-only pass (`globals.css` colours and radii, IBM Plex through `next/font`, a new D for the fonts).
2. Borrow WebTUI's frame and grid as CSS components (row 6, about 6–10 hours), then the boot log, the man-page card
   and the tmux pane, one PR each with a 390 capture.
3. Later, if Michael wants a toy: M4TT72's command line as a `/terminal` route over the data files (row 5's borrow,
   about 10–14 hours), off the Navbar, as `/talk` is since D89.

If Michael picks direction 2 (cartridge) instead, borrow from NES.css for one page (row 4); for an OS-window look,
React95 (row 2) is the maintained kit, with the Microsoft-imagery carve-out in its licence.

Question for Michael: borrow (as above), or do you want to see a daedalOS fork spiked on a branch before deciding?

## Sources

- Each candidate's licence and last push: `gh api repos/<owner>/<repo>` and its
  `LICENSE`, `README.md` and `package.json` (versions from `npm view <package> version`), read 2026-10-21.
- Test count: `npx jest --silent 2>&1 | tail -5` on this branch at commit 55564bb. Test files: `find src/__tests__
  \( -name '*.test.ts' -o -name '*.test.tsx' \) | wc -l` (100) and `grep -rl "@testing-library/react" src/__tests__
  --include='*.test.ts' --include='*.test.tsx' | wc -l` (55).
- Data layer: `wc -l src/lib/data/*.ts` (1969 total); `grep -c "^    slug:" src/lib/data/projects.ts` (10);
  `grep -n "caseStudy: {"` (4). Concierge: `wc -l src/components/concierge/ConciergeProvider.tsx` (734),
  `wc -l src/lib/concierge/*.ts` (592 total). Components and pages: `find src/components -name '*.tsx' | wc -l` (45),
  `find src/app -name page.tsx | wc -l` (11).
- The readers and the phone: `docs/notes/brand.md` § Positioning. Ground rule 9 (no new runtime dependency without a
  decision): `docs/specs/2026-10-18-portfolio-v2.md` § Ground rules, kept by `docs/specs/2026-10-21-portfolio-v3.md`;
  the 1115 figure: the v3 spec § 11. D41, D89, D90, D94, D95:
  `docs/specs/2026-10-18-portfolio-v2.md`.
- Direction 1, the token-only pass, "a cartridge could still appear once": `docs/design/2026-10-21-design-directions.html`
  § Recommendation.
- Hour ranges: this note's own estimates, with the assumption under each.

## Review (P6-04, 2026-10-21)

Covers the three P6 files: this note, `docs/design/2026-10-21-design-directions.html` and
`docs/design/2026-10-21-projects-showcase-options.html`.

**URLs.** `grep -ohE 'https?://[^" )<>`]+'` over the three files, trailing punctuation stripped, de-duplicated:
46 URLs; `curl -sIL -o /dev/null -m 20 -w '%{http_code}'` on each: 46 × 200, none redirected to a non-200. Nothing
fixed or removed.

**Self-contained.** `grep -nE '<script[^>]*src|<link[^>]*href="?http|<img[^>]*src="?http|@import|url\(http'
docs/design/*.html` prints nothing. Both HTML files have inline CSS only.

**Render.** Headless Chromium (Playwright), `file://` load, 500 ms wait, console/page errors and failed requests
counted, `document.documentElement.scrollWidth` against `innerWidth`:

```
design-directions 1280: scrollWidth 1280 inner 1280 errors 0
design-directions  390: scrollWidth  390 inner  390 errors 0
projects-showcase 1280: scrollWidth 1280 inner 1280 errors 0
projects-showcase  390: scrollWidth  390 inner  390 errors 0
```

**Numbers.** Every digit-bearing line was extracted (285 + 122 lines from the HTML text, 86 from this note) and
traced. Re-run against the repo today:

| Claim | Source | Result |
|---|---|---|
| 10 projects, 8 featured, 4 case studies | `grep -c "^    slug:"` / `featured: true` / `caseStudy: {` in `projects.ts` | 10, 8, 4 |
| 55 passing, 52 merged in 12 PRs, +374 tests, ≈ $2.53 | `projects.ts` metrics; `docs/notes/evidence-agent-harness.md` l. 70, `about-narrative-bullets.md` l. 23 | match |
| 2 days → ~6 hrs | `projects.ts` (GoHighLevel metric) | match |
| 1,359 tests; 20+ → 7 fields | `projects.ts`; `evidence-media-server.md` l. 58, 69 | match |
| 17 iterations, 3 projects, 14 in Oct 2026 | `when:` entries in `projects.ts`: 6 + 5 + 6; only "Sep 2026", "Sep 17–18" and "Feb 12–14" are not October | match |
| 51 nodes, six clusters, Agent Harness 9 project edges | `skills.ts` (`id:` count between `nodes` and `edges`; `projectStacks['agent-harness']`) | 51, 6, 9 |
| 1859 tests, 100 files, 55 with RTL | CLAUDE.md; `find`/`grep -rl` commands in § Sources | 100, 55 |
| 8 data files, 1969 lines; ConciergeProvider 734 lines; `lib/concierge` 9 files, 592 lines; 45 components; 11 pages; 6 case-study components | `wc -l`, `ls`, `find` | all match |
| Agent Harness title 66 characters | `projects.ts` title string | 66 |
| Contrast ratios (spot-checked 14.76, 5.93, 16.67) | WCAG 2 formula on the listed hex pairs | match |
| Memory counts (Profile 3 … Working 9), transcript lines, meter needles | "illustrative" tag on each mockup (lines 471, 672, 881 of the directions file; `no latency is measured yet`) | labelled |
| Font sizes, pixel cell sizes, hour ranges | the files' own design choices and estimates | stated as such |

**Findings.** None needed a fix, so there is no before/after. One caveat: the 17/14 iteration figure depends on the
free-text `when:` strings, which the showcase file already notes.
