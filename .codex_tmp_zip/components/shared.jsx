// StudyFlow — Shared UI Primitives
// Icons, doodles, dock, AI assistant, sticky notes, live cursors

// ═══════════════════════════════════════════════════════════════
// ICONS (feather-style, 1.75 stroke)
// ═══════════════════════════════════════════════════════════════
const Icon = ({ d, size = 20, stroke = 1.75, fill = "none", children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {d && <path d={d} />}
    {children}
  </svg>
);

const Icons = {
  Home: (p) => <Icon {...p}><path d="M3 12l9-9 9 9"/><path d="M5 10v10h14V10"/></Icon>,
  Cards: (p) => <Icon {...p}><rect x="3" y="5" width="14" height="14" rx="2"/><path d="M7 9h6M7 13h4"/><path d="M17 7l4 1-2 13-4-1"/></Icon>,
  Sparkles: (p) => <Icon {...p}><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="M19 14l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" strokeWidth="1.3"/></Icon>,
  Users: (p) => <Icon {...p}><circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6"/><circle cx="17" cy="7" r="2.5" strokeWidth="1.3"/><path d="M16 14c3 0 6 2 6 5" strokeWidth="1.3"/></Icon>,
  Upload: (p) => <Icon {...p}><path d="M12 15V4"/><path d="M7 9l5-5 5 5"/><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></Icon>,
  Doc: (p) => <Icon {...p}><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/></Icon>,
  Search: (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></Icon>,
  Plus: (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>,
  Settings: (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 008.91 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 8.91a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></Icon>,
  Chart: (p) => <Icon {...p}><path d="M3 3v18h18"/><path d="M7 14l4-4 4 3 6-7"/></Icon>,
  Clock: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>,
  Play: (p) => <Icon {...p}><path d="M6 4l14 8-14 8V4z" fill="currentColor"/></Icon>,
  Check: (p) => <Icon {...p}><path d="M5 12l5 5L20 7"/></Icon>,
  X: (p) => <Icon {...p}><path d="M6 6l12 12M18 6l-12 12"/></Icon>,
  ArrowRight: (p) => <Icon {...p}><path d="M5 12h14M13 5l7 7-7 7"/></Icon>,
  ArrowLeft: (p) => <Icon {...p}><path d="M19 12H5M11 19l-7-7 7-7"/></Icon>,
  Chevron: (p) => <Icon {...p}><path d="M9 6l6 6-6 6"/></Icon>,
  Brain: (p) => <Icon {...p}><path d="M9.5 3A3.5 3.5 0 006 6.5V7a3 3 0 00-1 5.83V14a3 3 0 003 3v1a3 3 0 006 0v-1a3 3 0 003-3v-1.17A3 3 0 0018 7v-.5A3.5 3.5 0 0014.5 3a3.5 3.5 0 00-5 0z"/><path d="M12 7v10" strokeWidth="1.2"/></Icon>,
  Bolt: (p) => <Icon {...p}><path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z"/></Icon>,
  Star: (p) => <Icon {...p}><path d="M12 3l2.8 6 6.2.8-4.5 4.4 1.1 6.3L12 17.5 6.4 20.5l1.1-6.3L3 9.8 9.2 9z"/></Icon>,
  Bell: (p) => <Icon {...p}><path d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 004 0"/></Icon>,
  Bookmark: (p) => <Icon {...p}><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></Icon>,
  Share: (p) => <Icon {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></Icon>,
  Folder: (p) => <Icon {...p}><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></Icon>,
  MoreH: (p) => <Icon {...p}><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></Icon>,
  Edit: (p) => <Icon {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 113 3L7 19l-4 1 1-4z"/></Icon>,
  Trash: (p) => <Icon {...p}><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></Icon>,
  Flip: (p) => <Icon {...p}><path d="M3 12a9 9 0 0115-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 01-15 6.7L3 16"/><path d="M3 21v-5h5"/></Icon>,
  Eye: (p) => <Icon {...p}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></Icon>,
  Lock: (p) => <Icon {...p}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></Icon>,
  Mail: (p) => <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></Icon>,
  Google: (p) => (
    <svg width={p?.size||20} height={p?.size||20} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  ),
  Logo: (p) => (
    <svg width={p?.size||28} height={p?.size||28} viewBox="0 0 40 40" fill="none">
      <rect x="4" y="4" width="28" height="32" rx="3" fill="#fafaf7" stroke="#1e293b" strokeWidth="2"/>
      <rect x="8" y="4" width="24" height="32" rx="3" fill="#fff" stroke="#1e293b" strokeWidth="2"/>
      <path d="M12 14h14M12 19h14M12 24h9" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="30" cy="11" r="5" fill="#6366f1"/>
      <path d="M27.5 11l2 2 3-3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════
// DOODLES (hand-drawn SVG decorations)
// ═══════════════════════════════════════════════════════════════
const Doodles = {
  Underline: ({ color = "#6366f1", w = 120 }) => (
    <svg width={w} height="10" viewBox="0 0 120 10" fill="none" style={{display:'block'}}>
      <path d="M2 6 Q 30 2, 60 5 T 118 4" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  Wave: ({ color = "#6366f1", w = 120 }) => (
    <svg width={w} height="8" viewBox="0 0 120 8" fill="none">
      <path d="M1 4 Q 10 1, 20 4 T 40 4 T 60 4 T 80 4 T 100 4 T 119 4" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  Circle: ({ color = "#6366f1", size = 80 }) => (
    <svg width={size} height={size*0.5} viewBox="0 0 100 50" fill="none">
      <path d="M10 25 Q 10 5, 50 6 Q 92 6, 92 25 Q 92 44, 50 44 Q 10 44, 12 26" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  Arrow: ({ color = "#6366f1", w = 60, flip = false }) => (
    <svg width={w} height={w*0.6} viewBox="0 0 60 36" fill="none" style={{transform: flip ? 'scaleX(-1)' : 'none'}}>
      <path d="M4 18 Q 20 8, 50 16" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M42 10 L 52 16 L 44 22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  Star: ({ color = "#6366f1", size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M10 2 L 11.8 7.2 L 17.5 7.5 L 13 11 L 14.5 16.5 L 10 13.5 L 5.5 16.5 L 7 11 L 2.5 7.5 L 8.2 7.2 Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  Sparkle: ({ color = "#6366f1", size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M7 1 L 8 6 L 13 7 L 8 8 L 7 13 L 6 8 L 1 7 L 6 6 Z" fill={color}/>
    </svg>
  ),
  Squiggle: ({ color = "#6366f1", w = 100 }) => (
    <svg width={w} height="14" viewBox="0 0 100 14" fill="none">
      <path d="M2 7 Q 8 2, 14 7 T 26 7 T 38 7 T 50 7 T 62 7 T 74 7 T 86 7 T 98 7" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  Paperclip: ({ color = "#64748b", size = 28 }) => (
    <svg width={size} height={size*1.6} viewBox="0 0 28 44" fill="none">
      <path d="M10 4 Q 4 4, 4 12 L 4 32 Q 4 40, 14 40 Q 24 40, 24 32 L 24 10 Q 24 6, 18 6 Q 12 6, 12 10 L 12 30 Q 12 34, 15 34 Q 18 34, 18 30 L 18 14" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════
// DOT PAPER BACKGROUND
// ═══════════════════════════════════════════════════════════════
const DotPaper = ({ children, className = "", style = {}, ...rest }) => (
  <div className={`dot-paper ${className}`} style={{ minHeight: '100%', ...style }} {...rest}>
    {children}
  </div>
);

// ═══════════════════════════════════════════════════════════════
// STICKY NOTE
// ═══════════════════════════════════════════════════════════════
const StickyNote = ({ color = "yellow", rotate = -1.5, children, tape = false, style = {} }) => (
  <div className={`sticky-note ${color}`} style={{ transform: `rotate(${rotate}deg)`, ...style }}>
    {tape && <div className="tape"></div>}
    {children}
  </div>
);

// ═══════════════════════════════════════════════════════════════
// DOCK (magic-ui inspired, with magnification)
// ═══════════════════════════════════════════════════════════════
const Dock = ({ items, active, onSelect }) => {
  return (
    <div className="dock">
      {items.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            className={`dock-item ${isActive ? 'active' : ''}`}
            onClick={() => onSelect && onSelect(item.id)}
            type="button"
          >
            {item.icon}
            <span className="tooltip">{item.label}</span>
            {item.badge && (
              <span style={{
                position: 'absolute', top: -3, right: -3,
                background: '#6366f1', color: 'white',
                fontSize: 9.5, fontWeight: 600,
                minWidth: 14, height: 14, padding: '0 4px',
                borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid white',
              }}>{item.badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// AVATAR
// ═══════════════════════════════════════════════════════════════
const AVATAR_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#06b6d4', '#8b5cf6'];
const Avatar = ({ name, size = 32, color, ring = false }) => {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  const bg = color || AVATAR_COLORS[idx];
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: bg,
      color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4,
      fontWeight: 600,
      fontFamily: 'Instrument Sans',
      border: ring ? `2px solid white` : 'none',
      boxShadow: ring ? '0 0 0 1.5px rgba(15,23,42,0.1)' : 'none',
      flexShrink: 0,
    }}>{initials}</div>
  );
};

// ═══════════════════════════════════════════════════════════════
// LIVE CURSOR
// ═══════════════════════════════════════════════════════════════
const LiveCursor = ({ x, y, name, color }) => (
  <div className="live-cursor" style={{ transform: `translate(${x}px, ${y}px)` }}>
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M5.5 3.5 L 5.5 17 L 9 13.5 L 11.5 18.5 L 13.5 17.5 L 11 12.5 L 16 12.5 Z"
        fill={color} stroke="white" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
    <div className="live-cursor-label" style={{ background: color }}>{name}</div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// COLLAB AVATARS BAR (top-right, Figma-style)
// ═══════════════════════════════════════════════════════════════
const CollabAvatars = ({ users }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
    {users.map((u, i) => (
      <div key={u.name} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: users.length - i }}>
        <Avatar name={u.name} color={u.color} size={30} ring />
      </div>
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════════════
// FLOATING AI ASSISTANT (bottom-right, magic)
// ═══════════════════════════════════════════════════════════════
const AIAssistant = ({ defaultOpen = false, context = "" }) => {
  const [open, setOpen] = React.useState(defaultOpen);
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState([
    { role: 'ai', text: context || 'Hi! Ich bin Flow — deine AI-Lernassistentin. Frag mich alles, oder lass mich eine Zusammenfassung oder neue Karten erstellen.' }
  ]);

  const suggestions = [
    "Erstell 10 Karten zu diesem Thema",
    "Fass das Dokument zusammen",
    "Quiz mich zu meinen schwachen Karten",
  ];

  const send = (text) => {
    const t = text || input;
    if (!t.trim()) return;
    setMessages(m => [...m, { role: 'user', text: t }]);
    setInput("");
    setTimeout(() => {
      setMessages(m => [...m, { role: 'ai', text: 'Ich überlege… (in der finalen App ruft dies die AI-API auf und streamt die Antwort)' }]);
    }, 600);
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="float"
          style={{
            position: 'fixed', bottom: 28, right: 28, zIndex: 80,
            width: 58, height: 58, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white',
            boxShadow: '0 8px 24px rgba(99,102,241,0.4), 0 2px 6px rgba(99,102,241,0.3)',
          }}
        >
          <div className="pulse-ring" style={{ position: 'absolute', inset: 0, borderRadius: '50%' }}></div>
          <Icons.Sparkles size={26} />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 80,
          width: 380, height: 520,
          background: '#fafaf7',
          backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)',
          backgroundSize: '14px 14px',
          borderRadius: 20,
          boxShadow: '0 20px 60px rgba(15,23,42,0.2), 0 4px 12px rgba(15,23,42,0.08)',
          border: '1px solid rgba(15,23,42,0.08)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(15,23,42,0.06)', background: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
              }}>
                <Icons.Sparkles size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>Flow</div>
                <div style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}></span>
                  Bereit zu helfen
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', padding: 6, borderRadius: 6, cursor: 'pointer', color: '#64748b' }}>
              <Icons.X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: m.role === 'user' ? '#1e293b' : 'white',
                color: m.role === 'user' ? 'white' : '#1e293b',
                fontSize: 13.5, lineHeight: 1.5,
                boxShadow: m.role === 'ai' ? '0 1px 2px rgba(15,23,42,0.06)' : 'none',
                border: m.role === 'ai' ? '1px solid rgba(15,23,42,0.05)' : 'none',
              }}>{m.text}</div>
            ))}
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div style={{ padding: '0 16px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {suggestions.map(s => (
                <button key={s} onClick={() => send(s)} style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  background: 'white',
                  border: '1px solid rgba(15,23,42,0.08)',
                  borderRadius: 10,
                  fontSize: 12.5, color: '#475569',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <Icons.Sparkles size={12} />
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: 12, borderTop: '1px solid rgba(15,23,42,0.06)', background: 'white', display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Frag Flow etwas…"
              style={{
                flex: 1, padding: '9px 12px', border: '1px solid #e2e8f0',
                borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: 'inherit'
              }}
            />
            <button onClick={() => send()} style={{
              padding: '0 14px', background: '#1e293b', color: 'white',
              border: 'none', borderRadius: 10, cursor: 'pointer',
              display: 'flex', alignItems: 'center',
            }}>
              <Icons.ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════
// FLASHCARD
// ═══════════════════════════════════════════════════════════════
const Flashcard = ({ front, back, flipped, onFlip, w = 560, h = 340, rotate = 0 }) => (
  <div
    className={`flashcard ${flipped ? 'flipped' : ''}`}
    onClick={onFlip}
    style={{ width: w, height: h, cursor: 'pointer', transform: `rotate(${rotate}deg)` }}
  >
    <div className="flashcard-inner">
      <div className="flashcard-face" style={{
        background: 'white',
        boxShadow: '0 2px 4px rgba(15,23,42,0.06), 0 16px 40px rgba(15,23,42,0.1)',
        border: '1px solid rgba(15,23,42,0.06)',
      }}>
        <div style={{ position: 'absolute', top: 18, left: 20, fontSize: 11, color: '#64748b', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Frage</div>
        <div style={{ position: 'absolute', top: 16, right: 20, color: '#cbd5e1' }}>
          <Icons.Flip size={16} />
        </div>
        <div style={{ fontSize: 30, fontFamily: 'Caveat, cursive', fontWeight: 500, color: '#0f172a', textAlign: 'center', lineHeight: 1.25, maxWidth: '85%' }}>
          {front}
        </div>
      </div>
      <div className="flashcard-face back" style={{
        background: '#eef2ff',
        boxShadow: '0 2px 4px rgba(99,102,241,0.08), 0 16px 40px rgba(99,102,241,0.18)',
        border: '1px solid #c7d2fe',
      }}>
        <div style={{ position: 'absolute', top: 18, left: 20, fontSize: 11, color: '#4f46e5', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Antwort</div>
        <div style={{ fontSize: 22, fontFamily: 'Instrument Sans', color: '#1e293b', textAlign: 'center', lineHeight: 1.45, maxWidth: '85%' }}>
          {back}
        </div>
      </div>
    </div>
  </div>
);

// Export to window so other babel scripts can use
Object.assign(window, { Icon, Icons, Doodles, DotPaper, StickyNote, Dock, Avatar, CollabAvatars, LiveCursor, AIAssistant, Flashcard, AVATAR_COLORS });
