'use client';

import type { Room } from 'livekit-client';
import { RoomAudioRenderer, RoomContext } from '@livekit/components-react';

// The agent's voice: RoomAudioRenderer inside this session's Room. ConciergeProvider loads it with next/dynamic once a
// Room exists, so @livekit/components-react stays out of every page's first load.
export default function RoomAudio({ room }: { room: Room }) {
  return (
    <RoomContext.Provider value={room}>
      <RoomAudioRenderer />
    </RoomContext.Provider>
  );
}
