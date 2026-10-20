import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgetMeButton from '@/components/talk/ForgetMeButton';

const CONFIRM = 'Erase everything the concierge remembers about you?';
const button = (name: string) => screen.getByRole('button', { name });

describe('ForgetMeButton', () => {
  it('starts as a single Forget me button, with no confirm step', () => {
    render(<ForgetMeButton onForget={jest.fn()} busy={false} />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(button('Forget me')).toBeEnabled();
    expect(screen.queryByText(CONFIRM)).not.toBeInTheDocument();
  });

  it('asks to confirm on the first click, without calling onForget, and focuses Cancel', async () => {
    const onForget = jest.fn();
    render(<ForgetMeButton onForget={onForget} busy={false} />);
    await userEvent.click(button('Forget me'));
    expect(screen.getByText(CONFIRM)).toBeInTheDocument();
    expect(screen.getByRole('group', { name: CONFIRM })).toBeInTheDocument();
    expect(button('Erase')).toBeEnabled();
    expect(button('Cancel')).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Forget me' })).not.toBeInTheDocument();
    expect(onForget).not.toHaveBeenCalled();
  });

  it('Erase calls onForget exactly once, even on a double click', async () => {
    const onForget = jest.fn();
    render(<ForgetMeButton onForget={onForget} busy={false} />);
    await userEvent.click(button('Forget me'));
    await userEvent.dblClick(button('Erase'));
    expect(onForget).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(CONFIRM)).not.toBeInTheDocument();
    expect(button('Forget me')).toHaveFocus();
  });

  it('after Erase, focus waits for the parent to finish, then returns to Forget me', async () => {
    // Like TalkSession: onForget sets busy in the same click, so the button comes back disabled. The hidden
    // button ends the RPC; fireEvent clicks it without moving focus.
    function Parent() {
      const [busy, setBusy] = useState(false);
      return (
        <>
          <ForgetMeButton onForget={() => setBusy(true)} busy={busy} />
          <button type="button" hidden data-testid="finish" onClick={() => setBusy(false)} />
        </>
      );
    }
    render(<Parent />);
    await userEvent.click(button('Forget me'));
    await userEvent.click(button('Erase'));
    expect(button('Forget me')).toBeDisabled();
    fireEvent.click(screen.getByTestId('finish'));
    expect(button('Forget me')).toHaveFocus();
  });

  it('Cancel returns to the single button without calling onForget', async () => {
    const onForget = jest.fn();
    render(<ForgetMeButton onForget={onForget} busy={false} />);
    await userEvent.click(button('Forget me'));
    await userEvent.click(button('Cancel'));
    expect(screen.queryByText(CONFIRM)).not.toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(button('Forget me')).toHaveFocus();
    expect(onForget).not.toHaveBeenCalled();
  });

  it('is disabled while busy, and a click does nothing', async () => {
    const onForget = jest.fn();
    render(<ForgetMeButton onForget={onForget} busy />);
    expect(button('Forget me')).toBeDisabled();
    await userEvent.click(button('Forget me'));
    expect(screen.queryByText(CONFIRM)).not.toBeInTheDocument();
    expect(onForget).not.toHaveBeenCalled();
  });

  it('disables Erase and Cancel if it turns busy mid-confirm', async () => {
    const onForget = jest.fn();
    const { rerender } = render(<ForgetMeButton onForget={onForget} busy={false} />);
    await userEvent.click(button('Forget me'));
    rerender(<ForgetMeButton onForget={onForget} busy />);
    expect(button('Erase')).toBeDisabled();
    expect(button('Cancel')).toBeDisabled();
  });

  it('gives every button the site focus ring', async () => {
    render(<ForgetMeButton onForget={jest.fn()} busy={false} />);
    expect(button('Forget me').className).toMatch(/focus-visible:outline-\[var\(--color-accent\)\]/);
    await userEvent.click(button('Forget me'));
    for (const name of ['Erase', 'Cancel']) {
      expect(button(name).className).toMatch(/focus-visible:outline-\[var\(--color-accent\)\]/);
    }
  });
});
