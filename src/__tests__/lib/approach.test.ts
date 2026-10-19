import { aboutIntro, methodSteps, profile, type MethodStep } from '@/lib/data';

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

describe('aboutIntro (D13, D32)', () => {
  it('is at most three sentences', () => {
    expect(aboutIntro.length).toBeGreaterThan(0);
    expect(aboutIntro.length).toBeLessThanOrEqual(3);
    expect(aboutIntro.join(' ').match(/[.!?](\s|$)/g)?.length).toBeLessThanOrEqual(3);
  });

  it('opens with the subline', () => {
    expect(aboutIntro[0]).toBe(profile.subline);
  });

  it('names every method step', () => {
    const text = aboutIntro.join(' ');
    for (const step of methodSteps) {
      expect(text).toContain(step.label);
    }
  });
});
