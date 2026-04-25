// StudyFlow — Lern-Modus (Flashcards + Quiz) mit echtem SRS
const { useState, useEffect, useMemo, useRef } = React;

const setId = new URLSearchParams(window.location.search).get('id');

// SM-2-inspired SRS calculation
function calcNextReview(card, grade) {
  let interval = card.interval_days || 1;
  let ease = card.ease_factor || 2.5;
  let mastery = card.mastery_level || 'new';

  if (grade === 1) {
    interval = 1;
    ease = Math.max(1.3, ease - 0.2);
    mastery = 'new';
  } else if (grade === 2) {
    interval = Math.max(1, Math.ceil(interval * 1.2));
    ease = Math.max(1.3, ease - 0.15);
    mastery = 'learning';
  } else if (grade === 3) {
    interval = Math.max(1, Math.ceil(interval * ease));
    mastery = interval >= 7 ? 'good' : 'learning';
  } else {
    interval = Math.max(1, Math.ceil(interval * ease * 1.3));
    ease = Math.min(2.5, ease + 0.15);
    mastery = interval >= 21 ? 'mastered' : 'good';
  }

  const next_review = new Date(Date.now() + interval * 86400000).toISOString();
  return { interval_days: interval, ease_factor: ease, mastery_level: mastery, next_review, review_count: (card.review_count || 0) + 1 };
}

function gradeHint(grade, card) {
  const interval = card.interval_days || 1;
  if (grade === 1) return '<1m';
  if (grade === 2) { const i = Math.max(1, Math.ceil(interval * 1.2)); return i < 1 ? '<1d' : `${i}d`; }
  if (grade === 3) { const i = Math.max(1, Math.ceil(interval * (card.ease_factor || 2.5))); return `${i}d`; }
  const i = Math.max(1, Math.ceil(interval * (card.ease_factor || 2.5) * 1.3));
  return `${i}d`;
}

