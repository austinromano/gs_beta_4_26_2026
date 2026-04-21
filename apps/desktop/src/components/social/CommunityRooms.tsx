import { motion } from 'framer-motion';

/**
 * Community-rooms strip above the feed drop-zone. Portrait cards with
 * avatar + halo, name, tagline, follower/online counts, Join button —
 * scaled down so the feed below keeps most of the viewport while all
 * text stays legible. Rooms are hard-coded for now; membership, presence,
 * and chat are a separate feature.
 */
interface Room {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  followers: number;
  online: number;
  gradient: string;
  accent: string;
}

const ROOMS: Room[] = [
  { id: 'girl-producers', name: 'Girl Producers', tagline: 'For women in production', icon: '💜', followers: 4820,   online: 127, gradient: 'linear-gradient(135deg, #EC4899 0%, #A855F7 100%)', accent: '#EC4899' },
  { id: 'fl-studio-gang', name: 'FL Studio Gang', tagline: 'The Fruity Loop family',  icon: '🍊', followers: 12_450, online: 384, gradient: 'linear-gradient(135deg, #F97316 0%, #F59E0B 100%)', accent: '#F97316' },
  { id: 'ableton-lab',    name: 'Ableton Lab',    tagline: 'Live + Max/MSP nerds',    icon: '🎛️', followers: 8_910,  online: 241, gradient: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)', accent: '#06B6D4' },
  { id: 'hip-hop-cypher', name: 'Hip-Hop Cypher', tagline: 'Beats, bars, and breaks', icon: '🎤', followers: 15_230, online: 512, gradient: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)', accent: '#7C3AED' },
];

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function RoomCard({ room }: { room: Room }) {
  return (
    <motion.div
      whileHover={{ y: -1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="rounded-xl px-2 pt-3 pb-2.5 flex flex-col items-center text-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(20,10,35,0.6) 0%, rgba(10,4,18,0.85) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Halo + avatar + online dot */}
      <div className="relative mb-1.5">
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ transform: 'scale(1.4)', border: '1px solid rgba(255,255,255,0.05)' }}
        />
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            transform: 'scale(1.22)',
            border: `1px solid ${room.accent}33`,
            background: `conic-gradient(from 220deg, transparent 0%, ${room.accent}40 12%, transparent 32%)`,
          }}
        />
        <div
          className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-[20px] relative"
          style={{
            background: room.gradient,
            boxShadow: `0 2px 8px ${room.accent}40, inset 0 1px 0 rgba(255,255,255,0.15)`,
          }}
        >
          <span>{room.icon}</span>
          <span
            className="absolute top-0 right-0 w-[10px] h-[10px] rounded-full"
            style={{ background: '#22C55E', boxShadow: '0 0 0 2px #0A0412' }}
          />
        </div>
      </div>

      <div className="text-[12px] font-bold text-white truncate w-full leading-tight">{room.name}</div>
      <div className="text-[10px] text-white/40 mb-1.5 truncate w-full">{room.tagline}</div>

      <div className="flex items-center gap-1.5 text-[10px] text-white/60 mb-2">
        <span><span className="font-bold text-white">{formatCount(room.online)}</span> on</span>
        <span className="w-px h-2 bg-white/15" />
        <span><span className="font-bold text-white">{formatCount(room.followers)}</span> fol</span>
      </div>

      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={() => {
          window.dispatchEvent(new CustomEvent('ghost-toast', { detail: { message: `Joining ${room.name}…` } }));
          console.log('[community] join', room.id);
        }}
        className="w-full h-7 rounded-full text-[11px] font-bold text-white transition-all hover:brightness-110"
        style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)', boxShadow: '0 1px 6px rgba(124,58,237,0.35)' }}
      >
        Join
      </motion.button>
    </motion.div>
  );
}

export default function CommunityRooms() {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-[11px] font-bold text-white/55 uppercase tracking-wider">Community rooms</h3>
        <button className="text-[11px] text-white/35 hover:text-white/70 transition-colors">See all</button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {ROOMS.map((r) => <RoomCard key={r.id} room={r} />)}
      </div>
    </div>
  );
}
