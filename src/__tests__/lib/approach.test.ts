import { methodSteps, type MethodStep } from '@/lib/data';

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
