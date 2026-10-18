import { render, screen, within } from '@testing-library/react';
import MethodSteps from '@/components/projects/case-study/MethodSteps';
import { methodSteps } from '@/lib/data/approach';
import { fixtureProject } from '../../fixtures/case-study-project';

const method = fixtureProject.caseStudy!.method;

describe('MethodSteps', () => {
  it('renders a #method section headed The Method', () => {
    const { container } = render(<MethodSteps method={method} />);
    const section = container.querySelector('section#method');
    expect(section).not.toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: 'The Method' })).toBeInTheDocument();
  });

  it('renders an ordered list with the five step ids in order', () => {
    const { container } = render(<MethodSteps method={method} />);
    const items = Array.from(container.querySelectorAll('ol > li'));
    expect(items.map((li) => li.id)).toEqual(['diagnose', 'decide', 'build', 'verify', 'simplify']);
  });

  it("puts each label from methodSteps above the project's text for that step", () => {
    const { container } = render(<MethodSteps method={method} />);
    for (const step of methodSteps) {
      const li = container.querySelector(`li#${step.id}`) as HTMLElement;
      expect(within(li).getByRole('heading', { level: 3, name: step.label })).toBeInTheDocument();
      expect(within(li).getByText(method[step.id])).toBeInTheDocument();
      const text = li.textContent ?? '';
      expect(text.indexOf(step.label)).toBeLessThan(text.indexOf(method[step.id]));
    }
  });
});
