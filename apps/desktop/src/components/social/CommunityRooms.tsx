import { motion } from 'framer-motion';

/**
 * Static community-rooms strip. Renders above the "drag & drop a sample"
 * prompt on the feed tab. The rooms themselves are hard-coded for now —
 * wiring up real membership + online presence + chat is a separate feature.
 * Clicking Join just logs for now so the UX fits without a backend.
 */
interface Room {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  followers: number;
  online: number;
  gradient: string; // CSS gradient for the avatar halo
}

const ROOMS: Room[] = [
  {
    id: 'girl-producers',
    name: 'Girl Producers',
    tagline: 'For women in production',
    icon: '💜',
    followers: 4820,
    online: 127,
    gradient: 'linear-gradient(135deg, #EC4899 0%, #A855F7 100%)',
  },
  {
    id: 'fl-studio-gang',
    name: 'FL Studio Gang',
    tagline: 'The Fruity Loop family',
    icon: '🍊',
    followers: 12_450,
    online: 384,
    gradient: 'linear-gradient(135deg, #F97316 0%, #F59E0B 100%)',
  },
  {
    id: 'ableton-lab',
    name: 'Ableton Lab',
    tagline: 'Live + Max/MSP nerds',
    icon: '🎛️',
    followers: 8_910,
    online: 241,
    gradient: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
  },
  {
    id: 'hip-hop-cypher',
    name: 'Hip-Hop Cypher',
    tagline: 'Beats, bars, and breaks',
    icon: '🎤',
    followers: 15_230,
    online: 512,
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)',
  },
];

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function RoomCard({ room }: { room: Room }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="rounded-2xl p-4 flex flex-col items-center text-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(20,10,35,0.6) 0%, rgba(10,4,18,0.85) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Concentric halo rings behind the avatar */}
      <div className="relative mb-4 mt-1">
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            transform: 'scale(1.55)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        />
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            transform: 'scale(1.3)',
            border: '1px solid rgba(255,255,255,0.08)',
            background: `conic-gradient(from 220deg, transparent 0%, ${room.gradient.split(' ')[2]?.replace(',', '') || '#A855F7'}55 10%, transparent 35%)`,
          }}
        />
        <div
          className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-[32px] relative"
          style={{
            background: room.gradient,
            boxShadow: '0 6px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}
        >
          <span>{room.icon}</span>
          {/* Online dot */}
          <span
            className="absolute top-0.5 right-0.5 w-[14px] h-[14px] rounded-full"
            style={{
              background: '#22C55E',
              boxShadow: '0 0 0 2px #0A0412, 0 0 6px rgba(34,197,94,0.6)',
            }}
          />
        </div>
      </div>

      <div className="text-[14px] font-bold text-white truncate w-full">{room.name}</div>
      <div className="text-[11px] text-white/40 mb-3 truncate w-full">{room.tagline}</div>

      <div className="flex items-center gap-3 text-[11px] text-white/60 mb-3">
        <span><span className="font-bold text-white">{formatCount(room.followers)}</span> followers</span>
        <span className="w-px h-3 bg-white/15" />
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22C55E' }} />
          <span className="font-bold text-white">{formatCount(room.online)}</span> online
        </span>
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => {
          // TODO: wire up real community rooms (presence, chat, membership).
          // For now, surface a friendly confirmation so the interaction feels live.
          window.dispatchEvent(new CustomEvent('ghost-toast', { detail: { message: `Joining ${room.name}…` } }));
          console.log('[community] join', room.id);
        }}
        className="w-full h-9 rounded-full text-[13px] font-bold text-white flex items-center justify-center gap-1.5 transition-all hover:brightness-110"
        style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)', boxShadow: '0 2px 10px rgba(124,58,237,0.35)' }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
        Join
      </motion.button>
    </motion.div>
  );
}

export default function CommunityRooms() {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-[12px] font-bold text-white/55 uppercase tracking-wider">Community rooms</h3>
        <span className="text-[11px] text-white/30">{ROOMS.length} rooms</span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {ROOMS.map((r) => <RoomCard key={r.id} room={r} />)}
      </div>
    </div>
  );
}
