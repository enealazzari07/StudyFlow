// StudyFlow — Dashboard v4: settings, pro/free, fixed AI, fixed RLS
const { useState, useEffect, useRef } = React;

const AIRFORCE_KEY = 'sk-air-tWdMV6mXgoa1zAfHr8UfGVI9BFzyr5dXE2jdZO4pPApRVrXDyH6W6Bdv6RwmUctq';
const AI_MODEL = 'claude-sonnet-4-6';
const AI_URL = 'https://api.airforce/v1/chat/completions';

// ─── Helpers ─────────────────────────────────────────────────
function formatFileSize(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b/1024).toFixed(1)} KB`;
  return `${(b/1048576).toFixed(1)} MB`;
}
function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff/60000);
  if (m < 1) return 'gerade eben';
  if (m < 60) return `vor ${m} Min.`;
  const h = Math.floor(m/60);
  if (h < 24) return `vor ${h} Std.`;
  return `vor ${Math.floor(h/24)} T.`;
}
function readFileAsBase64(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
}
function readFileAsText(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsText(file); });
}

function createFolderArtDataUri({ filled = false } = {}) {
  const svg = filled ? `
    <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="folderBack" x1="18" y1="16" x2="142" y2="148" gradientUnits="userSpaceOnUse">
          <stop stop-color="#2CC7FF"/>
          <stop offset="1" stop-color="#1638C7"/>
        </linearGradient>
        <linearGradient id="folderFront" x1="26" y1="42" x2="138" y2="146" gradientUnits="userSpaceOnUse">
          <stop stop-color="#3CC4FF"/>
          <stop offset="1" stop-color="#3055CC"/>
        </linearGradient>
        <linearGradient id="paper" x1="34" y1="24" x2="122" y2="78" gradientUnits="userSpaceOnUse">
          <stop stop-color="#F7FBFF"/>
          <stop offset="1" stop-color="#D3E3F6"/>
        </linearGradient>
      </defs>
      <rect x="4" y="18" width="152" height="134" rx="22" fill="url(#folderBack)" stroke="#5EAFFF" stroke-width="3"/>
      <path d="M18 36C18 26.6112 25.6112 19 35 19H67.2467C71.2585 19 75.1266 20.5112 78.0785 23.232L87.9215 32.2979C90.8734 35.0187 94.7415 36.53 98.7533 36.53H140C146.627 36.53 152 41.9026 152 48.53V55H18V36Z" fill="#7EDBFF" fill-opacity="0.42"/>
      <g opacity="0.96">
        <path d="M32 30.5C33.7334 25.247 39.2142 21.9593 44.6897 22.6478L127.024 33.0006C132.499 33.6891 136.334 38.0933 135.998 43.242L132.353 99.1173C132.017 104.266 127.637 108.122 122.162 107.434L39.8272 97.0815C34.3517 96.393 30.5164 91.9888 30.8521 86.8401L32 30.5Z" fill="url(#paper)"/>
        <path d="M25.5 44.5C26.6769 38.5067 31.8772 34.1667 38.0264 34.0574L119.32 32.6128C125.469 32.5035 130.822 36.6565 132.211 42.6045L144.517 95.3021C145.906 101.25 142.882 107.403 137.245 109.713L62.0254 140.545C56.3884 142.855 49.9249 140.759 46.7446 135.51L18.587 89.0368C15.4066 83.7875 14.7331 77.1059 16.7832 71.2483L25.5 44.5Z" fill="url(#paper)" fill-opacity="0.84"/>
      </g>
      <rect x="10" y="39" width="140" height="106" rx="22" fill="url(#folderFront)" stroke="#66ACFF" stroke-width="3"/>
    </svg>
  ` : `
    <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="folderShell" x1="16" y1="14" x2="144" y2="148" gradientUnits="userSpaceOnUse">
          <stop stop-color="#2CC7FF"/>
          <stop offset="1" stop-color="#1638C7"/>
        </linearGradient>
        <linearGradient id="folderFace" x1="12" y1="40" x2="148" y2="148" gradientUnits="userSpaceOnUse">
          <stop stop-color="#35BCFF"/>
          <stop offset="1" stop-color="#2348CB"/>
        </linearGradient>
      </defs>
      <path d="M5 29C5 16.8497 14.8497 7 27 7H73.4387C78.6698 7 83.7023 9.00937 87.4984 12.6132L97.5016 22.1068C101.298 25.7106 106.33 27.72 111.561 27.72H133C145.15 27.72 155 37.5697 155 49.72V133C155 145.15 145.15 155 133 155H27C14.8497 155 5 145.15 5 133V29Z" fill="url(#folderShell)" stroke="#5EAFFF" stroke-width="3"/>
      <rect x="5" y="42" width="150" height="113" rx="22" fill="url(#folderFace)" stroke="#66ACFF" stroke-width="3"/>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const EMPTY_FOLDER_ART = createFolderArtDataUri({ filled: false });
const FILLED_FOLDER_ART = createFolderArtDataUri({ filled: true });

