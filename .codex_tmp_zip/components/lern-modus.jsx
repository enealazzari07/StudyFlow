// StudyFlow — Lern-Modus (Flashcards + Quiz)
const { useState } = React;

const CARDS = [
  { id: 1, front: 'Was versteht man unter Preiselastizität der Nachfrage?', back: 'Die prozentuale Änderung der nachgefragten Menge, geteilt durch die prozentuale Änderung des Preises.' },
  { id: 2, front: 'Wann ist die Nachfrage elastisch?', back: 'Wenn |ε| > 1 — Mengenänderung ist prozentual größer als Preisänderung.' },
  { id: 3, front: 'Gesetz des abnehmenden Grenznutzens?', back: 'Der zusätzliche Nutzen jeder weiteren Einheit nimmt mit steigender Konsummenge ab.' },
  { id: 4, front: 'Was ist ein Giffen-Gut?', back: 'Ein inferiores Gut, dessen Nachfrage bei steigendem Preis zunimmt.' },
];

const QUIZ_QUESTIONS = [
  {
    q: 'Welche Aussage zur Preiselastizität ist korrekt?',
    options: [
      'Elastisch bedeutet |ε| < 1',
      'Elastisch bedeutet |ε| > 1',
      'Einheitselastisch bei |ε| = 2',
      'Unelastisch bei |ε| = ∞',
    ],
    correct: 1,
  },
];

const ModeSwitcher = ({ mode, setMode }) => (
  <div style={{ display: 'flex', gap: 4, padding: 4, background: 'white', borderRadius: 12, border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
    {[
      { id: 'flashcards', label: 'Karten', icon: <Icons.Cards size={14}/> },
      { id: 'quiz', label: 'Quiz', icon: <Icons.Brain size={14}/> },
      { id: 'typing', label: 'Tippen', icon: <Icons.Edit size={14}/> },
      { id: 'match', label: 'Match', icon: <Icons.Bolt size={14}/> },
    ].map(m => (
      <button key={m.id} onClick={() => setMode(m.id)} style={{
        padding: '8px 14px', fontSize: 13,
        background: mode === m.id ? '#0f172a' : 'transparent',
        color: mode === m.id ? 'white' : '#475569',
        fontWeight: 500, border: 'none', borderRadius: 8, cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {m.icon} {m.label}
      </button>
    ))}
  </div>
);

const FlashcardMode = () => {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = CARDS[idx];

  const rate = (grade) => {
    setFlipped(false);
    setTimeout(() => setIdx((idx + 1) % CARDS.length), 200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, padding: '32px 0' }}>
      <div style={{ width: 600, position: 'relative' }}>
        {/* Stacked cards behind */}
        <div style={{ position: 'absolute', inset: 0, background: 'white', borderRadius: 20, transform: 'rotate(-1.5deg) translateY(8px)', opacity: 0.6, border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}></div>
        <div style={{ position: 'absolute', inset: 0, background: 'white', borderRadius: 20, transform: 'rotate(0.8deg) translateY(4px)', opacity: 0.85, border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}></div>
        <div style={{ position: 'relative' }}>
          <Flashcard front={card.front} back={card.back} flipped={flipped} onFlip={() => setFlipped(!flipped)} w={600} h={360}/>
        </div>
      </div>

      <div style={{ fontFamily: 'Caveat', fontSize: 20, color: '#64748b' }}>
        Klick zum Umdrehen · <kbd style={{ padding: '1px 6px', background: '#f1f5f9', borderRadius: 4, fontSize: 11, fontFamily: 'JetBrains Mono', color: '#334155' }}>Space</kbd>
      </div>

      {/* Grade buttons (only show when flipped) */}
      {flipped ? (
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { g: 0, label: 'Nochmal', sub: '<1m', color: '#ef4444', bg: '#fee2e2' },
            { g: 1, label: 'Schwer', sub: '10m', color: '#f59e0b', bg: '#fef3c7' },
            { g: 2, label: 'Gut', sub: '1d', color: '#10b981', bg: '#d1fae5' },
            { g: 3, label: 'Einfach', sub: '4d', color: '#6366f1', bg: '#e0e7ff' },
          ].map(b => (
            <button key={b.g} onClick={() => rate(b.g)} style={{
              padding: '12px 24px',
              background: 'white',
              border: `1.5px solid ${b.bg}`,
              borderRadius: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
              minWidth: 120,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = b.bg; e.currentTarget.style.borderColor = b.color; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = b.bg; }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: b.color }}>{b.label}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{b.sub}</div>
            </button>
          ))}
        </div>
      ) : (
        <button onClick={() => setFlipped(true)} className="btn-primary" style={{ padding: '12px 28px' }}>
          <Icons.Flip size={14}/> Antwort zeigen
        </button>
      )}
    </div>
  );
};

const QuizMode = () => {
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);
  const q = QUIZ_QUESTIONS[0];

  const choose = (i) => {
    if (locked) return;
    setSelected(i);
    setLocked(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '32px 0' }}>
      <div style={{ width: 640, background: 'white', borderRadius: 20, padding: 36, border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 4px 16px rgba(15,23,42,0.06)' }}>
        <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 600, letterSpacing: '0.08em' }}>FRAGE 3 / 8</div>
        <div style={{ fontFamily: 'Caveat', fontSize: 32, fontWeight: 500, color: '#0f172a', marginTop: 10, lineHeight: 1.2 }}>
          {q.q}
        </div>

        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {q.options.map((opt, i) => {
            const isCorrect = i === q.correct;
            const isSelected = selected === i;
            const showState = locked && (isSelected || isCorrect);
            let bg = 'white', border = '#e2e8f0', color = '#334155';
            if (showState) {
              if (isCorrect) { bg = '#d1fae5'; border = '#10b981'; color = '#065f46'; }
              else if (isSelected) { bg = '#fee2e2'; border = '#ef4444'; color = '#991b1b'; }
            } else if (isSelected) { border = '#818cf8'; bg = '#eef2ff'; }
            return (
              <button key={i} onClick={() => choose(i)} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 18px',
                background: bg,
                border: `1.5px solid ${border}`,
                borderRadius: 12,
                fontSize: 14, color,
                textAlign: 'left', cursor: locked ? 'default' : 'pointer',
                fontFamily: 'inherit',
                fontWeight: 500,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: showState && isCorrect ? '#10b981' : (showState && isSelected ? '#ef4444' : '#f1f5f9'),
                  color: showState ? 'white' : '#64748b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 600,
                  flexShrink: 0,
                }}>
                  {showState && isCorrect ? <Icons.Check size={14}/> : (showState && isSelected && !isCorrect ? <Icons.X size={14}/> : String.fromCharCode(65 + i))}
                </div>
                {opt}
              </button>
            );
          })}
        </div>

        {locked && (
          <div style={{ marginTop: 24, padding: 16, background: '#eef2ff', borderRadius: 12, border: '1px solid #c7d2fe' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#4f46e5', fontWeight: 600 }}>
              <Icons.Sparkles size={13}/> FLOW ERKLÄRT
            </div>
            <div style={{ fontSize: 13.5, color: '#1e293b', marginTop: 6, lineHeight: 1.5 }}>
              <span style={{ fontWeight: 500 }}>|ε| &gt; 1</span> heißt, die Mengenänderung reagiert stärker als die Preisänderung — typisch bei Luxusgütern oder Produkten mit vielen Substituten.
            </div>
          </div>
        )}
      </div>

      {locked && (
        <button className="btn-primary" style={{ padding: '12px 28px' }} onClick={() => { setSelected(null); setLocked(false); }}>
          Weiter <Icons.ArrowRight size={14}/>
        </button>
      )}
    </div>
  );
};

