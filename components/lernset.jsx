// StudyFlow — Lernset Detail
const { useState, useEffect } = React;

const MASTERY_STYLE = {
  mastered: { color: '#10b981', bg: '#d1fae5', label: 'Gemeistert' },
  good:     { color: '#10b981', bg: '#d1fae5', label: 'Gemeistert' },
  learning: { color: '#f59e0b', bg: '#fef3c7', label: 'Am lernen' },
  new:      { color: '#64748b', bg: '#f1f5f9', label: 'Neu' },
};

const setId = new URLSearchParams(window.location.search).get('id');

// ─── Add Card Form ────────────────────────────────────────────
const AddCardForm = ({ setId, onAdded }) => {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    setLoading(true);
    const { data, error } = await window.sb.from('cards').insert({
      set_id: setId,
      front: front.trim(),
      back: back.trim(),
    }).select().single();
    setLoading(false);
    if (!error && data) {
      onAdded(data);
      setFront('');
      setBack('');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 10, background: 'white', border: '1.5px dashed #818cf8', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#6366f1', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Neue Karte</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Frage</div>
          <textarea
            value={front}
            onChange={e => setFront(e.target.value)}
            placeholder="Frage eingeben…"
            required
            rows={3}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontFamily: 'Caveat', fontSize: 18, color: '#0f172a', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
          />
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Antwort</div>
          <textarea
            value={back}
            onChange={e => setBack(e.target.value)}
            placeholder="Antwort eingeben…"
            required
            rows={3}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#334155', resize: 'vertical', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={loading || !front.trim() || !back.trim()} className="btn-primary" style={{ padding: '8px 18px', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Speichert…' : <><Icons.Plus size={13}/> Karte hinzufügen</>}
        </button>
      </div>
    </form>
  );
};

// ─── Card Row ────────────────────────────────────────────────
const CardRow = ({ card, index, focused, onFocus, onDelete }) => {
  const ms = MASTERY_STYLE[card.mastery_level] || MASTERY_STYLE.new;

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm('Karte löschen?')) return;
    await window.sb.from('cards').delete().eq('id', card.id);
    onDelete(card.id);
  };

  return (
    <div
      onClick={onFocus}
      style={{
        background: 'white',
        border: focused ? '1.5px solid #818cf8' : '1px solid rgba(15,23,42,0.06)',
        borderRadius: 12,
        padding: 16,
        display: 'grid',
        gridTemplateColumns: '32px 1fr 1fr auto',
        gap: 16,
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: focused ? '0 0 0 4px rgba(129,140,248,0.1)' : 'none',
      }}
    >
      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#94a3b8' }}>{String(index + 1).padStart(2, '0')}</div>
      <div>
        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Frage</div>
        <div style={{ fontFamily: 'Caveat', fontSize: 20, color: '#0f172a', fontWeight: 500, lineHeight: 1.2, marginTop: 2 }}>{card.front}</div>
      </div>
      <div>
        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Antwort</div>
        <div style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.45, marginTop: 4 }}>{card.back}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ padding: '3px 9px', borderRadius: 999, background: ms.bg, color: ms.color, fontSize: 11, fontWeight: 500 }}>{ms.label}</span>
        <button onClick={handleDelete} style={{ background: 'none', border: 'none', padding: 6, borderRadius: 6, cursor: 'pointer', color: '#94a3b8' }}>
          <Icons.X size={14}/>
        </button>
      </div>
    </div>
  );
};

