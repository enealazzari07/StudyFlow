// StudyFlow — Collaboration Screen (live co-editing a study set)
const { useState, useEffect, useRef } = React;

const ONLINE_USERS = [
  { name: 'Alex Meier', color: '#6366f1', you: true },
  { name: 'Lara K', color: '#ec4899', editing: 'card-3' },
  { name: 'Tim R', color: '#f59e0b', viewing: 'card-7' },
  { name: 'Noah W', color: '#10b981', editing: 'card-5' },
];

const ACTIVITY = [
  { user: 'Lara K', color: '#ec4899', action: 'hat Karte "Giffen-Gut" bearbeitet', time: 'jetzt' },
  { user: 'Tim R', color: '#f59e0b', action: 'hat 3 Karten aus VL07.pdf hinzugefügt', time: 'vor 2 Min' },
  { user: 'Noah W', color: '#10b981', action: 'hat kommentiert: "Das stimmt so nicht..."', time: 'vor 5 Min' },
  { user: 'Lara K', color: '#ec4899', action: 'hat das Set mit 2 Personen geteilt', time: 'vor 12 Min' },
];

const COLLAB_CARDS = [
  { id: 'card-1', q: 'Was ist das BIP?', a: 'Bruttoinlandsprodukt — Gesamtwert aller in einer Volkswirtschaft produzierten Waren und Dienstleistungen.', lockedBy: null },
  { id: 'card-3', q: 'Definiere das Gesetz des abnehmenden Grenznutzens.', a: 'Der Nutzen jeder weiteren Einheit nimmt ab…', lockedBy: 'Lara K', lockColor: '#ec4899' },
  { id: 'card-5', q: 'Marktversagen — drei Ursachen?', a: 'Externe Effekte, öffentliche Güter, Informationsasymmetrien.', lockedBy: 'Noah W', lockColor: '#10b981', hasComment: true },
  { id: 'card-7', q: 'Unterschied Substitutions- vs. Einkommenseffekt?', a: 'Substitutionseffekt: Wechsel zu relativ günstigerem Gut…', viewedBy: 'Tim R', viewColor: '#f59e0b' },
];

const Header = () => (
  <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 28px', background: 'white', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <a href="dashboard.html" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13 }}>
        <Icons.ArrowLeft size={14}/> Dashboard
      </a>
      <div style={{ height: 20, width: 1, background: '#e2e8f0' }}></div>
      <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 26, height: 26, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#eef2ff', color: '#6366f1', border: '1px solid #c7d2fe' }}>
          <Icons.Chart size={14}/>
        </span>
        Mikroökonomie II
      </div>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', background: '#d1fae5', color: '#065f46', borderRadius: 999, fontSize: 11, fontWeight: 500 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}></span>
        Live · 4 online
      </span>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {/* Online avatars */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {ONLINE_USERS.map((u, i) => (
          <div key={u.name} title={u.name} style={{ marginLeft: i === 0 ? 0 : -8, position: 'relative' }}>
            <Avatar name={u.name} color={u.color} size={30} ring/>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, borderRadius: '50%', background: '#10b981', border: '2px solid white' }}></div>
          </div>
        ))}
      </div>
      <button className="btn-primary" style={{ padding: '7px 14px', fontSize: 13 }}>
        <Icons.Share size={13}/> Einladen
      </button>
    </div>
  </header>
);

const EditingCard = ({ card }) => {
  const isLocked = !!card.lockedBy;
  const isViewed = !!card.viewedBy;
  return (
    <div style={{
      position: 'relative',
      background: 'white',
      borderRadius: 12,
      padding: 20,
      border: isLocked ? `2px solid ${card.lockColor}` : (isViewed ? `1.5px dashed ${card.viewColor}` : '1px solid rgba(15,23,42,0.06)'),
      boxShadow: isLocked ? `0 0 0 4px ${card.lockColor}15` : '0 1px 2px rgba(15,23,42,0.04)',
      transition: 'all 0.2s',
    }}>
      {/* Lock indicator (someone editing) */}
      {isLocked && (
        <div style={{
          position: 'absolute', top: -12, left: 16,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '3px 10px',
          background: card.lockColor,
          color: 'white',
          borderRadius: 999,
          fontSize: 11, fontWeight: 500,
          boxShadow: '0 2px 6px rgba(15,23,42,0.15)',
        }}>
          <Avatar name={card.lockedBy} color={card.lockColor} size={16}/>
          {card.lockedBy} bearbeitet…
        </div>
      )}

      {/* Viewing indicator */}
      {isViewed && (
        <div style={{
          position: 'absolute', top: -10, right: 16,
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '2px 8px',
          background: 'white',
          color: card.viewColor,
          border: `1px solid ${card.viewColor}`,
          borderRadius: 999,
          fontSize: 10.5, fontWeight: 500,
        }}>
          <Icons.Eye size={10}/> {card.viewedBy} schaut zu
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Frage</div>
          <div style={{ fontFamily: 'Caveat', fontSize: 21, fontWeight: 500, color: '#0f172a', lineHeight: 1.25 }}>
            {card.q}
            {isLocked && <span style={{ display: 'inline-block', width: 2, height: 20, background: card.lockColor, marginLeft: 2, verticalAlign: 'middle', animation: 'blink 1s infinite' }}></span>}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Antwort</div>
          <div style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.5 }}>{card.a}</div>
        </div>
      </div>

      {card.hasComment && (
        <div style={{ marginTop: 14, padding: '10px 14px', background: '#fef3c7', borderRadius: 10, display: 'flex', gap: 10, border: '1px solid #fde68a' }}>
          <Avatar name="Noah W" color="#10b981" size={24}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#0f172a' }}>
              Noah W <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: 11 }}>· vor 5 Min</span>
            </div>
            <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>
              Das stimmt so nicht — Informationsasymmetrien sind ein Marktversagen, aber nicht immer. Quelle: Mankiw Kap. 11
            </div>
          </div>
          <button style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#475569', fontFamily: 'inherit', cursor: 'pointer' }}>
            Antworten
          </button>
        </div>
      )}
    </div>
  );
};