// ─── Mode Switcher ────────────────────────────────────────────
const ModeSwitcher = ({ mode, setMode }) => (
  <div style={{ display: 'flex', gap: 4, padding: 4, background: 'white', borderRadius: 12, border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
    {[
      { id: 'flashcards', label: 'Karten', icon: <Icons.Cards size={14}/> },
      { id: 'quiz', label: 'Quiz', icon: <Icons.Brain size={14}/> },
      { id: 'typing', label: 'Tippen', icon: <Icons.Edit size={14}/> },
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

// ─── Flashcard Mode ───────────────────────────────────────────
const FlashcardMode = ({ cards, sessionCards, reviewed, onGrade }) => {
  const [flipped, setFlipped] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [exiting, setExiting] = useState(null); // 'left' | 'right' | null
  const dragRef = useRef({ active: false, startX: 0 });
  const hasDragged = useRef(false);
  const idx = reviewed;
  const card = sessionCards[idx];
  const nextCard = sessionCards[idx + 1] || null;
  const nextNextCard = sessionCards[idx + 2] || null;

  useEffect(() => {
    setFlipped(false);
    setDragX(0);
    setExiting(null);
    dragRef.current = { active: false, startX: 0 };
  }, [idx]);

  if (!card) return null;

  // 0..1 progress toward the swipe threshold
  const dragProgress = Math.min(1, Math.abs(dragX) / 120);
  const isDragging = dragRef.current.active;

  const triggerExit = (dir, grade) => {
    dragRef.current.active = false;
    setExiting(dir);
    setDragX(dir === 'right' ? 760 : -760);
    setTimeout(() => onGrade(card, grade), 380);
  };

  const handlePointerDown = (e) => {
    if (exiting) return;
    hasDragged.current = false;
    if (!flipped) return;
    dragRef.current = { active: true, startX: e.clientX };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current.active || exiting) return;
    const diff = e.clientX - dragRef.current.startX;
    setDragX(diff);
    if (Math.abs(diff) > 5) hasDragged.current = true;
  };

  const handlePointerUp = (e) => {
    if (!dragRef.current.active || exiting) return;
    dragRef.current.active = false;
    const diff = e.clientX - dragRef.current.startX;
    if (diff > 120) triggerExit('right', 3);
    else if (diff < -120) triggerExit('left', 1);
    else setDragX(0);
  };

  const grades = [
    { g: 1, label: 'Nochmal', color: '#ef4444', bg: '#fee2e2' },
    { g: 2, label: 'Schwer',  color: '#f59e0b', bg: '#fef3c7' },
    { g: 3, label: 'Gut',     color: '#10b981', bg: '#d1fae5' },
    { g: 4, label: 'Einfach', color: '#6366f1', bg: '#e0e7ff' },
  ];

  // Background card animates "up" as top card is dragged
  const bgScale = 0.93 + dragProgress * 0.07;
  const bgTranslateY = 6 - dragProgress * 6;
  const bg2Scale = 0.87 + dragProgress * 0.06;
  const bg2TranslateY = 12 - dragProgress * 6;
  const animTransition = isDragging ? 'none' : 'transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

  // Top card position: flies off when exiting, otherwise follows drag
  const cardX = exiting ? (exiting === 'right' ? 760 : -760) : dragX;
  const cardRot = cardX * 0.05;
  const cardTransition = isDragging ? 'none' : 'transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s ease';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, padding: '32px 0' }}>
      {/* Screen edge feedback */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '40vw',
        background: 'radial-gradient(circle at right center, rgba(16,185,129,0.35) 0%, transparent 70%)',
        opacity: flipped && dragX > 0 ? Math.min(1, dragX / 150) : 0,
        pointerEvents: 'none',
        transition: isDragging ? 'none' : 'opacity 0.3s ease-out',
        zIndex: 100,
      }} />
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: '40vw',
        background: 'radial-gradient(circle at left center, rgba(239,68,68,0.35) 0%, transparent 70%)',
        opacity: flipped && dragX < 0 ? Math.min(1, Math.abs(dragX) / 150) : 0,
        pointerEvents: 'none',
        transition: isDragging ? 'none' : 'opacity 0.3s ease-out',
        zIndex: 100,
      }} />

      {/* Card stack */}
      <div style={{ width: 600, height: 360, position: 'relative' }}>

        {/* Back layer — card after next */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'white', borderRadius: 20,
          transform: `rotate(-1.5deg) translateY(${bg2TranslateY}px) scale(${bg2Scale})`,
          opacity: 0.55,
          border: '1px solid rgba(15,23,42,0.06)',
          boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
          transition: animTransition,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}>
          {nextNextCard && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
              <div style={{ fontFamily: 'Caveat', fontSize: 24, color: '#94a3b8', textAlign: 'center', lineHeight: 1.3 }}>
                {nextNextCard.front}
              </div>
            </div>
          )}
        </div>

        {/* Middle layer — next card preview */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'white', borderRadius: 20,
          transform: `rotate(0.7deg) translateY(${bgTranslateY}px) scale(${bgScale})`,
          opacity: 0.88,
          border: '1px solid rgba(15,23,42,0.06)',
          boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
          transition: animTransition,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}>
          {nextCard && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10 }}>Frage</div>
              <div style={{ fontFamily: 'Caveat', fontSize: 28, color: '#334155', textAlign: 'center', lineHeight: 1.25 }}>
                {nextCard.front}
              </div>
            </div>
          )}
        </div>

        {/* Top card */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            position: 'absolute', inset: 0,
            transform: `translateX(${cardX}px) rotate(${cardRot}deg)`,
            opacity: exiting ? 0 : 1,
            transition: cardTransition,
            touchAction: flipped ? 'none' : 'auto',
            cursor: flipped ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
            userSelect: isDragging ? 'none' : 'auto',
          }}
        >
          <Flashcard front={card.front} back={card.back} flipped={flipped} onFlip={() => {
            if (!hasDragged.current) setFlipped(!flipped);
          }} w={600} h={360}/>
        </div>
      </div>

      <div style={{ fontFamily: 'Caveat', fontSize: 20, color: '#64748b' }}>
        Klick zum Umdrehen · <kbd style={{ padding: '1px 6px', background: '#f1f5f9', borderRadius: 4, fontSize: 11, fontFamily: 'JetBrains Mono', color: '#334155' }}>Space</kbd> {flipped && '· Swipe für Richtig/Falsch'}
      </div>

      {flipped ? (
        <div style={{ display: 'flex', gap: 10 }}>
          {grades.map(b => (
            <button key={b.g} onClick={() => !exiting && triggerExit(b.g >= 3 ? 'right' : 'left', b.g)} style={{
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
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{gradeHint(b.g, card)}</div>
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

// ─── Quiz Mode ─────────────────────────────────────────────────
const QuizMode = ({ sessionCards, reviewed, onGrade }) => {
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const card = sessionCards[reviewed];

  useEffect(() => { setSelected(null); setLocked(false); }, [reviewed]);

  if (!card) return null;

  // Build 4 options: correct answer + 3 random wrong ones
  const options = useMemo(() => {
    const others = sessionCards.filter(c => c.id !== card.id).map(c => c.back);
    const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 3);
    const all = [card.back, ...shuffled].sort(() => Math.random() - 0.5);
    return all;
  }, [card.id]);

  const correctIdx = options.indexOf(card.back);

  const choose = (i) => {
    if (locked) return;
    setSelected(i);
    setLocked(true);
    const isCorrect = i === correctIdx;
    if (isCorrect) setCorrectCount(c => c + 1);
    const grade = isCorrect ? 3 : 1;
    setTimeout(() => onGrade(card, grade), 1200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '32px 0' }}>
      <div style={{ width: 640, background: 'white', borderRadius: 20, padding: 36, border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 4px 16px rgba(15,23,42,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 600, letterSpacing: '0.08em' }}>FRAGE {reviewed + 1} / {sessionCards.length}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#10b981', fontWeight: 600, background: '#d1fae5', padding: '4px 8px', borderRadius: 6 }}>
            <Icons.Check size={12}/> {correctCount} RICHTIG
          </div>
        </div>
        <div style={{ fontFamily: 'Caveat', fontSize: 32, fontWeight: 500, color: '#0f172a', marginTop: 10, lineHeight: 1.2 }}>
          {card.front}
        </div>

        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {options.map((opt, i) => {
            const isCorrect = i === correctIdx;
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
                background: bg, border: `1.5px solid ${border}`,
                borderRadius: 12, fontSize: 14, color,
                textAlign: 'left', cursor: locked ? 'default' : 'pointer',
                fontFamily: 'inherit', fontWeight: 500,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: showState && isCorrect ? '#10b981' : (showState && isSelected ? '#ef4444' : '#f1f5f9'),
                  color: showState ? 'white' : '#64748b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 600, flexShrink: 0,
                }}>
                  {showState && isCorrect ? <Icons.Check size={14}/> : (showState && isSelected && !isCorrect ? <Icons.X size={14}/> : String.fromCharCode(65 + i))}
                </div>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── Typing Mode ───────────────────────────────────────────────
const TypingMode = ({ sessionCards, reviewed, onGrade }) => {
  const [input, setInput] = useState('');
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const card = sessionCards[reviewed];

  useEffect(() => {
    setInput('');
    setChecked(false);
    setIsCorrect(false);
  }, [reviewed]);

  if (!card) return null;

  const handleCheck = (e) => {
    e?.preventDefault();
    if (checked || !input.trim()) return;

    // Einfacher Vergleich (ignoriert Groß-/Kleinschreibung und Leerzeichen)
    const correct = input.trim().toLowerCase() === card.back.trim().toLowerCase();
    setIsCorrect(correct);
    setChecked(true);

    setTimeout(() => {
      onGrade(card, correct ? 3 : 1);
    }, 2500); // 2.5s warten, damit man das Ergebnis sehen kann
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '32px 0' }}>
      <div style={{ width: 640, background: 'white', borderRadius: 20, padding: 36, border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 4px 16px rgba(15,23,42,0.06)' }}>
        <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 600, letterSpacing: '0.08em' }}>FRAGE {reviewed + 1} / {sessionCards.length}</div>
        <div style={{ fontFamily: 'Caveat', fontSize: 32, fontWeight: 500, color: '#0f172a', marginTop: 10, lineHeight: 1.2 }}>
          {card.front}
        </div>

        <form onSubmit={handleCheck} style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={checked}
            placeholder="Tippe deine Antwort hier…"
            style={{ width: '100%', minHeight: 120, padding: 16, background: checked ? (isCorrect ? '#d1fae5' : '#fee2e2') : '#fafaf7', border: `2px solid ${checked ? (isCorrect ? '#10b981' : '#ef4444') : '#e2e8f0'}`, borderRadius: 12, fontSize: 15, fontFamily: 'inherit', color: checked ? (isCorrect ? '#065f46' : '#991b1b') : '#0f172a', resize: 'vertical', outline: 'none', transition: 'all 0.2s' }}
            autoFocus
          />

          {checked && !isCorrect && (
            <div style={{ padding: 16, background: '#eef2ff', borderRadius: 12, border: '1px solid #c7d2fe' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#4f46e5', letterSpacing: '0.05em', marginBottom: 6 }}>RICHTIGE ANTWORT</div>
              <div style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.5 }}>{card.back}</div>
            </div>
          )}

          {!checked && (
            <button type="submit" disabled={!input.trim()} className="btn-primary" style={{ padding: '14px', justifyContent: 'center', fontSize: 15, opacity: input.trim() ? 1 : 0.5 }}>
              Antwort prüfen
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

// ─── Done Screen ──────────────────────────────────────────────
const DoneScreen = ({ reviewed, setTitle }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 20 }}>
    <div style={{ width: 76, height: 76, borderRadius: 22, background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #c7d2fe' }}>
      <Icons.Check size={34}/>
    </div>
    <div style={{ fontFamily: 'Instrument Sans', fontSize: 28, fontWeight: 600, color: '#0f172a', letterSpacing: '-0.02em' }}>Session abgeschlossen!</div>
    <div style={{ fontFamily: 'Caveat', fontSize: 22, color: '#64748b' }}>Du hast {reviewed} Karten gelernt.</div>
    <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
      <a href={setId ? `lernset.html?id=${setId}` : 'dashboard.html'} className="btn-ghost" style={{ padding: '12px 24px', fontSize: 14 }}>
        Zum Lernset
      </a>
      <a href="dashboard.html" className="btn-primary" style={{ padding: '12px 24px', fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icons.Home size={14}/> Dashboard
      </a>
    </div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────
const LernModus = () => {
  const [mode, setMode] = useState('flashcards');
  const [cards, setCards] = useState([]);
  const [sessionCards, setSessionCards] = useState([]);
  const [reviewed, setReviewed] = useState(0);
  const [done, setDone] = useState(false);
  const [studySet, setStudySet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    (async () => {
      const session = await window.requireAuth();
      if (!session) return;

      const uid = session.user.id;
      setUserId(uid);

      if (!setId) { setLoading(false); return; }

      // Load study set
      const { data: s } = await window.sb.from('study_sets').select('*').eq('id', setId).single();
      if (s) { setStudySet(s); document.title = `${s.title} lernen — StudyFlow`; }

      // Load cards
      const now = new Date().toISOString();
      let { data: due } = await window.sb.from('cards')
        .select('*')
        .eq('set_id', setId)
        .lte('next_review', now)
        .order('next_review', { ascending: true });

      if (!due || due.length === 0) {
        const { data: all } = await window.sb.from('cards')
          .select('*')
          .eq('set_id', setId)
          .order('created_at', { ascending: true });
        due = all || [];
      }

      setCards(due);
      setSessionCards(due);

      // Start session record
      const { data: sess } = await window.sb.from('study_sessions').insert({
        user_id: uid,
        set_id: setId,
        mode: 'flashcard',
      }).select().single();
      if (sess) setSessionId(sess.id);

      // Compute streak (days with at least one review)
      const { data: reviews } = await window.sb.from('card_reviews')
        .select('reviewed_at')
        .eq('user_id', uid)
        .order('reviewed_at', { ascending: false })
        .limit(100);

      if (reviews && reviews.length > 0) {
        let s = 0;
        let d = new Date(); d.setHours(0,0,0,0);
        const days = new Set(reviews.map(r => new Date(r.reviewed_at).toDateString()));
        while (days.has(d.toDateString())) { s++; d.setDate(d.getDate() - 1); }
        setStreak(s);
      }

      setLoading(false);
    })();
  }, []);

  const handleGrade = async (card, grade) => {
    if (!userId) return;

    const updates = calcNextReview(card, grade);

    // Save review
    await window.sb.from('card_reviews').insert({ card_id: card.id, user_id: userId, grade });
    // Update card SRS data
    await window.sb.from('cards').update(updates).eq('id', card.id);

    const next = reviewed + 1;
    if (next >= sessionCards.length) {
      // End session
      if (sessionId) {
        await window.sb.from('study_sessions').update({
          cards_reviewed: next,
          ended_at: new Date().toISOString(),
        }).eq('id', sessionId);
      }
      setReviewed(next);
      setDone(true);
    } else {
      setReviewed(next);
    }
  };

  if (loading) return (
    <div className="dot-paper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'Caveat', fontSize: 24, color: '#64748b' }}>Lädt…</div>
    </div>
  );

  if (!setId || cards.length === 0) return (
    <div className="dot-paper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 48 }}>😴</div>
      <div style={{ fontFamily: 'Caveat', fontSize: 28, color: '#64748b' }}>Keine Karten zum Lernen</div>
      <a href={setId ? `lernset.html?id=${setId}` : 'dashboard.html'} className="btn-primary" style={{ padding: '10px 20px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icons.Plus size={14}/> Karten hinzufügen
      </a>
    </div>
  );

  const progress = reviewed / sessionCards.length;
  const backHref = setId ? `lernset.html?id=${setId}` : 'dashboard.html';

  return (
    <div className="dot-paper" style={{ minHeight: '100vh' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', margin: '14px 16px 0', background: 'white', borderRadius: 18, border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.04)' }}>
        <a href={backHref} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13 }}>
          <Icons.X size={16}/> Beenden
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{studySet?.title || 'Lernen'}</div>
          <span style={{ color: '#cbd5e1' }}>·</span>
          <div style={{ fontSize: 13, color: '#64748b' }}>{sessionCards.length} Karten</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {streak > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: '#fef3c7', borderRadius: 999, fontSize: 12, fontWeight: 500, color: '#92400e' }}>
              <Icons.Bolt size={14}/> {streak}
            </div>
          )}
        </div>
      </header>

      <div style={{ padding: '16px 32px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: '#64748b' }}>
          <span>Fortschritt · {reviewed} / {sessionCards.length}</span>
          <span>{done ? 'Fertig!' : `~ ${Math.ceil((sessionCards.length - reviewed) * 0.5)} Min übrig`}</span>
        </div>
        <div style={{ height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${progress * 100}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #818cf8)', borderRadius: 999, transition: 'width 0.3s ease' }}></div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 24 }}>
        <ModeSwitcher mode={mode} setMode={setMode}/>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 32px 100px' }}>
        {done ? (
          <DoneScreen reviewed={reviewed} setTitle={studySet?.title}/>
        ) : (
          <>
            {mode === 'flashcards' && (
              <FlashcardMode
                cards={cards}
                sessionCards={sessionCards}
                reviewed={reviewed}
                onGrade={handleGrade}
              />
            )}
            {mode === 'quiz' && sessionCards.length >= 4 ? (
              <QuizMode
                sessionCards={sessionCards}
                reviewed={reviewed}
                onGrade={handleGrade}
              />
            ) : mode === 'quiz' ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b', fontFamily: 'Caveat', fontSize: 22 }}>
                Mindestens 4 Karten für Quiz benötigt
              </div>
            ) : null}
            {mode === 'typing' && (
              <TypingMode
                sessionCards={sessionCards}
                reviewed={reviewed}
                onGrade={handleGrade}
              />
            )}
          </>
        )}
      </div>

      <AIAssistant/>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<LernModus/>);
