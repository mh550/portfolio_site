# VC3 plan: the voice-concierge deep-dive and its entry points (2026-10-20)

For the VC3 build sessions (VC3-02 … VC3-05). Spec: `docs/specs/2026-10-19-voice-concierge-page.md` W3, W4 and §3;
the v2 spec's case-study rules (D10, D12, D16, D17) and template
(`docs/plans/2026-10-18-M3-case-study-template.md` § Components: VC3 authors data against it and changes no
case-study component). Facts: `docs/notes/evidence-voice-concierge.md` ("the brief"), distilled from the agent's spec
(`/home/mh550/projects/voice-concierge/docs/spec.md` at `d3a9922`, read-only).

Build order: VC3-02 (the entry, its tests, the to-do note, the order decision) → VC3-03 (diagram, `/card` link,
Navbar decision) → VC3-04 (screenshots) → VC3-05 (fact-check, review, hand-off docs).

**Copy below is final.** VC3-02 pastes the entry in § The entry as TypeScript into `src/lib/data/projects.ts` as
written. Every string carries its own punctuation (the template adds none). Changing a sentence with a digit means
changing the brief's § Sentences with digits first.

**INBOX.md § Answers was empty at plan time (2026-10-20)**, so the order is the default below.

## The project entry, field by field

| Field | Value |
|---|---|
| `slug` | `'voice-concierge'` (already the target of `/talk`'s "deep dive" link, `talkPage.deepDiveHref`) |
| `title` | `'Voice Concierge: a voice agent that remembers returning visitors'` (64 characters, ASCII only: the OG image draws it with the bundled font) |
| `company` | `'Personal · open source'` (as agent-harness; the repo is public) |
| `shortDescription` | `'A LiveKit voice agent on this site that remembers you between visits, shows you what it remembers, and forgets you on request.'` (ASCII only) |
| `categories` | `['ai', 'systems']` |
| `techStack` | `['Python', 'LiveKit Agents', 'LiveKit Inference', 'Anthropic API', 'SQLite', 'Next.js', 'TypeScript', 'Claude Code']` (brief § Providers, § Hosting; the page half is Next.js + TypeScript). VC3-02: was `'OpenRouter'`; the agent repo's `docs/decisions.md` moved every LLM call to the Anthropic API, OpenRouter only as a fallback |
| `githubUrl` | `'https://github.com/mh550/voice-concierge'`: `gh repo view mh550/voice-concierge --json visibility` printed `{"visibility":"PUBLIC"}` at plan time (2026-10-20, VC3-01). `case-study-data.test.ts` then requires the same URL in `caseStudy.links` (it is) |
| `demoUrl` | not set (`/talk` is an internal page; it goes in `caseStudy.links` as `kind: 'demo'`) |
| `featured` | `true` |
| `order` | `5` (§ Order) |
| `metrics` | **not set** (`undefined`): no number is measured yet (brief, "Measured numbers: none yet"). `docs/notes/voice-concierge-todo.md` (VC3-02) says where they go |
| `thumbnail`, `detail.media` | not set (no fake screenshots; VC3-05 adds the 20 s recording to `docs/asset-checklist.md`) |
| `detail.architectureDiagram` | `'voice-concierge'` (set by VC3-03 together with the `DiagramKey`; VC3-02 leaves it out so its tree type-checks) |
| `caseStudy.iterations` | not set (one night, no stages to tell) |
| `caseStudy.lessons` | `[]` (nothing has broken in use yet; the What Broke section renders nothing) |
| `caseStudy.extraDiagrams` | not set |

Place the entry in the `projects` array **after `hit-list`** (array order is not display order; this keeps the
case studies together). `getProjectsByCategory` filters in array order, so `systems` becomes
`['agent-harness', 'home-media-server', 'voice-concierge']` and `ai` gains `voice-concierge` last.

### Decision ids

`VC-A` … `VC-F`, no digits: the badge is rendered (`DecisionLog`), and a digit in an id would have to trace to the
brief. They follow the order of the six practices in the voice-concierge page spec W3.

## The entry

```ts
  {
    slug: 'voice-concierge',
    title: 'Voice Concierge: a voice agent that remembers returning visitors',
    company: 'Personal · open source',
    shortDescription:
      'A LiveKit voice agent on this site that remembers you between visits, shows you what it remembers, and forgets you on request.',
    categories: ['ai', 'systems'],
    techStack: ['Python', 'LiveKit Agents', 'LiveKit Inference', 'Anthropic API', 'SQLite', 'Next.js', 'TypeScript', 'Claude Code'],
    githubUrl: 'https://github.com/mh550/voice-concierge',
    featured: true,
    order: 5,
    detail: {
      problem:
        'Voice agents forget you when the call ends, and memory is easy to add badly. A store call awaited inside the turn is a pause the caller hears. An extractor that reads the whole transcript can store what the agent said, or the part of a reply the visitor talked over, as if the visitor had said it. I wanted a concierge for this site that remembers returning visitors, by voice or by text, and lets each of them see and erase what it keeps.',
      approach:
        'One thread of memory per visitor, loaded at connect, written in the background, and shown live on the page.',
      challenges:
        'Keeping memory off the turn path, storing only what the visitor said and heard, and making erasure win over work still in flight.',
      outcome:
        'The agent and this page were built in parallel overnight, Oct 19 to Oct 20, for a demo on Oct 20, by two harness runs working to one shared contract. No latency numbers are measured yet. They go on this page once I have measured real sessions, and until then it shows none. The agent is built on livekit-agents 1.8 and only maps onto Agents 2.0: a thread per visitor, its state, an append-only journal, voice and text in one memory, a version fence where 2.0 adds a lease, and a thread that expires once it sits idle, as a 2.0 thread does.',
      // architectureDiagram: 'voice-concierge',  ← VC3-03
    },
    caseStudy: {
      role: 'Designer and operator',
      timeframe: 'Oct 2026',
      method: {
        diagnose:
          'The research behind the design found two traps. One published memory integration for LiveKit awaits its store calls inside the turn, and by default a refreshed page gets a fresh agent with no memory. So the rule became: memory work stays off the turn path, and memory lives outside the call, keyed to the visitor.',
        decide:
          'I wrote the memory design down practice by practice before any code, nearly every one with a test or an eval behind it, and modelled it on the thread, state and journal of LiveKit Agents 2.0, so it maps across if 2.0 ships as described. The agent and this page share one written contract, so the two could be built at the same time.',
        build:
          'The agent is a Python worker on my home box that connects out to LiveKit Cloud and keeps each visitor\'s memory in a local SQLite thread store. This site gained a token route and the /talk page, which shows the memory and the latency of each turn as they change. Each session ends after 10 minutes, and the page shows an offline state when the worker is not running.',
        verify:
          'The agent\'s design names an offline test for each part: the store, the merge, the write gate, heard-text-only and erasure, plus one that fails if a turn waits on extraction. This site\'s suite runs with no LiveKit settings at all, so the offline page is what every check sees. The live check, a real call against the running worker, is mine to run.',
        simplify:
          'The memory is small, so all of it loads at connect: no search mid-turn, no vector store, no filler line while a lookup runs. Typed slots and one visit summary stand in for a collection of notes; a collection with search is the next step if slots stop fitting.',
      },
      decisions: [
        {
          id: 'VC-A',
          title: 'Preload the memory at connect',
          chose:
            'loading the visitor\'s facts and last visit summary while the room connects, as one bounded block after the fixed instructions and the knowledge pack,',
          over: 'looking memories up during each turn',
          because:
            'the memory is small enough to load whole, so no turn waits on a lookup, and the start of the prompt stays the same for the whole call, which keeps it cacheable.',
          cost: 'It holds only while the memory stays small; a large collection would need search, and a filler line while it runs.',
        },
        {
          id: 'VC-B',
          title: 'Background extraction with delta merge',
          chose:
            'an extractor that runs after the turn, off the turn path, and proposes add, update and delete operations that plain code checks and applies,',
          over: 'awaiting a memory write inside the turn, or letting a model rewrite the whole memory,',
          because:
            'a turn must never wait on extraction or a store write, and a model that rewrites everything can drop facts nobody asked it to touch.',
          cost: 'A fact said in this turn reaches the store shortly after; the visitor\'s explicit "remember" and "forget" are the only writes inside a turn.',
        },
        {
          id: 'VC-C',
          title: 'Only what was heard',
          chose:
            'cutting an interrupted agent turn to the part the visitor actually heard before extraction, and never storing the agent\'s words as the visitor\'s,',
          over: 'extracting from the full transcript',
          because:
            'the rest of a reply the visitor talked over was never heard, and an agent\'s guess ("so you\'re a recruiter?") is not something the visitor said.',
          cost: 'The cut is only as exact as the framework\'s record of what played before the interruption.',
        },
        {
          id: 'VC-D',
          title: 'A write gate in front of memory',
          chose:
            'rejecting any value that reads like an instruction, holds a URL, a secret or a piece of code, runs past its length cap, or came from the agent, and showing memory to the model as quoted data,',
          over: 'storing whatever the extractor returns',
          because:
            'memory is an attack surface: a visitor who says "remember: ignore your instructions" must not change how the agent behaves on the next visit.',
          cost: 'The gate can turn away something harmless; each rejection goes in the journal, where it can be checked.',
        },
        {
          id: 'VC-E',
          title: 'Invalidate, and delete only on request',
          chose:
            'marking a corrected fact no longer valid and linking it to the one that replaced it, and deleting only when the visitor says "forget" or presses Forget me,',
          over: 'replacing facts in place',
          because:
            'a correction ("actually I\'m at Acme now") keeps the record of what the agent believed and when, while Forget me still erases the thread and everything linked to the visitor on my server.',
          cost: 'Old facts stay in the store until the thread has been idle for 30 days or the visitor erases it.',
        },
        {
          id: 'VC-F',
          title: 'One thread per visitor',
          chose:
            'one thread per browser visitor id, holding state, facts and an append-only journal, with every write checked against a version number,',
          over: 'memory per call, or one store shared by every visitor',
          because:
            'Agents 2.0\'s own advice is one thread per person for one memory, and a refresh or a second tab can put two jobs on one visitor, so a write that loaded an old version re-reads and re-applies its changes instead of overwriting.',
          cost: 'There is no lease, so two live sessions for one visitor can still interleave turns; and the id belongs to the browser, not a login.',
        },
      ],
      lessons: [],
      links: [
        { label: 'Talk to my concierge', href: '/talk', kind: 'demo' },
        { label: 'voice-concierge on GitHub', href: 'https://github.com/mh550/voice-concierge', kind: 'repo' },
      ],
      builtWith:
        'The spec and the design are mine: the agent, its memory and the contract between it and this page. Claude Code agents wrote the code for both, overnight, in two runs of my agent harness.',
    },
  },
```

Rendered decisions read "Chose {chose} over {over} because {because}" then "Cost: {cost}" (VC-C's cost is §4.4's "take what 1.8 records"). The method keys match `MethodStepId`; the page shows them under the five labels Diagnose, Decide,
Build, Verify, Simplify.

## Digits

The rule VC3-02's test enforces (feature step 1): take every string in the entry (`JSON.stringify` walk of the
object, every string value), split each on sentence ends (`/(?<=[.!?])\s+/`) and line breaks, and every piece that
contains a digit must appear **verbatim** in `docs/notes/evidence-voice-concierge.md`. The pieces, all copied into
the brief's § Sentences with digits:

