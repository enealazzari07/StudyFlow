// StudyFlow — Dashboard (v3: inline docs panel + real AI via api.airforce)
const { useState, useEffect, useRef } = React;

const AIRFORCE_KEY = 'sk-air-tWdMV6mXgoa1zAfHr8UfGVI9BFzyr5dXE2jdZO4pPApRVrXDyH6W6Bdv6RwmUctq';
const AI_MODEL = 'claude-sonnet-4-6';
const AI_URL = 'https://api.airforce/v1/chat/completions';

const DOCK_ITEMS = [
  { id: 'home', label: 'Start', icon: <Icons.Home size={18}/> },
  { id: 'cards', label: 'Lernsets', icon: <Icons.Cards size={18}/> },
  { id: 'docs', label: 'Dokumente', icon: <Icons.Doc size={18}/> },
  { id: 'ai', label: 'Flow AI', icon: <Icons.Sparkles size={18}/> },
  { id: 'stats', label: 'Fortschritt', icon: <Icons.Chart size={18}/> },
];

// ─── Helpers ─────────────────────────────────────────────────
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}
function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'gerade eben';
  if (m < 60) return `vor ${m} Min.`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} Std.`;
  return `vor ${Math.floor(h / 24)} T.`;
}
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsText(file);
  });
}

async function callAI(messages) {
  const res = await fetch(AI_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AIRFORCE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: AI_MODEL, messages }),
  });
  if (!res.ok) throw new Error(`API Error ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

