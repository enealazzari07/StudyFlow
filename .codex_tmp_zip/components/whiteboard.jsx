// StudyFlow — Whiteboard (Miro-style)
const { useState, useRef, useEffect } = React;

// ─── Tool definitions ─────────────────────────────────────────
const TOOLS = [
  { id: 'select', label: 'Auswählen', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l14 8-6 2-2 6z"/></svg>
  ) },
  { id: 'pan', label: 'Verschieben', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11V5a2 2 0 014 0v6"/><path d="M9 11V8a2 2 0 00-4 0v6c0 4 3 7 7 7s7-3 7-7v-3a2 2 0 00-4 0v-1a2 2 0 00-4 0"/></svg>
  ) },
  { id: 'pen', label: 'Stift', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7H12v-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18z"/></svg>
  ), hasColor: true },
  { id: 'highlight', label: 'Marker', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l-6 6v3h3l6-6"/><path d="M14 4l6 6-9 9-6-6z" fill="#fef3a0" stroke="currentColor"/></svg>
  ) },
  { id: 'eraser', label: 'Radierer', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20H7l-4-4 9-9 8 8z"/><path d="M16 16l-7-7"/></svg>
  ) },
  { id: 'note', label: 'Notiz', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" fill="#fef3a0"/><path d="M14 14l4 4M14 18l4-4" strokeWidth="1"/></svg>
  ) },
  { divider: true },
  { id: 'rect', label: 'Rechteck', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="6" width="16" height="12" rx="1"/></svg>
  ) },
  { id: 'circle', label: 'Kreis', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8"/></svg>
  ) },
  { id: 'text', label: 'Text', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5 5h14M12 5v14"/></svg>
  ) },
  { id: 'image', label: 'Bild', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 15l-5-5L4 20"/></svg>
  ) },
  { id: 'frame', label: 'Frame', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 7H3M5 17H3M19 7h2M19 17h2M7 5V3M17 5V3M7 21v-2M17 21v-2"/><rect x="5" y="5" width="14" height="14" rx="1"/></svg>
  ) },
  { id: 'sticker', label: 'Sticker', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3H6a3 3 0 00-3 3v12a3 3 0 003 3h9l6-6V6a3 3 0 00-3-3z"/><path d="M15 21v-4a2 2 0 012-2h4"/></svg>
  ) },
  { id: 'shapes', label: 'Formen', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><circle cx="7" cy="8" r="4"/><path d="M16 4l5 8h-10z"/><rect x="3" y="14" width="8" height="7" rx="1"/><path d="M17 14l4 4-4 4-4-4z"/></svg>
  ) },
  { id: 'connector', label: 'Verbinder', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 7l10 10"/></svg>
  ) },
  { divider: true },
  { id: 'comment', label: 'Kommentar', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H8l-5 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
  ) },
  { id: 'more', label: 'Mehr', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
  ) },
];

