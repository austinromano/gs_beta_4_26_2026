import { useSessionStore } from '../../stores/sessionStore';
import Avatar from '../common/Avatar';

// Live presence cluster — tiny circular avatars for every collaborator
// currently in the project room. Reads sessionStore.onlineUsers, which is
// fed by the server's `presence-update` / `user-joined` / `user-left`
// socket events, so the cluster updates in real time across the browser
// app and the VST plugin without polling.
export default function PresenceAvatars() {
  const onlineUsers = useSessionStore((s) => s.onlineUsers);
  if (!onlineUsers || onlineUsers.length === 0) return null;
  return (
    <div className="flex items-center -space-x-2 shrink-0" title={`${onlineUsers.length} in this project`}>
      {onlineUsers.slice(0, 6).map((u) => (
        <div
          key={u.userId}
          className="relative rounded-full"
          style={{
            // Inset ring (matches comment-pin styling) so overlapping
            // avatars stay visually separated.
            border: '2px solid #0A0412',
            borderRadius: '50%',
          }}
          title={u.displayName}
        >
          <Avatar name={u.displayName} src={u.avatarUrl ?? null} size="sm" userId={u.userId} />
          <span
            className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full"
            style={{ background: '#23A559', border: '2px solid #0A0412' }}
          />
        </div>
      ))}
      {onlineUsers.length > 6 && (
        <div
          className="relative rounded-full flex items-center justify-center w-6 h-6 text-[9px] font-semibold text-white/80"
          style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid #0A0412' }}
          title={`${onlineUsers.length - 6} more`}
        >
          +{onlineUsers.length - 6}
        </div>
      )}
    </div>
  );
}
