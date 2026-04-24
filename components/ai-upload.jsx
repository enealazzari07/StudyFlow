// StudyFlow — AI Upload (echte Datei-Uploads zu Supabase Storage)
const { useState, useEffect, useRef } = React;

const STAGES = [
  { key: 'idle', label: 'Bereit' },
  { key: 'uploading', label: 'Lade hoch', pct: 15 },
  { key: 'reading', label: 'Lese Dokument', pct: 40 },
  { key: 'analyzing', label: 'Analysiere Themen', pct: 70 },
  { key: 'generating', label: 'Erstelle Karten', pct: 90 },
  { key: 'done', label: 'Fertig!', pct: 100 },
];

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

const AIUpload = () => {
  const [file, setFile] = useState(null);
  const [stage, setStage] = useState('idle');
  const [dragging, setDragging] = useState(false);
  const [output, setOutput] = useState({ summary: true, cards: 20, quiz: true });
  const [noSummaryMode, setNoSummaryMode] = useState(false);
  const params = new URLSearchParams(window.location.search);
  const paramNoSummary = params.get('noSummary') === '1' || params.get('noSummary') === 'true';
  const paramTargetSetId = params.get('targetSetId') || null;
  const [userId, setUserId] = useState(null);
  const [recentDocs, setRecentDocs] = useState([]);
  const [error, setError] = useState('');
  const [uploadedDoc, setUploadedDoc] = useState(null);
  const [generatedCards, setGeneratedCards] = useState([]);
  const [saving, setSaving] = useState(false);
  const [rawAIOutput, setRawAIOutput] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      const session = await window.requireAuth();
      if (!session) return;
      setUserId(session.user.id);
      loadRecentDocs(session.user.id);
    })();
    // respect URL params for in-set scanning: disable summary when requested
    if (paramNoSummary) {
      setNoSummaryMode(true);
      setOutput(o => ({ ...o, summary: false }));
    }
  }, []);

  const loadRecentDocs = async (uid) => {
    const { data } = await window.sb.from('documents')
      .select('*')
      .eq('owner_id', uid)
      .order('created_at', { ascending: false })
      .limit(5);
    setRecentDocs(data || []);
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setStage('idle');
    setError('');
    setUploadedDoc(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const handleInputChange = (e) => {
    const f = e.target.files[0];
    if (f) handleFileSelect(f);
  };

  const start = async () => {
    if (!file || !userId) return;
    setError('');

    try {
      // Stage 1: Upload
      setStage('uploading');
      const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${userId}/${Date.now()}_${safeFilename}`;

      const { error: uploadErr } = await window.sb.storage
        .from('documents')
        .upload(path, file, { contentType: file.type });

      if (uploadErr) throw new Error(uploadErr.message);

      // Save document record
      const { data: doc } = await window.sb.from('documents').insert({
        owner_id: userId,
        name: file.name,
        file_path: path,
        file_size: file.size,
        mime_type: file.type,
      }).select().single();

      if (doc) setUploadedDoc(doc);

      // Simulate AI processing stages
      setStage('reading');
      await new Promise(r => setTimeout(r, 1400));
      setStage('analyzing');
      await new Promise(r => setTimeout(r, 1600));
      setStage('generating');
      await new Promise(r => setTimeout(r, 1500));

      // Mark as AI processed
      if (doc) {
        await window.sb.from('documents').update({ ai_processed: true }).eq('id', doc.id);
      }

      setStage('done');
      loadRecentDocs(userId);
      // If opened from a Lernset (targetSetId), prepare editable placeholders for generated cards
      if (paramTargetSetId) {
        const n = output.cards || 0;
        const placeholders = Array.from({ length: n }, (_, i) => ({ front: `Frage ${i + 1}`, back: `Antwort ${i + 1}` }));
        setGeneratedCards(placeholders);
      }
    } catch (err) {
      setError(err.message || 'Fehler beim Upload');
      setStage('idle');
    }
  };

  const currentStage = STAGES.find(s => s.key === stage) || STAGES[0];
  const isRunning = stage !== 'idle' && stage !== 'done';

  return (
    <div className="dot-paper" style={{ minHeight: '100vh' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', background: 'white', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
        <a href="dashboard.html" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13 }}>
          <Icons.ArrowLeft size={14}/> Dashboard
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: '#0f172a' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #818cf8)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icons.Sparkles size={14}/>
          </div>
          Flow AI
        </div>
        <div style={{ fontSize: 12, color: '#64748b' }}>{recentDocs.length} Dokumente</div>
      </header>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '48px 32px 80px', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 36, position: 'relative' }}>
          <div style={{ position: 'absolute', top: -10, left: 60, transform: 'rotate(-12deg)' }}>
            <Doodles.Sparkle color="#f59e0b" size={18}/>
          </div>
          <div style={{ position: 'absolute', top: 10, right: 80, transform: 'rotate(8deg)' }}>
            <Doodles.Star color="#6366f1" size={22}/>
          </div>
          <h1 style={{ fontFamily: 'Instrument Sans', fontSize: 36, fontWeight: 600, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Lade dein Skript hoch.
          </h1>
          <div style={{ fontFamily: 'Caveat', fontSize: 32, color: '#6366f1', fontWeight: 600, marginTop: 4 }}>
            Flow macht den Rest.
          </div>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 10, maxWidth: 480, marginInline: 'auto' }}>
            PDF, DOCX, Markdown oder einfach Text einfügen — Flow erstellt Karteikarten, Zusammenfassung und Quiz in ~8 Sekunden.
          </p>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#991b1b', marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />

        {/* Dropzone or file preview */}
        {!file ? (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? '#6366f1' : '#cbd5e1'}`,
              borderRadius: 20,
              padding: 48,
              textAlign: 'center',
              background: dragging ? '#eef2ff' : 'white',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ width: 72, height: 72, borderRadius: 16, background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <Icons.Upload size={32}/>
            </div>
            <div style={{ fontFamily: 'Instrument Sans', fontSize: 18, fontWeight: 600, color: '#0f172a', marginTop: 16 }}>
              Datei hierher ziehen
            </div>
            <div style={{ fontSize: 13.5, color: '#64748b', marginTop: 6 }}>
              oder <span style={{ color: '#4f46e5', fontWeight: 500 }}>durchsuchen</span>
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 16 }}>
              PDF · DOCX · MD · TXT · max. 50 MB
            </div>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: 20, padding: 24, border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 58, background: '#eef2ff', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', flexShrink: 0 }}>
                <Icons.Doc size={24}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 500, color: '#0f172a' }}>{file.name}</div>
                <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 3 }}>{formatFileSize(file.size)}</div>
              </div>
              {!isRunning && stage !== 'done' && (
                <button onClick={() => { setFile(null); setStage('idle'); }} style={{ background: 'none', border: 'none', padding: 8, color: '#94a3b8', cursor: 'pointer' }}>
                  <Icons.X size={18}/>
                </button>
              )}
              {stage === 'done' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: '#d1fae5', color: '#065f46', fontSize: 12, fontWeight: 500 }}>
                  <Icons.Check size={12}/> Fertig
                </div>
              )}
            </div>

            {isRunning && (
              <div style={{ marginTop: 24, padding: 18, background: '#fafaf7', borderRadius: 12, border: '1px solid rgba(15,23,42,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="float" style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #818cf8)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icons.Sparkles size={14}/>
                  </div>
                  <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{currentStage.label}…</div>
                </div>
                <div style={{ height: 4, background: '#e2e8f0', borderRadius: 999, marginTop: 14, overflow: 'hidden' }}>
                  <div style={{ width: `${currentStage.pct}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #818cf8)', transition: 'width 0.6s ease' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11.5, color: '#94a3b8' }}>
                  {STAGES.slice(1, 5).map(s => (
                    <span key={s.key} style={{ color: stage === s.key ? '#4f46e5' : ((currentStage.pct || 0) >= s.pct ? '#10b981' : '#cbd5e1'), fontWeight: 500 }}>
                      {(currentStage.pct || 0) >= s.pct ? <span style={{ display: 'inline-flex', marginRight: 4 }}><Icons.Check size={12}/></span> : null}{s.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {stage === 'done' && (
              <div style={{ marginTop: 24, padding: 20, background: 'linear-gradient(135deg, #eef2ff, #f5f3ff)', borderRadius: 14, border: '1px solid #c7d2fe' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#4f46e5', fontWeight: 600, letterSpacing: '0.04em' }}>
                  <Icons.Sparkles size={14}/> FLOW HAT ERSTELLT
                </div>
                <div style={{ fontFamily: 'Caveat', fontSize: 26, fontWeight: 600, color: '#0f172a', marginTop: 4, lineHeight: 1.15 }}>
                  Dein Dokument ist hochgeladen
                </div>
                <div style={{ fontSize: 13, color: '#475569', marginTop: 8 }}>
                  Das Dokument wurde gespeichert und ist bereit für die Verarbeitung.
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                  <a href="dashboard.html" className="btn-primary" style={{ padding: '10px 18px', flex: 1, justifyContent: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icons.Home size={14}/> Dashboard
                  </a>
                  <button onClick={() => { setFile(null); setStage('idle'); setUploadedDoc(null); }} className="btn-ghost" style={{ padding: '10px 16px' }}>Weiteres hochladen</button>
                </div>

                  {/* If targetSetId provided, show editable generated cards and option to save into Lernset */}
                  {paramTargetSetId && (
                    <div style={{ marginTop: 18, background: 'white', padding: 14, borderRadius: 10, border: '1px solid rgba(15,23,42,0.04)' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a', marginBottom: 10 }}>Vorschau: Karteikarten für Lernset speichern</div>

                              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>Rohdaten (kann AI-Ausgabe oder kopierter Text sein). Verwende "Analysieren" um automatische Karten zu erzeugen.</div>
                              <textarea value={rawAIOutput || generatedCards.map((g,i)=>`Frage ${i+1}\n${g.back}`).join('\n\n')} onChange={e=>setRawAIOutput(e.target.value)} style={{ width: '100%', minHeight: 120, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 10 }} />

                              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                                <button onClick={() => {
                                  // parse rawAIOutput into generatedCards
                                  const parsed = parseRawToCards(rawAIOutput || generatedCards.map((g)=>`${g.front}\n${g.back}`).join('\n\n'));
                                  if (parsed.length === 0) return alert('Keine Karten gefunden — bitte Format prüfen.');
                                  setGeneratedCards(parsed);
                                }} className="btn-primary" style={{ padding: '8px 12px' }}>Analysieren & in Karten umwandeln</button>
                                <button onClick={() => { setRawAIOutput(''); setGeneratedCards([]); }} className="btn-ghost" style={{ padding: '8px 12px' }}>Zurücksetzen</button>
                              </div>

                              {generatedCards.length === 0 ? (
                                <div style={{ fontSize: 13, color: '#64748b' }}>Keine generierten Karten verfügbar. Nutze den Analyzer oben.</div>
                              ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {generatedCards.map((g, idx) => (
                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'start' }}>
                              <textarea value={g.front} onChange={e => {
                                const copy = [...generatedCards]; copy[idx] = { ...copy[idx], front: e.target.value }; setGeneratedCards(copy);
                              }} style={{ padding: 8, borderRadius: 8, border: '1px solid #e2e8f0', minHeight: 56 }} />
                              <textarea value={g.back} onChange={e => {
                                const copy = [...generatedCards]; copy[idx] = { ...copy[idx], back: e.target.value }; setGeneratedCards(copy);
                              }} style={{ padding: 8, borderRadius: 8, border: '1px solid #e2e8f0', minHeight: 56 }} />
                              <div>
                                <button onClick={() => {
                                  const copy = generatedCards.filter((_, i) => i !== idx); setGeneratedCards(copy);
                                }} className="btn-ghost" style={{ padding: '8px 10px' }} title="Entfernen">Entfernen</button>
                              </div>
                            </div>
                          ))}

                          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            <button onClick={async () => {
                              if (generatedCards.length === 0) return;
                              setSaving(true);
                              try {
                                const rows = generatedCards.map(c => ({ set_id: paramTargetSetId, front: c.front, back: c.back }));
                                const { data, error: insertErr } = await window.sb.from('cards').insert(rows);
                                if (insertErr) throw new Error(insertErr.message || 'Fehler beim Speichern');
                                // redirect back to the Lernset
                                window.location.href = `lernset.html?id=${encodeURIComponent(paramTargetSetId)}`;
                              } catch (err) {
                                alert(err.message || 'Fehler beim Speichern der Karten');
                              } finally {
                                setSaving(false);
                              }
                            }} className="btn-primary" style={{ padding: '10px 14px' }} disabled={saving}>
                              {saving ? 'Speichert…' : 'Karten in Lernset speichern'}
                            </button>
                            <button onClick={() => { setGeneratedCards([]); }} className="btn-ghost" style={{ padding: '10px 14px' }}>Abbrechen</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            )}

            {stage === 'idle' && (
              <>
                <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(15,23,42,0.06)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 14 }}>Was soll Flow erstellen?</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { key: 'summary', label: 'Zusammenfassung', sub: 'Kompakte Übersicht der Kernthemen', icon: <Icons.Doc size={16}/> },
                      { key: 'quiz', label: 'Quizfragen', sub: '~8 Multiple-Choice-Fragen', icon: <Icons.Brain size={16}/> },
                    ].map(o => (
                      <label key={o.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#fafaf7', borderRadius: 10, cursor: (o.key === 'summary' && noSummaryMode) ? 'default' : 'pointer', border: '1px solid rgba(15,23,42,0.04)', opacity: (o.key === 'summary' && noSummaryMode) ? 0.6 : 1 }}>
                        <div style={{ color: '#6366f1' }}>{o.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 500, color: '#0f172a' }}>{o.label}</div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{o.sub}</div>
                        </div>
                        <div style={{
                          width: 36, height: 20, borderRadius: 999,
                          background: output[o.key] ? '#6366f1' : '#cbd5e1',
                          position: 'relative', transition: 'background 0.2s',
                          cursor: (o.key === 'summary' && noSummaryMode) ? 'default' : 'pointer',
                        }} onClick={() => { if (!(o.key === 'summary' && noSummaryMode)) setOutput({ ...output, [o.key]: !output[o.key] }); }}>
                          <div style={{
                            position: 'absolute', top: 2, left: output[o.key] ? 18 : 2,
                            width: 16, height: 16, borderRadius: '50%',
                            background: 'white', transition: 'left 0.2s',
                            boxShadow: '0 1px 2px rgba(15,23,42,0.15)',
                          }}></div>
                        </div>
                      </label>
                    ))}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#fafaf7', borderRadius: 10, border: '1px solid rgba(15,23,42,0.04)' }}>
                      <div style={{ color: '#6366f1' }}><Icons.Cards size={16}/></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, color: '#0f172a' }}>Karteikarten</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>Frage-Antwort-Paare für Spaced Repetition</div>
                      </div>
                      <input type="number" value={output.cards} onChange={e => setOutput({...output, cards: parseInt(e.target.value) || 0})} style={{ width: 60, padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, textAlign: 'center', fontFamily: 'inherit' }}/>
                      <span style={{ fontSize: 12, color: '#64748b' }}>Karten</span>
                    </div>
                  </div>
                </div>

                <button onClick={start} className="btn-primary" style={{ marginTop: 20, width: '100%', justifyContent: 'center', padding: '13px 20px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                  <Icons.Sparkles size={14}/> Hochladen & verarbeiten
                  <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.85 }}>~8 Sek</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Recent uploads */}
        <div style={{ marginTop: 40 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Zuletzt verarbeitet</div>
          {recentDocs.length === 0 ? (
            <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>Noch keine Dokumente hochgeladen</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentDocs.map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'white', borderRadius: 10, border: '1px solid rgba(15,23,42,0.04)' }}>
                  <Icons.Doc size={14}/>
                  <span style={{ fontSize: 13, color: '#0f172a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                  {r.ai_processed && <span style={{ fontSize: 11, color: '#059669', background: '#d1fae5', padding: '2px 7px', borderRadius: 4 }}>KI</span>}
                  <span style={{ fontSize: 12, color: '#64748b' }}>{formatFileSize(r.file_size || 0)}</span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{relativeTime(r.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<AIUpload/>);

// --- Helper: parse raw AI/text into card pairs ---
function parseRawToCards(text) {
  if (!text || !text.trim()) return [];
  // Normalize line endings
  const t = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

  // Try CSV-like: lines with separator ';' or '\t' or '|'
  const lines = t.split('\n');
  const csvCandidates = lines.filter(l => /;|\t|\|/.test(l));
  if (csvCandidates.length >= 1) {
    const parsed = csvCandidates.map(l => {
      const sep = l.includes(';') ? ';' : (l.includes('\t') ? '\t' : '|');
      const [q, a] = l.split(sep).map(s => s.trim());
      return q && a ? { front: q, back: a } : null;
    }).filter(Boolean);
    if (parsed.length) return parsed;
  }

  // Split by double newlines into blocks
  const blocks = t.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
  const pairs = [];
  for (const block of blocks) {
    // If block contains Q: and A:
    if (/\bQ[:]?\b/i.test(block) && /\bA[:]?\b/i.test(block)) {
      const qMatch = block.match(/Q[:]?\s*(.*?)\s*(?=A[:]?)/is);
      const aMatch = block.match(/A[:]?\s*([\s\S]*)/i);
      const q = qMatch ? qMatch[1].trim() : '';
      const a = aMatch ? aMatch[1].trim() : '';
      if (q || a) pairs.push({ front: q || block, back: a || '' });
      continue;
    }

    // Otherwise, split by first newline: first line question, rest answer
    const blines = block.split('\n').map(s=>s.trim()).filter(Boolean);
    if (blines.length === 1) {
      // single-line block, try split by ' - ' or ' — ' or ':'
      const sepMatch = block.match(/\s[-–—:]\s/);
      if (sepMatch) {
        const sep = sepMatch[0];
        const [q,a] = block.split(sep).map(s=>s.trim());
        if (q && a) { pairs.push({ front: q, back: a }); continue; }
      }
      // as fallback, treat as front with empty back
      pairs.push({ front: blines[0], back: '' });
    } else {
      const q = blines[0];
      const a = blines.slice(1).join(' ');
      pairs.push({ front: q, back: a });
    }
  }

  // If no pairs found but lines are even, pair line-by-line
  if (pairs.length === 0 && lines.length >= 2) {
    const out = [];
    for (let i=0;i<lines.length;i+=2) {
      const q = lines[i].trim();
      const a = (lines[i+1]||'').trim();
      if (q) out.push({ front: q, back: a });
    }
    if (out.length) return out;
  }

  return pairs;
}