| Piece | Field |
|---|---|
| `Oct 2026` | `caseStudy.timeframe` |
| `I wrote the memory design down practice by practice …, nearly every one with a test or an eval …, so it maps across if 2.0 ships as described.` | `method.decide` |
| `Each session ends after 10 minutes, and the page shows an offline state when the worker is not running.` | `method.build` |
| `Old facts stay in the store until the thread has been idle for 30 days or the visitor erases it.` | `VC-E.cost` |
| `Agents 2.0's own advice is one thread per person for one memory, …, so a write that loaded an old version re-reads and re-applies its changes instead of overwriting.` | `VC-F.because` |
| `The agent and this page were built in parallel overnight, Oct 19 to Oct 20, for a demo on Oct 20, by two harness runs working to one shared contract.` | `outcome` |
| `The agent is built on livekit-agents 1.8 and only maps onto Agents 2.0: …, and a thread that expires once it sits idle, as a 2.0 thread does.` | `outcome` |
| `https://github.com/mh550/voice-concierge` | `githubUrl`, `links[1].href` (the account name has digits) |

Nothing else in the entry, the diagram copy (§ Diagram) or the `/card` button holds a digit. The digits used: 2026,
2.0, 10, 30, 19, 20, 1.8 (and 550 in the repo URL). Each is in the brief's tables too (Status line; D2; B6; B7; §4.10).

