// StudyFlow — Lernset Detail
const { useState } = React;

const MOCK_CARDS = [
  { id: 1, front: 'Was versteht man unter Preiselastizität der Nachfrage?', back: 'Die prozentuale Änderung der nachgefragten Menge, geteilt durch die prozentuale Änderung des Preises.', mastery: 'good', tags: ['VL07'] },
  { id: 2, front: 'Wann ist die Nachfrage elastisch?', back: 'Wenn |ε| > 1 — die Mengenänderung ist prozentual größer als die Preisänderung.', mastery: 'good', tags: ['VL07'] },
  { id: 3, front: 'Definiere das Gesetz des abnehmenden Grenznutzens.', back: 'Der zusätzliche Nutzen jeder weiteren Einheit eines Gutes nimmt mit steigender Konsummenge ab.', mastery: 'learning', tags: ['VL05'] },
  { id: 4, front: 'Was ist ein Giffen-Gut?', back: 'Ein inferiores Gut, dessen Nachfrage bei steigendem Preis zunimmt (ungewöhnlicher Einkommenseffekt).', mastery: 'new', tags: ['VL07'] },
  { id: 5, front: 'Marktversagen — nenne drei Ursachen.', back: '(1) Externe Effekte, (2) Öffentliche Güter, (3) Informationsasymmetrien.', mastery: 'good', tags: ['VL08'] },
  { id: 6, front: 'Was ist die Konsumentenrente?', back: 'Die Differenz zwischen dem, was Konsumenten maximal zu zahlen bereit sind, und dem tatsächlichen Preis.', mastery: 'learning', tags: ['VL06'] },
  { id: 7, front: 'Unterschied: Substitutions- und Einkommenseffekt?', back: 'Substitutionseffekt: Wechsel zu relativ günstigerem Gut. Einkommenseffekt: Veränderung der Kaufkraft durch Preisänderung.', mastery: 'new', tags: ['VL06'] },
  { id: 8, front: 'Was misst das Bruttoinlandsprodukt (BIP)?', back: 'Den Gesamtwert aller in einer Volkswirtschaft in einem Jahr produzierten Waren und Dienstleistungen.', mastery: 'good', tags: ['VL01'] },
];

const MASTERY_STYLE = {
  good:     { color: '#10b981', bg: '#d1fae5', label: 'Gemeistert' },
  learning: { color: '#f59e0b', bg: '#fef3c7', label: 'Am lernen' },
  new:      { color: '#64748b', bg: '#f1f5f9', label: 'Neu' },
};

const Header = () => (
  <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', background: 'white', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <a href="dashboard.html" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13 }}>
        <Icons.ArrowLeft size={14}/> Dashboard
      </a>
      <div style={{ height: 20, width: 1, background: '#e2e8f0' }}></div>
      <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b' }}>
        <Icons.Folder size={14}/> Sommersemester 26
        <Icons.Chevron size={11}/>
        <span style={{ color: '#0f172a', fontWeight: 500 }}>Mikroökonomie II</span>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <CollabAvatars users={[
        { name: 'Lara K', color: '#ec4899' },
        { name: 'Tim R', color: '#f59e0b' },
        { name: 'Alex Meier', color: '#6366f1' },
      ]}/>
      <button className="btn-ghost" style={{ padding: '7px 12px', fontSize: 13 }}>
        <Icons.Share size={13}/> Teilen
      </button>
      <button className="btn-ghost" style={{ padding: 7 }}><Icons.MoreH size={16}/></button>
    </div>
  </header>
);

