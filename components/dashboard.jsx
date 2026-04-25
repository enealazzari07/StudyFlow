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
  <div onClick={onChange} style={{ width: 40, height: 22, borderRadius: 999, background: on ? '#6366f1' : '#cbd5e1', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
    <div style={{ position: 'absolute', top: 3, left: on ? 20 : 3, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(15,23,42,0.2)' }}/>
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
      <div style={{ background: 'white', borderRadius: 20, padding: 32, width: 480, boxShadow: '0 20px 60px rgba(15,23,42,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: 'Instrument Sans', fontSize: 20, fontWeight: 600, color: '#0f172a', marginBottom: 24 }}>Neues Lernset erstellen</div>
        {error && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#991b1b', marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Titel *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="input-paper" placeholder="z.B. Mikroökonomie II" required autoFocus/>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Beschreibung (optional)</label>
            <input value={description} onChange={e => setDescription(e.target.value)} className="input-paper" placeholder="Kurze Beschreibung…"/>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Ordner (optional)</label>
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

// ─── Settings Panel ──────────────────────────────────────────
const SettingsPanel = ({ user, profile, onProfileUpdate }) => {
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
      <div>
        <h1 style={{ fontFamily: 'Instrument Sans', fontSize: 22, fontWeight: 600, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>Einstellungen</h1>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Profil, Lernziele und Abo verwalten.</div>
      </div>

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
            <div style={{ fontFamily: 'Instrument Sans', fontSize: 16, fontWeight: 700, color: isPro ? 'white' : '#0f172a' }}>
              {isPro ? 'Pro Plan' : 'Free Plan'}
            </div>
            {isPro && <span style={{ fontSize: 10, background: '#818cf8', color: 'white', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>AKTIV</span>}
          </div>
          <div style={{ fontSize: 12.5, color: isPro ? '#a5b4fc' : '#64748b' }}>
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

      {/* Feature comparison */}
      <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid rgba(15,23,42,0.06)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>Free vs. Pro</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', gap: 0 }}>
          <div/><div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textAlign: 'center', padding: '6px 0' }}>FREE</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textAlign: 'center', padding: '6px 0' }}>PRO</div>
          {PRO_FEATURES.map((f, i) => (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderTop: '1px solid rgba(15,23,42,0.04)', fontSize: 13, color: '#334155' }}>
                <span style={{ color: '#6366f1', display: 'flex' }}>{f.icon}</span>{f.label}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid rgba(15,23,42,0.04)', fontSize: 12 }}>
                {f.free === false
                  ? <span style={{ color: '#cbd5e1', display: 'flex' }}><Icons.X size={14}/></span>
                  : <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>{f.free === true ? <Icons.Check size={14}/> : f.free}</span>
                }
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid rgba(15,23,42,0.04)', fontSize: 12, color: '#6366f1', fontWeight: 500 }}>
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
            <Icons.Sparkles size={14}/> Jetzt auf Pro upgraden — 9,99 €/Monat
          </button>
        )}
      </div>

      {/* Danger zone */}
      <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #fecaca' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#991b1b', marginBottom: 12 }}>Gefahrenzone</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>Konto löschen</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Alle Daten werden unwiderruflich gelöscht.</div>
          </div>
          <button onClick={() => alert('Bitte wende dich an den Support.')} style={{ padding: '7px 14px', background: 'none', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 12, color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit' }}>
            Konto löschen
          </button>
        </div>
      </div>

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
              9,99 € <span style={{ fontSize: 16, color: '#64748b', fontWeight: 400 }}>/Monat</span>
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
const DocsPanel = ({ userId, profile, onSetCreated, targetSetId }) => {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [output, setOutput] = useState({ summary: true, quiz: true, cards: 20 });
  const [step, setStep] = useState('idle');
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [recentDocs, setRecentDocs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savedSetId, setSavedSetId] = useState(null);
  const [savedToTarget, setSavedToTarget] = useState(false);
  const fileInputRef = useRef(null);

  const isImage = file && file.type.startsWith('image/');
  const isText = file && (file.type === 'text/plain' || file.name.endsWith('.md') || file.name.endsWith('.txt'));
  const isPro = profile?.plan === 'pro';

  useEffect(() => { if (userId) loadRecentDocs(); }, [userId]);

  const loadRecentDocs = async () => {
    const { data } = await window.sb.from('documents').select('*').eq('owner_id', userId)
      .order('created_at', { ascending: false }).limit(8);
    setRecentDocs(data || []);
  };

  const handleFileSelect = (f) => {
    if (!f) return;
    if (isImage && !isPro) { setError('Bildanalyse ist ein Pro-Feature. Upgrade für Zugriff.'); return; }
    setFile(f); setResult(null); setError(''); setSavedSetId(null); setSavedToTarget(false); setStep('idle');
  };

  const handleDrop = (e) => { e.preventDefault(); setDragging(false); handleFileSelect(e.dataTransfer.files[0]); };

  const buildUserContent = async () => {
    if (isImage) {
      const b64 = await readFileAsBase64(file);
      return [{ type: 'image_url', image_url: { url: b64 } }];
    }
    if (isText) {
      const txt = await readFileAsText(file);
      return txt.slice(0, 14000);
    }
    return `Dateiname: "${file.name}"`;
  };

  const handleProcess = async () => {
    if (!file || !userId) return;
    if (!output.summary && !output.quiz && output.cards === 0) { setError('Wähle mindestens eine Ausgabe aus.'); return; }
    setError(''); setResult(null); setSavedSetId(null); setSavedToTarget(false);

    try {
      // Nur bei "Scan" (Bild oder PDF) die externe AI-API nutzen
      const isPdf = file.type === 'application/pdf' || (file.name || '').toLowerCase().endsWith('.pdf');
      const isScan = isImage || isPdf;
      if (!isScan) {
        setError('Flow AI greift nur bei gescannten Dokumenten (PDF/Bild) auf die API zu.');
        return;
      }

      // Upload file
      setStep('uploading'); setProgress('Lade Datei hoch…');
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${userId}/${Date.now()}_${safe}`;
      const { error: upErr } = await window.sb.storage.from('documents').upload(path, file, { contentType: file.type });
      if (upErr) throw new Error(upErr.message);
      const { data: doc } = await window.sb.from('documents').insert({
        owner_id: userId, name: file.name, file_path: path, file_size: file.size, mime_type: file.type,
      }).select().single();

      setStep('thinking');
      const content = await buildUserContent();
      const results = {};

      // Cards — ask for simple JSON array only
      if (output.cards > 0) {
        setProgress(`${output.cards} Karteikarten werden erstellt…`);
        const prompt = `Erstelle genau ${output.cards} Lernkarteikarten auf Deutsch. Antworte NUR mit einem JSON-Array, kein anderer Text: [{"front":"Frage","back":"Antwort"}]`;
        const msgs = isImage
          ? [{ role: 'user', content: [...content, { type: 'text', text: prompt }] }]
          : [{ role: 'system', content: 'Antworte ausschließlich mit dem angeforderten JSON. Kein Markdown, kein erklärender Text.' }, { role: 'user', content: `${prompt}\n\n${content}` }];
        const raw = await callAI(msgs);
        const parsed = extractJSON(raw);
        if (Array.isArray(parsed) && parsed.length) results.cards = parsed;
      }

      // Summary — plain text, no JSON
      if (output.summary) {
        setProgress('Zusammenfassung wird erstellt…');
        const prompt = 'Erstelle eine strukturierte Zusammenfassung auf Deutsch mit Überschriften (## ) und Aufzählungszeichen (-). Nur Text, kein JSON.';
        const msgs = isImage
          ? [{ role: 'user', content: [...content, { type: 'text', text: prompt }] }]
          : [{ role: 'system', content: 'Du bist ein Lernassistent. Antworte nur mit der Zusammenfassung.' }, { role: 'user', content: `${prompt}\n\n${content}` }];
        results.summary = await callAI(msgs);
      }

      // Quiz — simple JSON array
      if (output.quiz) {
        setProgress('Quizfragen werden erstellt…');
        const n = Math.min(8, output.cards || 8);
        const prompt = `Erstelle ${n} Multiple-Choice-Fragen auf Deutsch. NUR JSON-Array: [{"question":"...","options":["A","B","C","D"],"correct":0}]. correct ist der Index (0-3) der richtigen Antwort.`;
        const msgs = isImage
          ? [{ role: 'user', content: [...content, { type: 'text', text: prompt }] }]
          : [{ role: 'system', content: 'Antworte ausschließlich mit dem JSON-Array.' }, { role: 'user', content: `${prompt}\n\n${content}` }];
        const raw = await callAI(msgs);
        const parsed = extractJSON(raw);
        if (Array.isArray(parsed) && parsed.length) results.quiz = parsed;
      }

      if (doc) await window.sb.from('documents').update({ ai_processed: true }).eq('id', doc.id);
      loadRecentDocs();
      setResult(results);
      setStep('done');
    } catch (err) {
      if (err.message === 'RATE_LIMIT') {
        setError('API-Limit erreicht (429). Bitte 30 Sekunden warten und erneut versuchen.');
      } else {
        setError(err.message || 'Unbekannter Fehler');
      }
      setStep('idle');
    }
  };

  const handleSaveAsSet = async () => {
    if (!result?.cards || savedSetId) return;
    setSaving(true);
    const setName = file ? file.name.replace(/\.[^.]+$/, '') : 'Flow AI Set';
    const { data: newSet, error: setErr } = await window.sb.from('study_sets').insert({
      owner_id: userId, title: setName, emoji: null,
      description: `Automatisch erstellt aus ${file?.name || 'Dokument'}`,
    }).select().single();
    if (setErr) { setError(setErr.message); setSaving(false); return; }
    await window.sb.from('cards').insert(result.cards.map(c => ({
      set_id: newSet.id,
      front: c.front || c.question || c.q || '',
      back: c.back || c.answer || c.a || '',
    })));
    setSavedSetId(newSet.id);
    setSaving(false);
    if (onSetCreated) onSetCreated({ ...newSet, total_cards: result.cards.length, mastered_cards: 0, due_cards: 0, cards: [] });
  };

  const handleSaveIntoTargetSet = async () => {
    if (!targetSetId || !result?.cards || savedToTarget) return;
    setSaving(true);
    setError('');
    try {
      await window.sb.from('cards').insert(result.cards.map(c => ({
        set_id: targetSetId,
        front: (c.front || c.question || c.q || '').toString(),
        back: (c.back || c.answer || c.a || '').toString(),
      })));
      setSavedToTarget(true);
      setSaving(false);
      window.location.href = `lernset.html?id=${targetSetId}`;
    } catch (e) {
      setSaving(false);
      setError(e?.message || 'Fehler beim Speichern ins Lernset');
    }
  };

  const renderSummary = (text) => text.split('\n').map((line, i) => {
    if (line.startsWith('## ')) return <div key={i} style={{ fontFamily: 'Instrument Sans', fontSize: 14, fontWeight: 600, color: '#0f172a', marginTop: 14, marginBottom: 3 }}>{line.slice(3)}</div>;
    if (line.startsWith('# ')) return <div key={i} style={{ fontFamily: 'Instrument Sans', fontSize: 16, fontWeight: 700, color: '#0f172a', marginTop: 18, marginBottom: 5 }}>{line.slice(2)}</div>;
    if (line.startsWith('- ') || line.startsWith('• ')) return <div key={i} style={{ fontSize: 13, color: '#334155', paddingLeft: 10, marginTop: 3, display: 'flex', gap: 6 }}><span style={{ color: '#6366f1' }}>·</span>{line.slice(2)}</div>;
    if (line.trim() === '') return <div key={i} style={{ height: 5 }}/>;
    return <div key={i} style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, marginTop: 2 }}>{line}</div>;
  });

  const isRunning = step === 'uploading' || step === 'thinking';
  const pct = step === 'uploading' ? 20 : step === 'thinking' ? 75 : 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 80 }}>
      <div>
        <h1 style={{ fontFamily: 'Instrument Sans', fontSize: 22, fontWeight: 600, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>Dokumente & Flow AI</h1>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
          Lade ein Skript, Bild oder Textdatei hoch — Flow erstellt Karteikarten, Zusammenfassung und Quiz.
          {!isPro && <span style={{ marginLeft: 6, color: '#6366f1', fontWeight: 500 }}>Bildanalyse nur im Pro-Plan.</span>}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <a href="dokument.html" className="btn-ghost" style={{ padding: '7px 12px', fontSize: 12.5, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <Icons.Plus size={13}/> Neues Dokument
          </a>
          {targetSetId && (
            <div style={{ fontSize: 12.5, color: '#64748b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ padding: '2px 8px', borderRadius: 999, background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe', fontWeight: 600, fontSize: 11 }}>IMPORT</span>
              Karten werden ins aktuelle Lernset gespeichert.
            </div>
          )}
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*,.pdf,.txt,.md" style={{ display: 'none' }} onChange={e => handleFileSelect(e.target.files[0])}/>

      {!file ? (
        <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{ border: `2px dashed ${dragging ? '#6366f1' : '#cbd5e1'}`, borderRadius: 16, padding: '44px 32px', textAlign: 'center', background: dragging ? '#eef2ff' : 'white', cursor: 'pointer', transition: 'all 0.15s' }}>
          <div style={{ width: 60, height: 60, borderRadius: 14, background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Icons.Upload size={26}/>
          </div>
          <div style={{ fontFamily: 'Instrument Sans', fontSize: 17, fontWeight: 600, color: '#0f172a' }}>Datei hierher ziehen</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>oder <span style={{ color: '#4f46e5', fontWeight: 500 }}>durchsuchen</span></div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 14, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['TXT / Markdown', 'PDF', isPro ? 'Bilder (Pro)' : 'Bilder (Pro)'].map(t => (
              <span key={t} style={{ padding: '3px 8px', background: '#f1f5f9', borderRadius: 5 }}>{t}</span>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
          {/* File row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 52, background: isImage ? '#fdf4ff' : '#eef2ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isImage ? '#a21caf' : '#6366f1', flexShrink: 0 }}>
              {isImage ? <Icons.Eye size={22}/> : <Icons.Doc size={22}/>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{formatFileSize(file.size)}</div>
            </div>
            {!isRunning && !result && (
              <button onClick={() => { setFile(null); setError(''); }} style={{ background: 'none', border: 'none', padding: 6, color: '#94a3b8', cursor: 'pointer' }}>
                <Icons.X size={16}/>
              </button>
            )}
          </div>

          {/* Output options */}
          {!isRunning && !result && (
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(15,23,42,0.06)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Was soll Flow erstellen?</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { key: 'summary', label: 'Zusammenfassung', sub: 'Kompakte Übersicht der Kernthemen', icon: <Icons.Doc size={15}/> },
                  { key: 'quiz', label: 'Quizfragen', sub: '~8 Multiple-Choice-Fragen', icon: <Icons.Brain size={15}/> },
                ].map(o => (
                  <label key={o.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#fafaf7', borderRadius: 10, cursor: 'pointer', border: '1px solid rgba(15,23,42,0.04)' }}>
                    <div style={{ color: '#6366f1' }}>{o.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: '#0f172a' }}>{o.label}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{o.sub}</div>
                    </div>
                    <Toggle on={output[o.key]} onChange={() => setOutput({ ...output, [o.key]: !output[o.key] })}/>
                  </label>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#fafaf7', borderRadius: 10, border: '1px solid rgba(15,23,42,0.04)' }}>
                  <div style={{ color: '#6366f1' }}><Icons.Cards size={15}/></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: '#0f172a' }}>Karteikarten</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>Frage-Antwort-Paare für Spaced Repetition</div>
                  </div>
                  <input type="number" value={output.cards} min={0} max={50} onChange={e => setOutput({ ...output, cards: Math.max(0, Math.min(50, +e.target.value || 0)) })}
                    style={{ width: 56, padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, textAlign: 'center', fontFamily: 'inherit' }}/>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Karten</span>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ marginTop: 14, background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#991b1b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <span>{error}</span>
              <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', padding: 0, flexShrink: 0 }}><Icons.X size={14}/></button>
            </div>
          )}

          {/* Progress */}
          {isRunning && (
            <div style={{ marginTop: 18, padding: 16, background: '#fafaf7', borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="float" style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #818cf8)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.Sparkles size={13}/>
                </div>
                <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{progress}</div>
              </div>
              <div style={{ height: 4, background: '#e2e8f0', borderRadius: 999, marginTop: 14, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #818cf8)', transition: 'width 1.2s ease', borderRadius: 999 }}></div>
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {result.cards && result.cards.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}><Icons.Cards size={15}/> {result.cards.length} Karteikarten</div>
                    {targetSetId ? (
                      savedToTarget ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: '#d1fae5', color: '#065f46', borderRadius: 8, fontSize: 12, fontWeight: 500 }}>
                          <Icons.Check size={12}/> Gespeichert — Öffnen…
                        </div>
                      ) : (
                        <button onClick={handleSaveIntoTargetSet} disabled={saving} className="btn-primary" style={{ padding: '5px 12px', fontSize: 12, opacity: saving ? 0.7 : 1 }}>
                          {saving ? 'Speichert…' : <><Icons.Plus size={12}/> In Lernset</>}
                        </button>
                      )
                    ) : savedSetId ? (
                      <a href={`lernset.html?id=${savedSetId}`} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: '#d1fae5', color: '#065f46', borderRadius: 8, fontSize: 12, fontWeight: 500, textDecoration: 'none' }}>
                        <Icons.Check size={12}/> Gespeichert — Öffnen
                      </a>
                    ) : (
                      <button onClick={handleSaveAsSet} disabled={saving} className="btn-primary" style={{ padding: '5px 12px', fontSize: 12, opacity: saving ? 0.7 : 1 }}>
                        {saving ? 'Speichert…' : <><Icons.Plus size={12}/> Als Lernset</>}
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto', paddingRight: 4 }}>
                    {result.cards.map((c, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#fafaf7', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(15,23,42,0.04)' }}>
                        <div style={{ padding: '9px 13px', borderRight: '1px solid rgba(15,23,42,0.06)' }}>
                          <div style={{ fontSize: 9.5, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>Frage</div>
                          <div style={{ fontFamily: 'Caveat', fontSize: 15, color: '#0f172a', lineHeight: 1.3 }}>{c.front || c.question || c.q}</div>
                        </div>
                        <div style={{ padding: '9px 13px' }}>
                          <div style={{ fontSize: 9.5, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>Antwort</div>
                          <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.4 }}>{c.back || c.answer || c.a}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.quiz && result.quiz.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}><Icons.Brain size={15}/> {result.quiz.length} Quizfragen</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                    {result.quiz.map((q, i) => (
                      <div key={i} style={{ background: '#fafaf7', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(15,23,42,0.04)' }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', marginBottom: 6 }}>{i+1}. {q.question}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                          {(q.options || []).map((opt, j) => (
                            <div key={j} style={{ fontSize: 12, color: j === q.correct ? '#059669' : '#64748b', padding: '3px 8px', background: j === q.correct ? '#d1fae5' : 'white', borderRadius: 6, border: `1px solid ${j === q.correct ? '#6ee7b7' : '#e2e8f0'}` }}>
                              {['A','B','C','D'][j]}. {opt}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.summary && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}><Icons.Doc size={15}/> Zusammenfassung</div>
                  <div style={{ background: '#fafaf7', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(15,23,42,0.04)', maxHeight: 260, overflowY: 'auto' }}>
                    {renderSummary(result.summary)}
                  </div>
                </div>
              )}

              <button onClick={() => { setFile(null); setResult(null); setStep('idle'); setSavedSetId(null); setError(''); }} className="btn-ghost" style={{ width: '100%', justifyContent: 'center', padding: '9px 0', fontSize: 13 }}>
                Weitere Datei hochladen
              </button>
            </div>
          )}

          {!isRunning && !result && (
            <button onClick={handleProcess} className="btn-primary" style={{ marginTop: 18, width: '100%', justifyContent: 'center', padding: '13px 0', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', fontSize: 14 }}>
              <Icons.Sparkles size={14}/> Mit Flow verarbeiten
              <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.8 }}>~10–30 Sek</span>
            </button>
          )}
        </div>
      )}

      {recentDocs.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Zuletzt hochgeladen</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recentDocs.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'white', borderRadius: 10, border: '1px solid rgba(15,23,42,0.05)' }}>
                <Icons.Doc size={14}/>
                <span style={{ fontSize: 13, color: '#0f172a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                {r.ai_processed && <span style={{ fontSize: 11, color: '#059669', background: '#d1fae5', padding: '2px 7px', borderRadius: 4, flexShrink: 0 }}>KI</span>}
                {(r.mime_type === 'application/studyflow-doc+json' || (r.name || '').endsWith('.studyflow.json')) && (
                  <a href={`dokument.html?id=${r.id}`} style={{ fontSize: 12, color: '#4f46e5', fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
                    Öffnen
                  </a>
                )}
                <span style={{ fontSize: 12, color: '#64748b', flexShrink: 0 }}>{formatFileSize(r.file_size || 0)}</span>
                <span style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0 }}>{relativeTime(r.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Sidebar ─────────────────────────────────────────────────
const Sidebar = ({ user, profile, sets, active, onNav, onNewSet }) => {
  const folders = [...new Set((sets || []).map(s => s.folder).filter(Boolean))];
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Nutzer';
  const isPro = profile?.plan === 'pro';

  const navItems = [
    { id: 'home', label: 'Alle Lernsets', count: sets ? sets.length : 0, icon: <Icons.Cards size={15}/> },
    { id: 'docs', label: 'Notes', count: null, icon: <Icons.Doc size={15}/> },
    { id: 'fav', label: 'Favoriten', count: 0, icon: <Icons.Star size={15}/> },
    { id: 'shared', label: 'Geteilt mit mir', count: 0, icon: <Icons.Users size={15}/> },
  ];

  return (
    <aside style={{ width: 240, flexShrink: 0, margin: '14px 0 14px 14px', background: 'white', borderRadius: 18, border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.04)', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20, height: 'calc(100vh - 28px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 4px' }}>
        <Icons.Logo size={26}/>
        <div style={{ fontFamily: 'Caveat', fontSize: 24, fontWeight: 600, color: '#0f172a' }}>StudyFlow</div>
        {isPro && <span style={{ fontSize: 9, background: 'linear-gradient(135deg,#6366f1,#818cf8)', color: 'white', padding: '2px 6px', borderRadius: 999, fontWeight: 700, letterSpacing: '0.06em' }}>PRO</span>}
      </div>

      <button onClick={onNewSet} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '9px 14px', fontSize: 13 }}>
        <Icons.Plus size={14}/> Neues Lernset
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, padding: '0 8px' }}>Bibliothek</div>
        {navItems.map(item => {
          const isActive = active === item.id || (active === 'cards' && item.id === 'home');
          return (
            <div key={item.id} onClick={() => onNav(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, background: isActive ? '#f1f5f9' : 'transparent', color: isActive ? '#0f172a' : '#475569', fontSize: 13, fontWeight: isActive ? 500 : 400, cursor: 'pointer', transition: 'background 0.1s' }}>
              {item.icon}
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.count !== null && <span style={{ fontSize: 11, color: '#94a3b8' }}>{item.count}</span>}
            </div>
          );
        })}
      </div>

      {folders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, padding: '0 8px' }}>Ordner</div>
          {folders.map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', fontSize: 13, color: '#475569', cursor: 'pointer', borderRadius: 8 }}>
              <Icons.Folder size={15}/>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(15,23,42,0.06)', paddingTop: 14 }}>
        {/* Settings nav item */}
        <div onClick={() => onNav('settings')} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, background: active === 'settings' ? '#f1f5f9' : 'transparent', color: active === 'settings' ? '#0f172a' : '#475569', fontSize: 13, cursor: 'pointer', marginBottom: 8 }}>
          <Icons.Settings size={15}/>
          <span style={{ flex: 1 }}>Einstellungen</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={displayName} color="#6366f1" size={30}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
            <div style={{ fontSize: 11, color: isPro ? '#6366f1' : '#94a3b8', fontWeight: isPro ? 600 : 400, display: 'flex', alignItems: 'center', gap: 6 }}>
              {isPro ? <Icons.Bolt size={12}/> : <Icons.Bookmark size={12}/>}
              {isPro ? 'Pro Plan' : 'Free Plan'}
            </div>
          </div>
          <button onClick={() => onNav('settings')} title="Einstellungen" style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
            <Icons.Settings size={16}/>
          </button>
        </div>
      </div>
    </aside>
  );
};

// ─── TopBar ──────────────────────────────────────────────────
const TopBar = ({ search, onSearch }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
    <div style={{ flex: 1, maxWidth: 380, position: 'relative' }}>
      <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><Icons.Search size={15}/></div>
      <input className="input-paper" placeholder="Suchen…" value={search} onChange={e => onSearch(e.target.value)} style={{ paddingLeft: 36, background: 'white', padding: '8px 12px 8px 36px', fontSize: 13 }}/>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button style={{ background: 'white', border: '1px solid #e2e8f0', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: 'inherit' }}><Icons.Bolt size={14}/> —</button>
      <button style={{ background: 'white', border: '1px solid #e2e8f0', padding: 7, borderRadius: 8, cursor: 'pointer', color: '#475569', display: 'flex' }}><Icons.Bell size={15}/></button>
    </div>
  </div>
);

// ─── Notes Panel ─────────────────────────────────────────────
const FOLDER_COLORS = ['#6366f1','#ef4444','#f59e0b','#10b981','#06b6d4','#8b5cf6','#ec4899','#475569'];
const PAGE_MIME = 'application/studyflow-page+json';

function notesUid() { return Math.random().toString(36).slice(2, 9); }

const NotesFolderModal = ({ folder, onSave, onDelete, onClose }) => {
  const [name, setName] = useState(folder?.name || '');
  const [color, setColor] = useState(folder?.color || FOLDER_COLORS[0]);
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.4)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }} onClick={onClose}>
      <div style={{ background:'white', borderRadius:20, padding:28, width:380, boxShadow:'0 20px 60px rgba(15,23,42,0.2)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ fontFamily:'Instrument Sans', fontSize:17, fontWeight:600, color:'#0f172a', marginBottom:20 }}>{folder ? 'Ordner bearbeiten' : 'Neuer Ordner'}</div>
        <label style={{ fontSize:12, fontWeight:500, color:'#475569', display:'block', marginBottom:6 }}>Name</label>
        <input ref={ref} value={name} onChange={e=>setName(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter'&&name.trim()) onSave(name.trim(), color); if(e.key==='Escape') onClose(); }}
          placeholder="z.B. Physik, Mathe…" className="input-paper" style={{ marginBottom:18, width:'100%' }}/>
        <label style={{ fontSize:12, fontWeight:500, color:'#475569', display:'block', marginBottom:8 }}>Farbe</label>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:24 }}>
          {FOLDER_COLORS.map(c => (
            <button key={c} onClick={()=>setColor(c)} style={{ width:30, height:30, borderRadius:'50%', background:c, border: color===c?'3px solid #0f172a':'3px solid transparent', cursor:'pointer', padding:0, outline:'none' }}/>
          ))}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onClose} className="btn-ghost" style={{ flex:1, justifyContent:'center', padding:'9px 0' }}>Abbrechen</button>
          <button onClick={()=>name.trim()&&onSave(name.trim(),color)} disabled={!name.trim()} className="btn-primary" style={{ flex:1, justifyContent:'center', padding:'9px 0', opacity:!name.trim()?0.5:1 }}>Speichern</button>
        </div>
        {folder && onDelete && (
          <button onClick={onDelete} style={{ marginTop:12, width:'100%', background:'none', border:'none', color:'#dc2626', cursor:'pointer', fontSize:12, padding:'6px 0' }}>Ordner löschen</button>
        )}
      </div>
    </div>
  );
};

const NotesPanel = ({ userId }) => {
  const { useRef: useR } = React;
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState([]);
  const [docFolders, setDocFolders] = useState({});
  const [currentFolder, setCurrentFolder] = useState(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [contextDoc, setContextDoc] = useState(null); // { id, x, y }

  const lsKey = `sf_notes_v1_${userId}`;

  useEffect(() => {
    if (!userId) return;
    try {
      const raw = localStorage.getItem(lsKey);
      if (raw) { const { folders: f=[], docFolders: df={} } = JSON.parse(raw); setFolders(f); setDocFolders(df); }
    } catch {}
  }, [userId]);

  const persist = (f, df) => {
    try { localStorage.setItem(lsKey, JSON.stringify({ folders: f, docFolders: df })); } catch {}
  };

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await window.sb.from('documents')
        .select('id, name, mime_type, file_size, updated_at')
        .eq('owner_id', userId)
        .order('updated_at', { ascending: false });
      setNotes(data || []);
      setLoading(false);
    })();
  }, [userId]);

  const createFolder = (name, color) => {
    const f = { id: notesUid(), name, color };
    const nf = [...folders, f];
    setFolders(nf); persist(nf, docFolders);
  };
  const updateFolder = (id, name, color) => {
    const nf = folders.map(f => f.id===id?{...f,name,color}:f);
    setFolders(nf); persist(nf, docFolders);
  };
  const deleteFolder = (id) => {
    const nf = folders.filter(f=>f.id!==id);
    const ndf = Object.fromEntries(Object.entries(docFolders).filter(([,v])=>v!==id));
    setFolders(nf); setDocFolders(ndf); persist(nf, ndf);
    if (currentFolder?.id===id) setCurrentFolder(null);
  };
  const moveDoc = (docId, folderId) => {
    const ndf = folderId ? {...docFolders,[docId]:folderId} : Object.fromEntries(Object.entries(docFolders).filter(([k])=>k!==docId));
    setDocFolders(ndf); persist(folders, ndf);
  };
  const deleteDoc = async (id) => {
    if (!confirm('Note wirklich löschen?')) return;
    await window.sb.from('documents').delete().eq('id', id);
    setNotes(prev => prev.filter(n => n.id !== id));
    const ndf = Object.fromEntries(Object.entries(docFolders).filter(([k])=>k!==id));
    setDocFolders(ndf); persist(folders, ndf);
  };

  const openNew = (type) => {
    const p = new URLSearchParams({ type });
    if (currentFolder) p.set('folderId', currentFolder.id);
    window.location.href = `dokument.html?${p}`;
  };

  const noteTitle = (n) => (n.name||'').replace(/\.studyflow\.json$/, '').replace(/\.studyflow$/, '') || 'Ohne Titel';
  const isWB = (n) => n.mime_type !== PAGE_MIME;
  const visibleNotes = currentFolder
    ? notes.filter(n => docFolders[n.id] === currentFolder.id)
    : notes.filter(n => !docFolders[n.id]);

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', gap:0, overflow:'hidden', minHeight:0 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {currentFolder && (
            <button onClick={()=>setCurrentFolder(null)} className="btn-ghost" style={{ padding:'5px 10px', fontSize:12, display:'flex', alignItems:'center', gap:4 }}>
              <Icons.ArrowLeft size={12}/> Alle Notes
            </button>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {currentFolder && <div style={{ width:10, height:10, borderRadius:'50%', background:currentFolder.color }}/>}
            <h1 style={{ fontFamily:'Instrument Sans', fontSize:22, fontWeight:600, color:'#0f172a', letterSpacing:'-0.02em', margin:0 }}>
              {currentFolder ? currentFolder.name : 'Notes'}
            </h1>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>{setEditingFolder(null);setShowFolderModal(true);}} className="btn-ghost" style={{ padding:'7px 12px', fontSize:12, display:'flex', alignItems:'center', gap:5 }}>
            <Icons.Plus size={12}/> Ordner
          </button>
          <button onClick={()=>openNew('whiteboard')} className="btn-ghost" style={{ padding:'7px 12px', fontSize:12, display:'flex', alignItems:'center', gap:5 }}>
            ✏️ Whiteboard
          </button>
          <button onClick={()=>openNew('document')} className="btn-primary" style={{ padding:'7px 12px', fontSize:12, display:'flex', alignItems:'center', gap:5 }}>
            📄 Dokument
          </button>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', paddingBottom:80, minHeight:0 }}>
        {/* Folders (root only) */}
        {!currentFolder && folders.length > 0 && (
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:10.5, fontWeight:600, color:'#94a3b8', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:10 }}>Ordner</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:10 }}>
              {folders.map(folder => {
                const count = notes.filter(n => docFolders[n.id] === folder.id).length;
                return (
                  <div key={folder.id}
                    style={{ background:'white', borderRadius:12, padding:'12px 14px', cursor:'pointer', border:`1.5px solid ${folder.color}30`, display:'flex', alignItems:'center', gap:10, position:'relative', transition:'box-shadow 0.15s' }}
                    onClick={()=>setCurrentFolder(folder)}
                    onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 12px rgba(15,23,42,0.08)'}
                    onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
                    <div style={{ width:34, height:34, borderRadius:9, background:folder.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ fontSize:16 }}>📁</span>
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontWeight:500, fontSize:13, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{folder.name}</div>
                      <div style={{ fontSize:11, color:'#94a3b8' }}>{count} {count===1?'Item':'Items'}</div>
                    </div>
                    <button onClick={e=>{e.stopPropagation();setEditingFolder(folder);setShowFolderModal(true);}}
                      style={{ position:'absolute', top:6, right:6, background:'none', border:'none', color:'#cbd5e1', cursor:'pointer', padding:2, borderRadius:4, lineHeight:1 }}
                      title="Bearbeiten">⋯</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Notes header */}
        {(!currentFolder && folders.length > 0) && (
          <div style={{ fontSize:10.5, fontWeight:600, color:'#94a3b8', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:10 }}>Notizen</div>
        )}

        {/* Notes grid */}
        {loading ? (
          <div style={{ color:'#94a3b8', fontFamily:'Caveat', fontSize:20, textAlign:'center', paddingTop:40 }}>Lädt…</div>
        ) : visibleNotes.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, paddingTop:60, color:'#94a3b8' }}>
            <div style={{ fontSize:42 }}>{currentFolder ? '📂' : '✏️'}</div>
            <div style={{ fontFamily:'Caveat', fontSize:22 }}>{currentFolder ? 'Ordner ist leer' : 'Noch keine Notes'}</div>
            <div style={{ fontSize:13, textAlign:'center' }}>Erstelle ein Whiteboard oder Dokument mit den Buttons oben rechts.</div>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(170px, 1fr))', gap:12 }}>
            {visibleNotes.map(note => (
              <div key={note.id} style={{ position:'relative' }}
                onContextMenu={e=>{e.preventDefault();setContextDoc({id:note.id,x:e.clientX,y:e.clientY});}}>
                <a href={`dokument.html?id=${note.id}`}
                  style={{ display:'flex', flexDirection:'column', textDecoration:'none', background:'white', borderRadius:12, border:'1px solid rgba(15,23,42,0.06)', overflow:'hidden', transition:'box-shadow 0.15s, border-color 0.15s' }}
                  onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 4px 16px rgba(15,23,42,0.08)';e.currentTarget.style.borderColor='#cbd5e1';}}
                  onMouseLeave={e=>{e.currentTarget.style.boxShadow='none';e.currentTarget.style.borderColor='rgba(15,23,42,0.06)';}}>
                  {/* Thumbnail */}
                  <div style={{ height:100, background: isWB(note) ? '#f8fafc' : '#fff', borderBottom:'1px solid rgba(15,23,42,0.05)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
                    {isWB(note) ? (
                      <div style={{ backgroundImage:'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize:'16px 16px', position:'absolute', inset:0, opacity:0.6 }}/>
                    ) : (
                      <div style={{ background:'white', width:70, height:90, borderRadius:2, boxShadow:'0 2px 8px rgba(15,23,42,0.12)', border:'1px solid #e2e8f0' }}/>
                    )}
                    <div style={{ position:'relative', fontSize:28, zIndex:1 }}>{isWB(note)?'🖊️':'📄'}</div>
                  </div>
                  {/* Info */}
                  <div style={{ padding:'10px 12px' }}>
                    <div style={{ fontWeight:500, fontSize:13, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{noteTitle(note)}</div>
                    <div style={{ fontSize:11, color:'#94a3b8', marginTop:2, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span>{isWB(note)?'Whiteboard':'Dokument'}</span>
                      <span>{relativeTime(note.updated_at)}</span>
                    </div>
                  </div>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextDoc && (
        <div style={{ position:'fixed', left:contextDoc.x, top:contextDoc.y, background:'white', borderRadius:10, boxShadow:'0 8px 24px rgba(15,23,42,0.15)', border:'1px solid rgba(15,23,42,0.08)', padding:'4px 0', zIndex:500, minWidth:180 }}
          onClick={()=>setContextDoc(null)} onMouseLeave={()=>setContextDoc(null)}>
          {folders.length > 0 && (
            <>
              <div style={{ fontSize:10.5, fontWeight:600, color:'#94a3b8', letterSpacing:'0.06em', textTransform:'uppercase', padding:'6px 14px 2px' }}>In Ordner verschieben</div>
              {folders.map(f => (
                <button key={f.id} onClick={()=>{moveDoc(contextDoc.id, f.id);setContextDoc(null);}}
                  style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'7px 14px', background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#0f172a', textAlign:'left' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:f.color, flexShrink:0 }}/>{f.name}
                </button>
              ))}
              {docFolders[contextDoc.id] && (
                <button onClick={()=>{moveDoc(contextDoc.id, null);setContextDoc(null);}}
                  style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'7px 14px', background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#64748b', textAlign:'left' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
                  Aus Ordner entfernen
                </button>
              )}
              <div style={{ height:1, background:'#f1f5f9', margin:'4px 0' }}/>
            </>
          )}
          <button onClick={()=>{deleteDoc(contextDoc.id);setContextDoc(null);}}
            style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'7px 14px', background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#dc2626', textAlign:'left' }}
            onMouseEnter={e=>e.currentTarget.style.background='#fef2f2'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
            <Icons.Trash size={12}/> Löschen
          </button>
        </div>
      )}

      {/* Folder modal */}
      {showFolderModal && (
        <NotesFolderModal
          folder={editingFolder}
          onSave={(name, color) => {
            if (editingFolder) updateFolder(editingFolder.id, name, color);
            else createFolder(name, color);
            setShowFolderModal(false); setEditingFolder(null);
          }}
          onDelete={editingFolder ? ()=>{ deleteFolder(editingFolder.id); setShowFolderModal(false); setEditingFolder(null); } : null}
          onClose={() => { setShowFolderModal(false); setEditingFolder(null); }}
        />
      )}
    </div>
  );
};

// ─── Set Row ─────────────────────────────────────────────────
const SetRow = ({ set, onDelete }) => {
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
    <a href={`lernset.html?id=${set.id}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 110px 90px 70px 80px', alignItems: 'center', gap: 14, padding: '10px 14px', background: 'white', borderRadius: 10, border: '1px solid rgba(15,23,42,0.05)', transition: 'border-color 0.15s, background 0.15s', textDecoration: 'none' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='#cbd5e1'; e.currentTarget.style.background='#fafbfc'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(15,23,42,0.05)'; e.currentTarget.style.background='white'; }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ width: 26, height: 26, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#eef2ff', color: '#6366f1', border: '1px solid #c7d2fe', flexShrink: 0 }}>
            <Icons.Cards size={14}/>
          </span>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{set.title}</div>
          {!isDraft && pct === 100 && <span style={{ fontSize: 10, color: '#059669', background: '#d1fae5', padding: '1px 6px', borderRadius: 4, fontWeight: 500, flexShrink: 0 }}>Fertig</span>}
          {isDraft && <span style={{ fontSize: 10, color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, fontWeight: 500, flexShrink: 0 }}>Entwurf</span>}
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {set.total_cards} Karten <span style={{ color: '#cbd5e1' }}>·</span> {lastStudy}
        </div>
      </div>
      <div>{!isDraft ? (() => {
        const barColor = pct >= 80 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#6366f1';
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 3 }}>
              <span style={{ fontWeight: 600, color: barColor }}>{pct}%</span>
              <span>{set.mastered_cards}/{set.total_cards}</span>
            </div>
            <div style={{ height: 4, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 999 }}/>
            </div>
          </div>
        );
      })() : <div style={{ fontSize: 11.5, color: '#94a3b8' }}>—</div>}</div>
      <div style={{ fontSize: 12, color: '#64748b' }}>{set.due_cards > 0 ? <span style={{ color: '#dc2626', fontWeight: 500 }}>{set.due_cards} fällig</span> : <span style={{ color: '#94a3b8' }}>keine fällig</span>}</div>
      <div><div style={{ fontSize: 11.5, color: '#cbd5e1' }}>Nur ich</div></div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
        <a href={`lern-modus.html?id=${set.id}`} onClick={e => e.stopPropagation()} style={{ padding: '5px 10px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, fontSize: 11.5, fontFamily: 'inherit', cursor: 'pointer', fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>Lernen</a>
        <button onClick={handleDelete} style={{ padding: 5, background: 'none', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#94a3b8', display: 'flex' }}><Icons.MoreH size={14}/></button>
      </div>
    </a>
  );
};

// ─── Stats ───────────────────────────────────────────────────
const StatsRow = ({ stats }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
    {[
      { label: 'Fällig heute', value: stats.dueToday || '0', sub: 'Karten' },
      { label: 'Diese Woche', value: stats.weekReviews || '0', sub: 'Karten geübt' },
      { label: 'Gemeistert', value: stats.masteryPct || '0%', sub: 'aller Karten' },
      { label: 'Lernsets', value: stats.totalSets || '0', sub: 'gesamt' },
      { label: 'Streak 🔥', value: (stats.streak || 0) + ' T.', sub: 'Tage am Stück' },
    ].map(s => (
      <div key={s.label} style={{ background: 'white', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(15,23,42,0.05)' }}>
        <div style={{ fontSize: 11, color: '#64748b' }}>{s.label}</div>
        <div style={{ fontFamily: 'Instrument Sans', fontSize: 22, fontWeight: 600, color: '#0f172a', marginTop: 2, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{s.sub}</div>
      </div>
    ))}
  </div>
);

// ─── Empty State ─────────────────────────────────────────────
const EmptyState = ({ onNewSet }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16, color: '#94a3b8', padding: 40 }}>
    <div style={{ width: 64, height: 64, borderRadius: 18, background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #c7d2fe' }}>
      <Icons.Cards size={28}/>
    </div>
    <div style={{ fontFamily: 'Caveat', fontSize: 24, color: '#64748b' }}>Noch keine Lernsets</div>
    <div style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center', maxWidth: 300 }}>Erstelle dein erstes Lernset oder lade ein Dokument hoch, um loszulegen.</div>
    <button onClick={onNewSet} className="btn-primary" style={{ padding: '10px 20px' }}><Icons.Plus size={14}/> Erstes Lernset erstellen</button>
  </div>
);

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
      mastered_cards: s.cards ? s.cards.filter(c => c.mastery_level === 'mastered' || c.mastery_level === 'good').length : 0,
      due_cards: s.cards ? s.cards.filter(c => c.next_review && c.next_review <= now).length : 0,
    }));
    setSets(enriched);

    const allCards = enriched.flatMap(s => s.cards || []);
    const dueToday = allCards.filter(c => c.next_review && c.next_review <= now).length;
    const mastered = allCards.filter(c => c.mastery_level === 'mastered' || c.mastery_level === 'good').length;
    const masteryPct = allCards.length ? Math.round((mastered/allCards.length)*100)+'%' : '0%';
    const weekAgo = new Date(Date.now()-7*24*3600*1000).toISOString();
    const { count: weekReviews } = await window.sb.from('card_reviews')
      .select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('reviewed_at', weekAgo);

    // Compute streak from card_reviews
    const ninetyDaysAgo = new Date(Date.now()-90*24*3600*1000).toISOString();
    const { data: reviewDates } = await window.sb.from('card_reviews')
      .select('reviewed_at').eq('user_id', userId).gte('reviewed_at', ninetyDaysAgo);
    const daySet = new Set((reviewDates||[]).map(r => r.reviewed_at.slice(0,10)));
    let streak = 0;
    for (let i = 0; i < 90; i++) {
      const d = new Date(Date.now() - i*86400000).toISOString().slice(0,10);
      if (daySet.has(d)) streak++;
      else if (i > 0) break;
    }
    setStats({ dueToday, weekReviews: weekReviews || 0, masteryPct, totalSets: enriched.length, streak });
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
      <Sidebar user={user} profile={profile} sets={sets} active={active} onNav={setActive} onNewSet={() => setShowModal(true)}/>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '18px 22px 14px', minWidth: 0, gap: 16, overflow: 'hidden' }}>
        <TopBar search={search} onSearch={setSearch}/>

        {showDocs && <NotesPanel userId={user?.id}/>}
        {showSettings && <SettingsPanel user={user} profile={profile} onProfileUpdate={setProfile}/>}

        {showSets && (
          <>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <h1 style={{ fontFamily: 'Instrument Sans', fontSize: 24, fontWeight: 600, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
                  Servus, {displayName.split(' ')[0]}.
                </h1>
                {stats.dueToday > 0 && (
                  <span style={{ fontSize: 13, color: '#64748b' }}>
                    <span style={{ color: '#0f172a', fontWeight: 500 }}>{stats.dueToday} Karten</span> fällig
                  </span>
                )}
              </div>
            </div>

            <StatsRow stats={stats}/>

            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <h2 style={{ fontFamily: 'Instrument Sans', fontSize: 15, fontWeight: 600, color: '#0f172a', margin: 0 }}>Alle Lernsets</h2>
                  <div style={{ display: 'flex', gap: 2, background: '#f1f5f9', padding: 2, borderRadius: 7 }}>
                    {[{ k:'all', l:'Alle' }, { k:'due', l:'Fällig' }].map(t => (
                      <button key={t.k} onClick={() => setFilter(t.k)} style={{ padding: '4px 10px', background: filter===t.k ? 'white' : 'transparent', border: 'none', borderRadius: 5, fontSize: 11.5, color: filter===t.k ? '#0f172a' : '#64748b', fontWeight: filter===t.k ? 500 : 400, cursor: 'pointer', fontFamily: 'inherit', boxShadow: filter===t.k ? '0 1px 2px rgba(15,23,42,0.08)' : 'none' }}>{t.l}</button>
                    ))}
                  </div>
                </div>
              </div>

              {filteredSets.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 110px 90px 70px 80px', gap: 14, padding: '0 14px', fontSize: 10.5, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  <div>Name</div><div>Fortschritt</div><div>Status</div><div>Team</div><div></div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 4, paddingBottom: 70 }}>
                {filteredSets.length > 0
                  ? filteredSets.map(s => <SetRow key={s.id} set={s} onDelete={handleSetDeleted}/>)
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
          { id: 'docs', label: 'Notes', icon: <Icons.Doc size={18}/> },
          { id: 'stats', label: 'Statistiken', icon: <Icons.Chart size={18}/> },
          { id: 'settings', label: 'Einstellungen', icon: <Icons.Settings size={18}/> },
        ]} active={active} onSelect={(id) => {
          if (id === 'stats') { window.location.href = 'stats.html'; return; }
          setActive(id);
        }}/>
      </div>

      <AIAssistant/>

      {showModal && (
        <CreateSetModal userId={user?.id} onClose={() => setShowModal(false)} onCreated={handleSetCreated}/>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Dashboard/>);
