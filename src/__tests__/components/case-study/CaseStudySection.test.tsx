import { render, screen } from '@testing-library/react';
import CaseStudySection from '@/components/projects/case-study/CaseStudySection';

describe('CaseStudySection', () => {
  it('renders a section labelled by its h2, with the given id', () => {
    const { container } = render(
      <CaseStudySection id="decisions" heading="Key Decisions">
        <p>Body</p>
      </CaseStudySection>,
    );
    const section = container.querySelector('section#decisions') as HTMLElement;
    expect(section).toHaveAttribute('aria-labelledby', 'decisions-heading');
    const h2 = screen.getByRole('heading', { level: 2, name: 'Key Decisions' });
    expect(h2).toHaveAttribute('id', 'decisions-heading');
    expect(screen.getByRole('region', { name: 'Key Decisions' })).toBe(section);
    expect(section).toHaveTextContent('Body');
  });
});
