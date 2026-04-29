const { useCallback, useEffect, useMemo, useRef, useState } = React;

const WB_MIME = 'application/studyflow-whiteboard+json';
const PALETTE = ['#0f172a', '#475569', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#ffffff'];
const PASTELS = ['#fef3a0', '#bfdbfe', '#fbcfe8', '#bbf7d0', '#fed7aa', '#e9d5ff', '#fecaca'];
const STICKY_THEMES = [
  { bg: '#fef3a0', border: '#eab308' },
  { bg: '#bfdbfe', border: '#3b82f6' },
  { bg: '#fbcfe8', border: '#ec4899' },
  { bg: '#bbf7d0', border: '#22c55e' },
  { bg: '#fed7aa', border: '#f97316' },
  { bg: '#e9d5ff', border: '#a855f7' },
];

const STICKER_CATEGORIES = [
  { name: 'Beliebt',    items: ['⭐', '✅', '❗', '💡', '🔥', '🎯', '📌', '🏆', '⚡', '💯', '✨', '💥'] },
  { name: 'Lernen',     items: ['📚', '📖', '✏️', '📝', '🎓', '🧠', '🔬', '💻', '📐', '🧮', '🖊️', '🔭', '📊', '📈', '📉', '🗂️'] },
  { name: 'Reaktionen', items: ['👍', '❤️', '🎉', '😍', '🙌', '👏', '🤔', '😎', '🥳', '💪', '🤩', '👋', '🫶', '🤯', '😅', '🙏'] },
  { name: 'Natur',      items: ['🚀', '💎', '🌈', '🌟', '🦋', '🎨', '🔮', '💫', '🌸', '🏅', '🍀', '🦄', '🌙', '🌺', '🌻', '⭐'] },
  { name: 'Status',     items: ['✔️', '❌', '⚠️', '❓', '🔄', '⏳', '🔒', '📍', '🆕', '🔑', '🚧', '🎖️', '📎', '🗝️', '🔓', '📬'] },
];

const TEMPLATES = [
  { id: 'mindmap',  name: 'Mind Map',          desc: 'Brainstorming für ein Thema',            icon: '🧠' },
  { id: 'flow',     name: 'Flussdiagramm',     desc: 'Prozess oder Ablauf visualisieren',      icon: '📊' },
  { id: 'matrix',   name: 'Eisenhower-Matrix', desc: 'Aufgaben nach Wichtigkeit sortieren',    icon: '🗂️' },
  { id: 'cards',    name: 'Lern-Karteikarten', desc: 'Karten gruppieren und verbinden',        icon: '🃏' },
  { id: 'swot',     name: 'SWOT-Analyse',      desc: 'Stärken, Schwächen, Chancen, Risiken',  icon: '🔍' },
  { id: 'timeline', name: 'Zeitleiste',         desc: 'Ereignisse chronologisch darstellen',   icon: '📅' },
  { id: 'cornell',  name: 'Cornell-Notizen',   desc: 'Strukturierte Mitschriften',             icon: '📋' },
  { id: 'kanban',   name: 'Kanban-Board',      desc: 'Aufgaben nach Status verwalten',         icon: '📌' },
];

const PEN_SIZES = [
  { id: 'thin',   label: 'Dünn',   size: 1.5, dot: 5  },
  { id: 'normal', label: 'Normal', size: 3,   dot: 9  },
  { id: 'thick',  label: 'Dick',   size: 7,   dot: 13 },
  { id: 'brush',  label: 'Pinsel', size: 18,  dot: 18 },
];

const LINE_STYLES = [
  { id: 'solid',  label: 'Durchgehend', dash: []     },
  { id: 'dashed', label: 'Gestrichelt', dash: [8, 5] },
  { id: 'dotted', label: 'Gepunktet',   dash: [2, 5] },
];

const ARROW_ENDS = [
  { id: 'none',  label: 'Keine Pfeile',    icon: '━' },
  { id: 'end',   label: 'Pfeil am Ende',   icon: '→' },
  { id: 'both',  label: 'Beide Pfeile',    icon: '↔' },
  { id: 'start', label: 'Pfeil am Start',  icon: '←' },
];

const SHORTCUT_MAP = {
  'v': 'select', 'h': 'pan', 'p': 'pen', 'm': 'highlight',
  'e': 'eraser', 'n': 'note', 'r': 'rect', 'c': 'circle',
  'a': 'arrow', 't': 'text', 'i': 'image', 'f': 'frame', 's': 'sticker',
};

const DEFAULT_BOARD = () => ({
  strokes: [],
  shapes: [],
  texts: [],
  notes: [],
  emojis: [],
  frames: [],
  comments: [],
  images: [],
});

const randomId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const clone = (value) => JSON.parse(JSON.stringify(value));
const dist2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

const ToolIcon = ({ children, size = 18 }) => (
  <Icon size={size} stroke={1.9}>
    {children}
  </Icon>
);

const TOOL_DEFS = {
  select:    { label: 'Auswählen (V)',  icon: <ToolIcon><path d="M5 3l13 8-6 2-2 6z" fill="currentColor" stroke="none"/></ToolIcon> },
  pan:       { label: 'Verschieben (H)',icon: <ToolIcon><path d="M9 11V5a2 2 0 0 1 4 0v6"/><path d="M9 11V8a2 2 0 0 0-4 0v6c0 4 3 7 7 7s7-3 7-7v-3a2 2 0 0 0-4 0v-1a2 2 0 0 0-4 0"/></ToolIcon> },
  pen:       { label: 'Stift (P)',      icon: <Icons.Edit size={18}/> },
  highlight: { label: 'Marker (M)',     icon: <ToolIcon><path d="M4 15l7-7 5 5-7 7H4z"/><path d="M13 6l2-2 5 5-2 2"/></ToolIcon> },
  eraser:    { label: 'Radierer (E)',   icon: <ToolIcon><path d="M20 20H7l-4-4 9-9 8 8z"/><path d="M16 16l-7-7"/></ToolIcon> },
  note:      { label: 'Notiz (N)',      icon: <ToolIcon><path d="M4 4h16v16H4z" rx="3"/><path d="M9 9h6M9 13h4"/></ToolIcon> },
  rect:      { label: 'Rechteck (R)',   icon: <ToolIcon><rect x="4" y="6" width="16" height="12" rx="2"/></ToolIcon> },
  circle:    { label: 'Kreis (C)',      icon: <ToolIcon><circle cx="12" cy="12" r="7"/></ToolIcon> },
  arrow:     { label: 'Pfeil (A)',      icon: <Icons.ArrowRight size={18}/> },
  text:      { label: 'Text (T)',       icon: <ToolIcon><path d="M5 5h14"/><path d="M12 5v14"/></ToolIcon> },
  image:     { label: 'Bild (I)',       icon: <ToolIcon><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 15l-5-5L4 20"/></ToolIcon> },
  frame:     { label: 'Frame (F)',      icon: <ToolIcon><path d="M5 7H3M5 17H3M19 7h2M19 17h2M7 5V3M17 5V3M7 21v-2M17 21v-2"/><rect x="5" y="5" width="14" height="14" rx="1"/></ToolIcon> },
  sticker:   { label: 'Sticker (S)',    icon: <ToolIcon><path d="M15 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h9l6-6V6a3 3 0 0 0-3-3z"/><path d="M15 21v-4a2 2 0 0 1 2-2h4"/></ToolIcon> },
  connector: { label: 'Verbinder',      icon: <ToolIcon><circle cx="5" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 7l10 10"/></ToolIcon> },
  comment:   { label: 'Kommentar',      icon: <ToolIcon><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></ToolIcon> },
  more:      { label: 'Vorlagen',       icon: <Icons.Plus size={18}/> },
};

const TOOL_ROWS = ['select', 'pan', 'pen', 'highlight', 'eraser', 'note', 'divider', 'rect', 'circle', 'arrow', 'text', 'image', 'frame', 'sticker', 'connector', 'divider', 'comment', 'more'];

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function getWorldPoint(evt, canvas, pan, zoom) {
  const rect = canvas.getBoundingClientRect();
  return { x: (evt.clientX - rect.left - pan.x) / zoom, y: (evt.clientY - rect.top - pan.y) / zoom };
}

function toScreen(x, y, pan, zoom) {
  return { x: x * zoom + pan.x, y: y * zoom + pan.y };
}

/* Smooth stroke with quadratic Bézier curves */
function drawSmoothStroke(ctx, stroke) {
  const pts = stroke.points;
  if (!pts?.length) return;
  ctx.save();
  ctx.globalAlpha = stroke.alpha ?? 1;
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (pts.length === 1) {
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, stroke.width / 2, 0, Math.PI * 2);
    ctx.fillStyle = stroke.color;
    ctx.fill();
  } else if (pts.length === 2) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBoard(ctx, board, pan, zoom) {
  const dpr = window.devicePixelRatio || 1;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.translate(pan.x, pan.y);
  ctx.scale(zoom, zoom);

  /* strokes — smooth bezier */
  for (const stroke of board.strokes) drawSmoothStroke(ctx, stroke);

  /* shapes */
  for (const shape of board.shapes) {
    ctx.save();
    ctx.strokeStyle = shape.color;
    ctx.lineWidth = shape.width || 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash(shape.dash !== undefined ? shape.dash : (shape.type === 'connector' ? [6, 6] : []));
    ctx.beginPath();
    if (shape.type === 'rect') {
      const x = Math.min(shape.x1, shape.x2);
      const y = Math.min(shape.y1, shape.y2);
      const w = Math.abs(shape.x2 - shape.x1);
      const h = Math.abs(shape.y2 - shape.y1);
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, 10);
      else ctx.rect(x, y, w, h);
    } else if (shape.type === 'circle') {
      ctx.ellipse((shape.x1 + shape.x2) / 2, (shape.y1 + shape.y2) / 2, Math.abs(shape.x2 - shape.x1) / 2, Math.abs(shape.y2 - shape.y1) / 2, 0, 0, Math.PI * 2);
    } else {
      const ae = shape.arrowEnd !== undefined ? shape.arrowEnd : (shape.type === 'arrow' ? 'end' : 'none');
      const angle = Math.atan2(shape.y2 - shape.y1, shape.x2 - shape.x1);
      const head = 14;
      ctx.moveTo(shape.x1, shape.y1);
      ctx.lineTo(shape.x2, shape.y2);
      if (ae === 'end' || ae === 'both') {
        ctx.moveTo(shape.x2 - head * Math.cos(angle - 0.45), shape.y2 - head * Math.sin(angle - 0.45));
        ctx.lineTo(shape.x2, shape.y2);
        ctx.lineTo(shape.x2 - head * Math.cos(angle + 0.45), shape.y2 - head * Math.sin(angle + 0.45));
      }
      if (ae === 'start' || ae === 'both') {
        const ar = angle + Math.PI;
        ctx.moveTo(shape.x1 - head * Math.cos(ar - 0.45), shape.y1 - head * Math.sin(ar - 0.45));
        ctx.lineTo(shape.x1, shape.y1);
        ctx.lineTo(shape.x1 - head * Math.cos(ar + 0.45), shape.y1 - head * Math.sin(ar + 0.45));
      }
    }
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function withinBox(x, y, box, pad = 0) {
  return x >= box.x - pad && x <= box.x + box.width + pad && y >= box.y - pad && y <= box.y + box.height + pad;
}

function findStroke(board, x, y, zoom) {
  for (let i = board.strokes.length - 1; i >= 0; i -= 1) {
    const stroke = board.strokes[i];
    const radius = (stroke.width || 1) * 0.8 + 10 / zoom;
    if (stroke.points.some((pt) => Math.hypot(pt.x - x, pt.y - y) <= radius)) return { index: i, item: stroke };
  }
  return null;
}

function findSelection(board, x, y, zoom) {
  for (let i = board.comments.length - 1; i >= 0; i -= 1) {
    const item = board.comments[i];
    if (withinBox(x, y, item, 12 / zoom)) return { kind: 'comments', item };
  }
  for (let i = board.images.length - 1; i >= 0; i -= 1) {
    const item = board.images[i];
    if (withinBox(x, y, item, 12 / zoom)) return { kind: 'images', item };
  }
  for (let i = board.frames.length - 1; i >= 0; i -= 1) {
    const item = board.frames[i];
    if (withinBox(x, y, item, 12 / zoom)) return { kind: 'frames', item };
  }
  for (let i = board.notes.length - 1; i >= 0; i -= 1) {
    const item = board.notes[i];
    if (withinBox(x, y, item, 12 / zoom)) return { kind: 'notes', item };
  }
  for (let i = board.texts.length - 1; i >= 0; i -= 1) {
    const item = board.texts[i];
    if (withinBox(x, y, item, 12 / zoom)) return { kind: 'texts', item };
  }
  for (let i = board.emojis.length - 1; i >= 0; i -= 1) {
    const item = board.emojis[i];
    if (withinBox(x, y, { x: item.x, y: item.y, width: 48, height: 48 }, 12 / zoom)) return { kind: 'emojis', item };
  }
  for (let i = board.shapes.length - 1; i >= 0; i -= 1) {
    const item = board.shapes[i];
    const left = Math.min(item.x1, item.x2);
    const top = Math.min(item.y1, item.y2);
    const width = Math.abs(item.x2 - item.x1) || 24;
    const height = Math.abs(item.y2 - item.y1) || 24;
    if (withinBox(x, y, { x: left, y: top, width, height }, 12 / zoom)) return { kind: 'shapes', item };
  }
  return null;
}

/* ─── TemplatesPanel ──────────────────────────────────────────────────────── */

function TemplatesPanel({ onClose, onInsert }) {
  return (
    <div style={{ position: 'absolute', right: 18, top: 70, bottom: 110, width: 330, background: 'white', borderRadius: 14, border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 8px 28px rgba(15,23,42,0.12), 0 1px 3px rgba(15,23,42,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 30 }}>
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Vorlagen &amp; Diagramme</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: '#94a3b8', display: 'flex' }}><Icons.X size={14}/></button>
      </div>
      <div style={{ padding: '0 10px 10px', overflowY: 'auto', flex: 1 }}>
        {TEMPLATES.map((template) => (
          <div
            key={template.id}
            onClick={() => onInsert(template.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 8px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ width: 38, height: 38, borderRadius: 9, background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>{template.icon}</div>
            <div style={{ fontSize: 12.5, color: '#0f172a', lineHeight: 1.4 }}>
              <span style={{ fontWeight: 600 }}>{template.name}</span><br/>
              <span style={{ color: '#64748b', fontSize: 11.5 }}>{template.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── StickersPanel ───────────────────────────────────────────────────────── */

function StickersPanel({ onClose, onPick }) {
  const [activeCategory, setActiveCategory] = useState(0);
  return (
    <div style={{ position: 'absolute', bottom: 82, left: '50%', transform: 'translateX(-50%)', background: 'white', borderRadius: 16, border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 8px 28px rgba(15,23,42,0.14)', width: 340, zIndex: 30, overflow: 'hidden' }}>
      {/* header */}
      <div style={{ padding: '10px 12px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a' }}>Sticker einfügen</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: '#94a3b8', display: 'flex' }}><Icons.X size={13}/></button>
      </div>
      {/* category tabs */}
      <div style={{ display: 'flex', gap: 2, padding: '0 10px 8px', overflowX: 'auto' }}>
        {STICKER_CATEGORIES.map((cat, i) => (
          <button
            key={cat.name}
            onClick={() => setActiveCategory(i)}
            style={{ padding: '4px 10px', borderRadius: 999, border: 'none', fontSize: 11.5, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', background: activeCategory === i ? '#0f172a' : '#f1f5f9', color: activeCategory === i ? 'white' : '#475569', fontFamily: 'inherit' }}
          >
            {cat.name}
          </button>
        ))}
      </div>
      {/* grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 2, padding: '0 10px 12px' }}>
        {STICKER_CATEGORIES[activeCategory].items.map((sticker) => (
          <button
            key={sticker}
            onClick={() => onPick(sticker)}
            style={{ padding: '7px 4px', background: 'transparent', border: '1px solid transparent', borderRadius: 8, fontSize: 20, cursor: 'pointer', lineHeight: 1, transition: 'background 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {sticker}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── LineStylePicker ─────────────────────────────────────────────────────── */

function LineStylePicker({ lineStyle, arrowEnd, onLineStyle, onArrowEnd }) {
  const lineIcons = { solid: '—', dashed: '╌', dotted: '···' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'white', borderRadius: 999, padding: '6px 10px', border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 4px 12px rgba(15,23,42,0.06)' }}>
        {LINE_STYLES.map((s) => (
          <button key={s.id} onClick={() => onLineStyle(s.id)} title={s.label}
            style={{ width: 36, height: 28, borderRadius: 8, border: lineStyle === s.id ? '2px solid #0f172a' : '1px solid #e2e8f0', background: lineStyle === s.id ? '#f8fafc' : 'transparent', cursor: 'pointer', fontFamily: 'monospace', fontSize: 14, color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {lineIcons[s.id]}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'white', borderRadius: 999, padding: '6px 10px', border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 4px 12px rgba(15,23,42,0.06)' }}>
        {ARROW_ENDS.map((a) => (
          <button key={a.id} onClick={() => onArrowEnd(a.id)} title={a.label}
            style={{ width: 36, height: 28, borderRadius: 8, border: arrowEnd === a.id ? '2px solid #0f172a' : '1px solid #e2e8f0', background: arrowEnd === a.id ? '#f8fafc' : 'transparent', cursor: 'pointer', fontFamily: 'monospace', fontSize: 16, color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {a.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── PenSizePicker ───────────────────────────────────────────────────────── */

function PenSizePicker({ penSizeId, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', borderRadius: 999, padding: '6px 12px', border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 4px 12px rgba(15,23,42,0.06)' }}>
      {PEN_SIZES.map((ps) => (
        <button
          key={ps.id}
          onClick={() => onChange(ps.id)}
          title={ps.label}
          style={{ width: 28, height: 28, borderRadius: '50%', border: penSizeId === ps.id ? '2.5px solid #0f172a' : '1.5px solid #cbd5e1', background: penSizeId === ps.id ? '#f8fafc' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
        >
          <div style={{ width: ps.dot, height: ps.dot, borderRadius: '50%', background: '#334155' }} />
        </button>
      ))}
    </div>
  );
}

/* ─── Main Whiteboard Component ───────────────────────────────────────────── */

const Whiteboard = () => {
  const docId = useMemo(() => new URLSearchParams(window.location.search).get('id'), []);
  const clientId = useMemo(() => randomId('client'), []);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const autosaveRef = useRef(null);
  const boardRef = useRef(DEFAULT_BOARD());
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const drawRef = useRef({ active: false, stroke: null });
  const shapeRef = useRef({ active: false, type: null, x1: 0, y1: 0, x2: 0, y2: 0 });
  const moveRef = useRef({ active: false, kind: null, id: null, startX: 0, startY: 0, origin: null });
  const dragPanRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });

  const [user, setUser] = useState(null);
  const [docRow, setDocRow] = useState(null);
  const [title, setTitle] = useState('Ohne Namen');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#0f172a');
  const [penSizeId, setPenSizeId] = useState('normal');
  const [lineStyle, setLineStyle] = useState('solid');
  const [arrowEnd, setArrowEnd] = useState('end');
  const [board, setBoard] = useState(DEFAULT_BOARD);
  const [history, setHistory] = useState([]);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [showTemplates, setShowTemplates] = useState(true);
  const [showStickers, setShowStickers] = useState(false);
  const [showShapePicker, setShowShapePicker] = useState(false);
  const [selected, setSelected] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  const pushHistory = useCallback(() => setHistory((prev) => [...prev.slice(-39), clone(boardRef.current)]), []);
  const mutateBoard = useCallback((fn) => setBoard((prev) => { const next = clone(prev); fn(next); return next; }), []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawBoard(canvas.getContext('2d'), boardRef.current, panRef.current, zoomRef.current);
    if (shapeRef.current.active) {
      const preview = clone(boardRef.current);
      const dash = LINE_STYLES.find((s) => s.id === lineStyle)?.dash || [];
      const ae = ['arrow', 'connector'].includes(shapeRef.current.type) ? arrowEnd : 'none';
      preview.shapes.push({ id: 'preview', type: shapeRef.current.type, x1: shapeRef.current.x1, y1: shapeRef.current.y1, x2: shapeRef.current.x2, y2: shapeRef.current.y2, color, width: 2.5, dash, arrowEnd: ae });
      drawBoard(canvas.getContext('2d'), preview, panRef.current, zoomRef.current);
    }
  }, [color, lineStyle, arrowEnd]);

  useEffect(() => { redraw(); }, [board, pan, zoom, redraw]);

  /* auth + load */
  useEffect(() => {
    (async () => {
      const session = await window.requireAuth();
      if (!session) return;
      setUser(session.user);
      if (docId) {
        const { data: row } = await window.sb.from('documents').select('*').eq('id', docId).single();
        if (row) {
          setDocRow(row);
          setTitle(row.name || 'Ohne Namen');
          if (row.file_path) {
            const { data: blob } = await window.sb.storage.from('documents').download(row.file_path);
            if (blob) {
              try {
                const payload = JSON.parse(await blob.text());
                setTitle(payload.title || row.name || 'Ohne Namen');
                setBoard({
                  strokes:  payload.strokes  || [],
                  shapes:   payload.shapes   || [],
                  texts:    payload.texts    || [],
                  notes:    payload.notes    || [],
                  emojis:   payload.emojis   || [],
                  frames:   payload.frames   || [],
                  comments: payload.comments || [],
                  images:   payload.images   || [],
                });
              } catch {}
            }
          }
        }
      }
      setLoading(false);
    })();
  }, [docId]);

  /* canvas resize */
  useEffect(() => {
    if (loading) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      redraw();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [loading, redraw]);

  /* ── scroll-wheel zoom (zoom towards cursor) ── */
  useEffect(() => {
    if (loading) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      setZoom((prevZoom) => {
        const newZoom = Math.min(4, Math.max(0.15, prevZoom * factor));
        setPan((prevPan) => ({
          x: mx - (mx - prevPan.x) * (newZoom / prevZoom),
          y: my - (my - prevPan.y) * (newZoom / prevZoom),
        }));
        return newZoom;
      });
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [loading]);

  /* save */
  const save = useCallback(async () => {
    if (!user) return null;
    setSaving(true);
    try {
      const payload = { type: 'studyflow_whiteboard', client_id: clientId, updated_at: new Date().toISOString(), title, ...boardRef.current };
      const blob = new Blob([JSON.stringify(payload)], { type: WB_MIME });
      const safe = title.replace(/[^a-zA-Z0-9._-]/g, '_') || 'whiteboard';
      const path = docRow?.file_path || `${user.id}/${Date.now()}_${safe}.whiteboard.json`;
      await window.sb.storage.from('documents').upload(path, blob, { contentType: WB_MIME, upsert: true });
      const meta = { name: title, file_path: path, file_size: blob.size, mime_type: WB_MIME };
      let row = docRow;
      if (docRow?.id) {
        const { data } = await window.sb.from('documents').update(meta).eq('id', docRow.id).select().single();
        if (data) row = data;
      } else {
        const { data } = await window.sb.from('documents').insert({ owner_id: user.id, doc_type: 'whiteboard', ...meta }).select().single();
        if (data) {
          row = data;
          const url = new URL(window.location.href);
          url.searchParams.set('id', data.id);
          window.history.replaceState({}, '', url.toString());
        }
      }
      setDocRow(row);
      setSavedAt(new Date());
      return row;
    } finally {
      setSaving(false);
    }
  }, [clientId, docRow, title, user]);

  /* autosave */
  useEffect(() => {
    if (loading || !user) return undefined;
    window.clearTimeout(autosaveRef.current);
    autosaveRef.current = window.setTimeout(() => { save(); }, 1200);
    return () => window.clearTimeout(autosaveRef.current);
  }, [board, title, loading, save, user]);

  /* keyboard shortcuts */
  useEffect(() => {
    const onKeyDown = (event) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isEditing = tag === 'input' || tag === 'textarea';

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        setHistory((prev) => {
          if (!prev.length) return prev;
          setBoard(prev[prev.length - 1]);
          return prev.slice(0, -1);
        });
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        save();
        return;
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && selected && !isEditing) {
        mutateBoard((draft) => {
          draft[selected.kind] = draft[selected.kind].filter((item) => item.id !== selected.id);
        });
        setSelected(null);
        return;
      }
      if (!isEditing && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const mapped = SHORTCUT_MAP[event.key.toLowerCase()];
        if (mapped) {
          if (mapped === 'sticker') { setShowStickers((p) => !p); return; }
          if (mapped === 'image') { fileInputRef.current?.click(); return; }
          setTool(mapped);
          setShowShapePicker(false);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mutateBoard, save, selected]);

  /* template insert */
  const insertTemplate = useCallback((templateId) => {
    const canvas = canvasRef.current;
    const cx = ((canvas?.offsetWidth || 1000) / 2 - panRef.current.x) / zoomRef.current;
    const cy = ((canvas?.offsetHeight || 700) / 2 - panRef.current.y) / zoomRef.current;
    pushHistory();
    mutateBoard((draft) => {
      if (templateId === 'mindmap') {
        draft.notes.push({ id: randomId('note'), x: cx - 220, y: cy - 110, width: 180, height: 120, text: 'Hauptthema\nHier eingeben', ...STICKY_THEMES[0] });
        draft.notes.push({ id: randomId('note'), x: cx + 40, y: cy - 120, width: 160, height: 100, text: 'Unterthema 1', ...STICKY_THEMES[1] });
        draft.notes.push({ id: randomId('note'), x: cx + 40, y: cy + 10, width: 160, height: 100, text: 'Unterthema 2', ...STICKY_THEMES[2] });
        draft.notes.push({ id: randomId('note'), x: cx + 40, y: cy + 140, width: 160, height: 100, text: 'Unterthema 3', ...STICKY_THEMES[3] });
        draft.shapes.push({ id: randomId('shape'), type: 'connector', x1: cx - 30, y1: cy - 50, x2: cx + 40, y2: cy - 70, color: '#94a3b8', width: 2 });
        draft.shapes.push({ id: randomId('shape'), type: 'connector', x1: cx - 30, y1: cy - 30, x2: cx + 40, y2: cy + 60, color: '#94a3b8', width: 2 });
        draft.shapes.push({ id: randomId('shape'), type: 'connector', x1: cx - 30, y1: cy - 10, x2: cx + 40, y2: cy + 190, color: '#94a3b8', width: 2 });
      }
      if (templateId === 'flow') {
        draft.frames.push({ id: randomId('frame'), x: cx - 280, y: cy - 130, width: 580, height: 270, title: 'Flussdiagramm' });
        draft.texts.push({ id: randomId('text'), x: cx - 220, y: cy - 20, width: 110, height: 38, text: 'Start', color: '#0f172a', bubble: true });
        draft.texts.push({ id: randomId('text'), x: cx - 60, y: cy - 20, width: 120, height: 38, text: 'Schritt 1', color: '#0f172a', bubble: true });
        draft.texts.push({ id: randomId('text'), x: cx + 100, y: cy - 20, width: 120, height: 38, text: 'Schritt 2', color: '#0f172a', bubble: true });
        draft.texts.push({ id: randomId('text'), x: cx + 230, y: cy - 20, width: 110, height: 38, text: 'Ende', color: '#0f172a', bubble: true });
        draft.shapes.push({ id: randomId('shape'), type: 'arrow', x1: cx - 100, y1: cy, x2: cx - 60, y2: cy, color: '#6366f1', width: 2.5 });
        draft.shapes.push({ id: randomId('shape'), type: 'arrow', x1: cx + 68, y1: cy, x2: cx + 100, y2: cy, color: '#6366f1', width: 2.5 });
        draft.shapes.push({ id: randomId('shape'), type: 'arrow', x1: cx + 228, y1: cy, x2: cx + 230, y2: cy, color: '#6366f1', width: 2.5 });
      }
      if (templateId === 'matrix') {
        const hw = 240, hh = 160;
        draft.frames.push({ id: randomId('frame'), x: cx - hw, y: cy - hh, width: hw * 2, height: hh * 2, title: 'Eisenhower-Matrix' });
        draft.shapes.push({ id: randomId('shape'), type: 'connector', x1: cx, y1: cy - hh, x2: cx, y2: cy + hh, color: '#94a3b8', width: 2 });
        draft.shapes.push({ id: randomId('shape'), type: 'connector', x1: cx - hw, y1: cy, x2: cx + hw, y2: cy, color: '#94a3b8', width: 2 });
        draft.texts.push({ id: randomId('text'), x: cx - hw + 10, y: cy - hh + 8, width: 120, height: 28, text: '① Wichtig + Dringend', color: '#ef4444', bubble: false });
        draft.texts.push({ id: randomId('text'), x: cx + 10, y: cy - hh + 8, width: 120, height: 28, text: '② Wichtig + Nicht dringend', color: '#3b82f6', bubble: false });
        draft.texts.push({ id: randomId('text'), x: cx - hw + 10, y: cy + 8, width: 120, height: 28, text: '③ Nicht wichtig + Dringend', color: '#f59e0b', bubble: false });
        draft.texts.push({ id: randomId('text'), x: cx + 10, y: cy + 8, width: 120, height: 28, text: '④ Nicht wichtig + Nicht dringend', color: '#94a3b8', bubble: false });
      }
      if (templateId === 'cards') {
        draft.notes.push({ id: randomId('note'), x: cx - 220, y: cy - 80, width: 170, height: 120, text: 'Begriff\n\nHier eingeben', ...STICKY_THEMES[2] });
        draft.notes.push({ id: randomId('note'), x: cx + 30, y: cy - 80, width: 170, height: 120, text: 'Definition\n\nHier eingeben', ...STICKY_THEMES[3] });
        draft.shapes.push({ id: randomId('shape'), type: 'arrow', x1: cx - 40, y1: cy - 20, x2: cx + 30, y2: cy - 20, color: '#94a3b8', width: 2 });
      }
      if (templateId === 'swot') {
        const sw = 200, sh = 140;
        draft.frames.push({ id: randomId('frame'), x: cx - sw - 10, y: cy - sh - 10, width: (sw + 10) * 2, height: (sh + 10) * 2, title: 'SWOT-Analyse' });
        draft.notes.push({ id: randomId('note'), x: cx - sw - 4, y: cy - sh - 4, width: sw, height: sh, text: '💪 Stärken\n\n•', ...STICKY_THEMES[3] });
        draft.notes.push({ id: randomId('note'), x: cx + 14, y: cy - sh - 4, width: sw, height: sh, text: '⚠️ Schwächen\n\n•', ...STICKY_THEMES[0] });
        draft.notes.push({ id: randomId('note'), x: cx - sw - 4, y: cy + 14, width: sw, height: sh, text: '🚀 Chancen\n\n•', ...STICKY_THEMES[1] });
        draft.notes.push({ id: randomId('note'), x: cx + 14, y: cy + 14, width: sw, height: sh, text: '❌ Risiken\n\n•', ...STICKY_THEMES[0] });
      }
      if (templateId === 'timeline') {
        draft.frames.push({ id: randomId('frame'), x: cx - 320, y: cy - 100, width: 660, height: 220, title: 'Zeitleiste' });
        draft.shapes.push({ id: randomId('shape'), type: 'arrow', x1: cx - 280, y1: cy + 20, x2: cx + 300, y2: cy + 20, color: '#6366f1', width: 3 });
        [-200, -100, 0, 100, 200].forEach((offset, i) => {
          draft.shapes.push({ id: randomId('shape'), type: 'connector', x1: cx + offset, y1: cy - 40, x2: cx + offset, y2: cy + 20, color: '#94a3b8', width: 1.5 });
          draft.notes.push({ id: randomId('note'), x: cx + offset - 55, y: cy - 100, width: 110, height: 56, text: `Ereignis ${i + 1}`, ...STICKY_THEMES[i % STICKY_THEMES.length] });
        });
      }
      if (templateId === 'cornell') {
        const fw = 580, fh = 420;
        draft.frames.push({ id: randomId('frame'), x: cx - fw / 2, y: cy - fh / 2, width: fw, height: fh, title: 'Cornell-Notizen' });
        draft.texts.push({ id: randomId('text'), x: cx - fw / 2 + 8, y: cy - fh / 2 + 8, width: 150, height: 28, text: '🔑 Schlüsselwörter', color: '#4f46e5', bubble: false });
        draft.texts.push({ id: randomId('text'), x: cx - fw / 2 + 168, y: cy - fh / 2 + 8, width: 200, height: 28, text: '📝 Notizen / Mitschrift', color: '#0f172a', bubble: false });
        draft.texts.push({ id: randomId('text'), x: cx - fw / 2 + 8, y: cy + 80, width: fw - 16, height: 28, text: '💡 Zusammenfassung', color: '#0f172a', bubble: false });
        draft.shapes.push({ id: randomId('shape'), type: 'connector', x1: cx - fw / 2 + 158, y1: cy - fh / 2, x2: cx - fw / 2 + 158, y2: cy + 70, color: '#cbd5e1', width: 1.5 });
        draft.shapes.push({ id: randomId('shape'), type: 'connector', x1: cx - fw / 2, y1: cy + 70, x2: cx + fw / 2, y2: cy + 70, color: '#cbd5e1', width: 1.5 });
      }
      if (templateId === 'kanban') {
        const cols = [
          { title: '📋 Offen', theme: STICKY_THEMES[0], items: ['Aufgabe 1', 'Aufgabe 2'] },
          { title: '⚙️ In Arbeit', theme: STICKY_THEMES[1], items: ['Aufgabe 3'] },
          { title: '✅ Erledigt', theme: STICKY_THEMES[3], items: ['Aufgabe 4'] },
        ];
        cols.forEach((col, ci) => {
          const colX = cx - 300 + ci * 220;
          draft.frames.push({ id: randomId('frame'), x: colX, y: cy - 200, width: 200, height: 400, title: col.title });
          col.items.forEach((item, ii) => {
            draft.notes.push({ id: randomId('note'), x: colX + 10, y: cy - 180 + ii * 130, width: 180, height: 110, text: item, ...col.theme });
          });
        });
      }
    });
    setShowTemplates(false);
  }, [mutateBoard, pushHistory]);

  const placeSticker = useCallback((emoji) => {
    const canvas = canvasRef.current;
    const x = ((canvas?.offsetWidth || 1000) / 2 - panRef.current.x) / zoomRef.current + (Math.random() - 0.5) * 200;
    const y = ((canvas?.offsetHeight || 700) / 2 - panRef.current.y) / zoomRef.current + (Math.random() - 0.5) * 140;
    pushHistory();
    mutateBoard((draft) => {
      draft.emojis.push({ id: randomId('emoji'), x, y, emoji, rotate: (Math.random() - 0.5) * 28 });
    });
    setShowStickers(false);
  }, [mutateBoard, pushHistory]);

  const handleImagePick = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const canvas = canvasRef.current;
      const x = ((canvas?.offsetWidth || 1000) / 2 - panRef.current.x) / zoomRef.current;
      const y = ((canvas?.offsetHeight || 700) / 2 - panRef.current.y) / zoomRef.current;
      pushHistory();
      mutateBoard((draft) => {
        draft.images.push({ id: randomId('image'), x, y, width: 220, height: 140, src: reader.result });
      });
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }, [mutateBoard, pushHistory]);

  const updateArrayItem = useCallback((kind, id, patch) => {
    mutateBoard((draft) => {
      draft[kind] = draft[kind].map((item) => item.id === id ? { ...item, ...patch } : item);
    });
  }, [mutateBoard]);

  const startOverlayMove = useCallback((event, kind, item) => {
    if (tool !== 'select') {
      setSelected({ kind, id: item.id });
      return;
    }
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const world = getWorldPoint(event, canvasRef.current, panRef.current, zoomRef.current);
    moveRef.current = { active: true, kind, id: item.id, startX: world.x, startY: world.y, origin: clone(item) };
    setSelected({ kind, id: item.id });
  }, [tool]);

  /* ── pointer events ── */

  const onPointerDown = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture?.(event.pointerId);
    const world = getWorldPoint(event, canvas, panRef.current, zoomRef.current);

    if (tool === 'pan' || event.button === 1) {
      dragPanRef.current = { active: true, startX: event.clientX, startY: event.clientY, originX: panRef.current.x, originY: panRef.current.y };
      return;
    }
    if (tool === 'select') {
      const found = findSelection(boardRef.current, world.x, world.y, zoomRef.current);
      if (found) {
        moveRef.current = { active: true, kind: found.kind, id: found.item.id, startX: world.x, startY: world.y, origin: clone(found.item) };
        setSelected({ kind: found.kind, id: found.item.id });
      } else {
        setSelected(null);
      }
      return;
    }
    if (tool === 'note') {
      pushHistory();
      const theme = STICKY_THEMES[boardRef.current.notes.length % STICKY_THEMES.length];
      mutateBoard((draft) => { draft.notes.push({ id: randomId('note'), x: world.x, y: world.y, width: 180, height: 130, text: 'Neue Notiz', ...theme }); });
      return;
    }
    if (tool === 'text') {
      pushHistory();
      mutateBoard((draft) => { draft.texts.push({ id: randomId('text'), x: world.x, y: world.y, width: 180, height: 48, text: 'Text', color, bubble: false }); });
      return;
    }
    if (tool === 'comment') {
      pushHistory();
      mutateBoard((draft) => { draft.comments.push({ id: randomId('comment'), x: world.x, y: world.y, width: 260, height: 140, text: 'Kommentar' }); });
      return;
    }
    if (tool === 'frame') {
      pushHistory();
      mutateBoard((draft) => { draft.frames.push({ id: randomId('frame'), x: world.x, y: world.y, width: 360, height: 220, title: 'Frame' }); });
      return;
    }
    if (tool === 'eraser') {
      const found = findSelection(boardRef.current, world.x, world.y, zoomRef.current);
      const strokeHit = findStroke(boardRef.current, world.x, world.y, zoomRef.current);
      if (found || strokeHit) {
        pushHistory();
        mutateBoard((draft) => {
          if (found) draft[found.kind] = draft[found.kind].filter((item) => item.id !== found.item.id);
          if (strokeHit) draft.strokes.splice(strokeHit.index, 1);
        });
      }
      return;
    }
    if (['rect', 'circle', 'arrow', 'connector'].includes(tool)) {
      pushHistory();
      shapeRef.current = { active: true, type: tool, x1: world.x, y1: world.y, x2: world.x, y2: world.y };
      return;
    }
    if (tool === 'pen' || tool === 'highlight') {
      pushHistory();
      const ps = PEN_SIZES.find((p) => p.id === penSizeId) || PEN_SIZES[1];
      const width = tool === 'highlight' ? Math.max(ps.size * 3, 14) : ps.size;
      drawRef.current = {
        active: true,
        stroke: { id: randomId('stroke'), tool, color, alpha: tool === 'highlight' ? 0.28 : 1, width, points: [world] },
      };
    }
  }, [color, mutateBoard, penSizeId, pushHistory, tool]);

  const onPointerMove = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (dragPanRef.current.active) {
      setPan({ x: dragPanRef.current.originX + event.clientX - dragPanRef.current.startX, y: dragPanRef.current.originY + event.clientY - dragPanRef.current.startY });
      return;
    }
    if (moveRef.current.active) {
      const world = getWorldPoint(event, canvas, panRef.current, zoomRef.current);
      const dx = world.x - moveRef.current.startX;
      const dy = world.y - moveRef.current.startY;
      mutateBoard((draft) => {
        draft[moveRef.current.kind] = draft[moveRef.current.kind].map((item) => {
          if (item.id !== moveRef.current.id) return item;
          const origin = moveRef.current.origin;
          if (moveRef.current.kind === 'shapes') return { ...item, x1: origin.x1 + dx, y1: origin.y1 + dy, x2: origin.x2 + dx, y2: origin.y2 + dy };
          return { ...item, x: origin.x + dx, y: origin.y + dy };
        });
      });
      return;
    }
    if (shapeRef.current.active) {
      const world = getWorldPoint(event, canvas, panRef.current, zoomRef.current);
      shapeRef.current = { ...shapeRef.current, x2: world.x, y2: world.y };
      redraw();
      return;
    }
    if (drawRef.current.active) {
      const world = getWorldPoint(event, canvas, panRef.current, zoomRef.current);
      const pts = drawRef.current.stroke.points;
      /* point subsampling — only record if moved ≥ 3px in world space */
      if (!pts.length || dist2(pts[pts.length - 1], world) >= 3 / zoomRef.current) {
        drawRef.current.stroke.points.push(world);
      }
      /* live preview — draw directly without full state clone */
      const ctx = canvas.getContext('2d');
      drawBoard(ctx, boardRef.current, panRef.current, zoomRef.current);
      const dpr = window.devicePixelRatio || 1;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.translate(panRef.current.x, panRef.current.y);
      ctx.scale(zoomRef.current, zoomRef.current);
      drawSmoothStroke(ctx, drawRef.current.stroke);
      ctx.restore();
    }
  }, [mutateBoard, redraw]);

  const onPointerUp = useCallback((event) => {
    dragPanRef.current.active = false;
    moveRef.current.active = false;
    if (shapeRef.current.active) {
      const current = shapeRef.current;
      shapeRef.current = { active: false, type: null, x1: 0, y1: 0, x2: 0, y2: 0 };
      const dash = LINE_STYLES.find((s) => s.id === lineStyle)?.dash || [];
      const ae = ['arrow', 'connector'].includes(current.type) ? arrowEnd : 'none';
      mutateBoard((draft) => {
        draft.shapes.push({ id: randomId('shape'), type: current.type, x1: current.x1, y1: current.y1, x2: current.x2, y2: current.y2, color, width: 2.5, dash, arrowEnd: ae });
      });
      return;
    }
    if (drawRef.current.active) {
      const stroke = clone(drawRef.current.stroke);
      drawRef.current = { active: false, stroke: null };
      mutateBoard((draft) => { draft.strokes.push(stroke); });
    }
  }, [color, lineStyle, arrowEnd, mutateBoard]);

  /* share */
  const shareUrl = (() => {
    const url = new URL(window.location.href);
    if (docRow?.id) url.searchParams.set('id', docRow.id);
    return url.toString();
  })();

  const copyShareLink = async () => {
    if (!docRow?.id) await save();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      window.prompt('Link kopieren', shareUrl);
    }
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Whiteboard wird geladen…</div>;

  /* ─── render ── */
  return (
    <div onPointerMove={onPointerMove} onPointerUp={onPointerUp} style={{ height: '100vh', overflow: 'hidden', position: 'relative', background: '#fafaf7' }}>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImagePick} style={{ display: 'none' }} />

      {/* canvas layer */}
      <div className="dot-paper" style={{ position: 'absolute', inset: 0, backgroundColor: '#fafaf7' }}>
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none', cursor: tool === 'pan' ? 'grab' : tool === 'select' ? 'default' : tool === 'eraser' ? 'cell' : 'crosshair' }}
        />

        {board.frames.map((frame) => {
          const p = toScreen(frame.x, frame.y, pan, zoom);
          return (
            <div key={frame.id} onPointerDown={(e) => startOverlayMove(e, 'frames', frame)} style={{ position: 'absolute', left: p.x, top: p.y, width: frame.width * zoom, height: frame.height * zoom, border: selected?.kind === 'frames' && selected?.id === frame.id ? '2px dashed #6366f1' : '1.5px dashed #94a3b8', borderRadius: 14, background: 'rgba(255,255,255,0.16)' }}>
              <input value={frame.title} onChange={(e) => updateArrayItem('frames', frame.id, { title: e.target.value })} style={{ position: 'absolute', top: -18, left: 10, border: 'none', background: 'white', padding: '4px 10px', borderRadius: 999, fontSize: 12, color: '#475569', boxShadow: '0 1px 2px rgba(15,23,42,0.06)' }} />
            </div>
          );
        })}

        {board.notes.map((note) => {
          const p = toScreen(note.x, note.y, pan, zoom);
          return (
            <textarea key={note.id} value={note.text} onPointerDown={(e) => startOverlayMove(e, 'notes', note)} onChange={(e) => updateArrayItem('notes', note.id, { text: e.target.value })} style={{ position: 'absolute', left: p.x, top: p.y, width: note.width * zoom, height: note.height * zoom, padding: `${14 * zoom}px`, background: note.bg, border: `${selected?.kind === 'notes' && selected?.id === note.id ? 2 : 1}px solid ${note.border}`, borderRadius: 6, boxShadow: '2px 3px 0 rgba(15,23,42,0.05), 0 8px 20px rgba(15,23,42,0.08)', fontFamily: 'Caveat', fontSize: Math.max(14, 18 * zoom), color: '#0f172a', resize: 'none', outline: 'none' }} />
          );
        })}

        {board.texts.map((text) => {
          const p = toScreen(text.x, text.y, pan, zoom);
          return text.bubble ? (
            <input key={text.id} value={text.text} onPointerDown={(e) => startOverlayMove(e, 'texts', text)} onChange={(e) => updateArrayItem('texts', text.id, { text: e.target.value })} style={{ position: 'absolute', left: p.x, top: p.y, width: text.width * zoom, padding: '10px 16px', background: 'white', border: `${selected?.kind === 'texts' && selected?.id === text.id ? 3 : 2}px solid #6366f1`, borderRadius: 999, fontSize: 13 * zoom, fontWeight: 500, color: text.color, textAlign: 'center', outline: 'none' }} />
          ) : (
            <textarea key={text.id} value={text.text} onPointerDown={(e) => startOverlayMove(e, 'texts', text)} onChange={(e) => updateArrayItem('texts', text.id, { text: e.target.value })} style={{ position: 'absolute', left: p.x, top: p.y, width: text.width * zoom, height: text.height * zoom, background: selected?.kind === 'texts' && selected?.id === text.id ? 'rgba(255,255,255,0.8)' : 'transparent', border: 'none', color: text.color, fontSize: Math.max(14, 20 * zoom), fontFamily: 'Caveat', outline: selected?.kind === 'texts' && selected?.id === text.id ? '1px dashed #6366f1' : 'none', resize: 'none' }} />
          );
        })}

        {board.comments.map((comment) => {
          const p = toScreen(comment.x, comment.y, pan, zoom);
          return (
            <div key={comment.id} onPointerDown={(e) => startOverlayMove(e, 'comments', comment)} style={{ position: 'absolute', left: p.x, top: p.y, width: comment.width * zoom, background: 'white', borderRadius: 18, border: selected?.kind === 'comments' && selected?.id === comment.id ? '2px solid #6366f1' : '1px solid #cbd5e1', boxShadow: '0 8px 20px rgba(15,23,42,0.08)' }}>
              <textarea value={comment.text} onChange={(e) => updateArrayItem('comments', comment.id, { text: e.target.value })} style={{ width: '100%', height: comment.height * zoom, border: 'none', background: 'transparent', resize: 'none', outline: 'none', padding: `${16 * zoom}px`, fontSize: Math.max(12, 14 * zoom), color: '#334155' }} />
            </div>
          );
        })}

        {board.images.map((image) => {
          const p = toScreen(image.x, image.y, pan, zoom);
          const isSelected = selected?.kind === 'images' && selected?.id === image.id;
          return (
            <div key={image.id} onPointerDown={(e) => startOverlayMove(e, 'images', image)} style={{ position: 'absolute', left: p.x, top: p.y, width: image.width * zoom, height: image.height * zoom, overflow: 'hidden', outline: isSelected ? '2px solid #6366f1' : 'none', cursor: tool === 'select' ? 'grab' : 'default' }}>
              <img src={image.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', userSelect: 'none', pointerEvents: 'none' }} />
            </div>
          );
        })}

        {board.emojis.map((emoji) => {
          const p = toScreen(emoji.x, emoji.y, pan, zoom);
          return (
            <div key={emoji.id} onPointerDown={(e) => startOverlayMove(e, 'emojis', emoji)} style={{ position: 'absolute', left: p.x, top: p.y, fontSize: 32 * zoom, transform: `rotate(${emoji.rotate}deg)`, filter: 'drop-shadow(2px 3px 4px rgba(15,23,42,0.15))', cursor: 'grab', userSelect: 'none' }}>
              {emoji.emoji}
            </div>
          );
        })}
      </div>

      {/* top-left: logo + title */}
      <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', borderRadius: 14, padding: '8px 14px 8px 10px', border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 2px 10px rgba(15,23,42,0.08)', zIndex: 20 }}>
        <a href="dashboard.html" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 10, borderRight: '1px solid #e2e8f0', textDecoration: 'none' }}>
          <Icons.Logo size={24} />
          <span style={{ fontFamily: 'Caveat', fontSize: 20, fontWeight: 600, color: '#0f172a', lineHeight: 1 }}>StudyFlow</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: 13, color: '#0f172a', fontWeight: 500, width: 170, background: 'transparent' }} />
          {savedAt && <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>{saving ? '↻ sync' : `✓ ${savedAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`}</span>}
        </div>
      </div>

      {/* top-right: cowork bar */}
      <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 8, zIndex: 20 }}>
        {/* Live collaborators */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 14, padding: '6px 12px', gap: 8, boxShadow: '0 2px 10px rgba(15,23,42,0.08)' }}>
          <div style={{ display: 'flex' }}>
            <Avatar name={user?.email || 'Du'} color="#06b6d4" size={26} ring />
            <div style={{ marginLeft: -7 }}><Avatar name="Lara K" color="#ec4899" size={26} ring /></div>
            <div style={{ marginLeft: -7 }}><Avatar name="Tim R" color="#f59e0b" size={26} ring /></div>
          </div>
          <div style={{ width: 1, height: 16, background: '#e2e8f0' }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#10b981', fontWeight: 500 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}/>
            Cowork aktiv
          </div>
        </div>
        {/* Zoom */}
        <div style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', border: '1px solid rgba(15,23,42,0.08)', padding: '8px 12px', borderRadius: 14, fontFamily: 'JetBrains Mono', fontSize: 12, color: '#475569', boxShadow: '0 2px 10px rgba(15,23,42,0.08)', minWidth: 54, textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </div>
        {/* Share */}
        <button onClick={() => setShareOpen(true)} style={{ padding: '8px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 14, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(99,102,241,0.35)', display: 'flex', alignItems: 'center', gap: 6, transition: 'opacity 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          <Icons.Share size={14}/> Teilen
        </button>
      </div>

      {/* templates panel / button */}
      {showTemplates && <TemplatesPanel onClose={() => setShowTemplates(false)} onInsert={insertTemplate} />}
      {!showTemplates && (
        <div style={{ position: 'absolute', right: 30, top: 380, display: 'flex', alignItems: 'center', gap: 8, zIndex: 15 }}>
          <span style={{ fontSize: 22 }}>✨</span>
          <button onClick={() => setShowTemplates(true)} style={{ background: 'white', border: '1px solid rgba(15,23,42,0.08)', padding: '8px 14px', borderRadius: 999, fontSize: 13, color: '#0f172a', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
            Vorlagen <span style={{ color: '#94a3b8' }}>›</span>
          </button>
        </div>
      )}

      {showStickers && <StickersPanel onClose={() => setShowStickers(false)} onPick={placeSticker} />}

      {/* bottom centre: toolbar */}
      <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 25, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>

        {/* colour + pen-size strip — shown for pen / highlight */}
        {(tool === 'pen' || tool === 'highlight') && (
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <PenSizePicker penSizeId={penSizeId} onChange={setPenSizeId} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'white', borderRadius: 999, padding: '6px 10px', border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 4px 12px rgba(15,23,42,0.06)' }}>
              {PASTELS.concat(PALETTE).map((swatch) => (
                <button key={swatch} onClick={() => setColor(swatch)} style={{ width: swatch === '#ffffff' ? 18 : 18, height: 18, borderRadius: '50%', background: swatch, border: color === swatch ? '2.5px solid #0f172a' : swatch === '#ffffff' ? '1px solid #cbd5e1' : '1px solid rgba(15,23,42,0.1)', cursor: 'pointer', padding: 0, flexShrink: 0 }} />
              ))}
            </div>
          </div>
        )}

        {(['arrow', 'connector'].includes(tool)) && (
          <LineStylePicker lineStyle={lineStyle} arrowEnd={arrowEnd} onLineStyle={setLineStyle} onArrowEnd={setArrowEnd} />
        )}

        {showShapePicker && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'white', borderRadius: 999, padding: '6px 10px', border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 4px 12px rgba(15,23,42,0.06)' }}>
            {['rect', 'circle', 'arrow', 'connector'].map((shapeTool) => (
              <button key={shapeTool} onClick={() => { setTool(shapeTool); setShowShapePicker(false); }} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: tool === shapeTool ? '#0f172a' : 'transparent', color: tool === shapeTool ? 'white' : '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {TOOL_DEFS[shapeTool].icon}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 1, background: 'white', borderRadius: 12, padding: 5, border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 6px 20px rgba(15,23,42,0.08), 0 1px 3px rgba(15,23,42,0.04)' }}>
          {TOOL_ROWS.map((item, index) => {
            if (item === 'divider') return <div key={`d_${index}`} style={{ width: 1, height: 22, background: '#e2e8f0', margin: '0 4px' }} />;
            const active = tool === item || (item === 'more' && showTemplates) || (item === 'sticker' && showStickers);
            return (
              <button
                key={item}
                onClick={() => {
                  if (item === 'sticker') { setShowStickers((prev) => !prev); return; }
                  if (item === 'more') { setShowTemplates((prev) => !prev); return; }
                  if (item === 'image') { fileInputRef.current?.click(); return; }
                  if (['rect', 'circle', 'arrow', 'connector'].includes(item)) { setTool(item); setShowShapePicker(false); return; }
                  setTool(item);
                  setShowShapePicker(false);
                }}
                onContextMenu={(e) => {
                  if (['rect', 'circle', 'arrow', 'connector'].includes(item)) {
                    e.preventDefault();
                    setShowShapePicker((prev) => !prev);
                  }
                }}
                title={TOOL_DEFS[item].label}
                style={{ width: 34, height: 34, borderRadius: 10, background: active ? '#0f172a' : 'transparent', color: active ? 'white' : '#475569', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
              >
                {TOOL_DEFS[item].icon}
              </button>
            );
          })}
        </div>
      </div>

      {/* bottom-right: zoom + undo + save */}
      <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', gap: 6, zIndex: 20 }}>
        <button
          onClick={() => setHistory((prev) => { if (!prev.length) return prev; setBoard(prev[prev.length - 1]); return prev.slice(0, -1); })}
          title="Rückgängig (Ctrl+Z)"
          style={{ width: 30, height: 30, background: 'white', border: '1px solid rgba(15,23,42,0.06)', borderRadius: 8, cursor: 'pointer', color: history.length ? '#475569' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ToolIcon size={14}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></ToolIcon>
        </button>
        <div style={{ background: 'white', border: '1px solid rgba(15,23,42,0.06)', borderRadius: 8, display: 'flex', alignItems: 'center', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
          <button onClick={() => setZoom((prev) => Math.max(0.15, prev - 0.1))} style={{ padding: 7, background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, lineHeight: 1 }}>-</button>
          <span style={{ fontSize: 11.5, color: '#475569', fontFamily: 'JetBrains Mono', minWidth: 36, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((prev) => Math.min(4, prev + 0.1))} style={{ padding: 7, background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex' }}><Icons.Plus size={13}/></button>
        </div>
        <button onClick={() => save()} style={{ width: 30, height: 30, background: 'white', border: '1px solid rgba(15,23,42,0.06)', borderRadius: 8, cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Speichern (Ctrl+S)"><Icons.Doc size={14}/></button>
      </div>

      {/* bottom-left: centre-view */}
      <div style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 20 }}>
        <button onClick={() => { setPan({ x: 0, y: 0 }); setZoom(1); }} style={{ background: 'white', border: '1px solid rgba(15,23,42,0.06)', padding: 8, borderRadius: 8, cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: 'inherit', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }} title="Board zentrieren">
          <ToolIcon size={14}><path d="M12 2L2 7l10 5 10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></ToolIcon>
        </button>
      </div>

      {/* share modal */}
      {shareOpen && (
        <div onClick={() => setShareOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 480, background: 'white', borderRadius: 24, boxShadow: '0 32px 80px rgba(15,23,42,0.2)', padding: '28px 28px 24px', animation: 'scaleIn 0.25s cubic-bezier(0.16,1,0.3,1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <Icons.Share size={18}/>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Board teilen</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>Cowork-Link zum gemeinsamen Bearbeiten</div>
              </div>
              <button onClick={() => setShareOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}><Icons.X size={18}/></button>
            </div>
            {/* Collaborators preview */}
            <div style={{ background: '#f8fafc', borderRadius: 14, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex' }}>
                <Avatar name={user?.email || 'Du'} color="#06b6d4" size={28} ring />
                <div style={{ marginLeft: -8 }}><Avatar name="Lara K" color="#ec4899" size={28} ring /></div>
                <div style={{ marginLeft: -8 }}><Avatar name="Tim R" color="#f59e0b" size={28} ring /></div>
              </div>
              <div style={{ fontSize: 12.5, color: '#475569' }}>
                <span style={{ fontWeight: 500 }}>3 Personen</span> können dieses Board bearbeiten
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input readOnly value={shareUrl} onClick={e => e.target.select()} style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 12, padding: '11px 14px', fontSize: 12.5, color: '#334155', background: '#fafafa', outline: 'none' }} />
              <button onClick={copyShareLink} style={{ border: 'none', borderRadius: 12, padding: '0 18px', background: copied ? '#10b981' : '#0f172a', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap', transition: 'background 0.2s', fontFamily: 'inherit' }}>
                {copied ? '✓ Kopiert' : 'Kopieren'}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShareOpen(false)} style={{ border: '1px solid #e2e8f0', background: 'white', borderRadius: 10, padding: '9px 16px', cursor: 'pointer', fontSize: 13, color: '#475569', fontFamily: 'inherit' }}>Schließen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Whiteboard />);
