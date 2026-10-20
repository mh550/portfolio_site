# VC4 plan: project order, Talk in the Navbar, the voice widget, the harness wording (2026-10-20)

For the VC4 build sessions (VC4-02 … VC4-06). Spec: `docs/specs/2026-10-20-vc4-order-widget-limits.md` § VC4
(Michael's answers of 2026-10-20, which supersede the v2 spec's D44/D47/D49 and the VC2 intro copy). Decisions go in
`docs/specs/2026-10-19-voice-concierge-page.md` § 7 (D59–D62, § Decisions below).

Build order: VC4-02 (order + Navbar) → VC4-03 (widget) → VC4-04 (wording) → VC4-05 (screenshots) → VC4-06 (review,
hand-off docs, CLAUDE.md counts). Each feature updates the tests it breaks in the same commit (§ Tests).

INBOX.md § Answers was empty at plan time; Michael is at a conference and asked for defaults, not questions.

## Order

`order` in `src/lib/data/projects.ts` (D59). The first five are Michael's; the rest keep their relative order from 6.
`order` stays unique; `featured` does not change (cherished and mirrored-google-calendars stay unfeatured).

| Slug | Before | After |
|---|---|---|
| `agent-harness` | 1 | 1 |
| `voice-concierge` | 5 | 2 |
| `ghl-jobtread-integration` | 6 | 3 |
| `ringcentral-jobtread-integration` | 8 | 4 |
| `home-media-server` | 3 | 5 |
| `linear-ai-workflow` | 2 | 6 |
| `hit-list` | 4 | 7 |
| `paint-estimator` | 7 | 8 |
| `mirrored-google-calendars` | 9 | 9 |
| `cherished` | 10 | 10 |

(The initializer's note listed ringcentral 7 and paint-estimator 8 before VC4; the file says paint-estimator 7,
ringcentral 8. The table follows the file.)

What a visitor now sees:
- `getTopProjects(3)` (the first three **featured** projects by order) becomes **agent-harness, voice-concierge,
  ghl-jobtread-integration**. So `/card`'s Selected work and the home page's Recent work both show, in order:
  "Agent Harness: overnight software delivery with verification gates", "Voice Concierge: a voice agent that
  remembers returning visitors", "GoHighLevel ↔ JobTread Integration". Before: agent-harness, linear-ai-workflow,
  home-media-server. Neither page's code changes; both already derive from `getTopProjects(3)`.
- `/projects` (all filter) lists the ten cards in the table's After order: the two Builder Clarity integrations sit
  together at 3 and 4, the measured case studies (home-media-server, linear-ai-workflow, hit-list) follow.
- The voice-concierge card has no metrics (D47's "band shows the category `ai` until it has a metric" still holds),
  so the home page's second card and `/card`'s second link carry no number. That is honest, and expected.
- Category filters keep the same relative order inside each category (they sort the same `order`).
- No project page changes: `project-page-unchanged.test.tsx.snap` holds no `order`, so the `.snap` stays untouched.

## Navbar

`src/components/Navbar.tsx` `links` gains `{ href: '/talk', label: 'Talk' }` between Projects and Approach (D60).
Eight links: Home, About, Skills, Projects, **Talk**, Approach, Experience, Contact. The desktop `ul` and the mobile
menu both map `links`, so one entry does both; `aria-current="page"` on `/talk` comes from the existing
`pathname === href` rule. The label is "Talk": short for the 390 px menu; the page's h1 ("Talk to my concierge") says
what it is.

Width check for VC4-05: the desktop list shows from `md` (768 px) with `gap-8`; eight `text-sm` labels plus seven
32 px gaps are about 630 px, plus the logo and `px-6`, about 710 px, which fits 768. VC4-05 looks at 1280 (and, if
anything looks tight, 768) and records it.

Docs that call `/talk` "off the Navbar" (v2 spec D44, D49; CLAUDE.md's Routes table row for `/talk`; review guide
§ VC2/VC3): D44 and D49 get a trailing "Superseded by D60 (VC4)." in VC4-01 (this feature); VC4-02 updates the
CLAUDE.md row and the Navbar line in § Components (eight links), VC4-06 the review guide.

## Voice widget

A link, not a player (D61). One file, `src/components/VoiceWidget.tsx`, no `"use client"` of its own (it has no
state; it is rendered inside the client `SiteChrome`).

Markup:

```tsx
import Link from 'next/link';
import { talkWidget } from '@/lib/data';
import { focusRing } from './focusRing';

/** The floating link to /talk (D61): bottom right on every chrome page but /talk; SiteChrome decides where. */
export default function VoiceWidget() {
  return (
    <Link
      href={talkWidget.href}
      aria-label={talkWidget.label}
      className={`fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-background)] shadow-lg shadow-black/40 transition-colors hover:bg-white print:hidden ${focusRing} focus-visible:outline-offset-4`}
    >
      {/* Two gentle pulses on load (4 s, under WCAG 2.2.2's 5 s), none under reduced motion */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-1 rounded-full border-2 border-[var(--color-accent)]/60 motion-safe:animate-pulse motion-safe:[animation-iteration-count:2]"
      />
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
        <path d="M12 18v4" />
      </svg>
    </Link>
  );
}
```

