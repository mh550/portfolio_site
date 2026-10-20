import { createContext } from 'react';

// Jest stand-in for @livekit/components-react (mapped in jest.config.ts): the two exports /talk uses.
export const RoomContext = createContext<unknown>(undefined);

export function RoomAudioRenderer() {
  return <div data-testid="room-audio-renderer" hidden />;
}
