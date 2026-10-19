import { render, screen } from '@testing-library/react';
import ConferenceNote from '@/components/card/ConferenceNote';

describe('ConferenceNote', () => {
  it('renders the note as a paragraph when given text', () => {
    render(<ConferenceNote note="Met me at a conference? Say hi." />);
    const note = screen.getByText('Met me at a conference? Say hi.');
    expect(note.tagName).toBe('P');
  });

  it.each([[''], ['   ']])('renders nothing for %p', (note) => {
    const { container } = render(<ConferenceNote note={note} />);
    expect(container).toBeEmptyDOMElement();
  });
});
