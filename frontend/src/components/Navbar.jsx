import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Flame, LayoutDashboard, CheckCircle, XCircle, Clock, Zap, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api, { fileUrl } from '../api/axios';

function NotifIcon({ type }) {
  if (type === 'submission_approved') return <CheckCircle size={12} className="text-eco-400 shrink-0" />;
  if (type === 'submission_rejected') return <XCircle size={12} className="text-red-400 shrink-0" />;
  return <Clock size={12} className="text-yellow-400 shrink-0" />;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try { const { data } = await api.get('/notifications'); setNotifications(data); } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30000);
    return () => clearInterval(id);
  }, [user]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openNotifs = async () => {
    setNotifOpen(v => !v);
    setDropdownOpen(false);
    if (!notifOpen && unread > 0) {
      try { await api.put('/notifications/read-all'); setNotifications(p => p.map(n => ({ ...n, read: true }))); } catch {}
    }
  };

  const dashPath = user?.role === 'teacher' ? '/teacher' : '/dashboard';
  const unread = notifications.filter(n => !n.read).length;
  const xpForNext = (user?.level || 1) * 500;
  const xpPct = Math.min(100, ((user?.xp || 0) % xpForNext) / xpForNext * 100);

  return (
    <nav className="sticky top-0 z-50 h-[53px] flex items-center px-4"
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
      <div className="max-w-[1400px] w-full mx-auto flex items-center gap-3">

        {/* Logo */}
        <Link to={user ? dashPath : '/'} className="flex items-center gap-2 shrink-0 mr-3">
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-sm"
            style={{ background: 'rgba(22,163,74,0.20)', border: '1px solid rgba(22,163,74,0.30)' }}>
            🌍
          </div>
          <span className="font-bold text-[15px] tracking-tight hidden sm:block">EcoQuest</span>
        </Link>

        <div className="flex-1" />

        {user ? (
          <div className="flex items-center gap-2">
            {/* Streak */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
              <Flame size={13} className="text-orange-400" />
              <span className="font-mono font-semibold text-orange-400">{user.streak || 0}</span>
            </div>

            {/* Level + XP bar */}
            <div className="hidden lg:flex flex-col items-end gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-white/40">Lv.{user.level || 1}</span>
                <Zap size={10} className="text-eco-400" />
                <span className="text-[11px] font-mono text-white/40">{user.xp || 0} XP</span>
              </div>
              <div className="w-24 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${xpPct}%`, background: 'var(--accent)' }} />
              </div>
            </div>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button onClick={openNotifs}
                className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ background: notifOpen ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                <Bell size={14} className={unread > 0 ? 'text-white' : 'text-white/40'} />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center px-0.5 text-[9px] font-bold text-white"
                    style={{ background: '#ef4444' }}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl overflow-hidden shadow-2xl z-50 fade-in"
                  style={{ background: 'var(--card)', border: '1px solid var(--border-md)' }}>
                  <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
                    <p className="text-[13px] font-semibold">Notifications</p>
                    {notifications.length > 0 && <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>{notifications.length} total</span>}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center">
                        <Bell size={18} className="mx-auto mb-2" style={{ color: 'var(--text-3)' }} />
                        <p className="text-[12px]" style={{ color: 'var(--text-3)' }}>No notifications yet</p>
                      </div>
                    ) : notifications.map(n => (
                      <div key={n._id} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/3"
                        style={{ borderBottom: '1px solid var(--border)', background: !n.read ? 'rgba(255,255,255,0.02)' : '' }}>
                        <NotifIcon type={n.type} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>{n.message}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                            {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button onClick={() => { setDropdownOpen(v => !v); setNotifOpen(false); }}
                className="flex items-center gap-2 h-8 px-2.5 rounded-lg transition-colors"
                style={{ background: dropdownOpen ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                {/* Show avatar image if exists, otherwise initials */}
                <div className="w-5 h-5 rounded-md overflow-hidden flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ background: user.avatar ? 'transparent' : 'rgba(22,163,74,0.25)' }}>
                  {user.avatar
                    ? <img src={fileUrl(user.avatar)} alt={user.name} className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
                    : user.name?.[0]?.toUpperCase()
                  }
                </div>
                <span className="text-[13px] font-medium hidden sm:block">{user.name?.split(' ')[0]}</span>
                <ChevronDown size={12} style={{ color: 'var(--text-3)' }} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl overflow-hidden shadow-2xl z-50 fade-in"
                  style={{ background: 'var(--card)', border: '1px solid var(--border-md)' }}>
                  <div className="px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
                    <p className="text-[13px] font-semibold">{user.name}</p>
                    <p className="text-[11px] capitalize" style={{ color: 'var(--text-3)' }}>{user.role}</p>
                  </div>
                  <Link to={dashPath} onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-[13px] transition-colors hover:bg-white/5"
                    style={{ color: 'var(--text-2)' }}>
                    <LayoutDashboard size={13} /> Dashboard
                  </Link>
                  <Link to="/profile" onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-[13px] transition-colors hover:bg-white/5"
                    style={{ color: 'var(--text-2)' }}>
                    <UserCircle size={13} /> View Profile
                  </Link>
                  <button onClick={() => { logout(); navigate('/'); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] text-red-400 transition-colors hover:bg-red-500/10">
                    <LogOut size={13} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-secondary text-[13px] py-1.5 px-4">Login</Link>
            <Link to="/register" className="btn-primary text-[13px] py-1.5 px-4">Get Started</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