## Order

**Default (recorded by VC3-02 in the v2 spec as `D47 *default*`, see § Decisions):** `order: 5`, and every project
at 5 or later moves down one. Reason: the deep-dive is new work with no measured numbers, so it sits after the four
case studies that have them and ahead of the older integration and client pages.

| Project | Before | After |
|---|---|---|
| agent-harness | 1 | 1 |
| linear-ai-workflow | 2 | 2 |
| home-media-server | 3 | 3 |
| hit-list | 4 | 4 |
| **voice-concierge** | — | **5** |
| ghl-jobtread-integration | 5 | 6 |
| paint-estimator | 6 | 7 |
| ringcentral-jobtread-integration | 7 | 8 |
| mirrored-google-calendars | 8 | 9 |
| cherished | 9 | 10 |

Effects: `getTopProjects(3)` stays `agent-harness, linear-ai-workflow, home-media-server`, so `/card`'s Selected work
and the home page's Recent work (both `getTopProjects(3)`) are **unchanged**. `/projects` shows the new card fifth (its
preview band shows the category `ai`, since there is no metric or thumbnail). `getTopProjects(10)` gains
`voice-concierge` after `hit-list` (8 featured). If Michael answers with another order in INBOX.md, D47 records the
answer instead and the table above changes with it.

