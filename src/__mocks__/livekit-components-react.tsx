import { createContext, useContext, useEffect } from 'react';

// Jest stand-in for @livekit/components-react (mapped in jest.config.ts): the two exports /talk uses.
export const RoomContext = createContext<unknown>(undefined);

// The room the renderer last found in its context, so a test can check it sits inside the provider for that room.
export const audioRenderer: { room: unknown } = { room: undefined };

export function RoomAudioRenderer() {
  const room = useContext(RoomContext);
  useEffect(() => {
    audioRenderer.room = room;
  }, [room]);
  return <div data-testid="room-audio-renderer" data-has-room={String(room !== undefined)} hidden />;
}
