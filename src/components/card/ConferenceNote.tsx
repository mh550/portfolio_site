// The optional one-liner above the card's Selected work (profile.conferenceNote). Empty means no element at all.
export default function ConferenceNote({ note }: { note: string }) {
  const text = note.trim();
  if (!text) return null;
  return (
    <p className="mb-6 border-l-2 border-[var(--color-accent)] pl-3 text-base text-white/90">{text}</p>
  );
}
