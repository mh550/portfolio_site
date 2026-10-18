import { render, screen, within } from '@testing-library/react';
import DecisionLog from '@/components/projects/case-study/DecisionLog';
import { fixtureProject } from '../../fixtures/case-study-project';

const decisions = fixtureProject.caseStudy!.decisions;

describe('DecisionLog', () => {
  it('renders a #decisions section headed Key Decisions', () => {
    const { container } = render(<DecisionLog decisions={decisions} />);
    expect(container.querySelector('section#decisions')).not.toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: 'Key Decisions' })).toBeInTheDocument();
  });

  it('renders a decision with every field: chip, title, the over clause and the cost line', () => {
    render(<DecisionLog decisions={decisions} />);
    const item = screen.getByText('Fixture decision with every field').closest('li') as HTMLElement;
    expect(within(item).getByText('F1')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Fixture decision with every field' })).toBeInTheDocument();
    expect(within(item).getByText(/^Chose /).textContent).toBe(
      'Chose fixture option A over fixture option B because fixture reason one',
    );
    expect(item).toHaveTextContent('Cost: fixture cost');
  });

  it('omits the over clause and the cost line when they are absent', () => {
    render(<DecisionLog decisions={decisions} />);
    const item = screen.getByText('Fixture decision without over or cost').closest('li') as HTMLElement;
    expect(within(item).getByText('F2')).toBeInTheDocument();
    expect(item).toHaveTextContent('Chose fixture option C because fixture reason two');
    const sentence = within(item).getByText(/^Chose /);
    expect(sentence.textContent).toBe('Chose fixture option C because fixture reason two');
    expect(item.textContent).not.toMatch(/Cost:/);
  });

  it('renders nothing for an empty array', () => {
    const { container } = render(<DecisionLog decisions={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