// ─── Create Set Modal ────────────────────────────────────────
const CreateSetModal = ({ onClose, onCreated, userId }) => {
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('📚');
  const [description, setDescription] = useState('');
  const [folder, setFolder] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError('');
    const { data, error: err } = await window.sb.from('study_sets').insert({
      owner_id: userId,
      title: title.trim(),
      emoji: emoji || '📚',
      description: description.trim() || null,
      folder: folder.trim() || null,
    }).select().single();
    setLoading(false);
    if (err) { setError(err.message); return; }
    onCreated(data);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 20, padding: 32, width: 480, boxShadow: '0 20px 60px rgba(15,23,42,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: 'Instrument Sans', fontSize: 20, fontWeight: 600, color: '#0f172a', marginBottom: 24 }}>Neues Lernset erstellen</div>
        {error && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#991b1b', marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Emoji</label>
              <input value={emoji} onChange={e => setEmoji(e.target.value)} className="input-paper" style={{ width: 60, textAlign: 'center', fontSize: 22 }} maxLength={2}/>
            </div>
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

// ─── Toggle Switch ────────────────────────────────────────────
const Toggle = ({ on, onChange }) => (
  <div onClick={onChange} style={{
    width: 40, height: 22, borderRadius: 999,
    background: on ? '#6366f1' : '#cbd5e1',
    position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
  }}>
    <div style={{
      position: 'absolute', top: 3, left: on ? 20 : 3,
      width: 16, height: 16, borderRadius: '50%',
      background: 'white', transition: 'left 0.2s',
      boxShadow: '0 1px 3px rgba(15,23,42,0.2)',
    }}/>
  </div>
);

// ─── Docs Panel ──────────────────────────────────────────────
const DocsPanel = ({ userId, onSetCreated }) => {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [output, setOutput] = useState({ summary: true, quiz: true, cards: 20 });
  const [step, setStep] = useState('idle'); // idle | uploading | thinking | done
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState(null); // { cards?, summary?, quiz? }
  const [error, setError] = useState('');
  const [recentDocs, setRecentDocs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savedSetId, setSavedSetId] = useState(null);
  const fileInputRef = useRef(null);

  const isImage = file && file.type.startsWith('image/');
  const isText = file && (file.type === 'text/plain' || file.name.endsWith('.md') || file.name.endsWith('.txt'));

  useEffect(() => { if (userId) loadRecentDocs(); }, [userId]);

  const loadRecentDocs = async () => {
    const { data } = await window.sb.from('documents')
      .select('*').eq('owner_id', userId)
      .order('created_at', { ascending: false }).limit(8);
    setRecentDocs(data || []);
  };

  const handleFileSelect = (f) => {
    if (!f) return;
    setFile(f); setResult(null); setError(''); setSavedSetId(null); setStep('idle');
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const buildContentForAI = async () => {
    if (isImage) {
      const base64 = await readFileAsBase64(file);
      return { type: 'image', base64 };
    }
    if (isText) {
      const text = await readFileAsText(file);
      return { type: 'text', content: text.slice(0, 14000) };
    }
    return { type: 'filename', content: file.name };
  };

  const callAIForOutput = async (contentInfo) => {
    const parts = [];
    if (output.summary) parts.push('eine Zusammenfassung (key: "summary", Markdown-Text)');
    if (output.quiz) parts.push(`${Math.min(output.cards, 8)} Quizfragen (key: "quiz", Array mit {question, options:[A,B,C,D], correct:0-3})`);
    if (output.cards > 0) parts.push(`genau ${output.cards} Karteikarten (key: "cards", Array mit {front, back})`);

    const taskDesc = `Erstelle auf Deutsch: ${parts.join(', ')}. Antworte NUR mit einem JSON-Objekt mit diesen Keys. Kein weiterer Text außerhalb des JSON.`;

    let messages;
    if (contentInfo.type === 'image') {
      messages = [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: contentInfo.base64 } },
          { type: 'text', text: taskDesc },
        ],
      }];
    } else {
      const ctx = contentInfo.type === 'text'
        ? contentInfo.content
        : `Dateiname: ${contentInfo.content}`;
      messages = [
        { role: 'system', content: 'Du bist ein präziser Lernassistent. Antworte ausschließlich mit dem angeforderten JSON-Objekt.' },
        { role: 'user', content: `${taskDesc}\n\nInhalt:\n${ctx}` },
      ];
    }
    return callAI(messages);
  };

  const handleProcess = async () => {
    if (!file || !userId) return;
    if (!output.summary && !output.quiz && output.cards === 0) {
      setError('Wähle mindestens eine Ausgabe aus.'); return;
    }
    setError(''); setResult(null); setSavedSetId(null);

    try {
      setStep('uploading'); setProgress('Lade Datei hoch…');
      const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${userId}/${Date.now()}_${safeFilename}`;
      const { error: uploadErr } = await window.sb.storage.from('documents').upload(path, file, { contentType: file.type });
      if (uploadErr) throw new Error(uploadErr.message);

      const { data: doc } = await window.sb.from('documents').insert({
        owner_id: userId, name: file.name, file_path: path,
        file_size: file.size, mime_type: file.type,
      }).select().single();

      setStep('thinking'); setProgress('Flow AI analysiert…');
      const contentInfo = await buildContentForAI();
      const rawResponse = await callAIForOutput(contentInfo);

      // Parse JSON response
      setProgress('Ergebnisse werden aufbereitet…');
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI hat kein gültiges JSON zurückgegeben. Bitte erneut versuchen.');
      const parsed = JSON.parse(jsonMatch[0]);

      setResult({
        cards: Array.isArray(parsed.cards) ? parsed.cards : null,
        summary: typeof parsed.summary === 'string' ? parsed.summary : null,
        quiz: Array.isArray(parsed.quiz) ? parsed.quiz : null,
      });

      if (doc) await window.sb.from('documents').update({ ai_processed: true }).eq('id', doc.id);
      loadRecentDocs();
      setStep('done');
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('429') || msg.includes('rate') || msg.toLowerCase().includes('limit')) {
        setError('API-Limit erreicht (429). Bitte 30 Sekunden warten und erneut versuchen.');
      } else {
        setError(msg || 'Unbekannter Fehler');
      }
      setStep('idle');
    }
  };

  const handleSaveAsSet = async () => {
    if (!result?.cards || savedSetId) return;
    setSaving(true);
    const setName = file ? file.name.replace(/\.[^.]+$/, '') : 'Flow AI Set';
    const { data: newSet, error: setErr } = await window.sb.from('study_sets').insert({
      owner_id: userId, title: setName, emoji: '🤖',
      description: `Automatisch erstellt aus ${file?.name || 'Dokument'}`,
    }).select().single();
    if (setErr) { setError(setErr.message); setSaving(false); return; }

    const cardsToInsert = result.cards.map(c => ({
      set_id: newSet.id,
      front: c.front || c.question || c.q || '',
      back: c.back || c.answer || c.a || '',
    }));
    await window.sb.from('cards').insert(cardsToInsert);
    setSavedSetId(newSet.id);
    setSaving(false);
    if (onSetCreated) onSetCreated({ ...newSet, total_cards: cardsToInsert.length, mastered_cards: 0, due_cards: 0, cards: [] });
  };

  const renderSummary = (text) => text.split('\n').map((line, i) => {
    if (line.startsWith('## ')) return <div key={i} style={{ fontFamily: 'Instrument Sans', fontSize: 14, fontWeight: 600, color: '#0f172a', marginTop: 14, marginBottom: 3 }}>{line.slice(3)}</div>;
    if (line.startsWith('# ')) return <div key={i} style={{ fontFamily: 'Instrument Sans', fontSize: 16, fontWeight: 700, color: '#0f172a', marginTop: 18, marginBottom: 5 }}>{line.slice(2)}</div>;
    if (line.startsWith('- ') || line.startsWith('• ')) return <div key={i} style={{ fontSize: 13, color: '#334155', paddingLeft: 10, marginTop: 3, display: 'flex', gap: 6 }}><span style={{ color: '#6366f1' }}>·</span>{line.slice(2)}</div>;
    if (line.trim() === '') return <div key={i} style={{ height: 5 }}/>;
    return <div key={i} style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, marginTop: 2 }}>{line}</div>;
  });

  const isRunning = step === 'uploading' || step === 'thinking';
  const canProcess = file && !isRunning && !result;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 80 }}>
      <div>
        <h1 style={{ fontFamily: 'Instrument Sans', fontSize: 22, fontWeight: 600, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>Dokumente & Flow AI</h1>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Lade ein Bild, Skript oder Textdokument hoch — Flow erstellt Karteikarten, Zusammenfassung und Quiz.</div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*,.pdf,.txt,.md" style={{ display: 'none' }} onChange={e => handleFileSelect(e.target.files[0])}/>

      {/* Dropzone */}
      {!file ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? '#6366f1' : '#cbd5e1'}`,
            borderRadius: 16, padding: '44px 32px', textAlign: 'center',
            background: dragging ? '#eef2ff' : 'white', cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          <div style={{ width: 60, height: 60, borderRadius: 14, background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Icons.Upload size={26}/>
          </div>
          <div style={{ fontFamily: 'Instrument Sans', fontSize: 17, fontWeight: 600, color: '#0f172a' }}>Datei hierher ziehen</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>oder <span style={{ color: '#4f46e5', fontWeight: 500 }}>durchsuchen</span></div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 14 }}>PDF · DOCX · MD · TXT · Bilder · max. 50 MB</div>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
          {/* File row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 52, background: isImage ? '#fdf4ff' : '#eef2ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isImage ? '#a21caf' : '#6366f1', flexShrink: 0 }}>
              {isImage ? <span style={{ fontSize: 22 }}>🖼️</span> : <Icons.Doc size={22}/>}
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

          {/* Output options — shown before processing */}
          {canProcess && (
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
                  <input type="number" value={output.cards} min={0} max={50}
                    onChange={e => setOutput({ ...output, cards: Math.max(0, Math.min(50, +e.target.value || 0)) })}
                    style={{ width: 58, padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, textAlign: 'center', fontFamily: 'inherit' }}/>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Karten</span>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ marginTop: 14, background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#991b1b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <span>{error}</span>
              <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', padding: 0 }}><Icons.X size={14}/></button>
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
                <div style={{ width: step === 'uploading' ? '25%' : '80%', height: '100%', background: 'linear-gradient(90deg, #6366f1, #818cf8)', transition: 'width 1s ease', borderRadius: 999 }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: '#94a3b8' }}>
                {['Hochladen', 'Lesen', 'Analysieren', 'Erstellen'].map((s, i) => (
                  <span key={s} style={{ color: (step === 'uploading' ? 0 : 2) >= i ? '#6366f1' : '#cbd5e1', fontWeight: 500 }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Cards result */}
              {result.cards && result.cards.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>🃏 {result.cards.length} Karteikarten</div>
                    {savedSetId ? (
                      <a href={`lernset.html?id=${savedSetId}`} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: '#d1fae5', color: '#065f46', borderRadius: 8, fontSize: 12, fontWeight: 500, textDecoration: 'none' }}>
                        <Icons.Check size={12}/> Gespeichert — Öffnen
                      </a>
                    ) : (
                      <button onClick={handleSaveAsSet} disabled={saving} className="btn-primary" style={{ padding: '5px 12px', fontSize: 12, opacity: saving ? 0.7 : 1 }}>
                        {saving ? 'Speichert…' : <><Icons.Plus size={12}/> Als Lernset</>}
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
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

              {/* Quiz result */}
              {result.quiz && result.quiz.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 10 }}>🧠 {result.quiz.length} Quizfragen</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
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

              {/* Summary result */}
              {result.summary && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>📝 Zusammenfassung</div>
                  <div style={{ background: '#fafaf7', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(15,23,42,0.04)', maxHeight: 280, overflowY: 'auto' }}>
                    {renderSummary(result.summary)}
                  </div>
                </div>
              )}

              <button onClick={() => { setFile(null); setResult(null); setStep('idle'); setSavedSetId(null); setError(''); }} className="btn-ghost" style={{ width: '100%', justifyContent: 'center', padding: '9px 0', fontSize: 13 }}>
                Weitere Datei hochladen
              </button>
            </div>
          )}

          {/* Process button */}
          {canProcess && (
            <button onClick={handleProcess} className="btn-primary" style={{ marginTop: 18, width: '100%', justifyContent: 'center', padding: '13px 0', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', fontSize: 14 }}>
              <Icons.Sparkles size={14}/> Mit Flow verarbeiten
              <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.8 }}>~10 Sek</span>
            </button>
          )}
        </div>
      )}

      {/* Recent documents */}
      {recentDocs.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Zuletzt hochgeladen</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recentDocs.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'white', borderRadius: 10, border: '1px solid rgba(15,23,42,0.05)' }}>
                <Icons.Doc size={14}/>
                <span style={{ fontSize: 13, color: '#0f172a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                {r.ai_processed && <span style={{ fontSize: 11, color: '#059669', background: '#d1fae5', padding: '2px 7px', borderRadius: 4, flexShrink: 0 }}>KI</span>}
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
const Sidebar = ({ user, profile, sets, active, onNav, onNewSet, onSignOut }) => {
  const folders = [...new Set((sets || []).map(s => s.folder).filter(Boolean))];
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Nutzer';

  const navItems = [
    { id: 'home', label: 'Alle Lernsets', count: sets ? sets.length : 0, icon: <Icons.Cards size={15}/> },
    { id: 'docs', label: 'Dokumente', count: null, icon: <Icons.Doc size={15}/> },
    { id: 'fav', label: 'Favoriten', count: 0, icon: <Icons.Star size={15}/> },
    { id: 'shared', label: 'Geteilt mit mir', count: 0, icon: <Icons.Users size={15}/> },
  ];

  return (
    <aside style={{
      width: 240, flexShrink: 0,
      margin: '14px 0 14px 14px',
      background: 'white', borderRadius: 18,
      border: '1px solid rgba(15,23,42,0.06)',
      boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.04)',
      padding: '20px 16px',
      display: 'flex', flexDirection: 'column', gap: 20,
      height: 'calc(100vh - 28px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 4px' }}>
        <Icons.Logo size={26}/>
        <div style={{ fontFamily: 'Caveat', fontSize: 24, fontWeight: 600, color: '#0f172a' }}>StudyFlow</div>
      </div>

      <button onClick={onNewSet} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '9px 14px', fontSize: 13 }}>
        <Icons.Plus size={14}/> Neues Lernset
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, padding: '0 8px' }}>Bibliothek</div>
        {navItems.map(item => {
          const isActive = active === item.id || (active === 'cards' && item.id === 'home');
          return (
            <div key={item.id} onClick={() => onNav(item.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '7px 10px', borderRadius: 8,
              background: isActive ? '#f1f5f9' : 'transparent',
              color: isActive ? '#0f172a' : '#475569',
              fontSize: 13, fontWeight: isActive ? 500 : 400,
              cursor: 'pointer', transition: 'background 0.1s',
            }}>
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

      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid rgba(15,23,42,0.06)', paddingTop: 14 }}>
        <Avatar name={displayName} color="#6366f1" size={30}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{profile?.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}</div>
        </div>
        <button onClick={onSignOut} title="Abmelden" style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
          <Icons.Settings size={15}/>
        </button>
      </div>
    </aside>
  );
};

// ─── TopBar ──────────────────────────────────────────────────
const TopBar = ({ search, onSearch }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
    <div style={{ flex: 1, maxWidth: 380, position: 'relative' }}>
      <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
        <Icons.Search size={15}/>
      </div>
      <input
        className="input-paper"
        placeholder="Suchen…"
        value={search}
        onChange={e => onSearch(e.target.value)}
        style={{ paddingLeft: 36, background: 'white', padding: '8px 12px 8px 36px', fontSize: 13 }}
      />
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button style={{ background: 'white', border: '1px solid #e2e8f0', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: 'inherit' }}>
        🔥 —
      </button>
      <button style={{ background: 'white', border: '1px solid #e2e8f0', padding: 7, borderRadius: 8, cursor: 'pointer', color: '#475569', display: 'flex' }}>
        <Icons.Bell size={15}/>
      </button>
    </div>
  </div>
);

// ─── Set Row ─────────────────────────────────────────────────
const SetRow = ({ set, onDelete }) => {
  const pct = set.total_cards ? Math.round((set.mastered_cards / set.total_cards) * 100) : 0;
  const isDraft = set.total_cards === 0;

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`"${set.title}" wirklich löschen?`)) return;
    await window.sb.from('study_sets').delete().eq('id', set.id);
    onDelete(set.id);
  };

  const lastStudy = set.updated_at
    ? (() => {
        const diff = Date.now() - new Date(set.updated_at).getTime();
        const h = Math.floor(diff / 3600000);
        if (h < 1) return 'Gerade eben';
        if (h < 24) return `vor ${h} Std.`;
        const d = Math.floor(h / 24);
        if (d === 1) return 'Gestern';
        return `vor ${d} T.`;
      })()
    : '—';

  return (
    <a href={`lernset.html?id=${set.id}`} style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) 110px 90px 70px 80px',
      alignItems: 'center', gap: 14,
      padding: '10px 14px', background: 'white',
      borderRadius: 10, border: '1px solid rgba(15,23,42,0.05)',
      transition: 'border-color 0.15s, background 0.15s', textDecoration: 'none',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#fafbfc'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(15,23,42,0.05)'; e.currentTarget.style.background = 'white'; }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 16 }}>{set.emoji || '📚'}</span>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{set.title}</div>
          {!isDraft && pct === 100 && <span style={{ fontSize: 10, color: '#059669', background: '#d1fae5', padding: '1px 6px', borderRadius: 4, fontWeight: 500, flexShrink: 0 }}>Fertig</span>}
          {isDraft && <span style={{ fontSize: 10, color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, fontWeight: 500, flexShrink: 0 }}>Entwurf</span>}
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {set.total_cards} Karten <span style={{ color: '#cbd5e1' }}>·</span> {lastStudy}
        </div>
      </div>
      <div>
        {!isDraft ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 3 }}>
              <span>{pct}%</span><span>{set.mastered_cards}/{set.total_cards}</span>
            </div>
            <div style={{ height: 4, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: '#0f172a', borderRadius: 999 }}></div>
            </div>
          </div>
        ) : <div style={{ fontSize: 11.5, color: '#94a3b8' }}>—</div>}
      </div>
      <div style={{ fontSize: 12, color: '#64748b' }}>
        {set.due_cards > 0 ? <span style={{ color: '#dc2626', fontWeight: 500 }}>{set.due_cards} fällig</span> : <span style={{ color: '#94a3b8' }}>keine fällig</span>}
      </div>
      <div><div style={{ fontSize: 11.5, color: '#cbd5e1' }}>Nur ich</div></div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
        <a href={`lern-modus.html?id=${set.id}`} onClick={e => e.stopPropagation()} style={{
          padding: '5px 10px', background: '#0f172a', color: 'white',
          border: 'none', borderRadius: 6, fontSize: 11.5, fontFamily: 'inherit',
          cursor: 'pointer', fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center',
        }}>Lernen</a>
        <button onClick={handleDelete} style={{ padding: 5, background: 'none', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
          <Icons.MoreH size={14}/>
        </button>
      </div>
    </a>
  );
};

