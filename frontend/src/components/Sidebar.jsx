import { NavLink } from 'react-router-dom';
import { fileUrl } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, BookOpen, Leaf, Trophy, BarChart2, Inbox, Star, Flame, Zap } from 'lucide-react';

const studentLinks = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/learn',       icon: BookOpen,         label: 'Learn' },
  { to: '/civic',       icon: Leaf,             label: 'Civic' },
  { to: '/leaderboard', icon: Trophy,           label: 'Leaderboard' },
  { to: '/analytics',   icon: BarChart2,        label: 'Analytics' },
];

const teacherLinks = [
  { to: '/teacher',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/civic',       icon: Inbox,            label: 'Reviews' },
  { to: '/leaderboard', icon: Trophy,           label: 'Leaderboard' },
  { to: '/analytics',   icon: BarChart2,        label: 'Analytics' },
];

export default function Sidebar() {
  const { user } = useAuth();
  const links = user?.role === 'teacher' ? teacherLinks : studentLinks;

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:fixed md:flex md:left-0 md:top-[53px] md:h-[calc(100vh-53px)] md:w-56 flex-col z-40"
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>

        <nav className="flex-1 flex flex-col gap-0.5 px-2 pt-4">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/dashboard' || to === '/teacher'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative ${
                  isActive ? 'text-white' : 'text-white/35 hover:text-white/80 hover:bg-white/5'
                }`
              }>
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute inset-0 rounded-lg"
                      style={{ background: 'rgba(22,163,74,0.10)', border: '1px solid rgba(22,163,74,0.20)' }} />
                  )}
                  <Icon size={16} className={`shrink-0 relative z-10 ${isActive ? 'text-eco-400' : ''}`} />
                  <span className="text-[13.5px] font-medium relative z-10">{label}</span>
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-eco-500 relative z-10" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User card */}
        <div className="px-2 pb-4">
          <div className="rounded-xl p-3" style={{ background: 'var(--tile)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2.5 mb-2.5">
              {/* Show avatar image if set, else initials */}
              <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{
                  background: user?.avatar ? 'transparent' : 'rgba(22,163,74,0.20)',
                  border: '1px solid rgba(22,163,74,0.30)',
                }}>
                {user?.avatar ? (
                  <img
                    src={fileUrl(user.avatar)}
                    alt={user?.name}
                    className="w-full h-full object-cover"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  user?.name?.[0]?.toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold truncate leading-tight">{user?.name?.split(' ')[0]}</p>
                <p className="text-[11px] capitalize" style={{ color: 'var(--text-3)' }}>{user?.class || user?.role}</p>
              </div>
            </div>
            <div className="flex justify-between" style={{ color: 'var(--text-3)' }}>
              <span className="flex items-center gap-1 text-[11px]">
                <Star size={10} className="text-eco-500" />
                <span className="font-mono text-[11px]">{user?.xp || 0}</span>
              </span>
              <span className="flex items-center gap-1 text-[11px]">
                <Flame size={10} className="text-orange-400" />
                <span className="font-mono text-[11px]">{user?.streak || 0}d</span>
              </span>
              {user?.role !== 'teacher' && (
                <span className="flex items-center gap-1 text-[11px]">
                  <Zap size={10} className="text-eco-400" />
                  <span className="font-mono text-[11px]">Lv{user?.level || 1}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch"
        style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/dashboard' || to === '/teacher'}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors"
            style={({ isActive }) => ({ color: isActive ? '#4ade80' : 'rgba(255,255,255,0.3)' })}>
            {({ isActive }) => (
              <>
                <Icon size={18} />
                <span className="text-[10px] font-medium">{label}</span>
                {isActive && <span className="absolute -top-px h-0.5 w-8 rounded-full" style={{ background: '#4ade80' }} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
