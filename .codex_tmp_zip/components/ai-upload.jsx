// StudyFlow — AI Upload
const { useState } = React;

const STAGES = [
  { key: 'idle', label: 'Bereit' },
  { key: 'reading', label: 'Lese Dokument', pct: 25 },
  { key: 'analyzing', label: 'Analysiere Themen', pct: 55 },
  { key: 'generating', label: 'Erstelle Karten', pct: 85 },
  { key: 'done', label: 'Fertig!', pct: 100 },
];

const AIUpload = () => {
  const [file, setFile] = useState(null);
  const [stage, setStage] = useState('idle');
  const [dragging, setDragging] = useState(false);
  const [output, setOutput] = useState({ summary: true, cards: 20, quiz: true });

  const start = () => {
    setStage('reading');
    setTimeout(() => setStage('analyzing'), 1200);
    setTimeout(() => setStage('generating'), 2800);
    setTimeout(() => setStage('done'), 4400);
  };

  const drop = (e) => {
    e.preventDefault();
    setDragging(false);
    setFile({ name: 'Mikroökonomie_VL12_Monopole.pdf', pages: 32, size: '2.4 MB' });
  };

  const currentStage = STAGES.find(s => s.key === stage);
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
        <div style={{ fontSize: 12, color: '#64748b' }}>42 / 100 AI-Credits übrig</div>
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

        {/* Dropzone or file preview */}
        {!file ? (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={drop}
            onClick={() => setFile({ name: 'Mikroökonomie_VL12_Monopole.pdf', pages: 32, size: '2.4 MB' })}
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
              <div style={{ width: 48, height: 58, background: '#eef2ff', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                <Icons.Doc size={24}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 500, color: '#0f172a' }}>{file.name}</div>
                <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 3 }}>{file.pages} Seiten · {file.size}</div>
              </div>
              {!isRunning && stage !== 'done' && (
                <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', padding: 8, color: '#94a3b8', cursor: 'pointer' }}>
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
                  {STAGES.slice(1, 4).map(s => (
                    <span key={s.key} style={{ color: stage === s.key ? '#4f46e5' : (currentStage.pct >= s.pct ? '#10b981' : '#cbd5e1'), fontWeight: 500 }}>
                      {currentStage.pct >= s.pct ? '✓ ' : ''}{s.label}
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
                  Dein Lernset ist bereit 🎉
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 16 }}>
                  {[
                    { n: 20, label: 'Karteikarten', icon: <Icons.Cards size={16}/> },
                    { n: 8, label: 'Quizfragen', icon: <Icons.Brain size={16}/> },
                    { n: 3, label: 'Seiten Zsf.', icon: <Icons.Doc size={16}/> },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'white', borderRadius: 10, padding: 12, border: '1px solid rgba(99,102,241,0.15)' }}>
                      <div style={{ color: '#6366f1' }}>{s.icon}</div>
                      <div style={{ fontFamily: 'Instrument Sans', fontSize: 22, fontWeight: 600, color: '#0f172a', marginTop: 6 }}>{s.n}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                  <a href="lernset.html" className="btn-primary" style={{ padding: '10px 18px', flex: 1, justifyContent: 'center' }}>
                    <Icons.ArrowRight size={14}/> Zum Lernset
                  </a>
                  <button className="btn-ghost" style={{ padding: '10px 16px' }}>Bearbeiten</button>
                </div>
              </div>
            )}

            {stage === 'idle' && (
              <>
                {/* Options */}
                <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(15,23,42,0.06)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 14 }}>Was soll Flow erstellen?</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { key: 'summary', label: 'Zusammenfassung', sub: 'Kompakte Übersicht der Kernthemen', icon: <Icons.Doc size={16}/> },
                      { key: 'quiz', label: 'Quizfragen', sub: '~8 Multiple-Choice-Fragen', icon: <Icons.Brain size={16}/> },
                    ].map(o => (
                      <label key={o.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#fafaf7', borderRadius: 10, cursor: 'pointer', border: '1px solid rgba(15,23,42,0.04)' }}>
                        <div style={{ color: '#6366f1' }}>{o.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 500, color: '#0f172a' }}>{o.label}</div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{o.sub}</div>
                        </div>
                        <div style={{
                          width: 36, height: 20, borderRadius: 999,
                          background: output[o.key] ? '#6366f1' : '#cbd5e1',
                          position: 'relative', transition: 'background 0.2s',
                        }} onClick={() => setOutput({ ...output, [o.key]: !output[o.key] })}>
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
                  <Icons.Sparkles size={14}/> Mit Flow verarbeiten
                  <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.85 }}>~8 Sek</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Recent uploads */}
        <div style={{ marginTop: 40 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Zuletzt verarbeitet</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { name: 'Stats_Kapitel_5.pdf', cards: 18, when: 'vor 2 Std.' },
              { name: 'Marketing_Skript_K3.pdf', cards: 32, when: 'gestern' },
              { name: 'VL06_Konsumentenrente.pdf', cards: 14, when: 'vor 3 T.' },
            ].map(r => (
              <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'white', borderRadius: 10, border: '1px solid rgba(15,23,42,0.04)' }}>
                <Icons.Doc size={14}/>
                <span style={{ fontSize: 13, color: '#0f172a', flex: 1 }}>{r.name}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{r.cards} Karten</span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{r.when}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<AIUpload/>);
