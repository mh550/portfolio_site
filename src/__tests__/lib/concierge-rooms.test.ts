/**
 * @jest-environment node
 */
import { RoomServiceClient } from 'livekit-server-sdk';
import { listLiveRooms } from '@/lib/concierge/rooms';

const mockListRooms = jest.fn();
jest.mock('livekit-server-sdk', () => ({
  RoomServiceClient: jest.fn().mockImplementation(() => ({ listRooms: mockListRooms })),
}));

const env = { url: 'wss://concierge.test.invalid', apiKey: 'k'.repeat(12), apiSecret: 'x'.repeat(32) };

beforeEach(() => {
  mockListRooms.mockReset();
  jest.mocked(RoomServiceClient).mockClear();
});

describe('listLiveRooms', () => {
  it('asks once, with a bounded 5 s attempt and no failover (D68), and keeps only the names', async () => {
    mockListRooms.mockResolvedValue([
      { name: 'concierge-0123456789-abcdefabcdef', sid: 'RM_1', numParticipants: 2 },
      { name: 'lobby', sid: 'RM_2', numParticipants: 0 },
    ]);
    await expect(listLiveRooms(env)).resolves.toEqual([
      { name: 'concierge-0123456789-abcdefabcdef' },
      { name: 'lobby' },
    ]);
    expect(RoomServiceClient).toHaveBeenCalledTimes(1);
    expect(RoomServiceClient).toHaveBeenCalledWith(env.url, env.apiKey, env.apiSecret, {
      requestTimeout: 5,
      failover: false,
    });
    expect(mockListRooms).toHaveBeenCalledTimes(1);
    expect(mockListRooms).toHaveBeenCalledWith();
  });

  it('passes a rejection through, so the route can fail closed', async () => {
    mockListRooms.mockRejectedValue(new Error('unavailable'));
    await expect(listLiveRooms(env)).rejects.toThrow('unavailable');
  });
});