// ─── Cards List ───────────────────────────────────────────────
const CardsList = ({ cards, setCards, currentSetId }) => {
  const [focused, setFocused] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addHover, setAddHover] = useState(false);
  const [scanHover, setScanHover] = useState(false);

  const filtered = cards.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'good') return c.mastery_level === 'mastered' || c.mastery_level === 'good';
    return c.mastery_level === filter;
  });

  return (
    <section style={{ padding: '8px 32px 100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{ fontFamily: 'Instrument Sans', fontSize: 18, fontWeight: 600, color: '#0f172a', margin: 0 }}>Alle Karten</h2>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>· {cards.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 4, padding: 4, background: '#f1f5f9', borderRadius: 10 }}>
          {[
            { id: 'all', label: 'Alle' },
            { id: 'good', label: 'Gemeistert' },
            { id: 'learning', label: 'Am lernen' },
            { id: 'new', label: 'Neu' },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding: '6px 12px', fontSize: 12.5,
              background: filter === f.id ? 'white' : 'transparent',
              color: filter === f.id ? '#0f172a' : '#64748b',
              fontWeight: filter === f.id ? 500 : 400,
              border: 'none', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: filter === f.id ? '0 1px 2px rgba(15,23,42,0.08)' : 'none',
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((c, i) => (
          <CardRow
            key={c.id}
            card={c}
            index={i}
            focused={focused === c.id}
            onFocus={() => setFocused(c.id)}
            onDelete={(id) => setCards(prev => prev.filter(x => x.id !== id))}
          />
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontFamily: 'Caveat', fontSize: 20 }}>
            Keine Karten in dieser Kategorie
          </div>
        )}
      </div>

      {showAddForm ? (
        <AddCardForm
          setId={currentSetId}
          onAdded={(card) => {
            setCards(prev => [...prev, card]);
            setShowAddForm(false);
          }}
        />
      ) : (
        <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onMouseEnter={() => setAddHover(true)}
            onMouseLeave={() => setAddHover(false)}
            onClick={() => setShowAddForm(true)}
            style={{
              flex: 1, padding: 16,
              background: addHover ? '#f3f4f6' : 'transparent', border: '1.5px dashed #cbd5e1',
              borderRadius: 12, color: '#64748b', fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s',
            }}
          >
            <Icons.Plus size={16}/> Neue Karte hinzufügen
          </button>

          <a
            href={`ai-upload.html?targetSetId=${encodeURIComponent(setId)}&noSummary=1`}
            className="btn-ghost"
            onMouseEnter={() => setScanHover(true)}
            onMouseLeave={() => setScanHover(false)}
            style={{
              flex: 1, padding: 16,
              background: scanHover ? '#f3f4f6' : 'transparent', border: '1.5px dashed #cbd5e1',
              borderRadius: 12, color: '#64748b', fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer', textDecoration: 'none', fontFamily: 'inherit', transition: 'background 0.12s',
            }}
            title="Dokument hochladen und Karten direkt ins Set speichern"
          >
            <Icons.Upload size={13}/> Scann Upload
          </a>
        </div>
      )}
    </section>
  );
};

// ─── Main ─────────────────────────────────────────────────────
const LernsetDetail = () => {
  const [studySet, setStudySet] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);

  const toggleVisibility = async () => {
    if (togglingVisibility) return;
    setTogglingVisibility(true);
    const next = !isPublic;
    const { error } = await window.sb
      .from('study_sets')
      .update({ is_public: next })
      .eq('id', setId);
    if (!error) setIsPublic(next);
    setTogglingVisibility(false);
  };

  useEffect(() => {
    (async () => {
      const session = await window.requireAuth();
      if (!session) return;

      if (!setId) { setNotFound(true); setLoading(false); return; }

      const { data: s } = await window.sb
        .from('study_sets')
        .select('*')
        .eq('id', setId)
        .single();

      if (!s) { setNotFound(true); setLoading(false); return; }

      setStudySet(s);
      setIsPublic(!!s.is_public);
      document.title = `${s.title} — StudyFlow`;

      const { data: c } = await window.sb
        .from('cards')
        .select('*')
        .eq('set_id', setId)
        .order('created_at', { ascending: true });

      setCards(c || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <div className="dot-paper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'Caveat', fontSize: 24, color: '#64748b' }}>Lädt…</div>
    </div>
  );

  if (notFound) return (
    <div className="dot-paper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 64, height: 64, borderRadius: 18, background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(15,23,42,0.06)' }}>
        <Icons.X size={24}/>
      </div>
      <div style={{ fontFamily: 'Caveat', fontSize: 28, color: '#64748b' }}>Lernset nicht gefunden</div>
      <a href="dashboard.html" className="btn-primary" style={{ padding: '10px 20px' }}>Zum Dashboard</a>
    </div>
  );

  const now = new Date().toISOString();
  const mastered = cards.filter(c => c.mastery_level === 'mastered' || c.mastery_level === 'good').length;
  const learning = cards.filter(c => c.mastery_level === 'learning').length;
  const newCards = cards.filter(c => c.mastery_level === 'new').length;
  const due = cards.filter(c => c.next_review && c.next_review <= now).length;
  const pct = cards.length ? Math.round((mastered / cards.length) * 100) : 0;
  const masteredPct = cards.length ? Math.round((mastered / cards.length) * 100) : 0;
  const learningPct = cards.length ? Math.round((learning / cards.length) * 100) : 0;

  const DOCK_ITEMS = [
    { id: 'home', label: 'Start', icon: <Icons.Home size={22}/>, href: 'dashboard.html' },
    { id: 'cards', label: 'Lernsets', icon: <Icons.Cards size={22}/>, href: 'dashboard.html' },
    { id: 'docs', label: 'Dokumente', icon: <Icons.Doc size={22}/>, href: 'ai-upload.html' },
    { id: 'ai', label: 'Flow AI', icon: <Icons.Sparkles size={22}/>, href: 'ai-upload.html' },
    { id: 'stats', label: 'Fortschritt', icon: <Icons.Chart size={22}/> },
    { id: 'settings', label: 'Einstellungen', icon: <Icons.Settings size={22}/> },
  ];

  return (
    <div className="dot-paper" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', background: 'white', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="dashboard.html" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13 }}>
            <Icons.ArrowLeft size={14}/> Dashboard
          </a>
          <div style={{ height: 20, width: 1, background: '#e2e8f0' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b' }}>
            {studySet.folder && <><Icons.Folder size={14}/> {studySet.folder} <Icons.Chevron size={11}/></>}
            <span style={{ color: '#0f172a', fontWeight: 500 }}>{studySet.title}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={toggleVisibility}
            disabled={togglingVisibility}
            className="btn-ghost"
            title={isPublic ? 'Öffentlich — klicken um auf Privat umzustellen' : 'Privat — klicken um auf Öffentlich umzustellen'}
            style={{ padding: '7px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, opacity: togglingVisibility ? 0.6 : 1, transition: 'opacity 0.15s' }}
          >
            {isPublic ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                Öffentlich
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Privat
              </>
            )}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section style={{ padding: '36px 32px 24px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ maxWidth: 560 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 54, height: 54, borderRadius: 18, background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #c7d2fe', flexShrink: 0 }}>
                <Icons.Cards size={26}/>
              </div>
              <div>
                <h1 style={{ fontFamily: 'Instrument Sans', fontSize: 32, fontWeight: 600, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                  {studySet.title}
                </h1>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                  {cards.length} Karten · letzte Änderung {(() => {
                    const diff = Date.now() - new Date(studySet.updated_at || studySet.created_at).getTime();
                    const h = Math.floor(diff / 3600000);
                    if (h < 1) return 'gerade eben';
                    if (h < 24) return `vor ${h} Std.`;
                    return `vor ${Math.floor(h / 24)} T.`;
                  })()}
                </div>
              </div>
            </div>
            {studySet.description && (
              <p style={{ fontSize: 14, color: '#475569', marginTop: 16, lineHeight: 1.55 }}>
                {studySet.description}
              </p>
            )}
            {studySet.folder && (
              <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
                <span className="pill">{studySet.folder}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <a href={`lern-modus.html?id=${setId}`} className="btn-primary" style={{ padding: '12px 18px', fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icons.Play size={14}/> Jetzt lernen
              {due > 0 && <span style={{ marginLeft: 4, background: 'rgba(255,255,255,0.15)', padding: '1px 7px', borderRadius: 5, fontSize: 11 }}>{due} fällig</span>}
            </a>
          </div>
        </div>

        {/* Progress card */}
        <div style={{ marginTop: 28, background: 'white', border: '1px solid rgba(15,23,42,0.06)', borderRadius: 14, padding: 20, display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: 24, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Fortschritt</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
              <span style={{ fontFamily: 'Instrument Sans', fontSize: 28, fontWeight: 600, color: '#0f172a', letterSpacing: '-0.02em' }}>{pct}%</span>
              {pct >= 80 && <span style={{ fontFamily: 'Caveat', fontSize: 18, color: '#10b981', fontWeight: 600 }}>auf gutem Weg</span>}
            </div>
            <div style={{ height: 6, background: '#f1f5f9', borderRadius: 999, marginTop: 10, overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${masteredPct}%`, background: '#10b981' }}></div>
              <div style={{ width: `${learningPct}%`, background: '#f59e0b' }}></div>
            </div>
          </div>
          {[
            { n: mastered, label: 'Gemeistert', c: '#10b981' },
            { n: learning, label: 'Am lernen', c: '#f59e0b' },
            { n: newCards, label: 'Neu', c: '#64748b' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.c }}></span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{s.label}</span>
              </div>
              <div style={{ fontFamily: 'Instrument Sans', fontSize: 22, fontWeight: 600, color: '#0f172a', marginTop: 2 }}>{s.n}</div>
            </div>
          ))}
        </div>
      </section>

      <CardsList cards={cards} setCards={setCards} currentSetId={setId}/>

      <AIAssistant/>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<LernsetDetail/>);