const ActivityPanel = () => (
  <aside style={{ width: 300, flexShrink: 0, padding: 20, background: 'white', borderLeft: '1px solid rgba(15,23,42,0.06)', display: 'flex', flexDirection: 'column', gap: 20 }}>
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Aktivität</div>
        <span className="pill" style={{ fontSize: 10 }}>Live</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {ACTIVITY.map((a, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, position: 'relative' }}>
            {i < ACTIVITY.length - 1 && <div style={{ position: 'absolute', left: 12, top: 30, bottom: -14, width: 1, background: '#e2e8f0' }}></div>}
            <Avatar name={a.user} color={a.color} size={24}/>
            <div style={{ flex: 1, paddingTop: 2 }}>
              <div style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.4 }}>
                <span style={{ fontWeight: 500, color: '#0f172a' }}>{a.user}</span> {a.action}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{a.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div style={{ marginTop: 'auto', padding: 14, background: '#fafaf7', borderRadius: 12, border: '1px solid rgba(15,23,42,0.04)' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Chat</div>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <Avatar name="Tim R" color="#f59e0b" size={22}/>
          <div style={{ background: 'white', padding: '6px 10px', borderRadius: '10px 10px 10px 2px', fontSize: 12, color: '#334155', border: '1px solid rgba(15,23,42,0.04)' }}>
            Soll ich Kap. 11 übernehmen?
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', justifyContent: 'flex-end' }}>
          <div style={{ background: '#1e293b', padding: '6px 10px', borderRadius: '10px 10px 2px 10px', fontSize: 12, color: 'white' }}>
            Jep, ich mach Kap. 12
          </div>
          <Avatar name="Alex Meier" color="#6366f1" size={22}/>
        </div>
      </div>
      <input
        className="input-paper"
        placeholder="Nachricht…"
        style={{ marginTop: 10, fontSize: 12, padding: '7px 10px' }}
      />
    </div>
  </aside>
);

const FakeCursors = () => {
  const [cursors, setCursors] = useState([
    { name: 'Lara K', color: '#ec4899', x: 480, y: 360 },
    { name: 'Tim R', color: '#f59e0b', x: 820, y: 620 },
    { name: 'Noah W', color: '#10b981', x: 620, y: 520 },
  ]);

  useEffect(() => {
    const iv = setInterval(() => {
      setCursors(cs => cs.map(c => ({
        ...c,
        x: Math.max(280, Math.min(1000, c.x + (Math.random() - 0.5) * 80)),
        y: Math.max(220, Math.min(760, c.y + (Math.random() - 0.5) * 60)),
      })));
    }, 900);
    return () => clearInterval(iv);
  }, []);

  return <>{cursors.map(c => <LiveCursor key={c.name} {...c}/>)}</>;
};

const Collab = () => (
  <div className="dot-paper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
    <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
    <Header/>
    <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
      <main style={{ flex: 1, padding: '28px 32px 100px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
          <h1 style={{ fontFamily: 'Instrument Sans', fontSize: 26, fontWeight: 600, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Gemeinsam bearbeiten
          </h1>
          <span style={{ fontFamily: 'Caveat', fontSize: 22, color: '#6366f1', fontWeight: 600 }}>— live!</span>
        </div>
        <div style={{ fontSize: 13.5, color: '#64748b', marginBottom: 24 }}>
          Änderungen erscheinen in Echtzeit. Wenn jemand eine Karte bearbeitet, wird sie für andere gesperrt.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {COLLAB_CARDS.map(c => <EditingCard key={c.id} card={c}/>)}
        </div>

        {/* Add card prompt */}
        <button style={{
          marginTop: 14, width: '100%', padding: 14,
          background: 'transparent', border: '1.5px dashed #cbd5e1',
          borderRadius: 12, color: '#64748b', fontSize: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <Icons.Plus size={14}/> Karte hinzufügen
        </button>

        <FakeCursors/>
      </main>
      <ActivityPanel/>
    </div>
    <AIAssistant context="Hallo! Ich sehe, ihr arbeitet gemeinsam. Ich kann Vorschläge zu euren Karten geben, oder Widersprüche erkennen."/>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(<Collab/>);