- **Icon**: the inline `<svg>` above (a stroked microphone, `aria-hidden`, `focusable="false"`): no icon package,
  no new dependency.
- **Data**: `src/lib/data/concierge.ts` gains `export const talkWidget = { label: 'Talk to my voice concierge', href:
  '/talk' }` (content lives in data; the barrel already re-exports `concierge.ts`). The aria-label is the accessible
  name; there is no visible text (a 56 px icon button is the brief's "small floating button").
- **Where**: `SiteChrome` renders `<VoiceWidget />` **after** `<Footer />` when `pathname !== '/talk'`. `/card*`
  already returns the bare children before that, so the widget never renders there. Exact match on `/talk` (there is
  no `/talk/*` route); `/evidence` keeps it (initializer default 6). Last in the DOM means last in the tab order: a
  keyboard user meets the skip link, the Navbar, the page and the footer first.
- **Size and place**: `h-14 w-14` (56 × 56 px, above the 44 × 44 minimum), `fixed right-4` and
  `bottom-[max(1rem,env(safe-area-inset-bottom))]`. The root layout's `viewport` sets no `viewport-fit=cover`, so the
  inset is 0 on today's site and the offset is 1 rem; the `max()` keeps the button above the home indicator if
  `cover` is ever turned on. `right-4` (not a `max()` with `safe-area-inset-right`) because the VC4-03 test pins it
  and portrait phones have no right inset.
- **Layer**: `z-40`, below the Navbar's `z-50`, so the open mobile menu (inside the Navbar) draws over it and the
  skip link (`z-[60]`) too.
- **Focus**: the shared `focusRing` (2 px accent outline) plus `focus-visible:outline-offset-4`, which wins over
  the shared offset 2 (computed `outline-offset: 4px` in Chromium). Why (VC4-03 review): with offset 2 the outline
  covered the same 2–4 px band as the decorative ring (accent at 60%), so focus only brightened that band; at offset
  4 it is a second ring 4–6 px out with a dark gap, plainly visible. `VoiceWidget.test.tsx` pins the class and every
  `focusRing` token. `a11y-new-pages.test.tsx`'s "focus-visible style" test renders `SiteChrome` at `/approach`, so
  it checks the widget too.
- **Motion**: the pulse is a decorative ring (`aria-hidden`, `pointer-events-none`) whose only animation classes are
  `motion-safe:animate-pulse` and `motion-safe:[animation-iteration-count:2]`: under `prefers-reduced-motion: reduce`
  it does not animate (computed `animation-name: none`). An opacity pulse, not `animate-ping`: ping scales the ring
  to 2×, which would push past the right edge at 390. Two iterations (2 s each) end it within 5 s, so it needs no
  pause control (WCAG 2.2.2). `-inset-1` keeps the ring 4 px outside the disc: its right edge is 12 px from the
  viewport's.
- **Print**: `print:hidden`.
- **Clear of the Footer's links** (default, D61): the Footer becomes `pt-8 pb-24 xl:pb-8 mt-16` (was `py-8 mt-16`).
  Why those breakpoints: at 390 the Footer is a centred column and its links end about 100 px left of the widget,
  so they never meet; from `sm` (640) to just under 1280 the links row sits at the right edge, exactly where the
  widget is, and with `pb-8` the links (32–52 px above the page bottom) would be under the widget (16–72 px). With
  `pb-24` (96 px) the last row ends above the widget at every width below `xl`; at `xl` (1280 and up) the
  `max-w-6xl` row ends at least 16 px left of the widget, so the old padding comes back. The same 96 px means any
  content the widget floats over while scrolling can be scrolled out from under it at the end of every page. The
  Footer keeps the padding on `/talk` too (no widget there): 64 px of extra space, not worth a pathname prop.
  `Footer.test.tsx` asserts `pb-24` and `xl:pb-8`; VC4-05 measures that the widget's box and every footer link's box
  do not intersect at 390 on `/about` scrolled to the bottom.

## Intro wording

`talkPage.intro` (D62). The first paragraph becomes, word for word:

> A voice agent I designed on LiveKit and built with my agent harness: specs in, verified milestones out. It
> remembers you between visits.

No digit (the old copy had none either; `concierge.ts`'s "no number but 30" holds). The second paragraph ("This page
shows what it remembers, where it learned each thing, and how long each turn took. Talk or type.") is unchanged.

Data shape: a paragraph is a string or a paragraph with one link in it.

```ts
export type IntroParagraph = string | { before: string; link: { label: string; href: string }; after: string };

intro: [
  {
    before: 'A voice agent I designed on LiveKit and built with ',
    link: { label: 'my agent harness', href: '/projects/agent-harness' },
    after: ': specs in, verified milestones out. It remembers you between visits.',
  },
  'This page shows what it remembers, where it learned each thing, and how long each turn took. Talk or type.',
] satisfies IntroParagraph[],
```

Render in `src/app/talk/page.tsx` (still a Server Component):

```tsx
{talkPage.intro.map((p, i) => (
  <p key={i}>
    {typeof p === 'string' ? p : (
      <>
        {p.before}
        <Link href={p.link.href} className={`text-[var(--color-accent)] underline underline-offset-4 hover:no-underline ${focusRing}`}>
          {p.link.label}
        </Link>
        {p.after}
      </>
    )}
  </p>
))}
```

Index keys are fine (static list). The link is underlined because it sits in body text (colour alone does not mark a
link, WCAG 1.4.1). `talk.test.tsx` changes from `getByText(sentence)` (which fails once a link splits the text) to:
the link named "my agent harness" has `href="/projects/agent-harness"`, and each paragraph's full text
(`before + label + after` for the object) equals a rendered `<p>`'s `textContent`. A one-line helper
`introText(p: IntroParagraph): string` lives in `concierge.ts` so the test and nothing else re-derives it.
`concierge-data.test.ts` asserts no paragraph's text contains a digit or "Claude Code agents writing".

The deep-dive (`voice-concierge`'s `caseStudy.builtWith`, `projects.ts` ~line 873) stays a **plain string** (the type
is shared by four case studies and `ProjectDetail` renders it as text), and the harness case study is linked from the
Links section. New `builtWith`, word for word:

> The spec and the design are mine: the agent, its memory and the contract between it and this page. My agent
> harness ran the build sessions, specs in and verified milestones out: Claude Code agents wrote this page's code
> overnight in one run, and a second run is writing the agent.

It names the harness, keeps "Claude Code agents" (`case-study-voice-concierge.test.ts` "credits Claude Code agents
under the harness (D10)" stays green unchanged), says the harness ran the build sessions and claims no hand-written
code (brand.md § Voice). No digit, so `docs/notes/evidence-voice-concierge.md` § Sentences with digits needs no new
line. `caseStudy.links` gains a third entry, after the demo and the repo:
`{ label: 'The agent harness that built it', href: '/projects/agent-harness', kind: 'doc' }` (`ProjectLink['kind']` is
`'repo' | 'live' | 'doc' | 'demo'`; `doc` draws ¶). Internal, so `ProjectLinks` keeps it in the tab via `next/link`.
`case-study-voice-concierge.test.ts` "links /talk as the demo first, then the public repo" gains the third entry.

`grep -rn 'writing much of the code' src/` must be empty afterwards. (The hit-list and home-media-server `builtWith`
say "wrote much of the code under that direction": a different phrase on different projects, out of VC4's scope.)

## Tests

Existing tests the order change breaks (VC4-02 updates each):

| File | Test | Change |
|---|---|---|
| `src/__tests__/lib/data.test.ts` | "carries the D12 order on every project" | the order map → § Order's After column; rename "carries the D59 order …" |
| `src/__tests__/lib/data.test.ts` | "returns the first n featured projects by order" | `['agent-harness', 'voice-concierge', 'ghl-jobtread-integration']` |
| `src/__tests__/lib/data.test.ts` | "returns every featured project, sorted by order, when n exceeds the count" | agent-harness, voice-concierge, ghl-jobtread-integration, ringcentral-jobtread-integration, home-media-server, linear-ai-workflow, hit-list, paint-estimator |
| `src/__tests__/lib/case-study-voice-concierge.test.ts` | the entry's field test (`expect(project.order).toBe(5)`, line 30) | `2` |
| `src/__tests__/lib/case-study-home-media-server.test.ts` | the entry's field test (`expect(project.order).toBe(3)`, line 25) | `5` |
| `src/__tests__/lib/case-study-hit-list.test.ts` | the entry's field test (`expect(project.order).toBe(4)`, line 22) | `7` |

Unaffected by the order (they derive it): `case-study-agent-harness.test.ts` (order 1, unchanged),
`pages/card.test.tsx` "shows exactly 3 selected-work links, equal to getTopProjects(3) in order",
`pages/home.test.tsx` "shows the getTopProjects(3) titles as h3, in order" and "links each card to its project page,
in order", `components/ProjectsGrid.test.tsx` "renders the cards sorted by order, lowest first (M8)". VC4-02 adds
one assertion to each of card and home: the second project link is `/projects/voice-concierge`.

The Navbar change breaks (VC4-02):

| File | Test | Change |
|---|---|---|
| `src/__tests__/components/Navbar.test.tsx` | "renders all nav links" | eight names, Talk fifth |
| `src/__tests__/components/Navbar.test.tsx` | "nav links have correct hrefs" | add `Talk: '/talk'` |
| `src/__tests__/components/Navbar.test.tsx` | "lists the seven links in order in the desktop list and the mobile menu (M8)" | eight, in order; rename "… the eight links …" |
| `src/__tests__/components/Navbar.test.tsx` | new | `usePathname` → `/talk` marks only Talk, desktop and mobile (as "Navbar on /approach (M8-02)") |

"does not link to /evidence" stays. `sitemap-robots.test.ts` already lists `/talk`.

The widget touches (VC4-03): `components/SiteChrome.test.tsx` (new cases: `/`, `/about`, `/projects/agent-harness`
have the link "Talk to my voice concierge"; `/talk` has the Navbar but not the link; `/card`, `/card/qr` have
neither); `pages/a11y-new-pages.test.tsx` "gives the skip link, Navbar and Footer links a focus-visible style"
(renders `SiteChrome` at `/approach`: the widget must carry `focusRing`, and it adds no landmark or heading);
`components/Footer.test.tsx` (new: the `pb-24`/`xl:pb-8` classes); new `components/VoiceWidget.test.tsx` (href,
name, `aria-hidden` svg, `print:hidden`, `motion-safe:animate-`, every `focusRing` token, no bare `animate-` class).

The wording touches (VC4-04): `pages/talk.test.tsx` "renders one h1, the eyebrow and the intro" (by paragraph text,
plus the link), `lib/concierge-data.test.ts` (no digit, no old phrase), `lib/case-study-voice-concierge.test.ts`
"links /talk as the demo first, then the public repo" (third link). "every sentence with a digit appears verbatim in
the evidence brief" stays green with no brief change (the new sentences have no digit).

At plan time (VC4-01 changes no code): `npx jest --silent 2>&1 | tail -5` → 992 tests, 75 suites, all passing.

## What Michael will see

Filled by VC4-05: one row per screenshot in `docs/screenshots/v2/`, with the measurements (widget vs footer link
boxes at 390, `scrollWidth`, the pulse's computed `animation-name` with and without reduced motion, the focus
outline colour).

| Screenshot | Page and state | What is on screen | Anything that looks wrong |
|---|---|---|---|
| `VC4-home-390.png` | `/`, 390×844 viewport, top of page | Hero (name, tagline, method strip on two lines, View Projects / About Me); the cyan mic disc bottom right at x 318–374, y 772–828, its ring visible | Nothing |
| `VC4-home-1280.png` | `/`, 1280×800 viewport | Navbar with eight links on one row (Home active, Talk fifth), hero, floating logos; widget at x 1208–1264, y 728–784 | Nothing |
| `VC4-about-footer-390.png` | `/about`, 390×844, scrolled to the bottom | Last paragraph, the snowboard clip, footer (name ©, GitHub · LinkedIn · Email on one row at y 726.5–745.5), widget below and right of the links | Nothing: 27 px between the links' bottom and the widget's top |
| `VC4-card-390.png` | `/card`, 390 wide, full page | Photo, Save contact, LinkedIn / Email / GitHub, Talk to my concierge, conference note, Selected work: Agent Harness, Voice Concierge, GoHighLevel ↔ JobTread in that order; no widget, no Navbar | Nothing |
| `VC4-menu-390.png` | `/`, 390×844, hamburger open | Close (×) button, the eight links stacked: Home (active, cyan), About, Skills, Projects, Talk, Approach, Experience, Contact; widget still bottom right (z-40 under the z-50 nav) | Nothing |
| `VC4-talk-390.png` | `/talk`, 390×844 viewport | Eyebrow, "Talk to my concierge", the intro with the underlined cyan "my agent harness" link (→ `/projects/agent-harness`), the second paragraph, Connect, the Transcript panel; no widget | Nothing |

Measured by a Playwright script against `next dev` on the harness port (VC4-05; script kept in the run's scratch
directory as `vc405/run.mjs`). Next's dev-only indicator (the "N" bubble bottom left) is hidden in the captures with
`nextjs-portal{display:none}` because production has none; nothing else is altered. All six PNGs are 53–300 KB.

- **Widget vs footer at 390×844, `/about` bottom**: widget box x 318, y 772, 56×56 (bottom edge 828 = 844 − 16).
  Footer links: GitHub x 101.3 w 46.5, LinkedIn x 171.8 w 57.0, Email x 252.8 w 36.0, all y 726.5 h 19. No
  intersection (the widget's left edge, 318, is 29 px right of Email's right edge, 288.7, and 27 px lower).
- **`document.documentElement.scrollWidth` at 390×844**: `/` 390, `/about` 390, `/projects` 390, `/talk` 390,
  `/card` 390. Console errors 0 and page errors 0 on each of the five.
- **Pulse** (`span[aria-hidden]` inside the widget, `/` at 1280): `reducedMotion: 'reduce'` → `animation-name: none`
  (iteration count 1, duration 0s); `'no-preference'` → `animation-name: pulse`, iteration count 2, duration 2s.
- **Keyboard on `/` at 1280**: Tab 1 Skip to content, 2 MH, 3–10 Home, About, Skills, Projects, **Talk (5th)**,
  Approach, Experience, Contact, 11–18 the page's links (View Projects, About Me, the three project cards' links,
  See all projects), 19–21 GitHub, LinkedIn, Email, **22 the widget**. On the widget `:focus-visible` matches and,
  once the 150 ms `transition-colors` settles, `outline-color` is `rgb(0, 212, 255)`, solid, 2px, offset 4px. (Read
  in the same frame as the Tab it is still `rgb(10, 10, 15)`, the text colour the transition starts from:
  `transition-colors` in Tailwind 4 includes `outline-color`. Every `focusRing` link with `transition-colors`
  fades in the same way; not a bug.)
- **Print**: `node .harness/print-check.mjs http://localhost:7834 / …/VC4-print-home.png` → `PASS print`, exit 0
  (white body, 0 visible nav/footer/canvas, 135 KB capture). The widget computes `display: none` under print media
  and `checkVisibility()` is false; the capture's bottom shows "See all projects →" and white space, no disc.
- **Navbar at md** (the eight-link check VC4-02 left here): at 768 the links' `ul` spans x 125–744 on one row
  (every `li` top 20), the MH logo ends at 43, `scrollWidth` 768; at 800 and 1024 also one row. 82 px spare at 768.

## Review

VC4-06: an Opus reviewer read `git diff f9e8a58..HEAD` (`$HARNESS_SCRATCH/VC4.diff`, 1356 lines) with the
vercel-react-best-practices and web-design-guidelines skills. Nothing Critical or Important; the Minor fixes below
were taken, the new Navbar test failing first. Tests 1011 → 1012.

| # | File | Finding | Severity | Outcome |
|---|---|---|---|---|
| 1 | `VoiceWidget.tsx` | Accessible name: `aria-label` "Talk to my voice concierge" (`talkWidget.label`); ring and SVG `aria-hidden`, SVG `focusable="false"`; no visible text, so 2.5.3 label-in-name does not apply. Other links to `/talk` say "Talk to my concierge" | None | Holds; kept "voice" (an icon-only link should say what kind of concierge) |
| 2 | `VoiceWidget.tsx`, `Navbar.tsx` | z-index: widget `z-40` under the Navbar `z-50` (the mobile menu is inside it) and the skip link `focus:z-[60]`. The open menu at 390×844 ends at ~370 px, the widget's box is y 772–828: no overlap, and the menu would paint over it if there were | None | Holds |
| 3 | `Footer.tsx` | Footer clearance: `pb-24` (96 px) > 16 + 56 below `xl`; from 640 to 1279 the links row sits under the widget's x range, so the padding is needed; it clears from 1248 up, so `xl` is the first breakpoint that can drop it (1280: 16 px gap) | None | Holds |
| 4 | `VoiceWidget.tsx` | Reduced motion: `motion-safe:animate-pulse` + `motion-safe:[animation-iteration-count:2]` (4 s < 2.2.2's 5 s); the production CSS puts the count after the shorthand in the same media block. Tailwind 4 has no iteration-count utility, so the arbitrary property is not an inline style a class could express | None | Holds; an `@theme` `--animate-pulse-twice` token was suggested as optional and not taken (it would depend on Tailwind emitting `@keyframes pulse` for a custom token) |
| 5 | `Navbar.tsx` | Eight links at 390: `block` links in a 342 px column, the longest label ("Experience") ~80 px, nothing wraps; at 768 one row, 82 px spare (VC4-05) | None | Holds |
| 6 | `concierge.ts`, `projects.ts` | Intro honesty against brand.md § Voice: D62's wording word for word, no number (tested), `builtWith` still says Claude Code agents wrote the code ("never hide that agents were used"); "overnight" and "a second run" trace to `docs/notes/evidence-voice-concierge.md`. "A second run is writing the agent" will go stale | None | Holds; the tense is a question for Michael (progress entry) |
| 7 | `Navbar.tsx` | The eighth link makes the open menu ~370 px inside a `fixed` nav: on a landscape phone under 768 wide and under ~370 tall, Contact is clipped and can't be scrolled to | Minor | Fixed: menu `div` gets `max-h-[calc(100dvh-4rem)] overflow-y-auto`; `Navbar.test.tsx` "caps the open menu…" failed first |
| 8 | `talk.test.tsx` | `link.className).toContain('underline')` is a substring match: `underline-offset-4` or `hover:no-underline` satisfy it | Minor | Fixed: class tokens split on whitespace |
| 9 | `VoiceWidget.test.tsx` | Nothing pinned the iteration count the 2.2.2 argument rests on | Minor | Fixed: asserts `motion-safe:[animation-iteration-count:2]` |
| 10 | `talk/page.tsx` | `introText` was used only by tests; the page keyed paragraphs by index | Minor | Fixed: `key={introText(p)}` |
| 11 | `SiteChrome.tsx` | No duplicated pathname logic (the widget has no `usePathname`), but the `'/talk'` literal repeated `talkWidget.href` | Minor | Fixed: `pathname !== talkWidget.href` |
| 12 | `VoiceWidget.tsx` | `bottom-[max(1rem,env(safe-area-inset-bottom))]` equals `bottom-4` until a `viewport-fit=cover` lands; Tailwind 4 has no safe-area utility | None | Kept (future-proof, tested) |
| 13 | `VoiceWidget.tsx` | Icon-only: sighted visitors infer the mic disc; no tooltip | Minor | Not taken: D61's design (the disc alone); a hover/focus label is a question for later |
| 14 | VC4 diff | No dead props, no unused exports or test helpers; the new `doc` link is internal | None | — |

## Decisions

Recorded in `docs/specs/2026-10-19-voice-concierge-page.md` § 7 (numbering starts at D59, never renumbered):

- **D59** project order (§ Order). Supersedes D47 (voice-concierge at 5, the old top three).
- **D60** Talk in the Navbar, the fifth of eight links, between Projects and Approach (§ Navbar). Supersedes D44's
  and D49's "off the Navbar"; the v2 spec's D44 and D49 each end "Superseded by D60 (VC4)."
- **D61** *default* the voice widget (§ Voice widget): link, placement, exclusions (`/talk`, `/card*`; `/evidence`
  keeps it), two pulses under `motion-safe:` only, Footer `pb-24 xl:pb-8`.
- **D62** the intro wording and the deep-dive credit (§ Intro wording). Supersedes the VC2 intro copy
  (`docs/plans/2026-10-20-VC2-talk-page.md` § Copy) and VC3's `builtWith`.

D59, D60 and D62's wording are Michael's (the VC4 spec); D61's details and D62's data shape and `builtWith` sentence
are defaults.