// ─── Stats ───────────────────────────────────────────────────
const StatsRow = ({ stats }) => {
  const items = [
    { label: 'Fällig heute', value: stats.dueToday || '0', sub: 'Karten' },
    { label: 'Diese Woche', value: stats.weekReviews || '0', sub: 'Karten geübt' },
    { label: 'Gemeistert', value: stats.masteryPct || '0%', sub: 'aller Karten' },
    { label: 'Lernsets', value: stats.totalSets || '0', sub: 'gesamt' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
      {items.map(s => (
        <div key={s.label} style={{ background: 'white', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(15,23,42,0.05)' }}>
          <div style={{ fontSize: 11, color: '#64748b' }}>{s.label}</div>
          <div style={{ fontFamily: 'Instrument Sans', fontSize: 22, fontWeight: 600, color: '#0f172a', marginTop: 2, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
};

// ─── Empty State ─────────────────────────────────────────────
const EmptyState = ({ onNewSet }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16, color: '#94a3b8', padding: 40 }}>
    <div style={{ fontSize: 48 }}>📚</div>
    <div style={{ fontFamily: 'Caveat', fontSize: 24, color: '#64748b' }}>Noch keine Lernsets</div>
    <div style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center', maxWidth: 300 }}>Erstelle dein erstes Lernset oder lade ein Dokument hoch, um loszulegen.</div>
    <button onClick={onNewSet} className="btn-primary" style={{ padding: '10px 20px' }}>
      <Icons.Plus size={14}/> Erstes Lernset erstellen
    </button>
  </div>
);

// ─── Dashboard ───────────────────────────────────────────────
const Dashboard = () => {
  const [active, setActive] = useState('home');
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
    const { data: rawSets } = await window.sb
      .from('study_sets')
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
    const masteryPct = allCards.length ? Math.round((mastered / allCards.length) * 100) + '%' : '0%';

    const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const { count: weekReviews } = await window.sb.from('card_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('reviewed_at', weekAgo);

    setStats({ dueToday, weekReviews: weekReviews || 0, masteryPct, totalSets: enriched.length });
  };

  const handleSignOut = async () => {
    await window.sb.auth.signOut();
    window.location.href = 'login.html';
  };

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

  const showDocs = active === 'docs';
  const showSets = !showDocs;

  if (loading) return (
    <div className="dot-paper" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'Caveat', fontSize: 24, color: '#64748b' }}>Lädt…</div>
    </div>
  );

  return (
    <div className="dot-paper" style={{ height: '100vh', overflow: 'hidden', display: 'flex' }}>
      <Sidebar
        user={user} profile={profile} sets={sets}
        active={active} onNav={setActive}
        onNewSet={() => setShowModal(true)} onSignOut={handleSignOut}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '18px 22px 14px', minWidth: 0, gap: 16, overflow: 'hidden' }}>
        <TopBar search={search} onSearch={setSearch}/>

        {showDocs ? (
          <DocsPanel userId={user?.id} onSetCreated={handleSetCreated}/>
        ) : (
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
                    {[{ k: 'all', l: 'Alle' }, { k: 'due', l: 'Fällig' }].map(t => (
                      <button key={t.k} onClick={() => setFilter(t.k)} style={{
                        padding: '4px 10px', background: filter === t.k ? 'white' : 'transparent',
                        border: 'none', borderRadius: 5, fontSize: 11.5,
                        color: filter === t.k ? '#0f172a' : '#64748b',
                        fontWeight: filter === t.k ? 500 : 400,
                        cursor: 'pointer', fontFamily: 'inherit',
                        boxShadow: filter === t.k ? '0 1px 2px rgba(15,23,42,0.08)' : 'none',
                      }}>{t.l}</button>
                    ))}
                  </div>
                </div>
              </div>

              {filteredSets.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) 110px 90px 70px 80px',
                  gap: 14, padding: '0 14px',
                  fontSize: 10.5, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>
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
        <Dock items={DOCK_ITEMS} active={active} onSelect={setActive}/>
      </div>

      <AIAssistant/>

      {showModal && (
        <CreateSetModal
          userId={user?.id}
          onClose={() => setShowModal(false)}
          onCreated={handleSetCreated}
        />
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Dashboard/>);
