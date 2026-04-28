// StudyFlow — AI Scan Upload (api.airforce vision)
const { useState, useEffect, useRef } = React;

const AIRFORCE_KEY = 'sk-air-tWdMV6mXgoa1zAfHr8UfGVI9BFzyr5dXE2jdZO4pPApRVrXDyH6W6Bdv6RwmUctq';
const AI_URL = 'https://api.airforce/v1/chat/completions';
const VISION_MODEL = 'claude-sonnet-4.6';

const params = new URLSearchParams(window.location.search);
const TARGET_SET_ID = params.get('targetSetId') || null;

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function uid() { return Math.random().toString(36).slice(2); }

// Read file → {type:'image'|'text', content: dataUrl|string}
function readFile(file) {
  return new Promise((resolve, reject) => {
    const isImage = file.type.startsWith('image/');
    const reader = new FileReader();
    if (isImage) {
      reader.onload = e => resolve({ type: 'image', content: e.target.result });
      reader.readAsDataURL(file);
    } else {
      reader.onload = e => resolve({ type: 'text', content: e.target.result });
      reader.onerror = reject;
      reader.readAsText(file, 'UTF-8');
    }
    reader.onerror = reject;
  });
}

// Call api.airforce and return parsed card array
async function analyzeFile(fileData) {
  const PROMPT = `Du bist ein Lernassistent. Analysiere den Inhalt und erstelle Karteikarten (Frage/Antwort-Paare) auf Deutsch.
Antworte AUSSCHLIESSLICH mit einem JSON-Array ohne weiteren Text:
[{"front": "Frage hier", "back": "Antwort hier"}, ...]
Erstelle mindestens 5 und maximal 30 sinnvolle Karten.`;

  let messages;
  if (fileData.type === 'image') {
    messages = [{
      role: 'user',
      content: [
        { type: 'text', text: PROMPT },
        { type: 'image_url', image_url: { url: fileData.content } }
      ]
    }];
  } else {
    const maxLen = 12000;
    const text = fileData.content.length > maxLen
      ? fileData.content.slice(0, maxLen) + '\n[... gekürzt]'
      : fileData.content;
    messages = [{
      role: 'user',
      content: `${PROMPT}\n\nInhalt:\n${text}`
    }];
  }

  const res = await fetch(AI_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${AIRFORCE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: VISION_MODEL, messages, max_tokens: 3000 })
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => res.status);
    throw new Error(`API Fehler ${res.status}: ${txt}`);
  }

  const json = await res.json();
  const raw = json?.choices?.[0]?.message?.content || '';

  // Extract JSON array from response (model sometimes wraps in ```json ... ```)
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Keine Karten in der Antwort gefunden. Antwort: ' + raw.slice(0, 200));
  const arr = JSON.parse(match[0]);
  if (!Array.isArray(arr) || arr.length === 0) throw new Error('Leeres Kartenarray');
  return arr.map(c => ({
    id: uid(),
    front: (c.front || c.Frage || c.question || '').trim(),
    back: (c.back || c.Antwort || c.answer || '').trim(),
  })).filter(c => c.front && c.back);
}

// ─── Editable card table ───────────────────────────────────────
const CardTable = ({ cards, onChange }) => {
  const updateCard = (id, field, val) =>
    onChange(cards.map(c => c.id === id ? { ...c, [field]: val } : c));
  const removeCard = (id) => onChange(cards.filter(c => c.id !== id));
  const addCard = () => onChange([...cards, { id: uid(), front: '', back: '' }]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 36px', gap: 0, background: '#f1f5f9', borderRadius: '10px 10px 0 0', border: '1px solid #e2e8f0', borderBottom: 'none', padding: '8px 12px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Frage</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Antwort</div>
        <div/>
      </div>

      {/* Card rows */}
      {cards.map((c, i) => (
        <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 36px', gap: 0, border: '1px solid #e2e8f0', borderBottom: i === cards.length - 1 ? '1px solid #e2e8f0' : 'none', background: i % 2 === 0 ? 'white' : '#fafaf9' }}>
          <textarea value={c.front} onChange={e => updateCard(c.id, 'front', e.target.value)}
            rows={2} placeholder="Frage…"
            style={{ padding: '10px 12px', border: 'none', borderRight: '1px solid #e2e8f0', background: 'transparent', fontFamily: 'Caveat', fontSize: 17, color: '#0f172a', resize: 'vertical', outline: 'none', width: '100%', boxSizing: 'border-box', minHeight: 56 }}/>
          <textarea value={c.back} onChange={e => updateCard(c.id, 'back', e.target.value)}
            rows={2} placeholder="Antwort…"
            style={{ padding: '10px 12px', border: 'none', borderRight: '1px solid #e2e8f0', background: 'transparent', fontFamily: 'inherit', fontSize: 13, color: '#334155', resize: 'vertical', outline: 'none', width: '100%', boxSizing: 'border-box', minHeight: 56 }}/>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button onClick={() => removeCard(c.id)} title="Entfernen"
              style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer', color: '#cbd5e1', borderRadius: 6, display: 'flex' }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}>
              <Icons.X size={14}/>
            </button>
          </div>
        </div>
      ))}

      {/* Add row */}
      <button onClick={addCard}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', background: 'transparent', border: '1px dashed #cbd5e1', borderTop: 'none', borderRadius: '0 0 10px 10px', cursor: 'pointer', color: '#64748b', fontSize: 13, fontFamily: 'inherit', transition: 'background 0.12s' }}
        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <Icons.Plus size={14}/> Karte hinzufügen
      </button>
    </div>
  );
};