## Diagram (`DiagramKey` `'voice-concierge'`, VC3-03)

In `src/components/projects/diagrams/index.tsx` next to the others, from the private `Node`, `Sub`, `Arrow` and `Panel`
primitives; entries in `DIAGRAMS`, `CAPTIONS` and `LABELS`. No new primitive, no SVG asset, no `"use client"`.

**Layout:** three panels in `flex flex-col gap-4 md:flex-row md:items-start` (stacked at 390, side by side from `md`,
top-aligned as in the agent-harness diagram). Between panels, a connector `div` holding two labelled arrows; each
arrow is rendered twice, `Arrow` (down) in a `md:hidden` wrapper and `Arrow dir="right"` in a `hidden md:flex`
wrapper, so it points the right way at both widths.

**Nodes, arrows and labels:**

```
[Panel A · "Visitor's browser and this site" · tone accent]
  (1) /talk page                      sub: in the browser: mic, text box, memory and latency panels
        ↓ "visitor id"
  (2) /api/concierge/token            sub: on this site's server: signs a room token

        A → B  "connect with the token"
        A ↔ B  "audio and text streams"

[Panel B · "LiveKit Cloud" · tone neutral]
  (3) Room                            sub: one per session (the token route names a new room on every Connect)

        B → C  "dispatch"
        B ↔ C  "audio and text streams"

[Panel C · "My home box" · tone neutral]
  (4) Agent worker  (accent)          sub: Python; connects out, no open ports
        ↓ "facts and journal"
  (5) SQLite thread store             sub: one thread per visitor
```

The ↔ arrows are drawn with the existing `Arrow` (one direction) and a label that says "streams"; the both-ways
reading is in the aria-label. Panel A's title names the browser **and** the site because the token route runs on
the server, not in the browser (the feature's panel list says "the visitor's browser"; this title keeps the word and
stays accurate). Panel C says "My home box" (first person, as all copy on the site; the feature's "Michael's home box").

The words VC3-03's test asserts are in the node text: **browser** (panel A title and node 1 sub), **token** (node 2,
arrow), **LiveKit** (panel B), **worker** (node 4), **SQLite** (node 5). No muted text inside an `opacity-*` wrapper
(the `Sub` and panel-title colours stay at full opacity for AA).

