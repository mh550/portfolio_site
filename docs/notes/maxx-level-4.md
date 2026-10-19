# MAXX Potential level-4 rubric (stub, D7)

`/evidence` is built around six general competencies for now (spec D7). When you have the real level-4 rubric,
paste it under **Rubric** below, as written, one heading per competency the rubric names.

## Remapping

Remapping the page to the rubric means editing **`src/lib/data/competencies.ts` only**:

- `competencies`: one entry per rubric competency. Change `title` (the h2) and `id` (the section's `#anchor`), and
  move each item under the competency it now evidences. Each competency keeps 2–4 items.
- `evidenceIntro.mapping`: the note that says the page follows general competencies. Reword it once it follows the
  rubric.
- A new item needs `text` (the link text), `href` (an internal route, `/projects/<slug>[#anchor]`, or a public repo
  root), `context` (`MAXX Potential`, `Builder Clarity` or `Personal`) and `source`: a phrase found in
  `docs/notes/brand.md` (MAXX and Builder Clarity) or an evidence brief or the spec (Personal). Never write a MAXX
  claim the bank in brand.md doesn't have.

`src/app/evidence/page.tsx` renders whatever is in the data. It needs no edit.
`src/__tests__/lib/competencies-links.test.ts` pins the six current titles in order. Update that list to the rubric's
titles in the same change. The other checks (2–4 items, sources found, hrefs resolve) stay as they are.

## Rubric

(Paste the level-4 rubric here.)