// ─── Main component ────────────────────────────────────────────
const AIUpload = () => {
  const [file, setFile] = useState(null);
  const [stage, setStage] = useState('idle'); // idle | analyzing | preview | saving | done
  const [cards, setCards] = useState([]);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [userId, setUserId] = useState(null);
  const [recentDocs, setRecentDocs] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      const session = await window.requireAuth();
      if (!session) return;
      setUserId(session.user.id);
      loadRecentDocs(session.user.id);
    })();
  }, []);

  const loadRecentDocs = async (uid) => {
    const { data } = await window.sb.from('documents')
      .select('*').eq('owner_id', uid)
      .order('created_at', { ascending: false }).limit(6);
    setRecentDocs(data || []);
  };

  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile || !userId) return;
    setFile(selectedFile);
    setCards([]);
    setError('');
    setStage('analyzing');

    try {
      // Upload to Supabase Storage in background
      const safeFilename = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${userId}/${Date.now()}_${safeFilename}`;
      window.sb.storage.from('documents').upload(path, selectedFile, { contentType: selectedFile.type })
        .then(async () => {
          const { data: doc } = await window.sb.from('documents').insert({
            owner_id: userId, name: selectedFile.name, file_path: path,
            file_size: selectedFile.size, mime_type: selectedFile.type, ai_processed: true,
          }).select().single();
          if (doc) loadRecentDocs(userId);
        }).catch(() => {}); // non-blocking

      // Read file and send to AI
      const fileData = await readFile(selectedFile);
      const parsed = await analyzeFile(fileData);
      setCards(parsed);
      setStage('preview');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Analyse fehlgeschlagen');
      setStage('idle');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const handleSave = async () => {
    const validCards = cards.filter(c => c.front.trim() && c.back.trim());
    if (validCards.length === 0) { setError('Keine gültigen Karten zum Speichern.'); return; }
    setStage('saving');
    try {
      if (TARGET_SET_ID) {
        // Save directly into existing set
        const rows = validCards.map(c => ({ set_id: TARGET_SET_ID, front: c.front.trim(), back: c.back.trim() }));
        const { error: e } = await window.sb.from('cards').insert(rows);
        if (e) throw new Error(e.message);
        window.location.href = `lernset.html?id=${encodeURIComponent(TARGET_SET_ID)}`;
      } else {
        // Create new set then add cards
        const { data: newSet, error: e1 } = await window.sb.from('study_sets').insert({
          owner_id: userId,
          title: file.name.replace(/\.[^.]+$/, '').replace(/_/g, ' '),
          visibility: 'private',
        }).select().single();
        if (e1) throw new Error(e1.message);
        const rows = validCards.map(c => ({ set_id: newSet.id, front: c.front.trim(), back: c.back.trim() }));
        await window.sb.from('cards').insert(rows);
        window.location.href = `lernset.html?id=${encodeURIComponent(newSet.id)}`;
      }
    } catch (err) {
      setError(err.message || 'Fehler beim Speichern');
      setStage('preview');
    }
  };

  const isImage = file && file.type.startsWith('image/');

  return (
    <div className="dot-paper" style={{ minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ padding: '12px 16px 0' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: 'white', borderRadius: 16, border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <a href="dashboard.html" style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(99,102,241,0.3)' }}>
                <Icons.Sparkles size={14} style={{ color: 'white' }}/>
              </div>
              <span style={{ fontFamily: 'Instrument Sans', fontWeight: 700, fontSize: 15, color: '#0f172a', letterSpacing: '-0.01em' }}>StudyFlow</span>
            </a>
            <div style={{ height: 20, width: 1, background: '#e2e8f0' }}/>
            <a href="dashboard.html" style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748b', fontSize: 13, textDecoration: 'none' }}>
              <Icons.ArrowLeft size={13}/> Dashboard
            </a>
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{recentDocs.length} Dokumente</div>
        </header>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Title */}
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'Instrument Sans', fontSize: 30, fontWeight: 700, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Scan & Karten generieren
          </h1>
          <p style={{ fontSize: 13.5, color: '#64748b', margin: 0 }}>
            Bild oder Dokument hochladen → Flow erkennt den Inhalt und erstellt Karteikarten automatisch
          </p>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 10, padding: '11px 16px', fontSize: 13, color: '#991b1b', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icons.X size={14}/> {error}
            <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', display: 'flex' }}><Icons.X size={13}/></button>
          </div>
        )}

        {/* ── IDLE: Dropzone ── */}
        {stage === 'idle' && (
          <>
            <input ref={fileInputRef} type="file"
              accept="image/*,.pdf,.txt,.md,.docx"
              style={{ display: 'none' }} onChange={e => { const f = e.target.files[0]; if (f) handleFileSelect(f); e.target.value = ''; }}/>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{ border: `2px dashed ${dragging ? '#6366f1' : '#cbd5e1'}`, borderRadius: 20, padding: '52px 40px', textAlign: 'center', background: dragging ? '#eef2ff' : 'white', cursor: 'pointer', transition: 'all 0.15s' }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Icons.Upload size={28}/>
              </div>
              <div style={{ fontFamily: 'Instrument Sans', fontSize: 17, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                Datei hier ablegen
              </div>
              <div style={{ fontSize: 13.5, color: '#64748b', marginBottom: 14 }}>
                oder <span style={{ color: '#6366f1', fontWeight: 500 }}>Datei auswählen</span>
              </div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['📷 Foto / Scan', '📄 PDF', '📝 TXT / MD'].map(t => (
                  <span key={t} style={{ fontSize: 11.5, color: '#64748b', background: '#f1f5f9', padding: '3px 10px', borderRadius: 999, border: '1px solid #e2e8f0' }}>{t}</span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── ANALYZING: Spinner ── */}
        {stage === 'analyzing' && (
          <div style={{ background: 'white', borderRadius: 20, padding: 40, border: '1px solid rgba(15,23,42,0.06)', textAlign: 'center', boxShadow: '0 2px 12px rgba(15,23,42,0.05)' }}>
            {/* File name */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 28, padding: '10px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', display: 'inline-flex' }}>
              <Icons.Doc size={15} style={{ color: '#6366f1' }}/>
              <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{file?.name}</span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{formatFileSize(file?.size || 0)}</span>
            </div>

            {/* Animated logo */}
            <div className="float" style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #6366f1, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
              <Icons.Sparkles size={28} style={{ color: 'white' }}/>
            </div>
            <div style={{ fontFamily: 'Caveat', fontSize: 26, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
              Flow analysiert…
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
              {isImage ? 'Bild wird erkannt und in Karten umgewandelt' : 'Inhalt wird analysiert und Karten werden erstellt'}
            </div>
            {/* Progress bar (indeterminate) */}
            <div style={{ height: 4, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden', maxWidth: 320, margin: '0 auto' }}>
              <div style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #6366f1, #818cf8, #6366f1)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite linear' }}/>
            </div>
            <style>{`@keyframes shimmer { 0%{background-position:100% 0} 100%{background-position:-100% 0} }`}</style>
          </div>
        )}

        {/* ── PREVIEW: Editable table ── */}
        {(stage === 'preview' || stage === 'saving') && (
          <div>
            {/* File info bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'white', borderRadius: 12, border: '1px solid rgba(15,23,42,0.06)', marginBottom: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {isImage ? <Icons.Upload size={15}/> : <Icons.Doc size={15}/>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file?.name}</div>
                <div style={{ fontSize: 11.5, color: '#94a3b8' }}>{formatFileSize(file?.size || 0)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: '#d1fae5', color: '#065f46', fontSize: 11.5, fontWeight: 600, flexShrink: 0 }}>
                <Icons.Check size={11}/> {cards.length} Karten erkannt
              </div>
              <button onClick={() => { setFile(null); setCards([]); setStage('idle'); setError(''); }}
                style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer', color: '#94a3b8', display: 'flex', borderRadius: 6 }}
                title="Andere Datei wählen">
                <Icons.X size={16}/>
              </button>
            </div>

            {/* Editable table */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>Karten überarbeiten</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>Direkt bearbeitbar · Zeile entfernen mit ✕</div>
              </div>
              <CardTable cards={cards} onChange={setCards}/>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button onClick={handleSave} disabled={stage === 'saving' || cards.filter(c=>c.front.trim()&&c.back.trim()).length === 0}
                style={{ flex: 1, padding: '12px 0', background: stage === 'saving' ? '#818cf8' : '#6366f1', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: stage === 'saving' ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'background 0.15s' }}>
                {stage === 'saving' ? 'Speichert…' : <><Icons.Cards size={15}/> {cards.filter(c=>c.front.trim()&&c.back.trim()).length} Karten ins Lernset speichern</>}
              </button>
              <button onClick={() => { setFile(null); setCards([]); setStage('idle'); setError(''); }}
                style={{ padding: '12px 18px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 12, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {/* ── Recent docs ── */}
        {recentDocs.length > 0 && stage === 'idle' && (
          <div style={{ marginTop: 36 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Zuletzt hochgeladen</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {recentDocs.map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: 'white', borderRadius: 10, border: '1px solid rgba(15,23,42,0.05)' }}>
                  <Icons.Doc size={13} style={{ color: '#94a3b8', flexShrink: 0 }}/>
                  <span style={{ fontSize: 13, color: '#0f172a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                  {r.ai_processed && <span style={{ fontSize: 10.5, color: '#059669', background: '#d1fae5', padding: '2px 7px', borderRadius: 4, fontWeight: 600, flexShrink: 0 }}>✓ KI</span>}
                  <span style={{ fontSize: 11.5, color: '#94a3b8', flexShrink: 0 }}>{formatFileSize(r.file_size || 0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<AIUpload/>);