- `aria-label` (`LABELS['voice-concierge']`): `'The visitor\'s browser loads the /talk page, which sends a browser visitor id to this site\'s token route, and the route signs a room token. The page connects to a LiveKit Cloud room with it, and audio and text stream both ways between the page and the room. The room dispatches the agent worker on my home box; the worker connects out to LiveKit, streams audio and text with the room, and keeps each visitor\'s facts and journal in a SQLite thread store, one thread per visitor.'`
- caption (`CAPTIONS['voice-concierge']`): `'Memory lives on my home box, outside the call: LiveKit carries the audio and text, and the worker reads and writes one thread per visitor.'`

## `/card` link (VC3-03)

A full-width secondary button **"Talk to my concierge"**, `next/link` to `/talk` (same tab, no `target`), directly
under the LinkedIn / Email / GitHub row and above Selected work:

```tsx
<Link href="/talk" className={`${secondaryButton} mt-3 w-full`}>
  Talk to my concierge
</Link>
```

It reuses the row's `secondaryButton` (44 px tall, `focusRing`), so the card keeps one visual language. Recorded as
`D48 *default*`. The QR leads to `/card`, so a conference visitor is one tap from `/talk`. At 390×844 the h1 and Save
contact stay above the fold (the new button sits below both; VC3-04 measures it).

## Navbar (VC3-03)

**Unchanged:** seven links, `/talk` stays off it, as D44 already says (the Navbar holds the site's seven sections;
`/talk` is a demo reached from `/card`, the deep-dive and the sitemap). Recorded again for VC3 as `D49 *default*`
pointing at D44; adding it later is one entry in `Navbar.tsx`'s link list plus `Navbar.test.tsx`.

## Tests that change

| File | Feature | Change |
|---|---|---|
| `src/__tests__/lib/case-study-voice-concierge.test.ts` (new) | VC3-02 | metrics `undefined`; categories `['ai','systems']`; the six decision titles name preload, extraction/delta, heard, gate, invalidate, thread (case-insensitive); ids `VC-A`…`VC-F`; links `[0]` is `/talk` kind `demo`, `[1]` the GitHub repo (PUBLIC at plan time); `lessons` is `[]`, `iterations` `undefined`; builtWith names "Claude Code" and "harness"; § Digits rule against the brief; the entry's JSON has none of the never-publish strings in § Never publish |
| `src/__tests__/lib/data.test.ts` | VC3-02 | 9 → 10 projects; the order map in § Order; `getTopProjects(3)` unchanged; `getTopProjects(10)` gains `voice-concierge` after `hit-list` |
| `src/__tests__/lib/case-study-types.test.ts` | VC3-02 | `systems` → `['agent-harness', 'home-media-server', 'voice-concierge']` (process unchanged) |
| `src/__tests__/components/ProjectsGrid.test.tsx` | VC3-02 | the Systems filter test gains `voice-concierge` (found at VC3-02); "shows the first metric value … of each case study without a thumbnail": the new case study has no metric, so the test covers case studies **with** metrics and adds one assertion that the voice-concierge card's band shows its category (`ai`) instead |
| `src/__tests__/app/opengraph-image.test.ts` | VC3-02 | no edit: it iterates every project, so the new title and shortDescription are checked against the bundled font's glyphs (both ASCII) and the no-metric path renders title and name only |
| `src/__tests__/app/sitemap-robots.test.ts` | VC3-02 | no edit expected (`9 + projects.length`); run it |
| `src/__tests__/pages/a11y-new-pages.test.tsx` | VC3-02 | gains `['/projects/voice-concierge', () => caseStudy('voice-concierge')]` |
| `src/__tests__/app/project-page-unchanged.test.tsx` | — | pins the classic pages only; must pass untouched |
| `src/__tests__/components/ProjectDiagram.test.tsx` | VC3-03 | `KEYS` gains `'voice-concierge'`; a describe asserts the text names browser, token, LiveKit, worker, SQLite, and no `opacity-` class wraps muted text |
| `src/__tests__/pages/card.test.tsx` | VC3-03 | the link with name "Talk to my concierge" has `href="/talk"` and no `target`; still exactly 3 `/projects/` links and 2 `target="_blank"` links; the total-links assertion (line 103, `buttonNames.length + 3`) counts the new button |
| `src/__tests__/components/Navbar.test.tsx` | VC3-03 | no edit; green |