const SetHero = () => (
  <section className="px-mobile" style={{ padding: '36px 32px 24px', position: 'relative' }}>
    <div className="mobile-col" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
      <div style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 44, lineHeight: 1 }}>📊</div>
          <div>
            <h1 style={{ fontFamily: 'Instrument Sans', fontSize: 32, fontWeight: 600, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              Mikroökonomie II
            </h1>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>142 Karten · von <span style={{ color: '#0f172a', fontWeight: 500 }}>Alex Meier</span> · letzte Änderung vor 2 Std.</div>
          </div>
        </div>
        <p style={{ fontSize: 14, color: '#475569', marginTop: 16, lineHeight: 1.55 }}>
          Vorlesungs-Begleitung — Angebot &amp; Nachfrage, Elastizität, Marktversagen, Monopole. Klausur am <span className="highlight">18. Mai</span>.
        </p>
        <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
          {['VL01–VL12', 'Prof. Hansen', 'Sommersemester', 'Klausurstoff'].map(t => (
            <span key={t} className="pill">{t}</span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <a href="lern-modus.html" className="btn-primary" style={{ padding: '12px 18px', fontSize: 14 }}>
          <Icons.Play size={14}/> Jetzt lernen
          <span style={{ marginLeft: 4, background: 'rgba(255,255,255,0.15)', padding: '1px 7px', borderRadius: 5, fontSize: 11 }}>12 fällig</span>
        </a>
        <button className="btn-ghost" style={{ padding: '12px 16px', fontSize: 14 }}>
          <Icons.Plus size={14}/> Karte
        </button>
      </div>
    </div>

    {/* Progress card */}
    <div className="card-content" style={{ marginTop: 28, background: 'white', border: '1px solid rgba(15,23,42,0.06)', borderRadius: 14, padding: 20, display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: 24, alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Fortschritt</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
          <span style={{ fontFamily: 'Instrument Sans', fontSize: 28, fontWeight: 600, color: '#0f172a', letterSpacing: '-0.02em' }}>61%</span>
          <span style={{ fontFamily: 'Caveat', fontSize: 18, color: '#10b981', fontWeight: 600 }}>auf gutem Weg</span>
        </div>
        <div style={{ height: 6, background: '#f1f5f9', borderRadius: 999, marginTop: 10, overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: '55%', background: '#10b981' }}></div>
          <div style={{ width: '21%', background: '#f59e0b' }}></div>
          <div style={{ width: '24%', background: '#e2e8f0' }}></div>
        </div>
      </div>
      {[
        { n: 78, label: 'Gemeistert', c: '#10b981' },
        { n: 30, label: 'Am lernen', c: '#f59e0b' },
        { n: 34, label: 'Neu', c: '#64748b' },
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
);

const CardRow = ({ card, index, focused, onFocus }) => {
  const ms = MASTERY_STYLE[card.mastery];
  return (
    <div
      onClick={onFocus}
      className="card-content" style={{
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
        <button style={{ background: 'none', border: 'none', padding: 6, borderRadius: 6, cursor: 'pointer', color: '#94a3b8' }}>
          <Icons.Edit size={14}/>
        </button>
        <button style={{ background: 'none', border: 'none', padding: 6, borderRadius: 6, cursor: 'pointer', color: '#94a3b8' }}>
          <Icons.MoreH size={14}/>
        </button>
      </div>
    </div>
  );
};

const CardsList = () => {
  const [focused, setFocused] = useState(3);
  const [filter, setFilter] = useState('all');

  return (
    <section className="px-mobile" style={{ padding: '8px 32px 100px' }}>
      {/* Controls */}
      <div className="mobile-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{ fontFamily: 'Instrument Sans', fontSize: 18, fontWeight: 600, color: '#0f172a', margin: 0 }}>Alle Karten</h2>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>· 142</span>
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
              border: 'none', borderRadius: 7, cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: filter === f.id ? '0 1px 2px rgba(15,23,42,0.08)' : 'none',
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* AI tip sticky note */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <div className="mobile-wrap" style={{ background: 'linear-gradient(135deg, #eef2ff, white)', border: '1px solid #c7d2fe', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #818cf8)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icons.Sparkles size={18}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: '#1e293b', fontWeight: 500 }}>Flow schlägt vor: 12 neue Karten aus <span style={{ color: '#4f46e5' }}>VL12_Monopole.pdf</span> erstellen</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Du hast das Dokument letzte Woche hochgeladen, aber noch keine Karten generiert.</div>
          </div>
          <button className="btn-primary" style={{ padding: '8px 14px', fontSize: 12.5 }}>Karten erstellen</button>
          <button style={{ background: 'none', border: 'none', padding: 6, color: '#94a3b8', cursor: 'pointer' }}><Icons.X size={16}/></button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {MOCK_CARDS.map((c, i) => (
          <CardRow key={c.id} card={c} index={i} focused={focused === c.id} onFocus={() => setFocused(c.id)}/>
        ))}
      </div>

      {/* Add card row */}
      <button style={{
        marginTop: 10, width: '100%', padding: 16,
        background: 'transparent', border: '1.5px dashed #cbd5e1',
        borderRadius: 12, color: '#64748b', fontSize: 13,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        cursor: 'pointer', fontFamily: 'inherit',
      }}>
        <Icons.Plus size={16}/> Neue Karte hinzufügen
      </button>
    </section>
  );
};

// Live cursor simulation (showing collaborators editing card #4)
const FakeCollabCursor = () => {
  const [pos, setPos] = React.useState({ x: 720, y: 620 });
  React.useEffect(() => {
    const iv = setInterval(() => {
      setPos({
        x: 600 + Math.sin(Date.now() / 1500) * 80,
        y: 600 + Math.cos(Date.now() / 1800) * 40,
      });
    }, 60);
    return () => clearInterval(iv);
  }, []);
  return <LiveCursor x={pos.x} y={pos.y} name="Lara bearbeitet" color="#ec4899"/>;
};

const DOCK_ITEMS = [
  { id: 'home', label: 'Start', icon: <Icons.Home size={22}/> },
  { id: 'cards', label: 'Lernsets', icon: <Icons.Cards size={22}/> },
  { id: 'docs', label: 'Dokumente', icon: <Icons.Doc size={22}/> },
  { id: 'ai', label: 'Flow AI', icon: <Icons.Sparkles size={22}/> },
  { id: 'stats', label: 'Fortschritt', icon: <Icons.Chart size={22}/> },
  { id: 'settings', label: 'Einstellungen', icon: <Icons.Settings size={22}/> },
];

const LernsetDetail = () => (
  <div className="dot-paper" style={{ minHeight: '100vh' }}>
    <Header/>
    <SetHero/>
    <CardsList/>
    <FakeCollabCursor/>
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 60 }}>
      <Dock items={DOCK_ITEMS} active="cards"/>
    </div>
    <AIAssistant/>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(<LernsetDetail/>);
