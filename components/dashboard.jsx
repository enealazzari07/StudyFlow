// StudyFlow — Dashboard v4: settings, pro/free, fixed AI, fixed RLS
const { useState, useEffect, useRef } = React;

const AIRFORCE_KEY = 'sk-air-tWdMV6mXgoa1zAfHr8UfGVI9BFzyr5dXE2jdZO4pPApRVrXDyH6W6Bdv6RwmUctq';
const AI_MODEL = 'claude-sonnet-4.6';
const AI_URL = 'https://api.airforce/v1/chat/completions';

// ← Azure App Registration: portal.azure.com → App-Registrierungen → Anwendungs-ID hier eintragen
const MS_CLIENT_ID = 'DEINE_AZURE_CLIENT_ID';

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

const EMPTY_FOLDER_ART = 'components/image.png';
const FILLED_FOLDER_ART = 'components/image.png';

// ─── Zhipu AI (GLM) API für den Chat ─────────────────────────
// Der API-Key ist im Zhipu AI Format. Unterstützt direkte Browser-Aufrufe (CORS).
const ZHIPU_KEY = 'fa883d72c67d4ab9b9f9400344fdba52.E20c9sxZEyRuklDbvojX7jhO';
const ZHIPU_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

async function callChatAI(messages, model) {
  const res = await fetch(ZHIPU_URL, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${ZHIPU_KEY}`, 
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model, messages, stream: false }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    if (res.status === 429) throw new Error('RATE_LIMIT');
    throw new Error(`API ${res.status}: ${txt.slice(0,120)}`);
  }
  const data = await res.json();
  return data.choices[0].message.content || '';
}

async function callAI(messages, model = AI_MODEL) {
  const res = await fetch(AI_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${AIRFORCE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    if (res.status === 429) throw new Error('RATE_LIMIT');
    throw new Error(`API ${res.status}: ${txt.slice(0,120)}`);
  }
  const data = await res.json();
  
  let content = data.choices[0].message.content || '';
  // Filter unwanted proxy ad from the free API provider
  content = content.replace(/Need proxies cheaper than the market\?\s*https:\/\/op\.wtf/gi, '').trim();
  return content;
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

// ─── Extension logos (inline SVG, no CDN needed) ─────────────
const ExtLogo = ({ id, size = 22 }) => {
  const logos = {
    onenote: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="4" fill="#7719AA"/>
        <rect x="3" y="5" width="11" height="15" rx="1.5" fill="white"/>
        <text x="5" y="17" fontFamily="Arial,sans-serif" fontSize="11" fontWeight="900" fill="#7719AA">N</text>
        <rect x="11.5" y="7.5" width="9" height="10" rx="1.5" fill="#C179E8"/>
        <line x1="13.5" y1="10.5" x2="18.5" y2="10.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="13.5" y1="13" x2="18.5" y2="13" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="13.5" y1="15.5" x2="18.5" y2="15.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
    teams: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="4" fill="#5059C9"/>
        <circle cx="15.5" cy="7.5" r="2" fill="#fff" opacity="0.9"/>
        <path d="M11 10.5h9v1c0 2.2-1.8 4-4 4h-1c-2.2 0-4-1.8-4-4v-1z" fill="white"/>
        <circle cx="9" cy="9" r="2.5" fill="white"/>
        <path d="M4.5 13h9v1C13.5 16.5 11.5 18 9 18s-4.5-1.5-4.5-4v-1z" fill="white"/>
      </svg>
    ),
    gdrive: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="12,3 22,20 2,20" fill="none"/>
        <polygon points="12,3 19,16 5,16" fill="#1967D2" opacity="0.15"/>
        <polygon points="2,20 9.5,7 14.5,16 8,20" fill="#1967D2"/>
        <polygon points="22,20 14.5,16 9.5,7 17,7" fill="#4285F4"/>
        <polygon points="2,20 22,20 14.5,16 8,20" fill="#188038"/>
        <polygon points="8,20 14.5,16 22,20" fill="#34A853"/>
        <polygon points="2,20 8,20 9.5,7" fill="#0D652D"/>
      </svg>
    ),
    gcal: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="4" width="20" height="18" rx="2" fill="white" stroke="#E0E0E0" strokeWidth="1"/>
        <rect x="2" y="4" width="20" height="6" rx="2" fill="#1E8E3E"/>
        <rect x="2" y="8" width="20" height="2" fill="#1E8E3E"/>
        <line x1="8" y1="4" x2="8" y2="2" stroke="#1E8E3E" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="16" y1="4" x2="16" y2="2" stroke="#1E8E3E" strokeWidth="1.5" strokeLinecap="round"/>
        <text x="7.5" y="19" fontFamily="Arial,sans-serif" fontSize="7" fontWeight="900" fill="#1967D2">31</text>
      </svg>
    ),
    notion: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="4" fill="white" stroke="#E5E7EB" strokeWidth="1"/>
        <path d="M6 5.5h7.5c.5 0 1 .2 1.4.5l2.6 2.2c.3.3.5.7.5 1.1V19c0 .3-.2.5-.5.5H6c-.3 0-.5-.2-.5-.5V6c0-.3.2-.5.5-.5z" fill="#0f172a"/>
        <path d="M9 9.5h6M9 12.5h6M9 15.5h4" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  };
  return logos[id] || null;
};

// ─── Extensions Panel ─────────────────────────────────────────
const EXTENSIONS = [
  { id: 'onenote', name: 'Microsoft OneNote', desc: 'Verbinde dein Konto und lass die KI deine Notizbücher zusammenfassen.', color: '#7719AA', bg: '#f5e6ff', makeScenarioId: 9126398, connected: false },
  { id: 'teams',   name: 'Microsoft Teams',  desc: 'Teile Lernerfolge und Lernsets in Teams-Kanälen mit Kommilitonen.',   color: '#5059C9', bg: '#eef0ff', makeScenarioId: 9126399, connected: false },
  { id: 'gdrive',  name: 'Google Drive',     desc: 'Synchronisiere Dokumente und Lernmaterialien mit Google Drive.',      color: '#1967D2', bg: '#e8f0fe', makeScenarioId: null,    connected: false },
  { id: 'gcal',    name: 'Google Calendar',  desc: 'Plane Lernsessions automatisch in deinem Google Kalender ein.',       color: '#1E8E3E', bg: '#e6f4ea', makeScenarioId: null,    connected: false },
  { id: 'notion',  name: 'Notion',           desc: 'Exportiere Karteikarten und Zusammenfassungen in Notion-Datenbanken.', color: '#0f172a', bg: '#f1f5f9', makeScenarioId: null,   connected: false },
];

// ─── OneNote Integration Modal ────────────────────────────────
const OneNoteModal = ({ onClose }) => {
  const [step, setStep] = useState('idle'); // idle | connecting | connected
  const [msalApp, setMsalApp] = useState(null);
  const [account, setAccount] = useState(null);
  const [notebooks, setNotebooks] = useState([]);
  const [selNotebook, setSelNotebook] = useState(null);
  const [sections, setSections] = useState([]);
  const [selSection, setSelSection] = useState(null);
  const [summary, setSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const SCOPES = ['Notes.Read', 'Notes.Read.All', 'openid', 'profile', 'User.Read'];

  const getMsal = async () => {
    if (msalApp) return msalApp;
    if (!window.msal) throw new Error('MSAL nicht geladen — Seite neu laden.');
    if (MS_CLIENT_ID === 'DEINE_AZURE_CLIENT_ID') throw new Error('Azure Client-ID nicht konfiguriert. Bitte in dashboard.jsx eintragen.');
    const app = new window.msal.PublicClientApplication({
      auth: {
        clientId: MS_CLIENT_ID,
        authority: 'https://login.microsoftonline.com/common',
        redirectUri: window.location.origin + window.location.pathname,
      },
      cache: { cacheLocation: 'localStorage', storeAuthStateInCookie: true },
    });
    await app.initialize();
    setMsalApp(app);
    return app;
  };

  const getToken = async (app, acc) => {
    try {
      const r = await app.acquireTokenSilent({ scopes: SCOPES, account: acc });
      return r.accessToken;
    } catch {
      const r = await app.acquireTokenPopup({ scopes: SCOPES, account: acc });
      return r.accessToken;
    }
  };

  const loadNotebooks = async (app, acc) => {
    setLoading(true);
    try {
      const token = await getToken(app, acc);
      const res = await fetch('https://graph.microsoft.com/v1.0/me/onenote/notebooks?$orderby=lastModifiedDateTime desc', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      setNotebooks(data.value || []);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleConnect = async () => {
    setError(''); setStep('connecting');
    try {
      const app = await getMsal();
      const result = await app.loginPopup({ scopes: SCOPES });
      setAccount(result.account);
      setStep('connected');
      await loadNotebooks(app, result.account);
    } catch (e) {
      setStep('idle');
      if (e.errorCode !== 'user_cancelled') setError(e.message || e.errorCode || String(e));
    }
  };

  const handleNotebook = async (nb) => {
    setSelNotebook(nb); setSections([]); setSelSection(null); setSummary('');
    setLoading(true);
    try {
      const app = await getMsal();
      const token = await getToken(app, account);
      const res = await fetch(`https://graph.microsoft.com/v1.0/me/onenote/notebooks/${nb.id}/sections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSections(data.value || []);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleSummarize = async (sec) => {
    setSelSection(sec); setSummarizing(true); setSummary(''); setError('');
    try {
      const app = await getMsal();
      const token = await getToken(app, account);
      const pRes = await fetch(`https://graph.microsoft.com/v1.0/me/onenote/sections/${sec.id}/pages?$top=10&$orderby=lastModifiedDateTime desc`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const pageList = (await pRes.json()).value || [];
      const texts = await Promise.all(pageList.slice(0, 6).map(async pg => {
        const r = await fetch(`https://graph.microsoft.com/v1.0/me/onenote/pages/${pg.id}/content`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const el = document.createElement('div');
        el.innerHTML = await r.text();
        return `## ${pg.title || 'Ohne Titel'}\n${(el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 1200)}`;
      }));
      const aiRes = await fetch(AI_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${AIRFORCE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: AI_MODEL,
          messages: [
            { role: 'system', content: 'Du bist ein intelligenter Lernassistent. Fasse die folgenden OneNote-Seiten klar und lernfreundlich zusammen. Nutze Überschriften und Bullet Points. Hebe Definitionen und Schlüsselkonzepte hervor. Antworte auf Deutsch.' },
            { role: 'user', content: `Fasse den Abschnitt "${sec.displayName}" zusammen:\n\n${texts.join('\n\n').slice(0, 8000)}` },
          ],
        }),
      });
      setSummary((await aiRes.json()).choices?.[0]?.message?.content || 'Keine Antwort.');
    } catch (e) { setError('Fehler: ' + e.message); }
    setSummarizing(false);
  };

  const handleDisconnect = async () => {
    try { const app = await getMsal(); if (account) await app.logoutPopup({ account }); } catch {}
    setStep('idle'); setAccount(null); setNotebooks([]);
    setSections([]); setSummary(''); setSelNotebook(null); setSelSection(null);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 80px rgba(15,23,42,0.22)' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f5e6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ExtLogo id="onenote" size={24}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>Microsoft OneNote</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Notizbücher verbinden &amp; mit KI zusammenfassen</div>
          </div>
          {account && <div style={{ fontSize: 11, color: '#16a34a', background: '#dcfce7', padding: '3px 10px', borderRadius: 999, fontWeight: 500 }}>✓ {account.name || account.username}</div>}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, display: 'flex' }}><Icons.X size={16}/></button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#dc2626' }}>⚠️ {error}</div>}

          {/* IDLE — Connect button */}
          {step === 'idle' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '24px 0' }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: '#f5e6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ExtLogo id="onenote" size={44}/>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>OneNote verbinden</div>
                <div style={{ fontSize: 13, color: '#64748b', maxWidth: 340, lineHeight: 1.6 }}>
                  Melde dich mit deinem Microsoft-Konto an. StudyFlow kann dann deine Notizbücher lesen und mit KI zusammenfassen.
                </div>
              </div>
              <button onClick={handleConnect} className="btn-primary" style={{ padding: '12px 32px', fontSize: 14, gap: 8 }}>
                <span style={{ fontSize: 16 }}>🪟</span> Mit Microsoft anmelden
              </button>
              <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
                Deine Daten verlassen nicht deinen Browser. Nur Lesezugriff.
              </div>
            </div>
          )}

          {/* CONNECTING */}
          {step === 'connecting' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '32px 0' }}>
              <div style={{ fontSize: 28 }}>🪟</div>
              <div style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>Microsoft-Anmeldefenster geöffnet…</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Bitte im Popup-Fenster anmelden</div>
            </div>
          )}

          {/* CONNECTED — Notebooks */}
          {step === 'connected' && !selNotebook && (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Deine Notizbücher</div>
              {loading
                ? <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 24 }}>Lade…</div>
                : notebooks.length === 0
                  ? <div style={{ color: '#94a3b8', fontSize: 13 }}>Keine Notizbücher gefunden.</div>
                  : notebooks.map(nb => (
                    <div key={nb.id} onClick={() => handleNotebook(nb)}
                      style={{ padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, background: 'white', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#7719AA'; e.currentTarget.style.background = '#fdf4ff'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white'; }}>
                      <span style={{ fontSize: 22 }}>📒</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{nb.displayName}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>Zuletzt geändert: {new Date(nb.lastModifiedDateTime).toLocaleDateString('de-DE')}</div>
                      </div>
                      <Icons.Chevron size={12} color="#94a3b8"/>
                    </div>
                  ))
              }
              <div style={{ paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
                <button onClick={handleDisconnect} style={{ background: 'none', border: '1px solid #fecaca', borderRadius: 8, padding: '6px 12px', fontSize: 11, color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit' }}>Konto trennen</button>
              </div>
            </>
          )}

          {/* CONNECTED — Sections */}
          {step === 'connected' && selNotebook && !selSection && !summary && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => { setSelNotebook(null); setSections([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontSize: 12, fontFamily: 'inherit' }}>← Zurück</button>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{selNotebook.displayName}</div>
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Abschnitt zum Zusammenfassen wählen:</div>
              {loading
                ? <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 16 }}>Lade Abschnitte…</div>
                : sections.map(sec => (
                  <div key={sec.id} style={{ padding: '11px 16px', border: '1px solid #e2e8f0', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 16 }}>📑</span>
                      <span style={{ fontSize: 13, color: '#0f172a' }}>{sec.displayName}</span>
                    </div>
                    <button onClick={() => handleSummarize(sec)} className="btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}>
                      <Icons.Sparkles size={12}/> Zusammenfassen
                    </button>
                  </div>
                ))
              }
            </>
          )}

          {/* SUMMARY */}
          {(summarizing || (selSection && summary)) && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => { setSelSection(null); setSummary(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontSize: 12, fontFamily: 'inherit' }}>← Zurück</button>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{selSection?.displayName}</div>
              </div>
              {summarizing ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 32 }}>
                  <div style={{ fontSize: 28 }}>🧠</div>
                  <div style={{ fontSize: 13, color: '#7719AA', fontWeight: 500 }}>KI liest deine Notizen…</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Einen Moment bitte</div>
                </div>
              ) : (
                <div style={{ background: '#fdf4ff', borderRadius: 12, padding: 20, border: '1px solid #e9d5ff', fontSize: 13, color: '#334155', lineHeight: 1.75, whiteSpace: 'pre-wrap', maxHeight: 340, overflowY: 'auto' }}>
                  {summary}
                </div>
              )}
              {summary && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => navigator.clipboard.writeText(summary)} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Kopieren</button>
                  <button onClick={() => handleSummarize(selSection)} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}><Icons.Sparkles size={12}/> Neu generieren</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Extensions Panel ─────────────────────────────────────────