const COLORS = ['#0f172a', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7'];

// ─── Templates panel ──────────────────────────────────────────
const TEMPLATES = [
  { name: 'Mind Map', desc: 'Brainstorming für ein Thema', icon: '🧠' },
  { name: 'Flussdiagramm', desc: 'Prozess oder Ablauf visualisieren', icon: '📊' },
  { name: 'Eisenhower-Matrix', desc: 'Aufgaben nach Wichtigkeit sortieren', icon: '🗂️' },
  { name: 'Gantt-Diagramm', desc: 'Projekt-Zeitplan mit Meilensteinen', icon: '📅' },
  { name: 'Lern-Karteikarten', desc: 'Karten gruppieren und verbinden', icon: '🃏' },
  { name: 'Klausur-Plan', desc: 'Wochenplan zur Klausur-Vorbereitung', icon: '📚' },
];

const STICKERS = ['⭐', '✅', '❗', '💡', '🔥', '🎯', '📌', '✏️', '🤔', '👍', '❤️', '🚀', '🏆', '⚡', '📝', '🎉'];

const TemplatesPanel = ({ onClose }) => (
  <div style={{
    position: 'absolute', right: 18, top: 70, bottom: 110,
    width: 320,
    background: 'white',
    borderRadius: 14,
    border: '1px solid rgba(15,23,42,0.08)',
    boxShadow: '0 8px 28px rgba(15,23,42,0.12), 0 1px 3px rgba(15,23,42,0.06)',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 30,
  }}>
    <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Erstelle Vorlagen und Diagramme</div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6l-12 12"/></svg>
      </button>
    </div>

    <div style={{ padding: 14 }}>
      <div style={{
        background: '#fafbfc', border: '1px solid rgba(15,23,42,0.06)',
        borderRadius: 10, padding: '10px 12px',
        fontSize: 12.5, color: '#94a3b8',
        minHeight: 80,
      }}>
        Erstellen wir eine…
      </div>
    </div>

    <div style={{ padding: '0 14px 14px', overflowY: 'auto', flex: 1 }}>
      {TEMPLATES.map(t => (
        <div key={t.name} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 8px', borderRadius: 8,
          cursor: 'pointer',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}>{t.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, color: '#0f172a' }}>
              <span style={{ fontWeight: 600 }}>{t.name}</span> <span style={{ color: '#64748b' }}>{t.desc}</span>
            </div>
          </div>
        </div>
      ))}
    </div>

    <div style={{ padding: 12, borderTop: '1px solid rgba(15,23,42,0.06)', display: 'flex', justifyContent: 'flex-end' }}>
      <button style={{
        padding: '6px 12px', background: '#a5b4fc', color: 'white',
        border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 500,
        cursor: 'pointer', fontFamily: 'inherit', opacity: 0.7,
      }}>
        Erzeugen ↑
      </button>
    </div>
  </div>
);

