import {
  aboutIntro,
  exampleHref,
  loopStepExample,
  loopSteps,
  methodSteps,
  principles,
  profile,
  resolvedExamples,
  type LoopStep,
  type MethodStep,
} from '@/lib/data';

describe('methodSteps', () => {
  it('has the five steps in method order', () => {
    expect(methodSteps.map((s) => s.id)).toEqual(['diagnose', 'decide', 'build', 'verify', 'simplify']);
  });

  it('labels each step', () => {
    expect(methodSteps.map((s) => s.label)).toEqual(['Diagnose', 'Decide', 'Build', 'Verify', 'Simplify']);
  });

  it('gives each step one short line of 20–90 characters', () => {
    for (const step of methodSteps) {
      expect(step.line.length).toBeGreaterThanOrEqual(20);
      expect(step.line.length).toBeLessThanOrEqual(90);
    }
  });

  it('writes each line in first person', () => {
    for (const step of methodSteps) {
      expect(step.line).toMatch(/\bI\b/);
    }
  });

  it('has exactly the MethodStep fields', () => {
    for (const step of methodSteps) {
      const keys: (keyof MethodStep)[] = ['id', 'label', 'line'];
      expect(Object.keys(step).sort()).toEqual([...keys].sort());
    }
  });
});

describe('loopSteps (D77)', () => {
  it('has the five loop steps in order, with unique ids', () => {
    expect(loopSteps.map((s) => s.id)).toEqual(['spec', 'context', 'build', 'verify', 'learn']);
    expect(new Set(loopSteps.map((s) => s.id)).size).toBe(5);
  });

  it('has the labels and lines verbatim from the v3 spec § 2', () => {
    expect(loopSteps.map(({ label, line }) => [label, line])).toEqual([
      ['Spec', 'I write down what done means before anything is built.'],
      ['Context', 'Every session starts fresh, from state kept on disk, not from memory.'],
      ['Build', 'Test first, one feature at a time, the smallest system that fixes the real problem.'],
      ['Verify', 'An independent check, with evidence per step, before anything merges.'],
      ['Learn', 'Every run is measured and written down, and the next plan reads it.'],
    ]);
  });

  it('maps each step to its principle per the P1 plan', () => {
    expect(Object.fromEntries(loopSteps.map((s) => [s.id, s.principle]))).toEqual({
      spec: 'decisions-explicit',
      context: 'automate-bookkeeping',
      build: 'simplify-after-use',
      verify: 'verify-what-the-human-sees',
      learn: 'fakes-mirror-reality',
    });
  });

  it('names a principle that exists for every step', () => {
    const ids = principles.map((p) => p.id);
    for (const step of loopSteps) expect(ids).toContain(step.principle);
  });

  it('has exactly the LoopStep fields', () => {
    for (const step of loopSteps) {
      const keys: (keyof LoopStep)[] = ['id', 'label', 'line', 'principle'];
      expect(Object.keys(step).sort()).toEqual([...keys].sort());
    }
  });
});

describe('aboutIntro (D13, D32, D77)', () => {
  it('is at most three sentences', () => {
    expect(aboutIntro.length).toBeGreaterThan(0);
    expect(aboutIntro.length).toBeLessThanOrEqual(3);
    expect(aboutIntro.join(' ').match(/[.!?](\s|$)/g)?.length).toBeLessThanOrEqual(3);
  });

  it('opens with the subline', () => {
    expect(aboutIntro[0]).toBe(profile.subline);
  });

  it('opens with the v3 subline (D76)', () => {
    expect(aboutIntro[0]).toBe(
      'I build the harnesses, memory and verification around AI agents, and the integrations they run on.',
    );
  });

  it('names the five loop labels in order', () => {
    expect(aboutIntro[1]).toBe('I work the way my harness runs: Spec, Context, Build, Verify, Learn.');
  });

  it('no longer names the case-study method', () => {
    expect(aboutIntro.join(' ')).not.toMatch(/Diagnose|Decide|Simplify/);
  });
});

describe('loopStepExample (D80)', () => {
  it("is the first linkable example of the step's principle", () => {
    for (const step of loopSteps) {
      const principle = principles.find((p) => p.id === step.principle)!;
      const first = resolvedExamples(principle).find((e) => exampleHref(e) !== undefined)!;
      const link = loopStepExample(step);
      expect(link.href).toBe(exampleHref(first));
      expect(link.href).toMatch(/^\/projects\//);
      expect(first.text.startsWith(link.text)).toBe(true);
    }
  });

  it("names each link with its example's first sentence", () => {
    expect(loopSteps.map((s) => loopStepExample(s).text)).toEqual([
      'The harness keeps a numbered decision ledger.',
      'In the harness a deterministic bash driver does all the git bookkeeping, because a script does that and a prompt might not.',
      'I built four download-quality tiers, used them, then replaced them with one rule: lossless or 256 kbps and up.',
      'After the first night every count matched, 859 = 859 = 859, while 92 titles were still wrong on my phone.',
      'The harness broke its own rule.',
    ]);
  });

  it('throws when a principle has no linkable example', () => {
    expect(() => loopStepExample({ ...loopSteps[0], principle: 'missing' as LoopStep['principle'] })).toThrow();
  });
});
