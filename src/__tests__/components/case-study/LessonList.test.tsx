import { render, screen, within } from '@testing-library/react';
import LessonList from '@/components/projects/case-study/LessonList';
import { fixtureProject } from '../../fixtures/case-study-project';

const lessons = fixtureProject.caseStudy!.lessons;

describe('LessonList', () => {
  it('renders a #lessons section headed What Broke', () => {
    const { container } = render(<LessonList lessons={lessons} />);
    expect(container.querySelector('section#lessons')).not.toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: 'What Broke' })).toBeInTheDocument();
  });

  it("renders each 'What broke' → 'The rule' pair in order", () => {
    const { container } = render(<LessonList lessons={lessons} />);
    const items = Array.from(container.querySelectorAll('ul > li')) as HTMLElement[];
    expect(items).toHaveLength(lessons.length);
    items.forEach((item, i) => {
      expect(within(item).getByText('What broke')).toBeInTheDocument();
      expect(within(item).getByText('The rule')).toBeInTheDocument();
      const text = item.textContent ?? '';
      const order = ['What broke', lessons[i].broke, '→', 'The rule', lessons[i].rule].map((s) => text.indexOf(s));
      expect(order.every((n) => n >= 0)).toBe(true);
      expect([...order].sort((a, b) => a - b)).toEqual(order);
    });
  });

  it('hides the arrow from assistive tech', () => {
    const { container } = render(<LessonList lessons={lessons} />);
    const arrows = Array.from(container.querySelectorAll('[aria-hidden="true"]')).filter((el) => el.textContent === '→');
    expect(arrows).toHaveLength(lessons.length);
  });

  it('renders two lessons with the same broke text without a duplicate-key warning', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<LessonList lessons={[{ broke: 'Same.', rule: 'One.' }, { broke: 'Same.', rule: 'Two.' }]} />);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('separates each label from its text with a space', () => {
    const { container } = render(<LessonList lessons={lessons} />);
    const first = container.querySelector('ul > li') as HTMLElement;
    expect(first.textContent).toContain(`What broke ${lessons[0].broke}`);
    expect(first.textContent).toContain(`The rule ${lessons[0].rule}`);
  });

  it('renders nothing for an empty array', () => {
    const { container } = render(<LessonList lessons={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