const ExtensionsPanel = () => {
  const [showOneNote, setShowOneNote] = useState(false);
  const [connected, setConnected] = useState({});
  const isOneNoteLinked = !!localStorage.getItem('sf_ms_client_id');

  const handleConnect = (ext) => {
    if (ext.id === 'onenote') { setShowOneNote(true); return; }
    if (ext.makeScenarioId) window.open(`https://eu2.make.com/1840378/scenarios/${ext.makeScenarioId}/edit`, '_blank');
    else window.open('https://make.com', '_blank');
    setConnected(prev => ({ ...prev, [ext.id]: true }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {showOneNote && <OneNoteModal onClose={() => setShowOneNote(false)} />}

      <div>
        <h2 style={{ fontFamily: 'Instrument Sans', fontSize: 18, fontWeight: 600, color: 'var(--text-main)', margin: '0 0 4px' }}>Erweiterungen</h2>
        <div style={{ fontSize: 13, color: 'var(--text-light)' }}>Verbinde StudyFlow mit deinen Tools. OneNote ermöglicht direkte KI-Zusammenfassungen deiner Notizen.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {EXTENSIONS.map(ext => {
          const isConnected = ext.id === 'onenote' ? isOneNoteLinked : (connected[ext.id] || ext.connected);
          return (
            <div key={ext.id} style={{ background: 'var(--bg-panel)', border: `1px solid ${isConnected ? ext.color + '44' : 'var(--border-light)'}`, borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: ext.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ExtLogo id={ext.id} size={20}/>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>{ext.name}</div>
                    {ext.id === 'onenote' && <div style={{ fontSize: 10, color: '#7719AA', fontWeight: 500, marginTop: 1 }}>KI-Zusammenfassung</div>}
                  </div>
                </div>
                {isConnected && <span style={{ fontSize: 10, background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>VERBUNDEN</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-light)', lineHeight: 1.5 }}>{ext.desc}</div>
              <button onClick={() => handleConnect(ext)} style={{ marginTop: 'auto', padding: '7px 14px', borderRadius: 8, border: isConnected ? `1px solid ${ext.color}44` : '1px solid var(--border-light)', background: isConnected ? ext.bg : 'white', color: isConnected ? ext.color : 'var(--text-main)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {ext.id === 'onenote'
                  ? isConnected ? <><Icons.Sparkles size={12}/> OneNote öffnen</> : <><Icons.Share size={12}/> Verbinden</>
                  : isConnected ? <><Icons.Check size={12}/> Konfigurieren</> : '+ Einrichten'}
              </button>
            </div>
          );
        })}
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
    if (type === 'whiteboard') return (
      <div style={{ width: 48, height: 48, borderRadius: 14, background: '#eef2ff', border: '1px solid #c7d2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3"/>
          <circle cx="8" cy="8" r="0.9" fill="#6366f1" stroke="none"/>
          <circle cx="12" cy="8" r="0.9" fill="#6366f1" stroke="none"/>
          <circle cx="16" cy="8" r="0.9" fill="#6366f1" stroke="none"/>
          <circle cx="8" cy="12" r="0.9" fill="#6366f1" stroke="none"/>
          <circle cx="12" cy="12" r="0.9" fill="#6366f1" stroke="none"/>
          <circle cx="16" cy="12" r="0.9" fill="#6366f1" stroke="none"/>
          <circle cx="8" cy="16" r="0.9" fill="#6366f1" stroke="none"/>
          <circle cx="12" cy="16" r="0.9" fill="#6366f1" stroke="none"/>
          <circle cx="16" cy="16" r="0.9" fill="#6366f1" stroke="none"/>
        </svg>
      </div>
    );
    return (
      <div style={{ width: 48, height: 48, borderRadius: 14, background: '#eef2ff', border: '1px solid #c7d2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      </div>
    );
  };

  const FolderIcon = () => (
    <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
    </div>
  );

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
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor='#fde68a'; e.currentTarget.style.background='#fffbeb'; }}
                onDragLeave={e => { e.currentTarget.style.borderColor='var(--border-light)'; e.currentTarget.style.background='var(--bg-panel)'; }}
                onDrop={e => { e.currentTarget.style.borderColor='var(--border-light)'; e.currentTarget.style.background='var(--bg-panel)'; handleDrop(e.dataTransfer.getData('text/plain'), item.id); }}
                style={{ background: 'var(--bg-panel)', borderRadius: 12, border: '1px solid var(--border-light)', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='#fde68a'; e.currentTarget.style.boxShadow='0 4px 16px rgba(245,158,11,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-light)'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.background='var(--bg-panel)'; }}>
                <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, #fffbeb 0%, var(--bg-panel) 100%)', borderBottom: '1px solid var(--border-light)' }}>
                  <FolderIcon/>
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-lighter)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ padding: '1px 5px', background: '#fffbeb', borderRadius: 4, fontSize: 10, fontWeight: 600, color: '#d97706' }}>Ordner</span>
                    <span>{childCount} {childCount === 1 ? 'Element' : 'Elemente'}</span>
                  </div>
                </div>
                <button onClick={e => deleteItem(item.id, e)} style={{ position: 'absolute', top: 6, right: 6, background: 'var(--bg-panel)', border: 'none', color: 'var(--text-lighter)', cursor: 'pointer', padding: 4, borderRadius: 5, display: 'flex', opacity: 0.8 }}
                  onMouseEnter={e => e.currentTarget.style.color='#ef4444'} onMouseLeave={e => e.currentTarget.style.color='var(--text-lighter)'}>
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
                height: 100,
                background: item.doc_type === 'whiteboard'
                  ? 'linear-gradient(180deg, #eef2ff 0%, var(--bg-panel) 100%)'
                  : 'linear-gradient(180deg, var(--bg-main) 0%, var(--bg-panel) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border-light)',
              }}>
                <IconForType type={item.doc_type}/>
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

// ─── Flow AI Panel ────────────────────────────────────────────
let _aiChatIdCounter = 1;
const makeChat = (title, firstMsg) => ({
  id: _aiChatIdCounter++,
  title,
  messages: [{ role: 'ai', text: firstMsg, time: new Date() }],
});

const SUGGESTIONS = [
  { icon: <Icons.Cards size={13}/>,    text: 'Erkläre mir das Thema meines aktiven Lernsets' },
  { icon: <Icons.Brain size={13}/>,    text: 'Quiz mich zu meinen schwachen Karten' },
  { icon: <Icons.Sparkles size={13}/>, text: 'Erstell 10 neue Karten zu einem Thema' },
  { icon: <Icons.Doc size={13}/>,      text: 'Fass mein letztes Dokument zusammen' },
];

const MODELS = [
  { id: 'glm-4', label: 'GLM-4 (Zhipu)' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { id: 'claude-sonnet-4.6', label: 'Sonnet 4.6' },
];

const FlowAIPage = ({ onClose }) => {
  const [chats, setChats] = React.useState(() => [
    makeChat('Willkommen', 'Hi! Ich bin Flow — deine KI-Lernassistentin. 👋\nFrag mich alles: ich erkläre Konzepte, erstelle Karten oder mache Quiz mit dir.'),
  ]);
  const [activeChatId, setActiveChatId] = React.useState(chats[0].id);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [model, setModel] = React.useState('glm-4');
  const [showModelDropdown, setShowModelDropdown] = React.useState(false);
  const messagesEndRef = React.useRef(null);
  const inputRef = React.useRef(null);

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages?.length]);

  const newChat = () => {
    const c = makeChat('Neuer Chat', 'Neuer Chat gestartet! Was möchtest du wissen oder lernen?');
    setChats(prev => [c, ...prev]);
    setActiveChatId(c.id);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const send = async (text) => {
    const t = (text || input).trim();
    if (!t || loading) return;
    setInput('');

    const userMsg = { role: 'user', text: t, time: new Date() };
    setChats(prev => prev.map(c =>
      c.id === activeChatId
        ? { ...c, title: c.messages.length <= 1 ? t.slice(0, 32) : c.title, messages: [...c.messages, userMsg] }
        : c
    ));
    setLoading(true);

    try {
      const res = await callChatAI([
        { role: 'system', content: 'Du bist Flow, eine freundliche KI-Lernassistentin für StudyFlow. Antworte auf Deutsch, präzise und motivierend. Helfe beim Lernen, Erklären von Konzepten, Erstellen von Karteikarten und Quiz. Antworte kurz und strukturiert.' },
        ...activeChat.messages.filter(m => m.role !== 'ai' || activeChat.messages.indexOf(m) > 0).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
        { role: 'user', content: t },
      ], model);
      const aiMsg = { role: 'ai', text: res, time: new Date() };
      setChats(prev => prev.map(c =>
        c.id === activeChatId ? { ...c, messages: [...c.messages, aiMsg] } : c
      ));
    } catch (e) {
      const errMsg = { role: 'ai', text: e.message === 'RATE_LIMIT' ? 'Rate limit erreicht — bitte kurz warten und nochmal versuchen.' : 'Verbindungsfehler — bitte erneut versuchen.', time: new Date() };
      setChats(prev => prev.map(c =>
        c.id === activeChatId ? { ...c, messages: [...c.messages, errMsg] } : c
      ));
    }
    setLoading(false);
  };

  const formatTime = (d) => d instanceof Date ? d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '';

  const CHAT_COLORS = ['#6366f1','#10b981','#f59e0b','#ec4899','#06b6d4','#8b5cf6'];

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
    <style>{`
      @keyframes flowPulse { 0%,100%{opacity:0.25;transform:scale(0.75)} 50%{opacity:1;transform:scale(1)} }
      @keyframes flowFadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      .flow-msg { animation: flowFadeIn 0.25s ease; }
      .flow-chat-item:hover { background: rgba(255,255,255,0.07) !important; }
    `}</style>

      {/* ── Left: dark notebook cover ── */}
      <div style={{ width: 238, flexShrink: 0, background: '#141d2e', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Logo */}
        <div style={{ padding: '20px 18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99,102,241,0.4)', flexShrink: 0 }}>
              <Icons.Sparkles size={18} style={{ color: 'white' }}/>
            </div>
            <div>
              <div style={{ fontFamily: 'Caveat', fontSize: 22, fontWeight: 700, color: 'white', lineHeight: 1.1 }}>Flow AI</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}/>
                <span style={{ fontSize: 10.5, color: '#10b981', fontWeight: 500 }}>Online</span>
              </div>
            </div>
          </div>
          <button onClick={newChat} style={{ width: '100%', padding: '9px 12px', background: 'rgba(99,102,241,0.22)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 12, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 13, fontFamily: 'inherit', fontWeight: 500, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.22)'; }}>
            <Icons.Plus size={13}/> Neuer Chat
          </button>
        </div>

        {/* Chat list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 8px 6px' }}>Verlauf</div>
          {chats.map((c, i) => {
            const isAct = c.id === activeChatId;
            const col = CHAT_COLORS[i % CHAT_COLORS.length];
            return (
              <div key={c.id} className="flow-chat-item" onClick={() => setActiveChatId(c.id)}
                style={{ padding: '9px 10px', borderRadius: 10, cursor: 'pointer', background: isAct ? 'rgba(99,102,241,0.2)' : 'transparent', border: isAct ? '1px solid rgba(99,102,241,0.35)' : '1px solid transparent', transition: 'all 0.1s', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: col, flexShrink: 0, opacity: isAct ? 1 : 0.45, boxShadow: isAct ? `0 0 6px ${col}88` : 'none' }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: isAct ? 'white' : 'rgba(255,255,255,0.55)', fontWeight: isAct ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>{c.messages.length} Nachr.</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Close button at bottom */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={onClose} style={{ width: '100%', padding: '7px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontFamily: 'inherit', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}>
            <Icons.X size={13}/> Schliessen
          </button>
        </div>
      </div>

      {/* ── Right: cream notebook pages ── */}
      <div style={{ flex: 1, minWidth: 0, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        background: '#f7f3ea',
        backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.18) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}>
        {/* Red margin line */}
        <div style={{ position: 'absolute', left: 72, top: 0, bottom: 0, width: 1.5, background: 'rgba(239,68,68,0.22)', zIndex: 0, pointerEvents: 'none' }}/>

        {/* Title bar */}
        <div style={{ padding: '14px 20px 10px 88px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, zIndex: 1, position: 'relative' }}>
          <div style={{ fontFamily: 'Caveat', fontSize: 22, fontWeight: 700, color: '#1e293b', letterSpacing: '0.01em' }}>{activeChat.title}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{formatTime(new Date())}</div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 36px 150px 88px', display: 'flex', flexDirection: 'column', gap: 22, zIndex: 1, position: 'relative' }}>

          {/* Empty state */}
          {activeChat.messages.length <= 1 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, minHeight: 240 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Caveat', fontSize: 32, fontWeight: 700, color: '#1e293b', lineHeight: 1.2, marginBottom: 6 }}>Was kann ich für<br/>dich aufschreiben?</div>
                <div style={{ fontFamily: 'Caveat', fontSize: 17, color: '#64748b' }}>Deine KI-Lernassistentin ist bereit ✏️</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', maxWidth: 460 }}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => send(s.text)} style={{ textAlign: 'left', padding: '11px 14px', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(15,23,42,0.1)', borderRadius: 12, fontSize: 12.5, color: '#475569', fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 8, transition: 'all 0.15s', boxShadow: '0 1px 4px rgba(15,23,42,0.06)', lineHeight: 1.4 }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.95)'; e.currentTarget.style.borderColor = '#c7d2fe'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor = 'rgba(15,23,42,0.1)'; }}>
                    <span style={{ color: '#6366f1', flexShrink: 0, marginTop: 1 }}>{s.icon}</span> {s.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {activeChat.messages.map((m, i) => (
            <div key={i} className="flow-msg" style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 5 }}>
              {m.role === 'ai' ? (
                /* AI: sticky-note style */
                <div style={{ maxWidth: '74%', position: 'relative' }}>
                  {/* Tape strip on top */}
                  <div style={{ position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)', width: 44, height: 14, background: 'rgba(99,102,241,0.25)', borderRadius: 3, zIndex: 1 }}/>
                  <div style={{ background: '#fffef5', borderRadius: '3px 12px 12px 12px', padding: '16px 16px 12px', boxShadow: '2px 4px 16px rgba(15,23,42,0.11), 0 1px 3px rgba(15,23,42,0.07)', border: '1px solid rgba(234,179,8,0.12)', transform: `rotate(${i % 3 === 0 ? -0.4 : i % 3 === 1 ? 0.3 : -0.2}deg)` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <div style={{ width: 18, height: 18, borderRadius: 6, background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icons.Sparkles size={10} style={{ color: 'white' }}/>
                      </div>
                      <span style={{ fontFamily: 'Caveat', fontSize: 13, fontWeight: 700, color: '#6366f1', letterSpacing: '0.03em' }}>Flow</span>
                      <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 2 }}>{formatTime(m.time)}</span>
                    </div>
                    <div style={{ fontSize: 13.5, lineHeight: 1.7, color: '#1e293b', whiteSpace: 'pre-wrap' }}>{m.text}</div>
                  </div>
                </div>
              ) : (
                /* User: dark ink bubble */
                <div style={{ maxWidth: '68%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <div style={{ padding: '10px 16px', borderRadius: '16px 16px 4px 16px', background: '#1e293b', color: 'white', fontSize: 13.5, lineHeight: 1.65, boxShadow: '0 2px 12px rgba(15,23,42,0.2)', whiteSpace: 'pre-wrap' }}>{m.text}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>{formatTime(m.time)}</div>
                </div>
              )}
            </div>
          ))}

          {/* Loading dots */}
          {loading && (
            <div className="flow-msg" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}>
              <div style={{ position: 'relative', maxWidth: '74%' }}>
                <div style={{ position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)', width: 44, height: 14, background: 'rgba(99,102,241,0.25)', borderRadius: 3 }}/>
                <div style={{ background: '#fffef5', borderRadius: '3px 12px 12px 12px', padding: '16px 20px', boxShadow: '2px 4px 16px rgba(15,23,42,0.11)', border: '1px solid rgba(234,179,8,0.12)', display: 'flex', gap: 6, alignItems: 'center' }}>
                  {[0,1,2].map(j => (
                    <div key={j} style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', animation: `flowPulse 1.2s ease-in-out ${j*0.22}s infinite` }}/>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef}/>
        </div>

        {/* Floating input */}
        <div style={{ position: 'absolute', bottom: 18, left: 78, right: 28, zIndex: 10 }}>
          <div style={{ background: 'rgba(255,252,242,0.97)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRadius: 20, border: '1px solid rgba(15,23,42,0.11)', boxShadow: '0 8px 28px rgba(15,23,42,0.13), 0 2px 6px rgba(15,23,42,0.06)', padding: '14px 14px 10px 16px' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Schreib etwas…"
              rows={1}
              style={{ width: '100%', padding: 0, border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: 14, background: 'transparent', color: '#1e293b', resize: 'none', lineHeight: 1.55, maxHeight: 120, overflowY: 'auto', display: 'block' }}
              onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <button onClick={newChat} title="Neuer Chat" style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(15,23,42,0.06)', border: '1px solid rgba(15,23,42,0.09)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', transition: 'all 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,23,42,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(15,23,42,0.06)'}>
                <Icons.Plus size={14}/>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ position: 'relative' }}>
                  {showModelDropdown && (
                    <div style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: 8, background: 'white', borderRadius: 12, border: '1px solid rgba(15,23,42,0.09)', boxShadow: '0 4px 20px rgba(15,23,42,0.08)', padding: 6, zIndex: 100, minWidth: 140 }}>
                      {MODELS.map(m => (
                        <div key={m.id} onClick={() => { setModel(m.id); setShowModelDropdown(false); }}
                          style={{ padding: '8px 10px', fontSize: 12, color: model === m.id ? '#6366f1' : '#1e293b', cursor: 'pointer', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.1s', background: model === m.id ? '#eef2ff' : 'transparent' }}
                          onMouseEnter={e => { if (model !== m.id) e.currentTarget.style.background = '#f1f5f9'; }}
                          onMouseLeave={e => { if (model !== m.id) e.currentTarget.style.background = 'transparent'; }}>
                          {m.label}
                          {model === m.id && <Icons.Check size={14}/>}
                        </div>
                      ))}
                    </div>
                  )}
                  <div onClick={() => setShowModelDropdown(!showModelDropdown)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 9, background: 'rgba(15,23,42,0.06)', border: '1px solid rgba(15,23,42,0.09)', cursor: 'pointer' }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: 'linear-gradient(135deg,#6366f1,#818cf8)', flexShrink: 0 }}/>
                    <span style={{ fontSize: 12, color: '#475569', fontWeight: 500, whiteSpace: 'nowrap' }}>{MODELS.find(m => m.id === model)?.label}</span>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.5 3.5L5 6.5L7.5 3.5" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
                <button onClick={() => send()} disabled={!input.trim() || loading}
                  style={{ width: 32, height: 32, borderRadius: 10, background: input.trim() && !loading ? '#1e293b' : 'rgba(15,23,42,0.08)', color: input.trim() && !loading ? 'white' : '#94a3b8', border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}>
                  <Icons.ArrowRight size={15}/>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
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

      {/* Tools */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-lighter)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, padding: '0 8px' }}>Tools</div>
        {[{ id: 'ai', label: 'Flow AI', icon: <Icons.Sparkles size={15}/> }].map(item => {
          const isActive = active === item.id;
          return (
            <div key={item.id} onClick={() => onNav(item.id)}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, background: isActive ? '#eef2ff' : 'transparent', color: isActive ? '#4f46e5' : 'var(--text-muted)', fontSize: 13, fontWeight: isActive ? 500 : 400, cursor: 'pointer', transition: 'background 0.1s' }}>
              {item.icon}
              <span style={{ flex: 1 }}>{item.label}</span>
              {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', flexShrink: 0 }}/>}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-light)', paddingTop: 14 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* User profile */}
          <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            {showUserMenu && (
              <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 8, background: 'var(--bg-panel)', borderRadius: 12, border: '1px solid var(--border-light)', boxShadow: '0 4px 20px rgba(15,23,42,0.08)', padding: 6, zIndex: 100 }}>
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

          {/* Settings button — own box next to profile */}
          <div
            onClick={() => onNav('settings')}
            onMouseEnter={e => { if (active !== 'settings') e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={e => { if (active !== 'settings') e.currentTarget.style.background = active === 'settings' ? 'var(--bg-active)' : 'var(--bg-panel)'; }}
            title="Einstellungen"
            style={{
              flexShrink: 0,
              padding: '10px',
              borderRadius: 10,
              border: '1px solid var(--border-light)',
              background: active === 'settings' ? 'var(--bg-active)' : 'var(--bg-panel)',
              color: active === 'settings' ? 'var(--text-main)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.1s',
            }}
          >
            <Icons.Settings size={15}/>
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
        <button onClick={e => { e.preventDefault(); e.stopPropagation(); window.location.href = `lern-modus.html?id=${set.id}`; }}
          style={{ padding: '6px 14px', background: 'var(--text-main)', color: 'var(--bg-panel)', border: 'none', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Icons.Brain size={12}/> Lernen
        </button>
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
  const activeSets = (sets || []).filter(s => s.mastered_cards > 0).length;

  // Level system: 1 XP per card review, 100 XP per level
  const totalXP = stats?.totalReviews || 0;
  const XP_PER_LEVEL = 100;
  const level = Math.floor(totalXP / XP_PER_LEVEL) + 1;
  const xpInLevel = totalXP % XP_PER_LEVEL;
  const levelPct = xpInLevel / XP_PER_LEVEL;
  const xpToNext = XP_PER_LEVEL - xpInLevel;
  const levelRadius = 22;
  const levelCircumference = 2 * Math.PI * levelRadius;
  const levelDashoffset = levelCircumference * (1 - levelPct);

  // Masking tape strip — same style as the "Klausur" sticky note (.tape from globals.css)
  const Tape = ({ color }) => (
    <div style={{
      position: 'absolute',
      width: 52, height: 18,
      background: color + '8C',
      top: -8, left: '50%',
      transform: 'translateX(-50%) rotate(-2deg)',
      borderLeft: '1px dashed rgba(255,255,255,0.6)',
      borderRight: '1px dashed rgba(255,255,255,0.6)',
      boxShadow: '0 1px 3px rgba(15,23,42,0.1)',
      zIndex: 2,
      pointerEvents: 'none',
      borderRadius: 2,
    }}/>
  );

  // Wavy underline SVG for notebook feel
  const WavyLine = ({ color }) => (
    <svg width="100%" height="6" viewBox="0 0 120 6" preserveAspectRatio="none" style={{ display: 'block', marginTop: 4 }}>
      <path d="M0 3 Q 10 0.5 20 3 T 40 3 T 60 3 T 80 3 T 100 3 T 120 3" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4"/>
    </svg>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Notebook-Karten: Aktivität, Wochenziel, Level */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, paddingTop: 14, alignItems: 'stretch' }}>

        {/* Aktivität — blaues Tape */}
        <div style={{ position: 'relative', transform: 'rotate(-1deg)', display: 'flex', flexDirection: 'column' }}>
          <Tape color="#3b82f6"/>
          <div style={{
            background: 'var(--bg-panel)',
            borderRadius: 14,
            padding: '18px 16px 14px',
            border: '1px solid var(--border-light)',
            boxShadow: '0 2px 8px rgba(15,23,42,0.05), 2px 3px 0 rgba(15,23,42,0.03)',
            flex: 1, minHeight: 134,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div style={{ fontFamily: 'Caveat', fontSize: 16, fontWeight: 600, color: '#2563eb', marginBottom: 2 }}>Aktivität</div>
            <WavyLine color="#3b82f6"/>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <div style={{ fontFamily: 'Caveat', fontSize: 32, fontWeight: 700, color: 'var(--text-main)', lineHeight: 1 }}>{streak || 0}</div>
                <div style={{ fontFamily: 'Caveat', fontSize: 14, color: '#3b82f6' }}>Tage Streak</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 4 }}>
                {cells.map((cell, i) => (
                  <div key={i} title={`${cell.dateStr}\n${cell.count} Karten`}
                    style={{ width: 9, height: 9, borderRadius: 2,
                      background: cell.v === 0 ? 'var(--bg-active)' : `rgba(59,130,246,${cell.v + 0.1})`,
                      cursor: 'help' }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Wochenziel — grünes Tape */}
        <div style={{ position: 'relative', transform: 'rotate(0.5deg)', display: 'flex', flexDirection: 'column' }}>
          <Tape color="#22c55e"/>
          <div style={{
            background: 'var(--bg-panel)',
            borderRadius: 14,
            padding: '18px 16px 14px',
            border: '1px solid var(--border-light)',
            boxShadow: '0 2px 8px rgba(15,23,42,0.05), 2px 3px 0 rgba(15,23,42,0.03)',
            flex: 1, minHeight: 134,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div style={{ fontFamily: 'Caveat', fontSize: 16, fontWeight: 600, color: '#16a34a', marginBottom: 2 }}>Wochenziel</div>
            <WavyLine color="#22c55e"/>
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 8 }}>
                <div style={{ fontFamily: 'Caveat', fontSize: 32, fontWeight: 700, color: 'var(--text-main)', lineHeight: 1 }}>{weekReviews}</div>
                <div style={{ fontFamily: 'Caveat', fontSize: 15, color: '#16a34a', marginBottom: 2 }}>/ {weeklyGoal} Karten</div>
              </div>
              <div style={{ height: 7, background: 'var(--bg-active)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${goalPct}%`, height: '100%', borderRadius: 999, transition: 'width 0.4s ease',
                  background: goalPct >= 100 ? '#16a34a' : 'linear-gradient(90deg, #4ade80, #16a34a)' }}/>
              </div>
              <div style={{ fontFamily: 'Caveat', fontSize: 13, color: 'var(--text-light)', marginTop: 5 }}>
                {goalPct >= 100 ? '🎉 Ziel erreicht!' : `Noch ${Math.max(0, weeklyGoal - weekReviews)} bis zum Ziel`}
              </div>
            </div>
          </div>
        </div>

        {/* Level — goldenes Tape */}
        <div style={{ position: 'relative', transform: 'rotate(-0.8deg)', display: 'flex', flexDirection: 'column' }}>
          <Tape color="#f59e0b"/>
          <div style={{
            background: 'var(--bg-panel)',
            borderRadius: 14,
            padding: '18px 16px 14px',
            border: '1px solid var(--border-light)',
            boxShadow: '0 2px 8px rgba(15,23,42,0.05), 2px 3px 0 rgba(15,23,42,0.03)',
            flex: 1, minHeight: 134,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div style={{ fontFamily: 'Caveat', fontSize: 16, fontWeight: 600, color: '#d97706', marginBottom: 2 }}>Fortschritt</div>
            <WavyLine color="#f59e0b"/>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <div style={{ fontFamily: 'Caveat', fontSize: 32, fontWeight: 700, color: 'var(--text-main)', lineHeight: 1 }}>Level {level}</div>
                <div style={{ fontFamily: 'Caveat', fontSize: 13, color: 'var(--text-light)', marginTop: 2 }}>
                  {totalXP === 0 ? 'Fang an zu lernen!' : `${xpToNext} XP bis Level ${level + 1}`}
                </div>
              </div>
              {/* Gold ring */}
              <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="52" height="52" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="26" cy="26" r={levelRadius} stroke="var(--bg-active)" strokeWidth="4.5" fill="none"/>
                  <circle cx="26" cy="26" r={levelRadius} stroke="#f59e0b" strokeWidth="4.5" fill="none"
                    strokeDasharray={levelCircumference}
                    strokeDashoffset={levelDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.6s ease', filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.5))' }}
                  />
                </svg>
                <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: '#d97706', letterSpacing: '0.06em', lineHeight: 1 }}>LVL</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', lineHeight: 1 }}>{level}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kleine Stats — 4 Boxen */}
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

      // Apply pending referral code from Google OAuth flow
      const pendingRef = localStorage.getItem('studyflow_pending_ref');
      if (pendingRef && prof && !prof.referred_by) {
        await window.sb.from('profiles').update({ referred_by: pendingRef }).eq('id', u.id);
        localStorage.removeItem('studyflow_pending_ref');
      }

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
    const { count: totalReviews } = await window.sb.from('card_reviews')
      .select('id', { count: 'exact', head: true }).eq('user_id', userId);

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
    
    setStats({ dueToday, weekReviews: weekReviews || 0, masteryPct, totalSets: enriched.length, reviewCounts, totalReviews: totalReviews || 0 });
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
  const showAI = active === 'ai';
  const showSets = !showDocs && !showSettings && !showAI;

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

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: showAI ? 0 : '18px 22px 14px', minWidth: 0, gap: 16, overflow: 'hidden' }}>
        {!showAI && <TopBar search={search} onSearch={setSearch} streak={streak}/>}

        {showDocs && <DocsPanel userId={user?.id}/>}
        {showSettings && <SettingsPanel user={user} profile={profile} onProfileUpdate={setProfile} darkMode={darkMode} setDarkMode={setDarkMode}/>}
        {showAI && <FlowAIPage onClose={() => setActive('home')}/>}

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

              <div style={{ display: filteredSets.length > 0 ? 'grid' : 'flex', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 4, paddingBottom: 20, alignContent: 'start' }}>
                {filteredSets.length > 0
                  ? filteredSets.map(s => <SetCard key={s.id} set={s} onDelete={handleSetDeleted}/>)
                  : <EmptyState onNewSet={() => setShowModal(true)}/>
                }
              </div>
            </div>
          </>
        )}
      </main>


      {!showAI && <AIAssistant/>}

      {showModal && (
        <CreateSetModal userId={user?.id} onClose={() => setShowModal(false)} onCreated={handleSetCreated}/>
      )}
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Dashboard/>);