## Never publish

The entry, the diagram copy and the brief hold none of: the agent's env file path, the kill-switch file name, the
kill-switch variable, the LiveKit Cloud project name, any hostname, any key or key name from the agent spec (B10).
VC3-02's test checks the entry's JSON for `~/.`, `.config/`, `CONCIERGE_`, `API_KEY`, `API_SECRET` and
`livekit.cloud`; the content guard (`content-guard.test.ts`) covers tailnet hostnames, CGNAT IPs and ntfy URLs over
`src/`.

## Decisions to record (v2 spec)

The feature list names these `D44`, `D45` and `D43`, but VC1 and VC2 already used D43–D46. VC3 appends the next free
numbers:

- **D47** *default* (VC3-02): the order in § Order and its effect (none on `/card` or the home Recent work).
- **D48** *default* (VC3-03): the `/card` "Talk to my concierge" placement in § `/card` link.
- **D49** *default* (VC3-03): the Navbar stays at seven links; `/talk` is reached from `/card`, the deep-dive and the
  sitemap (restates D44 for VC3).

## Traceability

"Brief" = `docs/notes/evidence-voice-concierge.md`; § and B/D numbers are the agent spec's.

| Claim in the copy | Where | Source |
|---|---|---|
| voice agents forget at the end of a call; a refreshed page gets a fresh agent with no memory | problem, diagnose | Brief § The problem (Research, `close_on_disconnect`) |
| a store call awaited inside the turn is heard; one published integration does it | problem, diagnose, VC-B | Brief § The problem (Research, Mem0 guide); §1 anti-goals |
| storing what the agent said / what was talked over | problem, VC-C | §1 anti-goals; §4.4; §4.0 "Only what was heard" |
| see and erase what it keeps | problem | §1 anti-goals; page spec W2 |
| practice by practice, each with a test or an eval | decide | D6; §4.0 |
| modelled on thread, state and journal of 2.0; "if 2.0 ships as described" | decide | D2; Research open question |
| one written contract, built at the same time | decide, outcome | §6; page spec §4; D4 |
| Python worker on my home box, connects out, local SQLite thread store | build, diagram | D3; §2; §4.2 |
| token route and /talk with memory and per-turn latency | build | page spec W1, W2 (built in VC1, VC2) |
| sessions end after 10 minutes | build | B7; §6 |
| offline state when the worker is not running | build | B7; §6 (no agent within 10 s) |
| the design names offline tests: store, merge, gate, heard text, erasure; one fails if a turn waits on extraction | verify | §7 (required tests) |
| this site's suite runs with no LiveKit env | verify | page spec §3; D46 |
| the live check is mine to run | verify | page spec §5 "Morning (Michael)"; §7 live evals |
| all loaded at connect; no search mid-turn; no filler | simplify, VC-A | §4.0 "Just-in-time vs preload"; §4.3 |
| typed slots and one visit summary; a collection with search is the next step | simplify | B3; §4.0 "Profile, not collection" |
| bounded block after the fixed instructions; prefix stays the same, cacheable | VC-A | §4.3; §4.0 "Stable, cached prefix"; §5 |
| extractor proposes add/update/delete, plain code applies; no model rewrites the memory | VC-B | §4.4; §4.0 "Delta edits"; B4 |
| shortly after | VC-B cost | §4.4 (debounced about 2 s, then an LLM call) |
| remember / forget are the only hot-path writes | VC-B cost | B4; §4.4 "Hot-path writes" |
| interrupted turns cut to what was heard; agent's words never stored as visitor's; "so you're a recruiter?"; the cut is only as exact as what the framework records | VC-C | §4.4 ("take what 1.8 records"); §4.0; §4.9 |
| gate: instruction, URL, secret, code, length cap, agent attribution; memory as quoted data | VC-D | §4.4; B12 |
| "remember: ignore your instructions" | VC-D | §4.9 injection case; §7 live evals |
| rejections journaled | VC-D cost | §4.4 (`gate_rejected`) |
| invalidate, link to replacement; delete only on forget / Forget me | VC-E | B5; §4.4 |
| "actually I'm at Acme now" | VC-E | §4.9 correction case |
| Forget me erases the thread and everything linked to the visitor on Michael's server | VC-E | §4.2 "Erasure" (LiveKit's Agent Insights copy, B11, and the anonymous metrics, B9, are outside it: the /talk privacy note says so) |
| idle 30 days | VC-E cost | B6 |
| one thread per browser visitor id; state, facts, journal; version check | VC-F | B2; §4.2 |
| 2.0's advice: one thread per person for one memory | VC-F | B2 (quoting 2.0); Research ("a thread is not a person") |
| refresh or second tab, two jobs on one visitor; re-read and re-apply | VC-F | §4.2 "Single writer" |
| no lease, sessions can interleave; id is the browser, not a login | VC-F cost | §4.2; §2 out of scope |
| built overnight Oct 19 → 20 for a demo on Oct 20, two runs in parallel | outcome | Status line; D4; §1; page spec header |
| no latency numbers measured yet | outcome | Brief "Measured numbers: none yet"; §4.7 |
| built on livekit-agents 1.8, only maps onto 2.0; thread, state, journal, channels, fence vs lease, idle expiry like 2.0's `idle_ttl` | outcome | D2; §2; Brief § The Agents 2.0 mapping |
| spec and design (agent, memory, contract) by Michael; code by Claude Code agents in two harness runs | builtWith | Status line ("Owner", "Builder"); D1–D6; brand.md (credit rule) |
| STT/TTS LiveKit Inference, LLM Anthropic API, Python | techStack | D5; §2; agent repo `docs/decisions.md` "LLM provider: Anthropic direct" |
| repo is public | links, githubUrl | Brief § How it was built (gh output) |