// Small activity heatmap — 14 weeks × 7 days
const ActivityHeatmap = () => {
  // Deterministic intensity pattern
  const cells = React.useMemo(() => Array.from({ length: 14 * 7 }).map((_, i) => {
    const pseudo = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const r = Math.abs(pseudo);
    if (r < 0.35) return 0;
    if (r < 0.6) return 0.2;
    if (r < 0.78) return 0.4;
    if (r < 0.92) return 0.65;
    return 1;
  }), []);

  return (
    <div style={{
      background: 'white',
      border: '1px solid rgba(15,23,42,0.06)',
      borderRadius: 12,
      padding: '12px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
    }}>
      <div>
        <div style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Aktivität</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 2 }}>
          <span style={{ fontFamily: 'Caveat', fontSize: 24, fontWeight: 600, color: '#0f172a', lineHeight: 1 }}>47</span>
          <span style={{ fontSize: 11, color: '#64748b' }}>Tage Streak</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 2.5, flex: 1 }}>
        {cells.map((intensity, i) => (
          <div key={i} style={{
            aspectRatio: 1,
            borderRadius: 2,
            background: intensity === 0 ? '#f1f5f9' : `rgba(99,102,241,${intensity})`,
          }}></div>
        ))}
      </div>
      <div style={{ fontSize: 10.5, color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
        <span>letzte 14 Wochen</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
          <span style={{ fontSize: 9 }}>weniger</span>
          {[0, 0.2, 0.4, 0.65, 1].map(v => (
            <div key={v} style={{ width: 8, height: 8, borderRadius: 2, background: v === 0 ? '#f1f5f9' : `rgba(99,102,241,${v})` }}></div>
          ))}
          <span style={{ fontSize: 9 }}>mehr</span>
        </div>
      </div>
    </div>
  );
};

const LernModus = () => {
  const [mode, setMode] = useState('flashcards');

  return (
    <div className="dot-paper" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', background: 'white', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
        <a href="lernset.html" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13 }}>
          <Icons.X size={16}/> Beenden
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>Mikroökonomie II</div>
          <span style={{ color: '#cbd5e1' }}>·</span>
          <div style={{ fontSize: 13, color: '#64748b' }}>Session 3 · 12 Karten</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: '#fef3c7', borderRadius: 999, fontSize: 12, fontWeight: 500, color: '#92400e' }}>
            🔥 47
          </div>
          <button className="btn-ghost" style={{ padding: 7 }}><Icons.Settings size={16}/></button>
        </div>
      </header>

      {/* Activity heatmap */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '16px 32px 0' }}>
        <ActivityHeatmap/>
      </div>

      {/* Progress bar */}
      <div style={{ padding: '16px 32px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: '#64748b' }}>
          <span>Fortschritt · 4 / 12</span>
          <span>~ 9 Min übrig</span>
        </div>
        <div style={{ height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: '33%', height: '100%', background: 'linear-gradient(90deg, #6366f1, #818cf8)', borderRadius: 999 }}></div>
        </div>
      </div>

      {/* Mode switcher */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 24 }}>
        <ModeSwitcher mode={mode} setMode={setMode}/>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 32px 100px' }}>
        {mode === 'flashcards' && <FlashcardMode/>}
        {mode === 'quiz' && <QuizMode/>}
        {mode === 'typing' && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b', fontFamily: 'Caveat', fontSize: 24 }}>Tipp-Modus — coming soon ✍️</div>
        )}
        {mode === 'match' && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b', fontFamily: 'Caveat', fontSize: 24 }}>Match-Modus — coming soon ⚡</div>
        )}
      </div>

      <AIAssistant/>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<LernModus/>);