const StickersPanel = ({ onClose, onPick }) => (
  <div style={{
    position: 'absolute', bottom: 78, left: '50%', transform: 'translateX(-50%)',
    background: 'white',
    borderRadius: 14,
    border: '1px solid rgba(15,23,42,0.08)',
    boxShadow: '0 8px 28px rgba(15,23,42,0.12)',
    padding: 12,
    width: 280,
    zIndex: 30,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>Sticker</div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6l-12 12"/></svg>
      </button>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4 }}>
      {STICKERS.map(s => (
        <button key={s} onClick={() => onPick(s)} style={{
          padding: 6, background: 'transparent', border: '1px solid transparent',
          borderRadius: 6, fontSize: 18, cursor: 'pointer',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
        >{s}</button>
      ))}
    </div>
  </div>
);

// ─── Canvas content (mock) ────────────────────────────────────
const CanvasContent = ({ stickers }) => (
  <>
    {/* Sample placed elements to make canvas feel real */}
    <div style={{ position: 'absolute', left: 180, top: 120, width: 180, padding: '14px 14px 16px', background: '#fef3a0', borderRadius: 4, boxShadow: '2px 3px 0 rgba(15,23,42,0.05), 0 8px 20px rgba(15,23,42,0.08)', transform: 'rotate(-1.5deg)', fontFamily: 'Caveat', fontSize: 18, color: '#0f172a', lineHeight: 1.3 }}>
      Mikro-Klausur<br/>Thema: Marktversagen
    </div>
    <div style={{ position: 'absolute', left: 420, top: 200, width: 160, padding: '14px 14px 16px', background: '#bfdbfe', borderRadius: 4, boxShadow: '2px 3px 0 rgba(15,23,42,0.05), 0 8px 20px rgba(15,23,42,0.08)', transform: 'rotate(2deg)', fontFamily: 'Caveat', fontSize: 18, color: '#0f172a', lineHeight: 1.3 }}>
      Externe Effekte<br/>(VL07, S. 12)
    </div>
    <div style={{ position: 'absolute', left: 240, top: 320, padding: '10px 16px', background: 'white', border: '2px solid #6366f1', borderRadius: 999, fontSize: 13, fontWeight: 500, color: '#4f46e5' }}>
      Hauptthema
    </div>

    {/* Connector */}
    <svg style={{ position: 'absolute', left: 200, top: 180, pointerEvents: 'none' }} width="280" height="180">
      <path d="M30 20 Q 100 80, 220 100" stroke="#94a3b8" strokeWidth="2" fill="none" strokeDasharray="4 4"/>
    </svg>

    {/* Drawn line */}
    <svg style={{ position: 'absolute', left: 580, top: 140, pointerEvents: 'none' }} width="220" height="180">
      <path d="M10 80 Q 60 10, 120 60 T 210 100" stroke="#ec4899" strokeWidth="3" fill="none" strokeLinecap="round"/>
    </svg>

    {/* Placed stickers */}
    {stickers.map((s, i) => (
      <div key={i} style={{ position: 'absolute', left: s.x, top: s.y, fontSize: 32, transform: `rotate(${s.r}deg)`, filter: 'drop-shadow(2px 3px 4px rgba(15,23,42,0.15))' }}>{s.emoji}</div>
    ))}
  </>
);

// ─── Main ─────────────────────────────────────────────────────
const Whiteboard = () => {
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#0f172a');
  const [showTemplates, setShowTemplates] = useState(true);
  const [showStickers, setShowStickers] = useState(false);
  const [stickers, setStickers] = useState([
    { emoji: '⭐', x: 720, y: 280, r: 12 },
    { emoji: '💡', x: 380, y: 380, r: -8 },
  ]);

  const placeSticker = (emoji) => {
    setStickers(s => [...s, {
      emoji,
      x: 400 + Math.random() * 400,
      y: 200 + Math.random() * 250,
      r: (Math.random() - 0.5) * 30,
    }]);
    setShowStickers(false);
  };

  return (
    <div style={{ height: '100vh', overflow: 'hidden', position: 'relative', background: '#fafaf7' }}>
      {/* Dot canvas */}
      <div className="dot-paper" style={{ position: 'absolute', inset: 0, backgroundColor: '#fafaf7' }}>
        <CanvasContent stickers={stickers}/>
      </div>

      {/* Top-left: Logo + file info */}
      <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', alignItems: 'center', gap: 8, background: 'white', borderRadius: 10, padding: '6px 10px 6px 8px', border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 1px 2px rgba(15,23,42,0.04)', zIndex: 20 }}>
        <a href="dashboard.html" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 8, borderRight: '1px solid #e2e8f0' }}>
          <Icons.Logo size={22}/>
          <span style={{ fontFamily: 'Caveat', fontSize: 18, fontWeight: 600, color: '#0f172a' }}>StudyFlow</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 4 }}>
          <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>Ohne Namen</span>
          <span style={{ fontSize: 10.5, color: '#a78bfa', background: '#f3e8ff', padding: '1px 6px', borderRadius: 4, fontWeight: 500 }}>Kostenlos</span>
        </div>
        <div style={{ width: 1, height: 18, background: '#e2e8f0', margin: '0 4px' }}></div>
        <button style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: '#64748b', display: 'flex', borderRadius: 4 }} title="Duplizieren">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        </button>
      </div>

      {/* Top-right: collab + share */}
      <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 8, zIndex: 20 }}>
        <button style={{ background: 'white', border: '1px solid rgba(15,23,42,0.08)', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#475569', fontFamily: 'inherit' }}>
          <Avatar name="Carla" color="#06b6d4" size={22}/>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <button style={{ background: 'white', border: '1px solid rgba(15,23,42,0.08)', padding: 7, borderRadius: 8, cursor: 'pointer', color: '#475569', display: 'flex' }} title="Kommentare">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H8l-5 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        </button>
        <div style={{ display: 'flex' }}>
          <Avatar name="Lara K" color="#ec4899" size={28} ring/>
          <div style={{ marginLeft: -6 }}><Avatar name="Tim R" color="#f59e0b" size={28} ring/></div>
        </div>
        <div style={{ background: 'white', border: '1px solid rgba(15,23,42,0.08)', padding: '6px 10px', borderRadius: 8, fontFamily: 'JetBrains Mono', fontSize: 11.5, color: '#475569', display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
          03:01
        </div>
        <button style={{
          padding: '7px 14px', background: '#8b5cf6', color: 'white',
          border: 'none', borderRadius: 8, fontSize: 12.5, fontWeight: 500,
          cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 1px 2px rgba(139,92,246,0.3)',
        }}>
          Teilen
        </button>
      </div>

      {/* Templates panel */}
      {showTemplates && <TemplatesPanel onClose={() => setShowTemplates(false)}/>}

      {/* "Mit einer Vorlage beginnen" tip */}
      {!showTemplates && (
        <div style={{ position: 'absolute', right: 30, top: 380, display: 'flex', alignItems: 'center', gap: 8, zIndex: 15 }}>
          <span style={{ fontSize: 22 }}>✨</span>
          <button onClick={() => setShowTemplates(true)} style={{ background: 'white', border: '1px solid rgba(15,23,42,0.08)', padding: '8px 14px', borderRadius: 999, fontSize: 13, color: '#0f172a', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
            Mit einer Vorlage beginnen <span style={{ color: '#94a3b8' }}>›</span>
          </button>
        </div>
      )}

      {/* Stickers panel */}
      {showStickers && <StickersPanel onClose={() => setShowStickers(false)} onPick={placeSticker}/>}

      {/* Toolbar (bottom-center) — color row + tools row */}
      <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 25, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        {/* Color row — visible only when pen/highlight active */}
        {(tool === 'pen' || tool === 'highlight') && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'white', borderRadius: 999,
            padding: '6px 10px',
            border: '1px solid rgba(15,23,42,0.06)',
            boxShadow: '0 4px 12px rgba(15,23,42,0.06)',
          }}>
            <div style={{ display: 'flex', gap: 3, paddingRight: 8, borderRight: '1px solid #e2e8f0' }}>
              {['#fef3a0', '#bfdbfe', '#fbcfe8', '#bbf7d0', '#fed7aa'].map(c => (
                <button key={c} onClick={() => setColor(c)} style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: color === c ? '2px solid #0f172a' : '1px solid rgba(15,23,42,0.1)', cursor: 'pointer', padding: 0 }} title="Pastell"/>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: c,
                  border: color === c ? '2px solid #0f172a' : '1px solid rgba(15,23,42,0.1)',
                  cursor: 'pointer', padding: 0,
                  outline: color === c ? '2px solid white' : 'none',
                  outlineOffset: -4,
                }} title={c}/>
              ))}
            </div>
            <button style={{ marginLeft: 6, width: 22, height: 22, borderRadius: '50%', border: '1px dashed #cbd5e1', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }} title="Eigene Farbe">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          </div>
        )}

        {/* Tools row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 1,
          background: 'white', borderRadius: 12,
          padding: 5,
          border: '1px solid rgba(15,23,42,0.06)',
          boxShadow: '0 6px 20px rgba(15,23,42,0.08), 0 1px 3px rgba(15,23,42,0.04)',
        }}>
          {TOOLS.map((t, i) => {
            if (t.divider) return <div key={`d${i}`} style={{ width: 1, height: 22, background: '#e2e8f0', margin: '0 4px' }}></div>;
            const isActive = tool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  if (t.id === 'sticker') { setShowStickers(s => !s); return; }
                  if (t.id === 'more') { setShowTemplates(s => !s); return; }
                  setTool(t.id);
                }}
                title={t.label}
                style={{
                  width: 34, height: 34, borderRadius: 8,
                  background: isActive ? '#0f172a' : 'transparent',
                  color: isActive ? 'white' : '#475569',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s, color 0.15s',
                  position: 'relative',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f1f5f9'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                {t.icon}
                {/* active triangle indicator */}
                {isActive && tool === 'pen' && (
                  <div style={{ position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: '4px solid #0f172a' }}></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom-right: zoom + help */}
      <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', gap: 6, zIndex: 20 }}>
        <div style={{ background: 'white', border: '1px solid rgba(15,23,42,0.06)', borderRadius: 8, display: 'flex', alignItems: 'center', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
          <button style={{ padding: 7, background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex' }} title="Verkleinern">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14"/></svg>
          </button>
          <span style={{ fontSize: 11.5, color: '#475569', fontFamily: 'JetBrains Mono', minWidth: 36, textAlign: 'center' }}>100%</span>
          <button style={{ padding: 7, background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex' }} title="Vergrößern">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>
        <button style={{ width: 30, height: 30, background: 'white', border: '1px solid rgba(15,23,42,0.06)', borderRadius: 8, cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontFamily: 'inherit' }} title="Hilfe">?</button>
      </div>

      {/* Bottom-left: layers */}
      <div style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 20 }}>
        <button style={{ background: 'white', border: '1px solid rgba(15,23,42,0.06)', padding: 8, borderRadius: 8, cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: 'inherit', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }} title="Ebenen">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        </button>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Whiteboard/>);
