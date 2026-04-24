import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, School, BookOpen, Shield, Camera,
  Pencil, Check, X, ArrowLeft, Star, Flame, Trophy,
  Loader, AlertCircle, CheckCircle,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import api, { fileUrl } from '../api/axios';

// ── Avatar component — shows image or initials fallback ───────
function Avatar({ src, name, size = 96, editable = false, onEdit }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <div
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center font-bold text-white"
        style={{
          background: src ? 'transparent' : 'linear-gradient(135deg, #16a34a, #15803d)',
          border: '2px solid rgba(22,163,74,0.40)',
          fontSize: size * 0.33,
        }}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : initials}
      </div>

      {editable && (
        <button
          onClick={onEdit}
          className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{ background: '#16a34a', border: '2px solid var(--bg)' }}
          title="Change photo"
        >
          <Camera size={13} className="text-white" />
        </button>
      )}
    </div>
  );
}

// ── Info row — view mode ──────────────────────────────────────
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-md)' }}>
        <Icon size={13} style={{ color: 'var(--text-3)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="label mb-0.5">{label}</p>
        <p className="text-[14px] font-medium truncate">{value || '—'}</p>
      </div>
    </div>
  );
}

const CLASS_OPTIONS = [
  '', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12', 'College Year 1', 'College Year 2', 'College Year 3',
];

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(false);
  const [saving,  setSaving]    = useState(false);
  const [error,   setError]     = useState('');
  const [success, setSuccess]   = useState('');

  // Edit form state
  const [form, setForm] = useState({ name: '', school: '', class: '' });

  // Avatar preview
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile,    setAvatarFile]    = useState(null);

  // ── Load profile ─────────────────────────────────────────────
  useEffect(() => {
    api.get('/users/me')
      .then(({ data }) => {
        setProfile(data);
        setForm({ name: data.name || '', school: data.school || '', class: data.class || '' });
      })
      .catch(() => setError('Could not load profile'))
      .finally(() => setLoading(false));
  }, []);

  // ── Handle avatar file pick ───────────────────────────────────
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Client-side validation
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (jpg, png, etc.)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10 MB');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError('');
  };

  // ── Enter / cancel edit mode ──────────────────────────────────
  const startEditing = () => {
    setForm({ name: profile.name || '', school: profile.school || '', class: profile.class || '' });
    setAvatarPreview(null);
    setAvatarFile(null);
    setError('');
    setSuccess('');
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setAvatarPreview(null);
    setAvatarFile(null);
    setError('');
  };

  // ── Save profile ──────────────────────────────────────────────
  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!form.name.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setSaving(true);
    try {
      // Use FormData to support both text + file in one request
      const fd = new FormData();
      fd.append('name',   form.name.trim());
      fd.append('school', form.school.trim());
      fd.append('class',  form.class);
      if (avatarFile) fd.append('avatar', avatarFile);

      const { data } = await api.put('/users/me', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setProfile(data);
      setEditing(false);
      setAvatarPreview(null);
      setAvatarFile(null);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);

      // Refresh global auth context so Navbar shows updated avatar/name
      await refreshUser();

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Derived values ────────────────────────────────────────────
  const avatarSrc = avatarPreview
    ? avatarPreview
    : profile?.avatar
    ? fileUrl(profile.avatar)
    : null;

  const roleBadge = profile?.role === 'teacher'
    ? { label: 'Teacher', color: '#4ade80', bg: 'rgba(22,163,74,0.12)', border: 'rgba(22,163,74,0.25)' }
    : { label: 'Student', color: '#60a5fa', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)' };

  // ── Loading state ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bw-theme flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Loader size={28} className="text-eco-400 animate-spin" />
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bw-theme" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 md:ml-56 p-4 md:p-6 pb-20 md:pb-6">
          <div className="max-w-2xl mx-auto space-y-4">

            {/* Back */}
            <button onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-[13px] transition-colors hover:text-white"
              style={{ color: 'var(--text-3)' }}>
              <ArrowLeft size={14} /> Back
            </button>

            {/* Alert banners */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-[13px] text-red-400"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
                <AlertCircle size={14} className="shrink-0" /> {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-[13px] text-eco-400"
                style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.20)' }}>
                <CheckCircle size={14} className="shrink-0" /> {success}
              </div>
            )}

            {/* ── Profile card ─────────────────────────────── */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border-md)' }}>

              {/* Header banner */}
              <div className="h-24 relative" style={{
                background: 'linear-gradient(135deg, rgba(22,163,74,0.20) 0%, rgba(22,163,74,0.04) 100%)',
                borderBottom: '1px solid var(--border)',
              }} />

              {/* Avatar + name row */}
              <div className="px-6 pb-6">
                <div className="flex items-end justify-between -mt-12 mb-4">
                  <div>
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    <Avatar
                      src={avatarSrc}
                      name={profile?.name}
                      size={80}
                      editable={editing}
                      onEdit={() => fileInputRef.current?.click()}
                    />
                    {editing && (
                      <p className="text-[11px] mt-2" style={{ color: 'var(--text-3)' }}>
                        Click camera to change photo · Max 10 MB (jpg/png/webp)
                      </p>
                    )}
                  </div>

                  {/* Edit / Save / Cancel buttons */}
                  <div className="flex items-center gap-2 mb-2">
                    {!editing ? (
                      <button onClick={startEditing} className="btn-secondary flex items-center gap-2 text-[13px]" style={{ padding: '0.45rem 0.9rem' }}>
                        <Pencil size={13} /> Edit Profile
                      </button>
                    ) : (
                      <>
                        <button onClick={cancelEditing} className="btn-secondary flex items-center gap-2 text-[13px]" style={{ padding: '0.45rem 0.9rem' }}
                          disabled={saving}>
                          <X size={13} /> Cancel
                        </button>
                        <button onClick={handleSave} className="btn-primary flex items-center gap-2 text-[13px]" style={{ padding: '0.45rem 0.9rem' }}
                          disabled={saving}>
                          {saving ? <Loader size={13} className="animate-spin" /> : <Check size={13} />}
                          {saving ? 'Saving…' : 'Save'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Name + role badge */}
                {!editing ? (
                  <div className="mb-1">
                    <h1 className="text-xl font-bold tracking-tight">{profile?.name}</h1>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[12px] font-semibold px-2.5 py-0.5 rounded-full"
                        style={{ background: roleBadge.bg, color: roleBadge.color, border: `1px solid ${roleBadge.border}` }}>
                        {roleBadge.label}
                      </span>
                      {profile?.isVerified && (
                        <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-3)' }}>
                          <CheckCircle size={11} className="text-eco-400" /> Verified
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 space-y-3">
                    <div>
                      <label className="label block mb-1.5">Full Name</label>
                      <div className="relative">
                        <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                        <input
                          className="input pl-9"
                          value={form.name}
                          onChange={e => setForm({ ...form, name: e.target.value })}
                          placeholder="Your name"
                          maxLength={80}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="label block mb-1.5">School / Institution</label>
                      <div className="relative">
                        <School size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                        <input
                          className="input pl-9"
                          value={form.school}
                          onChange={e => setForm({ ...form, school: e.target.value })}
                          placeholder="ABC Public School"
                          maxLength={120}
                        />
                      </div>
                    </div>
                    {profile?.role === 'student' && (
                      <div>
                        <label className="label block mb-1.5">Class / Grade</label>
                        <div className="relative">
                          <BookOpen size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                          <select
                            className="input pl-9"
                            value={form.class}
                            onChange={e => setForm({ ...form, class: e.target.value })}
                          >
                            {CLASS_OPTIONS.map(c => (
                              <option key={c} value={c}>{c || 'Select Class'}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Info section (view mode only) ────────── */}
              {!editing && (
                <div className="px-6 pb-6 space-y-0" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="text-[11px] font-semibold mt-4 mb-2" style={{ color: 'var(--text-3)' }}>PROFILE DETAILS</p>
                  <InfoRow icon={Mail}    label="Email"        value={profile?.email} />
                  <InfoRow icon={School}  label="School"       value={profile?.school} />
                  {profile?.role === 'student' && (
                    <InfoRow icon={BookOpen} label="Class"     value={profile?.class} />
                  )}
                  <InfoRow icon={Shield}  label="Role"         value={profile?.role === 'teacher' ? 'Teacher' : 'Student'} />
                  <InfoRow icon={User}    label="Joined"       value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—'} />
                </div>
              )}
            </div>

            {/* ── Stats card ─────────────────────────────── */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Star,   label: 'Total XP',   value: profile?.xp     ?? 0,         color: '#4ade80' },
                { icon: Flame,  label: 'Streak',      value: `${profile?.streak ?? 0}d`,   color: '#fb923c' },
                { icon: Trophy, label: 'Level',       value: `Lv. ${profile?.level ?? 1}`, color: '#facc15' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="rounded-2xl p-4 text-center"
                  style={{ background: 'var(--card)', border: '1px solid var(--border-md)' }}>
                  <Icon size={16} className="mx-auto mb-2" style={{ color }} />
                  <p className="text-xl font-bold font-mono" style={{ color }}>{value}</p>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>{label}</p>
                </div>
              ))}
            </div>

            {/* ── Badges ─────────────────────────────────── */}
            {profile?.badges?.length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border-md)' }}>
                <p className="text-[12px] font-semibold mb-3" style={{ color: 'var(--text-2)' }}>Badges Earned</p>
                <div className="flex flex-wrap gap-2">
                  {profile.badges.map((badge, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-[12px] font-medium"
                      style={{ background: 'rgba(22,163,74,0.12)', color: '#4ade80', border: '1px solid rgba(22,163,74,0.25)' }}>
                      🏅 {badge}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