Left out on purpose: the model id and provider pair (B1 defaults, may change), the 1,500-character and 3,000-token
budgets, the 24-item compaction threshold, the 5-sessions-a-day cap and the 50 ms test bound. They are true design
facts, but each is a number a reader could take for a measurement, and the page has none until Michael measures.

## Brand check

| Rule | Holds | How |
|---|---|---|
| First person | yes | problem, decide, build ("my home box"), verify ("mine to run"), outcome ("once I have measured"), builtWith |
| Past tense for what happened | yes | outcome and decide narrate in the past; the design's standing rules are present tense |
| Numbers over adjectives | yes, with no numbers to give | no adjective claims speed or quality; the outcome says plainly that no latency is measured |
| No buzzwords | yes | none of leverage, synergy, seamless, robust, cutting-edge, revolutionary, empower, best-in-class, game-changing |
| Show the reasoning | yes | six chose / over / because, each with a cost |
| Credit honestly (D10) | yes | builtWith: Michael wrote the specs, design and contract; Claude Code agents wrote the code |
| Never publish | yes | § Never publish; the only link besides `/talk` is the public repo |
| Overclaiming | yes | "only maps onto Agents 2.0", "if 2.0 ships as described", "No latency numbers are measured yet" |

## Risks

- **The agent run may not finish tonight.** The copy states the design ("the agent's design names an offline
  test") and says both halves "were built in parallel overnight". At plan time the agent repo's `main` held only the
  spec. Before pasting, VC3-02 reads the agent repo's `README.md` and `docs/decisions.md` (read-only, the public
  `main`) and notes in its progress entry what it found; VC3-05's fact-check repeats that and softens any sentence
  the built code does not support (write less, not more). Michael has the last look in the morning.
- **Repo visibility can change.** The GitHub link is in because the repo was PUBLIC at plan time; if
  `gh repo view` prints anything else when VC3-02 runs, drop `githubUrl` and the second link (the content guard
  forbids private repo links).
- **No metrics on a featured card.** The `/projects` card shows the category `ai` in its preview band instead of a
  number. That is the honest state until measurement; `docs/notes/voice-concierge-todo.md` is the way back.

## What Michael will see

VC3-04 fills this: one row per screenshot (page · what is on screen · anything that looks wrong).