async function callAI(messages) {
  const res = await fetch(AI_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${AIRFORCE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: AI_MODEL, messages }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    if (res.status === 429) throw new Error('RATE_LIMIT');
    throw new Error(`API ${res.status}: ${txt.slice(0,120)}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

// Robustly extract JSON array or object from raw AI text
function extractJSON(raw) {
  if (!raw) return null;
  // Strip markdown code fences
  let s = raw.replace(/```(?:json|JSON)?\s*/g, '').replace(/```\s*/g, '').trim();
  // Try array first
  const arr = s.match(/\[[\s\S]*\]/);
  if (arr) { try { const p = JSON.parse(arr[0]); if (Array.isArray(p) && p.length) return p; } catch {} }
  // Try object
  const obj = s.match(/\{[\s\S]*\}/);
  if (obj) { try { return JSON.parse(obj[0]); } catch {} }
  return null;
}

// ─── Toggle ──────────────────────────────────────────────────
const Toggle = ({ on, onChange }) => (
  <div onClick={onChange} style={{ width: 40, height: 22, borderRadius: 999, background: on ? '#6366f1' : 'var(--border-focus)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
    <div style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(15,23,42,0.2)' }}/>
  </div>
);

// ─── Create Set Modal ────────────────────────────────────────
const CreateSetModal = ({ onClose, onCreated, userId }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [folder, setFolder] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true); setError('');
    const { data, error: err } = await window.sb.from('study_sets').insert({
      owner_id: userId, title: title.trim(), emoji: null,
      description: description.trim() || null, folder: folder.trim() || null,
    }).select().single();
    setLoading(false);
    if (err) { setError(err.message); return; }
    onCreated(data); onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div style={{ background: 'var(--bg-panel)', borderRadius: 20, padding: 32, width: 480, boxShadow: '0 20px 60px rgba(15,23,42,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: 'Instrument Sans', fontSize: 20, fontWeight: 600, color: 'var(--text-main)', marginBottom: 24 }}>Neues Lernset erstellen</div>
        {error && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#991b1b', marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Titel *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="input-paper" placeholder="z.B. Mikroökonomie II" required autoFocus/>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Beschreibung (optional)</label>
            <input value={description} onChange={e => setDescription(e.target.value)} className="input-paper" placeholder="Kurze Beschreibung…"/>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Ordner (optional)</label>
            <input value={folder} onChange={e => setFolder(e.target.value)} className="input-paper" placeholder="z.B. Sommersemester 26"/>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex: 1, justifyContent: 'center', padding: '11px 0' }}>Abbrechen</button>
            <button type="submit" disabled={loading || !title.trim()} className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '11px 0', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Erstelle…' : <><Icons.Plus size={14}/> Erstellen</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Extensions Panel ─────────────────────────────────────────
const EXTENSIONS = [
  {
    id: 'onenote',
    name: 'Microsoft OneNote',
    desc: 'Exportiere Notizen, Karteikarten und Zusammenfassungen direkt in OneNote-Notizbücher.',
    icon: '📓',
    color: '#7719AA',
    bg: '#f5e6ff',
    makeScenarioId: 9126398,
    connected: false,
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    desc: 'Teile Lernerfolge und Lernsets in Teams-Kanälen mit Kommilitonen.',
    icon: '💬',
    color: '#5059C9',
    bg: '#eef0ff',
    makeScenarioId: 9126399,
    connected: false,
  },
  {
    id: 'gdrive',
    name: 'Google Drive',
    desc: 'Synchronisiere Dokumente und Lernmaterialien mit Google Drive.',
    icon: '📁',
    color: '#1967D2',
    bg: '#e8f0fe',
    makeScenarioId: null,
    connected: false,
  },
  {
    id: 'gcal',
    name: 'Google Calendar',
    desc: 'Plane Lernsessions automatisch in deinem Google Kalender ein.',
    icon: '📅',
    color: '#1E8E3E',
    bg: '#e6f4ea',
    makeScenarioId: null,
    connected: false,
  },
  {
    id: 'notion',
    name: 'Notion',
    desc: 'Exportiere Karteikarten und Zusammenfassungen in Notion-Datenbanken.',
    icon: '⬛',
    color: '#0f172a',
    bg: '#f1f5f9',
    makeScenarioId: null,
    connected: false,
  },
  {
    id: 'slack',
    name: 'Slack',
    desc: 'Empfange tägliche Lernerinnerungen und teile Fortschritte in Slack.',
    icon: '🟣',
    color: '#611f69',
    bg: '#fce8ff',
    makeScenarioId: null,
    connected: false,
  },
  {
    id: 'github',
    name: 'GitHub',
    desc: 'Verknüpfe Programmier-Lernsets mit deinen GitHub-Repositories.',
    icon: '🐙',
    color: '#0f172a',
    bg: '#f1f5f9',
    makeScenarioId: null,
    connected: false,
  },
  {
    id: 'spotify',
    name: 'Spotify',
    desc: 'Starte automatisch Focus-Playlists beim Beginn einer Lernsession.',
    icon: '🎵',
    color: '#1DB954',
    bg: '#e6faf0',
    makeScenarioId: null,
    connected: false,
  },
];

const ExtensionsPanel = () => {
  const [connected, setConnected] = useState({});
  const makeBaseUrl = 'https://eu2.make.com/1840378/scenarios';

  const handleConnect = (ext) => {
    if (ext.makeScenarioId) {
      window.open(`${makeBaseUrl}/${ext.makeScenarioId}/edit`, '_blank');
      setConnected(prev => ({ ...prev, [ext.id]: true }));
    } else {
      window.open('https://make.com', '_blank');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: 'Instrument Sans', fontSize: 18, fontWeight: 600, color: 'var(--text-main)', margin: '0 0 4px' }}>Erweiterungen</h2>
        <div style={{ fontSize: 13, color: 'var(--text-light)' }}>
          Verbinde StudyFlow mit deinen Lieblingstools über{' '}
          <a href="https://make.com" target="_blank" rel="noreferrer" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>Make.com</a>.
          Die Szenarien für OneNote und Teams sind bereits eingerichtet.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {EXTENSIONS.map(ext => {
          const isConnected = connected[ext.id] || ext.connected;
          const hasMake = !!ext.makeScenarioId;
          return (
            <div key={ext.id} style={{
              background: 'var(--bg-panel)',
              border: `1px solid ${isConnected ? ext.color + '44' : 'var(--border-light)'}`,
              borderRadius: 14,
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              transition: 'box-shadow 0.15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: ext.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    {ext.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>{ext.name}</div>
                    {hasMake && (
                      <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 500, marginTop: 1, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#6366f1', display: 'inline-block' }}/>
                        Make.com Szenario
                      </div>
                    )}
                  </div>
                </div>
                {isConnected && (
                  <span style={{ fontSize: 10, background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>AKTIV</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-light)', lineHeight: 1.5 }}>{ext.desc}</div>
              <button
                onClick={() => handleConnect(ext)}
                style={{
                  marginTop: 'auto',
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: isConnected ? `1px solid ${ext.color}44` : '1px solid var(--border-light)',
                  background: isConnected ? ext.bg : 'white',
                  color: isConnected ? ext.color : 'var(--text-main)',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 0.15s',
                }}
              >
                {isConnected ? <><Icons.Check size={12}/> Konfigurieren</> : hasMake ? <><Icons.Share size={12}/> Verbinden</> : '+ Make.com einrichten'}
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ background: 'linear-gradient(135deg, #eef2ff, #f5f3ff)', borderRadius: 14, padding: 18, border: '1px solid #c7d2fe', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ fontSize: 28 }}>⚡</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#312e81', marginBottom: 3 }}>Eigene Automatisierung über Make.com</div>
          <div style={{ fontSize: 12, color: '#4338ca' }}>
            Erstelle benutzerdefinierte Workflows: z.B. Karten aus E-Mails importieren, Lernstatistiken in Airtable speichern oder Zusammenfassungen per Telegram erhalten.
          </div>
        </div>
        <a href="https://eu2.make.com/1840378/scenarios" target="_blank" rel="noreferrer"
          style={{ marginLeft: 'auto', flexShrink: 0, padding: '8px 16px', background: '#4f46e5', color: 'white', borderRadius: 8, fontSize: 12, fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap' }}>
          Make.com öffnen →
        </a>
      </div>
    </div>
  );
};

// ─── Settings Panel ──────────────────────────────────────────
const SettingsPanel = ({ user, profile, onProfileUpdate, darkMode, setDarkMode }) => {
  const [settingsTab, setSettingsTab] = useState('profil');
  const [name, setName] = useState(profile?.display_name || '');
  const [university, setUniversity] = useState(profile?.university || '');
  const [weeklyGoal, setWeeklyGoal] = useState(profile?.weekly_goal || 20);
  const [bio, setBio] = useState(profile?.bio || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const isPro = profile?.plan === 'pro';
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Nutzer';
  const refCode = profile?.referral_code || user?.id?.split('-')[0].toUpperCase() || 'DEMO';

  const handleSave = async () => {
    setSaving(true);
    const { data } = await window.sb.from('profiles').update({
      display_name: name.trim() || displayName,
      university: university.trim() || null,
      weekly_goal: weeklyGoal,
      bio: bio.trim() || null,
    }).eq('id', user.id).select().single();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (data) onProfileUpdate(data);
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    const { data } = await window.sb.from('profiles').update({ plan: 'pro' }).eq('id', user.id).select().single();
    setUpgrading(false);
    setShowUpgrade(false);
    if (data) onProfileUpdate(data);
  };

  const handleDowngrade = async () => {
    if (!confirm('Auf Free downgraden?')) return;
    const { data } = await window.sb.from('profiles').update({ plan: 'free' }).eq('id', user.id).select().single();
    if (data) onProfileUpdate(data);
  };

  const PRO_FEATURES = [
    { icon: <Icons.Sparkles size={14}/>, label: 'Unbegrenzte AI-Analysen', free: '3 / Monat', pro: 'Unbegrenzt' },
    { icon: <Icons.Cards size={14}/>, label: 'Lernsets', free: 'Bis 10', pro: 'Unbegrenzt' },
    { icon: <Icons.Eye size={14}/>, label: 'Bildanalyse (Vision AI)', free: false, pro: true },
    { icon: <Icons.Users size={14}/>, label: 'Kollaboration', free: false, pro: true },
    { icon: <Icons.Chart size={14}/>, label: 'Detaillierte Statistiken', free: false, pro: true },
    { icon: <Icons.Mail size={14}/>, label: 'Uni-Mail Bonus', free: false, pro: 'Kostenlos!' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'Instrument Sans', fontSize: 22, fontWeight: 600, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>Einstellungen</h1>
          <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>Profil, Lernziele und Erweiterungen verwalten.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-panel)', padding: '6px 12px', borderRadius: 999, border: '1px solid var(--border-light)' }}>
          <Icons.Eye size={14} color="var(--text-muted)"/>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-main)' }}>Dark Mode</span>
          <Toggle on={darkMode} onChange={() => setDarkMode(!darkMode)}/>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-panel)', borderRadius: 10, padding: 4, border: '1px solid var(--border-light)', alignSelf: 'flex-start' }}>
        {[{ id: 'profil', label: 'Profil & Abo', icon: '👤' }, { id: 'extensions', label: 'Erweiterungen', icon: '🔌' }].map(tab => (
          <button key={tab.id} onClick={() => setSettingsTab(tab.id)} style={{
            padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 13, fontWeight: settingsTab === tab.id ? 600 : 400,
            background: settingsTab === tab.id ? 'white' : 'transparent',
            color: settingsTab === tab.id ? 'var(--text-main)' : 'var(--text-muted)',
            boxShadow: settingsTab === tab.id ? '0 1px 4px rgba(15,23,42,0.08)' : 'none',
            display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
          }}>
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {settingsTab === 'extensions' && <ExtensionsPanel />}
      {settingsTab === 'profil' && <>

      {/* Plan banner */}
      <div style={{
        borderRadius: 16, padding: '18px 22px',
        background: isPro ? 'linear-gradient(135deg, #1e1b4b, #312e81)' : 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
        border: isPro ? 'none' : '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 10,
              background: isPro ? 'rgba(99,102,241,0.22)' : 'rgba(15,23,42,0.06)',
              color: isPro ? '#c7d2fe' : '#475569',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: isPro ? '1px solid rgba(165,180,252,0.25)' : '1px solid rgba(15,23,42,0.06)',
            }}>
              {isPro ? <Icons.Bolt size={14}/> : <Icons.Bookmark size={14}/>}
            </div>
            <div style={{ fontFamily: 'Instrument Sans', fontSize: 16, fontWeight: 700, color: isPro ? 'white' : 'var(--text-main)' }}>
              {isPro ? 'Pro Plan' : 'Free Plan'}
            </div>
            {isPro && <span style={{ fontSize: 10, background: '#818cf8', color: 'white', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>AKTIV</span>}
          </div>
          <div style={{ fontSize: 12.5, color: isPro ? '#a5b4fc' : 'var(--text-light)' }}>
            {isPro ? 'Voller Zugriff auf alle Features — vielen Dank!' : 'Upgrade für unbegrenzte AI, Bildanalyse & mehr.'}
          </div>
        </div>
        {isPro ? (
          <button onClick={handleDowngrade} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '7px 14px', fontSize: 12, color: '#c7d2fe', cursor: 'pointer', fontFamily: 'inherit' }}>
            Kündigen
          </button>
        ) : (
          <button onClick={() => setShowUpgrade(true)} className="btn-primary" style={{ padding: '9px 18px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', flexShrink: 0 }}>
            <Icons.Sparkles size={13}/> Upgrade auf Pro
          </button>
        )}
      </div>

      {/* Profile form */}
      <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid rgba(15,23,42,0.06)', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Profil</div>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar name={displayName} color="#6366f1" size={56}/>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{displayName}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{user?.email}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Anzeigename</label>
            <input value={name} onChange={e => setName(e.target.value)} className="input-paper" placeholder={displayName}/>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Universität</label>
            <input value={university} onChange={e => setUniversity(e.target.value)} className="input-paper" placeholder="z.B. FU Berlin"/>
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Bio (optional)</label>
          <input value={bio} onChange={e => setBio(e.target.value)} className="input-paper" placeholder="Kurze Beschreibung…"/>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 10 }}>Wochenziel — <span style={{ color: '#6366f1', fontWeight: 600 }}>{weeklyGoal} Karten</span></label>
          <input type="range" min={5} max={200} step={5} value={weeklyGoal} onChange={e => setWeeklyGoal(+e.target.value)}
            style={{ width: '100%', accentColor: '#6366f1' }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
            <span>5 Karten</span><span>200 Karten</span>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ alignSelf: 'flex-start', padding: '9px 22px', opacity: saving ? 0.7 : 1 }}>
          {saved ? <><Icons.Check size={14}/> Gespeichert!</> : saving ? 'Speichert…' : 'Änderungen speichern'}
        </button>
      </div>

      {/* Referral System */}
      <div style={{ background: 'var(--bg-panel)', borderRadius: 16, padding: 24, border: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>Freunde einladen</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>Empfiehl StudyFlow und sichere dir Guthaben.</div>
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '6px 12px', borderRadius: 999, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Guthaben:</span> {Number(profile?.balance || 0).toFixed(2).replace('.', ',')} €
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
          Teile deinen Code. Wenn sich jemand mit deinem Code registriert und ein Pro-Abo abschließt, erhaltet ihr beide <strong style={{ color: 'var(--text-main)' }}>4,00 €</strong> auf euer Konto gutgeschrieben. Das Guthaben wird automatisch verrechnet.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input readOnly value={refCode} className="input-paper" style={{ flex: 1, color: 'var(--text-main)', background: 'var(--bg-hover)', fontFamily: 'JetBrains Mono', fontSize: 16, letterSpacing: '0.1em', textAlign: 'center', fontWeight: 600 }} />
          <button onClick={() => { navigator.clipboard.writeText(refCode); alert('Code kopiert!'); }} className="btn-ghost" style={{ padding: '0 16px' }}>
            Code kopieren
          </button>
        </div>
      </div>

      {/* Feature comparison */}
      <div style={{ background: 'var(--bg-panel)', borderRadius: 16, padding: 24, border: '1px solid var(--border-light)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', marginBottom: 16 }}>Free vs. Pro</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', gap: 0 }}>
          <div/><div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textAlign: 'center', padding: '6px 0' }}>FREE</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textAlign: 'center', padding: '6px 0' }}>PRO</div>
          {PRO_FEATURES.map((f, i) => (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderTop: '1px solid var(--border-light)', fontSize: 13, color: 'var(--text-muted)' }}>
                <span style={{ color: '#6366f1', display: 'flex' }}>{f.icon}</span>{f.label}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid var(--border-light)', fontSize: 12 }}>
                {f.free === false
                  ? <span style={{ color: '#cbd5e1', display: 'flex' }}><Icons.X size={14}/></span>
                  : <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>{f.free === true ? <Icons.Check size={14}/> : f.free}</span>
                }
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid var(--border-light)', fontSize: 12, color: '#6366f1', fontWeight: 500 }}>
                {f.pro === false
                  ? <span style={{ color: '#cbd5e1', display: 'flex' }}><Icons.X size={14}/></span>
                  : (f.pro === true ? <span style={{ display: 'flex' }}><Icons.Check size={14}/></span> : f.pro)
                }
              </div>
            </React.Fragment>
          ))}
        </div>
        {!isPro && (
          <button onClick={() => setShowUpgrade(true)} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px 0', marginTop: 20, background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
            <Icons.Sparkles size={14}/> Jetzt auf Pro upgraden — 5,99 €/Monat
          </button>
        )}
      </div>

      {/* Danger zone */}
      <div style={{ background: 'var(--bg-panel)', borderRadius: 16, padding: 24, border: '1px solid #fecaca' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#991b1b', marginBottom: 12 }}>Gefahrenzone</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-main)', fontWeight: 500 }}>Konto löschen</div>
            <div style={{ fontSize: 12, color: 'var(--text-lighter)', marginTop: 2 }}>Alle Daten werden unwiderruflich gelöscht.</div>
          </div>
          <button onClick={() => alert('Bitte wende dich an den Support.')} style={{ padding: '7px 14px', background: 'none', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 12, color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit' }}>
            Konto löschen
          </button>
        </div>
      </div>

      </>}

      {/* Upgrade Modal */}
      {showUpgrade && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setShowUpgrade(false)}>
          <div style={{ background: 'white', borderRadius: 24, padding: 36, width: 420, boxShadow: '0 30px 80px rgba(15,23,42,0.25)', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 64, height: 64, borderRadius: 20, margin: '0 auto 12px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.Bolt size={28}/>
            </div>
            <div style={{ fontFamily: 'Instrument Sans', fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>StudyFlow Pro</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Lerne smarter — ohne Einschränkungen.</div>
            <div style={{ fontFamily: 'Instrument Sans', fontSize: 36, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
              5,99 € <span style={{ fontSize: 16, color: '#64748b', fontWeight: 400 }}>/Monat</span>
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 28 }}>Jederzeit kündbar · Keine Bindung</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28, textAlign: 'left' }}>
              {['Unbegrenzte AI-Analysen & Bildanalyse', 'Unbegrenzte Lernsets', 'Kollaboration in Echtzeit', 'Detaillierte Lernstatistiken', 'Prioritäts-Support'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155' }}>
                  <span style={{ color: '#6366f1', display: 'flex' }}><Icons.Check size={14}/></span> {f}
                </div>
              ))}
            </div>
            <button onClick={handleUpgrade} disabled={upgrading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px 0', fontSize: 15, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', opacity: upgrading ? 0.7 : 1 }}>
              {upgrading ? 'Wird aktiviert…' : <><Icons.Sparkles size={16}/> Pro aktivieren</>}
            </button>
            <button onClick={() => setShowUpgrade(false)} style={{ marginTop: 12, background: 'none', border: 'none', fontSize: 13, color: '#94a3b8', cursor: 'pointer', fontFamily: 'inherit' }}>
              Vielleicht später
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Docs Panel ──────────────────────────────────────────────
const DocsPanel = ({ userId }) => {
  const [items, setItems] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null); // null = root
  const [loading, setLoading] = useState(true);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (userId) load(); }, [userId]);

  const load = async () => {
    setLoading(true);
    const { data } = await window.sb.from('documents')
      .select('*').eq('owner_id', userId)
      .order('doc_type', { ascending: true })
      .order('name', { ascending: true });
    setItems(data || []);
    setLoading(false);
  };

  const createFolder = async () => {
    if (!folderName.trim()) return;
    setCreating(true);
    const { error: err } = await window.sb.from('documents').insert({
      owner_id: userId, name: folderName.trim(),
      doc_type: 'folder', file_path: '', file_size: 0,
      mime_type: 'studyflow/folder',
      folder_id: currentFolder,
    });
    setCreating(false);
    if (err) { setError(err.message); return; }
    setFolderName(''); setShowNewFolder(false);
    load();
  };

  const createDoc = async () => {
    const { data, error: err } = await window.sb.from('documents').insert({
      owner_id: userId, name: 'Neues Dokument',
      doc_type: 'doc', file_path: '', file_size: 0,
      mime_type: 'application/studyflow-doc+json',
      folder_id: currentFolder,
    }).select().single();
    if (err) { setError(err.message); return; }
    window.location.href = `dokument.html?id=${data.id}`;
  };

  const createWhiteboard = async () => {
    const { data, error: err } = await window.sb.from('documents').insert({
      owner_id: userId, name: 'Neues Whiteboard',
      doc_type: 'whiteboard', file_path: '', file_size: 0,
      mime_type: 'application/studyflow-whiteboard+json',
      folder_id: currentFolder,
    }).select().single();
    if (err) { setError(err.message); return; }
    window.location.href = `whiteboard.html?id=${data.id}`;
  };

  const deleteItem = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Wirklich löschen?')) return;
    await window.sb.from('documents').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleDrop = async (itemId, folderId) => {
    if (!itemId) return;
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, folder_id: folderId } : i));
    const { error: err } = await window.sb.from('documents').update({ folder_id: folderId }).eq('id', itemId);
    if (err) { setError(err.message); load(); }
  };

  const visibleItems = items.filter(i =>
    currentFolder ? i.folder_id === currentFolder : !i.folder_id
  );
  const folders = visibleItems.filter(i => i.doc_type === 'folder');
  const files = visibleItems.filter(i => i.doc_type !== 'folder');

  const breadcrumb = currentFolder
    ? items.find(i => i.id === currentFolder)?.name || 'Ordner'
    : null;

  const openItem = (item) => {
    if (item.doc_type === 'folder') { setCurrentFolder(item.id); return; }
    if (item.doc_type === 'whiteboard') { window.location.href = `whiteboard.html?id=${item.id}`; return; }
    window.location.href = `dokument.html?id=${item.id}`;
  };

  const IconForType = ({ type }) => {
    if (type === 'folder') return (
      <img
        src={EMPTY_FOLDER_ART}
        alt=""
        style={{ width: 20, height: 20, objectFit: 'contain', display: 'block' }}
      />
    );
    if (type === 'whiteboard') return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="2" width="16" height="16" rx="3" fill="#818cf8" opacity="0.15" stroke="#818cf8" strokeWidth="1.5"/>
        <circle cx="6" cy="6" r="0.8" fill="#818cf8"/>
        <circle cx="10" cy="6" r="0.8" fill="#818cf8"/>
        <circle cx="14" cy="6" r="0.8" fill="#818cf8"/>
        <circle cx="6" cy="10" r="0.8" fill="#818cf8"/>
        <circle cx="10" cy="10" r="0.8" fill="#818cf8"/>
        <circle cx="14" cy="10" r="0.8" fill="#818cf8"/>
        <circle cx="6" cy="14" r="0.8" fill="#818cf8"/>
        <circle cx="10" cy="14" r="0.8" fill="#818cf8"/>
        <circle cx="14" cy="14" r="0.8" fill="#818cf8"/>
      </svg>
    );
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="1" width="11" height="18" rx="2" fill="#6366f1" opacity="0.12" stroke="#6366f1" strokeWidth="1.5"/>
        <path d="M6 7h8M6 10h8M6 13h5" stroke="#6366f1" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M14 1l3 3h-3V1z" fill="#6366f1" opacity="0.5"/>
      </svg>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {breadcrumb && (
            <button onClick={() => setCurrentFolder(null)}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.color = '#6366f1'; }}
              onDragLeave={e => { e.currentTarget.style.color = 'var(--text-light)'; }}
              onDrop={e => { e.currentTarget.style.color = 'var(--text-light)'; handleDrop(e.dataTransfer.getData('text/plain'), null); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0', fontFamily: 'inherit', transition: 'color 0.15s' }}>
              <Icons.ArrowLeft size={14}/> Dokumente
            </button>
          )}
          {breadcrumb && <span style={{ color: 'var(--text-lighter)', fontSize: 13 }}>/</span>}
          <h1 style={{ fontFamily: 'Instrument Sans', fontSize: 20, fontWeight: 600, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            {breadcrumb || 'Dokumente'}
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setShowNewFolder(true)} className="btn-ghost" style={{ padding: '7px 12px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icons.Folder size={13}/> Ordner
          </button>
          <button onClick={createDoc} className="btn-ghost" style={{ padding: '7px 12px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icons.Doc size={13}/> Doc
          </button>
          <button onClick={createWhiteboard} className="btn-primary" style={{ padding: '7px 12px', fontSize: 12.5 }}>
            <Icons.Edit size={13}/> Whiteboard
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#991b1b', display: 'flex', justifyContent: 'space-between' }}>
          {error}<button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer' }}><Icons.X size={13}/></button>
        </div>
      )}

      {/* New Folder inline */}
      {showNewFolder && (
        <div style={{ background: 'var(--bg-panel)', borderRadius: 12, padding: '14px 16px', border: '1px solid #c7d2fe', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icons.Folder size={16}/>
          <input autoFocus value={folderName} onChange={e => setFolderName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') createFolder(); if (e.key === 'Escape') { setShowNewFolder(false); setFolderName(''); } }}
            placeholder="Ordnername…" className="input-paper" style={{ flex: 1, fontSize: 13 }}/>
          <button onClick={createFolder} disabled={creating || !folderName.trim()} className="btn-primary" style={{ padding: '6px 14px', fontSize: 12.5 }}>Erstellen</button>
          <button onClick={() => { setShowNewFolder(false); setFolderName(''); }} className="btn-ghost" style={{ padding: '6px 10px', fontSize: 12.5 }}>Abbrechen</button>
        </div>
      )}

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-lighter)', fontSize: 13 }}>Lädt…</div>
      ) : (folders.length === 0 && files.length === 0) ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: 'var(--text-lighter)', padding: 48 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #c7d2fe' }}>
            <Icons.Doc size={24}/>
          </div>
          <div style={{ fontFamily: 'Caveat', fontSize: 22, color: 'var(--text-light)' }}>Noch leer</div>
          <div style={{ fontSize: 13, color: 'var(--text-lighter)', textAlign: 'center', maxWidth: 260 }}>Erstelle ein Doc zum Schreiben oder ein Whiteboard zum Zeichnen.</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={createDoc} className="btn-ghost" style={{ padding: '8px 16px', fontSize: 13 }}><Icons.Doc size={13}/> Neues Doc</button>
            <button onClick={createWhiteboard} className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}><Icons.Edit size={13}/> Neues Whiteboard</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
          {/* Folders */}
          {folders.map(item => {
            const childCount = items.filter(i => i.folder_id === item.id).length;
            const folderArt = childCount > 0 ? FILLED_FOLDER_ART : EMPTY_FOLDER_ART;
            return (
              <div key={item.id} onClick={() => openItem(item)}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor='#6366f1'; e.currentTarget.style.background='#eef2ff'; }}
                onDragLeave={e => { e.currentTarget.style.borderColor='var(--border-light)'; e.currentTarget.style.background='var(--bg-panel)'; }}
                onDrop={e => { e.currentTarget.style.borderColor='var(--border-light)'; e.currentTarget.style.background='var(--bg-panel)'; handleDrop(e.dataTransfer.getData('text/plain'), item.id); }}
                style={{ background: 'var(--bg-panel)', borderRadius: 14, padding: '14px 14px 12px', border: '1px solid var(--border-light)', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s', display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='#fcd34d'; e.currentTarget.style.boxShadow='0 4px 16px rgba(245,158,11,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-light)'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.background='var(--bg-panel)'; }}>
                <div style={{ height: 84, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', overflow: 'hidden' }}>
                  <img
                    src={folderArt}
                    alt={childCount > 0 ? 'Ordner mit Inhalten' : 'Leerer Ordner'}
                    style={{ width: 74, height: 74, objectFit: 'contain', display: 'block', filter: childCount > 0 ? 'drop-shadow(0 10px 18px rgba(37, 99, 235, 0.16))' : 'drop-shadow(0 8px 14px rgba(37, 99, 235, 0.12))' }}
                  />
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-lighter)' }}>
                  {childCount} {childCount === 1 ? 'Element' : 'Elemente'}
                </div>
                <button onClick={e => deleteItem(item.id, e)} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: 'var(--text-lighter)', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex' }}
                  onMouseEnter={e => e.currentTarget.style.color='#ef4444'} onMouseLeave={e => e.currentTarget.style.color='#cbd5e1'}>
                  <Icons.X size={12}/>
                </button>
              </div>
            );
          })}
          {/* Docs & Whiteboards */}
          {files.map(item => (
            <div key={item.id} onClick={() => openItem(item)}
              draggable
              onDragStart={e => { e.dataTransfer.setData('text/plain', item.id); e.dataTransfer.effectAllowed = 'move'; }}
              style={{ background: 'var(--bg-panel)', borderRadius: 12, border: '1px solid var(--border-light)', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = item.doc_type === 'whiteboard' ? '#a5b4fc' : '#c7d2fe';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.08)';
              }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-light)'; e.currentTarget.style.boxShadow='none'; }}>
              {/* Preview area */}
              <div style={{
                height: 110,
                background: item.doc_type === 'whiteboard'
                  ? 'radial-gradient(circle, var(--text-lighter) 1px, transparent 1px) 0 0 / 18px 18px, var(--bg-panel)'
                  : 'linear-gradient(180deg, var(--bg-main) 0%, var(--bg-panel) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border-light)',
              }}>
                <div style={{ opacity: 0.35 }}><IconForType type={item.doc_type}/></div>
              </div>
              {/* Footer */}
              <div style={{ padding: '10px 12px' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-lighter)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ padding: '1px 5px', background: item.doc_type === 'whiteboard' ? '#eef2ff' : 'var(--bg-hover)', borderRadius: 4, fontSize: 10, fontWeight: 600, color: item.doc_type === 'whiteboard' ? '#6366f1' : 'var(--text-light)' }}>
                    {item.doc_type === 'whiteboard' ? 'Whiteboard' : 'Doc'}
                  </span>
                  <span>{relativeTime(item.updated_at || item.created_at)}</span>
                </div>
              </div>
              <button onClick={e => deleteItem(item.id, e)} style={{ position: 'absolute', top: 6, right: 6, background: 'var(--bg-panel)', border: 'none', color: 'var(--text-lighter)', cursor: 'pointer', padding: 4, borderRadius: 5, display: 'flex', opacity: 0.8 }}
                onMouseEnter={e => e.currentTarget.style.color='#ef4444'} onMouseLeave={e => e.currentTarget.style.color='var(--text-lighter)'}>
                <Icons.X size={12}/>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Sidebar ─────────────────────────────────────────────────
const Sidebar = ({ user, profile, sets, active, onNav, onNewSet }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const folders = [...new Set((sets || []).map(s => s.folder).filter(Boolean))];
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Nutzer';
  const isPro = profile?.plan === 'pro';

  const navItems = [
    { id: 'home', label: 'Alle Lernsets', count: sets ? sets.length : 0, icon: <Icons.Cards size={15}/> },
    { id: 'docs', label: 'Dokumente', count: null, icon: <Icons.Doc size={15}/> },
    { id: 'fav', label: 'Favoriten', count: 0, icon: <Icons.Star size={15}/> },
    { id: 'shared', label: 'Geteilt mit mir', count: 0, icon: <Icons.Users size={15}/> },
  ];

  return (
    <aside style={{ width: 240, flexShrink: 0, margin: '14px 0 14px 14px', background: 'var(--bg-panel)', borderRadius: 18, border: '1px solid var(--border-light)', boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.04)', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20, height: 'calc(100vh - 28px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 4px' }}>
        <Icons.Logo size={26}/>
        <div style={{ fontFamily: 'Caveat', fontSize: 24, fontWeight: 600, color: 'var(--text-main)' }}>StudyFlow</div>
        {isPro && <span style={{ fontSize: 9, background: 'linear-gradient(135deg,#6366f1,#818cf8)', color: 'white', padding: '2px 6px', borderRadius: 999, fontWeight: 700, letterSpacing: '0.06em' }}>PRO</span>}
      </div>

      <button onClick={onNewSet} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '9px 14px', fontSize: 13 }}>
        <Icons.Plus size={14}/> Neues Lernset
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-lighter)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, padding: '0 8px' }}>Bibliothek</div>
        {navItems.map(item => {
          const isActive = active === item.id || (active === 'cards' && item.id === 'home');
          return (
            <div key={item.id} onClick={() => onNav(item.id)} onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }} onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, background: isActive ? 'var(--bg-active)' : 'transparent', color: isActive ? 'var(--text-main)' : 'var(--text-muted)', fontSize: 13, fontWeight: isActive ? 500 : 400, cursor: 'pointer', transition: 'background 0.1s' }}>
              {item.icon}
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.count !== null && <span style={{ fontSize: 11, color: 'var(--text-lighter)' }}>{item.count}</span>}
            </div>
          );
        })}
      </div>

      {folders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-lighter)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, padding: '0 8px' }}>Ordner</div>
          {folders.map(f => (
            <div key={f} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer', borderRadius: 8, transition: 'background 0.1s' }}>
              <Icons.Folder size={15}/>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--border-light)', paddingTop: 14 }}>
        <div
          onClick={() => onNav('settings')}
          onMouseEnter={e => { if (active !== 'settings') e.currentTarget.style.background = 'var(--bg-hover)'; }}
          onMouseLeave={e => { if (active !== 'settings') e.currentTarget.style.background = 'transparent'; }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.1s', color: active === 'settings' ? 'var(--text-main)' : 'var(--text-muted)', background: active === 'settings' ? 'var(--bg-active)' : 'transparent', fontWeight: active === 'settings' ? 500 : 400, fontSize: 13 }}
        >
          <Icons.Settings size={15}/>
          <span style={{ flex: 1 }}>Einstellungen</span>
        </div>

        <div style={{ position: 'relative' }}>
          {showUserMenu && (
            <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 8, background: 'var(--bg-panel)', borderRadius: 12, border: '1px solid var(--border-light)', boxShadow: '0 4px 20px rgba(15,23,42,0.08)', padding: 6, zIndex: 100 }}>
              <div onClick={() => { setShowUserMenu(false); onNav('settings'); }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-active)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} style={{ padding: '8px 10px', fontSize: 13, color: 'var(--text-main)', cursor: 'pointer', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.1s' }}>
                <Icons.Settings size={14}/> Profil verwalten
              </div>
              <div style={{ height: 1, background: '#e2e8f0', margin: '4px 0' }}></div>
              <div onClick={async () => {
                if (confirm('Möchtest du dich abmelden?')) {
                  await window.sb.auth.signOut();
                  window.location.href = 'login.html';
                }
              }} onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} style={{ padding: '8px 10px', fontSize: 13, color: '#ef4444', cursor: 'pointer', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.1s' }}>
                <Icons.ArrowLeft size={14}/> Abmelden
              </div>
            </div>
          )}
          <div
            onClick={() => setShowUserMenu(!showUserMenu)}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px', borderRadius: 10, cursor: 'pointer', transition: 'background 0.1s' }}
          >
            <Avatar name={displayName} color="#6366f1" size={30}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
              <div style={{ fontSize: 11, color: isPro ? '#6366f1' : 'var(--text-lighter)', fontWeight: isPro ? 600 : 400, display: 'flex', alignItems: 'center', gap: 6 }}>
                {isPro ? <Icons.Bolt size={12}/> : <Icons.Bookmark size={12}/>}
                {isPro ? 'Pro Plan' : 'Free Plan'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

// ─── TopBar ──────────────────────────────────────────────────
const TopBar = ({ search, onSearch, streak }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
    <div style={{ flex: 1, maxWidth: 380, position: 'relative' }}>
      <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-lighter)' }}><Icons.Search size={15}/></div>
      <input className="input-paper" placeholder="Suchen…" value={search} onChange={e => onSearch(e.target.value)} style={{ paddingLeft: 36, background: 'var(--bg-panel)', padding: '8px 12px 8px 36px', fontSize: 13 }}/>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div title={`${streak || 0} Tage Streak`} style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-focus)', padding: '6px 10px', borderRadius: 8, color: streak > 0 ? '#f59e0b' : 'var(--text-lighter)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', userSelect: 'none' }}>
        <Icons.Bolt size={14}/> {streak || 0}
      </div>
      <button style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-focus)', padding: 7, borderRadius: 8, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><Icons.Bell size={15}/></button>
    </div>
  </div>
);

// ─── Set Card ────────────────────────────────────────────────
const SetCard = ({ set, onDelete }) => {
  const pct = set.total_cards ? Math.round((set.mastered_cards / set.total_cards) * 100) : 0;
  const isDraft = set.total_cards === 0;
  const lastStudy = set.updated_at ? (() => {
    const diff = Date.now() - new Date(set.updated_at).getTime();
    const h = Math.floor(diff/3600000);
    if (h < 1) return 'Gerade eben'; if (h < 24) return `vor ${h} Std.`;
    const d = Math.floor(h/24); if (d === 1) return 'Gestern'; return `vor ${d} T.`;
  })() : '—';

  const handleDelete = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!confirm(`"${set.title}" wirklich löschen?`)) return;
    await window.sb.from('study_sets').delete().eq('id', set.id);
    onDelete(set.id);
  };

  return (
    <a href={`lernset.html?id=${set.id}`} style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '18px 20px', background: 'var(--bg-panel)', borderRadius: 14, border: '1px solid var(--border-light)', transition: 'border-color 0.15s, box-shadow 0.15s', textDecoration: 'none', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='#c7d2fe'; e.currentTarget.style.boxShadow='0 4px 16px rgba(99,102,241,0.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-light)'; e.currentTarget.style.boxShadow='0 1px 3px rgba(15,23,42,0.04)'; }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eef2ff', color: '#6366f1', border: '1px solid #c7d2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icons.Cards size={16}/>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Instrument Sans' }}>{set.title}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-lighter)', marginTop: 1 }}>{set.total_cards} Karten · {lastStudy}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
          {!isDraft && pct === 100 && <span style={{ fontSize: 10, color: '#059669', background: '#d1fae5', padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>Fertig</span>}
          {isDraft && <span style={{ fontSize: 10, color: 'var(--text-light)', background: 'var(--bg-active)', padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>Entwurf</span>}
          {set.due_cards > 0 && <span style={{ fontSize: 10, color: '#dc2626', background: '#fee2e2', padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>{set.due_cards} fällig</span>}
          <button onClick={handleDelete} style={{ padding: 4, background: 'none', border: 'none', borderRadius: 5, cursor: 'pointer', color: '#cbd5e1', display: 'flex' }}><Icons.MoreH size={14}/></button>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-lighter)', marginBottom: 5 }}>
          <span>Fortschritt</span>
          <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>{isDraft ? '—' : `${pct}%`}</span>
        </div>
        <div style={{ height: 5, background: 'var(--bg-active)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#059669' : 'linear-gradient(90deg, #6366f1, #818cf8)', borderRadius: 999, transition: 'width 0.3s' }}/>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
        <div style={{ fontSize: 11.5, color: 'var(--text-lighter)' }}>
          {!isDraft ? <span>{set.mastered_cards} / {set.total_cards} gemeistert</span> : <span>Noch leer</span>}
        </div>
        <a href={`lern-modus.html?id=${set.id}`} onClick={e => e.stopPropagation()}
          style={{ padding: '6px 14px', background: 'var(--text-main)', color: 'var(--bg-panel)', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Icons.Brain size={12}/> Lernen
        </a>
      </div>
    </a>
  );
};

// ─── Stats ───────────────────────────────────────────────────
const StatsRow = ({ stats, streak, profile, sets }) => {
  const cells = React.useMemo(() => {
    const arr = [];
    for (let i = 0; i < 28; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (27 - i));
      const dateStr = d.toISOString().slice(0, 10);
      const count = stats.reviewCounts?.[dateStr] || 0;
      let v = 0;
      if (count > 0) v = 0.2;
      if (count >= 10) v = 0.4;
      if (count >= 20) v = 0.65;
      if (count >= 30) v = 1;
      arr.push({ v, count, dateStr: d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) });
    }
    return arr;
  }, [stats.reviewCounts]);

  const weeklyGoal = profile?.weekly_goal || 20;
  const weekReviews = stats?.weekReviews || 0;
  const goalPct = Math.min(100, Math.round((weekReviews / weeklyGoal) * 100));

  const totalCards = sets?.reduce((acc, s) => acc + (s.total_cards || 0), 0) || 0;
  const totalMastered = sets?.reduce((acc, s) => acc + (s.mastered_cards || 0), 0) || 0;
  const masteredPct = totalCards ? Math.round((totalMastered / totalCards) * 100) : 0;
  const activeSets = (sets || []).filter(s => s.mastered_cards > 0).length;

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (masteredPct / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Obere Reihe: 4 kleine Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {[
          { label: 'Fällig heute', value: stats.dueToday || '0', sub: 'Karten' },
          { label: 'Diese Woche', value: stats.weekReviews || '0', sub: 'Karten geübt' },
          { label: 'Gemeistert', value: stats.masteryPct || '0%', sub: 'aller Karten' },
          { label: 'Lernsets', value: stats.totalSets || '0', sub: 'gesamt' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-panel)', borderRadius: 10, padding: '10px 14px', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{s.label}</div>
            <div style={{ fontFamily: 'Instrument Sans', fontSize: 20, fontWeight: 600, color: 'var(--text-main)', marginTop: 2, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-lighter)', marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Untere Reihe: 3 große Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {/* Block 1: Aktivität Heatmap */}
        <div style={{ background: 'var(--bg-panel)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 12, color: 'var(--text-light)', fontWeight: 500 }}>Aktivität</div>
            <div style={{ fontFamily: 'Instrument Sans', fontSize: 22, fontWeight: 600, color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1 }}>{streak || 0} <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-lighter)', letterSpacing: 'normal' }}>Tage</span></div>
            <div style={{ fontSize: 11, color: 'var(--text-lighter)', marginTop: 2 }}>letzte 28 Tage</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {cells.map((cell, i) => (
              <div key={i} title={`${cell.dateStr}\n${cell.count} Karten geübt`} style={{ width: 10, height: 10, borderRadius: 2, background: cell.v === 0 ? 'var(--bg-active)' : `rgba(99,102,241,${cell.v})`, cursor: 'help' }} />
            ))}
          </div>
        </div>

        {/* Block 2: Wochenziel */}
        <div style={{ background: 'var(--bg-panel)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, color: 'var(--text-light)', fontWeight: 500 }}>Wochenziel</div>
            <div style={{ fontSize: 11, color: 'var(--text-lighter)' }}>{goalPct >= 100 ? 'Ziel erreicht! 🎉' : `Noch ${Math.max(0, weeklyGoal - weekReviews)}`}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ fontFamily: 'Instrument Sans', fontSize: 22, fontWeight: 600, color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1 }}>{weekReviews}</div>
            <div style={{ fontSize: 12, color: 'var(--text-lighter)', fontWeight: 500 }}>/ {weeklyGoal} Karten</div>
          </div>
          <div style={{ height: 6, background: 'var(--bg-active)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${goalPct}%`, height: '100%', background: goalPct >= 100 ? '#10b981' : '#6366f1', borderRadius: 999 }} />
          </div>
        </div>

        {/* Block 3: Gesamt-Fortschritt (Circle Donut Chart) */}
        <div style={{ background: 'var(--bg-panel)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 12, color: 'var(--text-light)', fontWeight: 500 }}>Gesamt-Fortschritt</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <div style={{ fontFamily: 'Instrument Sans', fontSize: 22, fontWeight: 600, color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1 }}>{totalMastered}</div>
              <div style={{ fontSize: 12, color: 'var(--text-lighter)', fontWeight: 500 }}>/ {totalCards} Karten</div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-lighter)', marginTop: 2 }}>
              <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{activeSets}</span> Lernsets geübt
            </div>
          </div>

          {/* Circle Donut Chart */}
          <div style={{ position: 'relative', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="44" height="44" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="22" cy="22" r={radius} stroke="var(--bg-active)" strokeWidth="4" fill="none" />
              <circle cx="22" cy="22" r={radius} stroke="#10b981" strokeWidth="4" fill="none" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
            </svg>
            <div style={{ position: 'absolute', fontSize: 10, fontWeight: 600, color: 'var(--text-main)' }}>{masteredPct}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Empty State ─────────────────────────────────────────────
const EmptyState = ({ onNewSet }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16, color: 'var(--text-lighter)', padding: 40 }}>
    <div style={{ width: 64, height: 64, borderRadius: 18, background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #c7d2fe' }}>
      <Icons.Cards size={28}/>
    </div>
    <div style={{ fontFamily: 'Caveat', fontSize: 24, color: 'var(--text-light)' }}>Noch keine Lernsets</div>
    <div style={{ fontSize: 14, color: 'var(--text-lighter)', textAlign: 'center', maxWidth: 300 }}>Erstelle dein erstes Lernset oder lade ein Dokument hoch, um loszulegen.</div>
    <button onClick={onNewSet} className="btn-primary" style={{ padding: '10px 20px' }}><Icons.Plus size={14}/> Erstes Lernset erstellen</button>
  </div>
);

// ─── Welcome Modal ───────────────────────────────────────────
const WelcomeModal = ({ onClose }) => {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div style={{ background: 'var(--bg-panel)', borderRadius: 24, padding: 40, width: 480, maxWidth: '100%', boxShadow: '0 30px 80px rgba(15,23,42,0.2)', position: 'relative', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.05, pointerEvents: 'none' }}>
          <Icons.Sparkles size={160} />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #6366f1, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 8px 16px rgba(99,102,241,0.25)', flexShrink: 0 }}>
            <Icons.Logo size={32} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'Instrument Sans', fontSize: 24, fontWeight: 700, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>Willkommen bei StudyFlow! 🎉</h2>
            <div style={{ fontFamily: 'Caveat', fontSize: 18, color: '#6366f1', fontWeight: 600 }}>Schön, dass du da bist.</div>
          </div>
        </div>
        
        <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 32 }}>
          Bevor du loslegst, hier ein kurzer Überblick, wie du das meiste aus deinem neuen Lern-Workspace herausholst:
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 36 }}>
          {[
            { icon: <Icons.Sparkles size={16}/>, color: '#8b5cf6', bg: '#f3e8ff', title: 'Flow AI', desc: 'Lade PDFs oder Skripte hoch. Flow erstellt dir in Sekunden Zusammenfassungen und Karteikarten.' },
            { icon: <Icons.Cards size={16}/>, color: '#10b981', bg: '#d1fae5', title: 'Spaced Repetition', desc: 'Lerne smarter, nicht härter. Der Algorithmus zeigt dir Karten genau dann, wenn du sie vergessen würdest.' },
            { icon: <Icons.Users size={16}/>, color: '#f59e0b', bg: '#fef3c7', title: 'Zusammen lernen', desc: 'Teile deine Ordner mit Freunden und bearbeitet Lernsets gemeinsam in Echtzeit.' }
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: f.bg, color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {f.icon}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>{f.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 2, lineHeight: 1.4 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
        
        <button onClick={onClose} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px 0', fontSize: 15, background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
          Alles klar, los geht's! <Icons.ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

// ─── Dashboard ───────────────────────────────────────────────
const Dashboard = () => {
  const initialTab = (() => {
    const t = new URLSearchParams(window.location.search).get('tab');
    return t || 'home';
  })();
  const targetSetId = (() => new URLSearchParams(window.location.search).get('targetSetId'))();
  const [active, setActive] = useState(initialTab);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sets, setSets] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(() => localStorage.getItem('studyflow_welcome') === 'true');
  const [streak, setStreak] = useState(0);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (darkMode) document.body.classList.add('dark-theme');
    else document.body.classList.remove('dark-theme');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    if (showWelcome) {
      localStorage.removeItem('studyflow_welcome');
    }
  }, [showWelcome]);

  useEffect(() => {
    (async () => {
      const session = await window.requireAuth();
      if (!session) return;
      const u = session.user;
      setUser(u);
      const { data: prof } = await window.sb.from('profiles').select('*').eq('id', u.id).single();
      setProfile(prof);
      await loadSets(u.id);
      setLoading(false);
    })();
  }, []);

  const loadSets = async (userId) => {
    const { data: rawSets } = await window.sb.from('study_sets')
      .select('*, cards(id, mastery_level, next_review)')
      .eq('owner_id', userId)
      .order('updated_at', { ascending: false });
    if (!rawSets) return;

    const now = new Date().toISOString();
    const enriched = rawSets.map(s => ({
      ...s,
      total_cards: s.cards ? s.cards.length : 0,
      mastered_cards: s.cards ? s.cards.filter(c => c.mastery_level === 'mastered').length : 0,
      due_cards: s.cards ? s.cards.filter(c => c.next_review && c.next_review <= now).length : 0,
    }));
    setSets(enriched);

    const allCards = enriched.flatMap(s => s.cards || []);
    const dueToday = allCards.filter(c => c.next_review && c.next_review <= now).length;
    const mastered = allCards.filter(c => c.mastery_level === 'mastered').length;
    const masteryPct = allCards.length ? Math.round((mastered/allCards.length)*100)+'%' : '0%';
    const weekAgo = new Date(Date.now()-7*24*3600*1000).toISOString();
    const { count: weekReviews } = await window.sb.from('card_reviews')
      .select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('reviewed_at', weekAgo);

    // Streak: consecutive days (incl. today) with at least one review
    const { data: reviewDates } = await window.sb.from('card_reviews')
      .select('reviewed_at').eq('user_id', userId).order('reviewed_at', { ascending: false }).limit(365);
      
    const reviewCounts = {};
    if (reviewDates && reviewDates.length > 0) {
      reviewDates.forEach(r => {
        const date = r.reviewed_at.slice(0, 10);
        reviewCounts[date] = (reviewCounts[date] || 0) + 1;
      });
      const daySet = new Set(reviewDates.map(r => r.reviewed_at.slice(0, 10)));
      const todayStr = new Date().toISOString().slice(0, 10);
      let s = 0, check = new Date();
      // Allow starting from today or yesterday
      if (!daySet.has(todayStr)) check.setDate(check.getDate() - 1);
      while (true) {
        const key = check.toISOString().slice(0, 10);
        if (!daySet.has(key)) break;
        s++;
        check.setDate(check.getDate() - 1);
      }
      setStreak(s);
    } else {
      setStreak(0);
    }
    
    setStats({ dueToday, weekReviews: weekReviews || 0, masteryPct, totalSets: enriched.length, reviewCounts });
  };

  // Abmelden-Button wurde entfernt (Sidebar-UI)

  const handleSetCreated = (newSet) => {
    setSets(prev => [{ ...newSet, total_cards: newSet.total_cards || 0, mastered_cards: 0, due_cards: 0, cards: [] }, ...prev]);
    setStats(prev => ({ ...prev, totalSets: (prev.totalSets || 0) + 1 }));
  };

  const handleSetDeleted = (id) => setSets(prev => prev.filter(s => s.id !== id));

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Nutzer';
  const filteredSets = sets.filter(s => {
    if (search) return s.title.toLowerCase().includes(search.toLowerCase());
    if (filter === 'due') return s.due_cards > 0;
    return true;
  });

  if (loading) return (
    <div className="dot-paper" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'Caveat', fontSize: 24, color: '#64748b' }}>Lädt…</div>
    </div>
  );

  const showDocs = active === 'docs';
  const showSettings = active === 'settings';
  const showSets = !showDocs && !showSettings;

  return (
    <div className="dot-paper" style={{ height: '100vh', overflow: 'hidden', display: 'flex' }}>
      <style>{`
        :root {
          --bg-main: #fafaf7;
          --bg-panel: white;
          --bg-active: #f1f5f9;
          --bg-hover: #f8fafc;
          --text-main: #0f172a;
          --text-muted: #475569;
          --text-light: #64748b;
          --text-lighter: #94a3b8;
          --border-light: rgba(15,23,42,0.06);
          --border-focus: #e2e8f0;
        }
        .dark-theme {
          --bg-main: #0f172a;
          --bg-panel: #1e293b;
          --bg-active: #334155;
          --bg-hover: #334155;
          --text-main: #f8fafc;
          --text-muted: #cbd5e1;
          --text-light: #94a3b8;
          --text-lighter: #64748b;
          --border-light: rgba(255,255,255,0.1);
          --border-focus: rgba(255,255,255,0.15);
          --dot-color: rgba(255,255,255,0.05);
        }
        body.dark-theme { background-color: var(--bg-main); color: var(--text-main); }
        body.dark-theme .dot-paper { background-color: var(--bg-main) !important; }
        body.dark-theme .input-paper { background-color: var(--bg-panel); color: var(--text-main); border-color: var(--border-focus); }
        body.dark-theme .btn-ghost { background-color: var(--bg-panel); color: var(--text-main); border-color: var(--border-light); }
        body.dark-theme .btn-ghost:hover { background-color: var(--bg-hover); }

        .custom-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; border-radius: 50%; background: white; border: 2px solid #6366f1; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: transform 0.1s, box-shadow 0.1s; }
        .custom-slider::-moz-range-thumb { width: 20px; height: 20px; border-radius: 50%; background: white; border: 2px solid #6366f1; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: transform 0.1s, box-shadow 0.1s; }
        .custom-slider:focus::-webkit-slider-thumb, .custom-slider:hover::-webkit-slider-thumb { transform: scale(1.1); box-shadow: 0 0 0 4px rgba(99,102,241,0.15); }
        .custom-slider:focus::-moz-range-thumb, .custom-slider:hover::-moz-range-thumb { transform: scale(1.1); box-shadow: 0 0 0 4px rgba(99,102,241,0.15); }
        body.dark-theme .custom-slider::-webkit-slider-thumb { background: var(--bg-panel); }
        body.dark-theme .custom-slider::-moz-range-thumb { background: var(--bg-panel); }
      `}</style>
      <Sidebar user={user} profile={profile} sets={sets} active={active} onNav={setActive} onNewSet={() => setShowModal(true)}/>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '18px 22px 14px', minWidth: 0, gap: 16, overflow: 'hidden' }}>
        <TopBar search={search} onSearch={setSearch} streak={streak}/>

        {showDocs && <DocsPanel userId={user?.id}/>}
        {showSettings && <SettingsPanel user={user} profile={profile} onProfileUpdate={setProfile} darkMode={darkMode} setDarkMode={setDarkMode}/>}

        {showSets && (
          <>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <h1 style={{ fontFamily: 'Instrument Sans', fontSize: 24, fontWeight: 600, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                  Servus, {displayName.split(' ')[0]}.
                </h1>
                {stats.dueToday > 0 && (
                  <span style={{ fontSize: 13, color: 'var(--text-light)' }}>
                    <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{stats.dueToday} Karten</span> fällig
                  </span>
                )}
              </div>
            </div>

            <StatsRow stats={stats} streak={streak} profile={profile} sets={sets}/>

            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <h2 style={{ fontFamily: 'Instrument Sans', fontSize: 15, fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>Alle Lernsets</h2>
                  <div style={{ display: 'flex', gap: 2, background: 'var(--bg-active)', padding: 2, borderRadius: 7 }}>
                    {[{ k:'all', l:'Alle' }, { k:'due', l:'Fällig' }].map(t => (
                      <button key={t.k} onClick={() => setFilter(t.k)} style={{ padding: '4px 10px', background: filter===t.k ? 'var(--bg-panel)' : 'transparent', border: 'none', borderRadius: 5, fontSize: 11.5, color: filter===t.k ? 'var(--text-main)' : 'var(--text-light)', fontWeight: filter===t.k ? 500 : 400, cursor: 'pointer', fontFamily: 'inherit', boxShadow: filter===t.k ? '0 1px 2px rgba(15,23,42,0.08)' : 'none' }}>{t.l}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: filteredSets.length > 0 ? 'grid' : 'flex', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 4, paddingBottom: 70, alignContent: 'start' }}>
                {filteredSets.length > 0
                  ? filteredSets.map(s => <SetCard key={s.id} set={s} onDelete={handleSetDeleted}/>)
                  : <EmptyState onNewSet={() => setShowModal(true)}/>
                }
              </div>
            </div>
          </>
        )}
      </main>

      <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 60 }}>
        <Dock items={[
          { id: 'home', label: 'Start', icon: <Icons.Home size={18}/> },
          { id: 'cards', label: 'Lernsets', icon: <Icons.Cards size={18}/> },
          { id: 'docs', label: 'Dokumente', icon: <Icons.Doc size={18}/> },
          { id: 'settings', label: 'Einstellungen', icon: <Icons.Settings size={18}/> },
        ]} active={active} onSelect={setActive}/>
      </div>

      <AIAssistant/>

      {showModal && (
        <CreateSetModal userId={user?.id} onClose={() => setShowModal(false)} onCreated={handleSetCreated}/>
      )}
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Dashboard/>);
