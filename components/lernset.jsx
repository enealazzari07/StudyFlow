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

// ─── Exam Date Banner ─────────────────────────────────────────
const ExamDateBanner = ({ studySet, cards, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [dateInput, setDateInput] = useState(studySet.exam_date ? studySet.exam_date.slice(0, 10) : '');
  const [saving, setSaving] = useState(false);

  const mastered = cards.filter(c => c.mastery_level === 'mastered' || c.mastery_level === 'good').length;
  const unmastered = cards.length - mastered;

  const handleSave = async () => {
    setSaving(true);
    const val = dateInput || null;
    await window.sb.from('study_sets').update({ exam_date: val }).eq('id', studySet.id);
    setSaving(false);
    setEditing(false);
    onSave(val);
  };

  if (!studySet.exam_date && !editing) {
    return (
      <button onClick={() => setEditing(true)} style={{ marginTop: 12, background: 'none', border: '1px dashed #cbd5e1', borderRadius: 10, padding: '8px 14px', fontSize: 12.5, color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
        <Icons.Calendar size={13}/> Prüfungsdatum festlegen
      </button>
    );
  }

  if (editing) {
    return (
      <div style={{ marginTop: 12, background: 'white', border: '1px solid #c7d2fe', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Icons.Calendar size={15} style={{ color: '#6366f1', flexShrink: 0 }}/>
        <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>Prüfungsdatum:</span>
        <input type="date" value={dateInput} onChange={e => setDateInput(e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: 7, padding: '5px 10px', fontSize: 13, fontFamily: 'inherit', color: '#0f172a' }}/>
        <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}>{saving ? 'Speichert…' : 'Speichern'}</button>
        <button onClick={() => setEditing(false)} className="btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}>Abbrechen</button>
      </div>
    );
  }

  const today = new Date(); today.setHours(0,0,0,0);
  const exam = new Date(studySet.exam_date); exam.setHours(0,0,0,0);
  const daysRemaining = Math.round((exam - today) / 86400000);

  let status, statusText, cardsPerDay = 0;
  if (daysRemaining < 0) {
    status = 'danger'; statusText = 'Prüfung bereits vorbei';
  } else if (daysRemaining === 0) {
    status = 'danger'; statusText = 'Prüfung heute! Nur noch wiederholen.';
  } else if (daysRemaining === 1) {
    status = 'danger'; statusText = 'Letzter Tag — nur wiederholen!'; cardsPerDay = unmastered;
  } else if (unmastered === 0) {
    status = 'good'; statusText = 'Alle Karten gemeistert — du bist bereit!';
  } else {
    cardsPerDay = Math.ceil(unmastered / (daysRemaining - 1));
    if (cardsPerDay > 20)      { status = 'danger';  statusText = 'Sehr intensiv lernen nötig'; }
    else if (cardsPerDay > 10) { status = 'warning'; statusText = 'Intensiv lernen nötig'; }
    else if (cardsPerDay > 5)  { status = 'ok';      statusText = 'Gut auf Kurs'; }
    else                        { status = 'good';    statusText = 'Du bist im Plan'; }
  }

  const col = {
    good:    { bg: '#d1fae5', border: '#6ee7b7', text: '#065f46', dot: '#10b981' },
    ok:      { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af', dot: '#3b82f6' },
    warning: { bg: '#fef3c7', border: '#fde68a', text: '#92400e', dot: '#f59e0b' },
    danger:  { bg: '#fee2e2', border: '#fecaca', text: '#991b1b', dot: '#ef4444' },
  }[status];

  const examStr = new Date(studySet.exam_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div style={{ marginTop: 12, background: col.bg, border: `1px solid ${col.border}`, borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: col.dot, flexShrink: 0 }}></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: col.text }}>{statusText}</div>
        <div style={{ fontSize: 12, color: col.text, opacity: 0.75, marginTop: 2 }}>
          Prüfung: {examStr} · {daysRemaining > 0 ? `noch ${daysRemaining} Tag${daysRemaining !== 1 ? 'e' : ''}` : daysRemaining === 0 ? 'heute' : 'vorbei'}
          {cardsPerDay > 0 && ` · ${cardsPerDay} Karte${cardsPerDay !== 1 ? 'n' : ''}/Tag`}
          {unmastered > 0 && ` · ${unmastered} noch zu lernen`}
        </div>
      </div>
      <button onClick={() => { setDateInput(studySet.exam_date ? studySet.exam_date.slice(0, 10) : ''); setEditing(true); }} style={{ background: 'none', border: 'none', fontSize: 11.5, color: col.text, opacity: 0.7, cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit', padding: 0 }}>Ändern</button>
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
  const updateExamDate = (val) => setStudySet(prev => ({ ...prev, exam_date: val }));

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
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', margin: '14px 16px 0', background: window.dm('white', '#161b22'), borderRadius: 18, border: `1px solid ${window.dm('rgba(15,23,42,0.06)', 'rgba(255,255,255,0.07)')}`, boxShadow: window.dm('0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.04)', '0 1px 2px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)') }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a href="dashboard.html" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <Icons.Logo size={28}/>
            <span style={{ fontFamily: 'Instrument Sans', fontSize: 15, fontWeight: 600, color: window.dm('#0f172a', '#e6edf3'), letterSpacing: '-0.01em' }}>StudyFlow</span>
          </a>
          <span style={{ color: window.dm('#e2e8f0', 'rgba(255,255,255,0.12)') }}>·</span>
          <a href="dashboard.html" style={{ display: 'flex', alignItems: 'center', gap: 4, color: window.dm('#64748b', '#6e7681'), fontSize: 13, textDecoration: 'none' }}>
            <Icons.ArrowLeft size={13}/> Dashboard
          </a>
        </div>
        <div style={{ fontFamily: 'Caveat', fontSize: 22, fontWeight: 600, color: window.dm('#0f172a', '#e6edf3'), letterSpacing: '0.01em' }}>
          {studySet.title}
        </div>
        <button className="btn-ghost" style={{ padding: '7px 12px', fontSize: 13 }}>
          <Icons.Share size={13}/> Teilen
        </button>
      </header>

      {/* Hero */}
      <section style={{ padding: '36px 32px 24px', position: 'relative', color: window.dm('#0f172a', '#e6edf3') }}>
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
        <div style={{ marginTop: 28, background: window.dm('white', '#161b22'), border: `1px solid ${window.dm('rgba(15,23,42,0.06)', 'rgba(255,255,255,0.07)')}`, borderRadius: 14, padding: 20, display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: 24, alignItems: 'center' }}>
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
        <ExamDateBanner studySet={studySet} cards={cards} onSave={updateExamDate}/>
      </section>

      <CardsList cards={cards} setCards={setCards} currentSetId={setId}/>

      <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 60 }}>
        <Dock items={DOCK_ITEMS} active="cards" onSelect={(id) => {
          const item = DOCK_ITEMS.find(i => i.id === id);
          if (item?.href) window.location.href = item.href;
        }}/>
      </div>
      <AIAssistant/>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<LernsetDetail/>);
