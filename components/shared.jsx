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
    <svg width={p?.size || 100} height={p?.size ? p.size * 0.33 : 33} viewBox="0 0 100 33" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
      <g clipPath="url(#clip0_9_237)">
        <path d="M12.3154 0.00289917H13.2047C16.2919 0.0700133 19.3289 1.31162 21.5101 3.50961C20.7047 4.33176 19.8826 5.12035 19.094 5.9425C17.8691 4.83511 16.3926 3.97941 14.7819 3.6774C12.3993 3.17404 9.83222 3.62706 7.83557 4.98612C5.65436 6.4123 4.17785 8.8284 3.85906 11.4123C3.50671 13.9626 4.22819 16.6472 5.88926 18.6271C7.48322 20.5566 9.91611 21.7646 12.4329 21.8485C14.7819 21.9828 17.2315 21.2613 18.943 19.617C20.2852 18.4593 20.906 16.6975 21.1074 14.9861C18.3221 14.9861 15.5369 15.0029 12.7517 14.9861V11.5297H24.4799C25.0839 15.2378 24.2114 19.4157 21.3926 22.0667C19.5134 23.9459 16.9128 25.0532 14.2617 25.2714C11.6946 25.523 9.04363 25.0365 6.76175 23.7948C4.02685 22.3351 1.84564 19.8687 0.771812 16.966C-0.234899 14.2982 -0.251678 11.2781 0.68792 8.5935C1.54362 6.14384 3.18792 3.97941 5.30201 2.46934C7.33222 0.976054 9.79866 0.153906 12.3154 0.00289917Z" fill="#3780FF"/>
        <path d="M79.5974 0.875366H83.188V24.8351C81.9967 24.8351 80.7887 24.8519 79.5974 24.8183C79.6142 16.8485 79.5974 8.86194 79.5974 0.875366Z" fill="#38B137"/>
        <path d="M32.4664 9.18073C34.6812 8.76127 37.0805 9.23106 38.9094 10.5566C40.5705 11.7311 41.7282 13.5767 42.0805 15.5901C42.5336 17.9223 41.9631 20.4727 40.453 22.3183C38.8255 24.3821 36.1577 25.4895 33.5571 25.3217C31.1745 25.1874 28.8591 23.9962 27.4497 22.0499C25.8557 19.9022 25.4698 16.9492 26.3423 14.4324C27.2148 11.7311 29.6812 9.66731 32.4664 9.18073ZM32.9698 12.3686C32.0638 12.6035 31.2248 13.1237 30.6208 13.8619C28.9933 15.8082 29.094 18.9794 30.8893 20.7915C31.9128 21.8317 33.4564 22.3183 34.8826 22.0331C36.2081 21.7982 37.3658 20.9089 38.0034 19.7344C39.1107 17.7378 38.792 14.9861 37.0973 13.4257C36.0067 12.419 34.4128 11.9995 32.9698 12.3686Z" fill="#FA3913"/>
        <path d="M50.2517 9.18074C52.7853 8.69417 55.5537 9.39886 57.4497 11.1774C60.5369 13.9458 60.8725 19.1304 58.2383 22.3183C56.6443 24.3318 54.0604 25.4391 51.5101 25.3217C49.0772 25.2546 46.6779 24.0465 45.2349 22.0499C43.6074 19.8519 43.2551 16.8318 44.1779 14.2646C45.1007 11.6472 47.5168 9.65054 50.2517 9.18074ZM50.7551 12.3687C49.849 12.6036 49.0101 13.1237 48.4061 13.8452C46.7953 15.7579 46.8624 18.8787 48.5906 20.7076C49.6141 21.7982 51.2081 22.3351 52.6846 22.0331C53.9933 21.7814 55.1678 20.9089 55.8054 19.7344C56.896 17.721 56.5772 14.9693 54.8658 13.4089C53.7752 12.4022 52.1812 11.9995 50.7551 12.3687Z" fill="#FCBD06"/>
        <path d="M65.3355 10.1539C67.265 8.94585 69.8322 8.61028 71.9127 9.65054C72.5671 9.93578 73.104 10.4224 73.6241 10.9089C73.6409 10.4559 73.6241 9.98612 73.6409 9.51632C74.765 9.5331 75.8892 9.51632 77.0301 9.5331V24.3318C77.0134 26.5633 76.4429 28.9291 74.8322 30.5566C73.0704 32.3519 70.3691 32.9056 67.9362 32.5364C65.3355 32.1505 63.0704 30.2546 62.0637 27.8552C63.0704 27.3687 64.1275 26.9828 65.1677 26.5297C65.755 27.9056 66.9463 29.0801 68.4395 29.3485C69.9328 29.617 71.661 29.2479 72.6342 28.0063C73.6744 26.7311 73.6744 24.9861 73.6241 23.4257C72.8523 24.1807 71.963 24.8519 70.8892 25.1036C68.557 25.7579 65.9899 24.9526 64.1946 23.3754C62.3825 21.7982 61.3087 19.3653 61.4093 16.9492C61.4597 14.2143 63.0033 11.5801 65.3355 10.1539ZM68.8087 12.3016C67.7852 12.4693 66.8288 13.0398 66.1744 13.8284C64.5973 15.7076 64.5973 18.7109 66.1912 20.5566C67.0973 21.6472 68.557 22.2512 69.9664 22.1002C71.2919 21.966 72.5167 21.1271 73.1711 19.9693C74.2785 18.0063 74.0939 15.3385 72.6006 13.6271C71.6778 12.57 70.2013 12.0499 68.8087 12.3016Z" fill="#3780FF"/>
        <path d="M87.5 11.0096C89.5134 9.13039 92.6175 8.4928 95.2014 9.48273C97.651 10.4056 99.2114 12.7378 100 15.1371C96.3591 16.6472 92.7349 18.1405 89.094 19.6505C89.5973 20.6069 90.3691 21.4794 91.4094 21.8317C92.8691 22.3519 94.6141 22.1673 95.839 21.1941C96.3255 20.825 96.7114 20.3384 97.0806 19.8686C98.0034 20.4894 98.9262 21.0935 99.849 21.7143C98.5403 23.6774 96.3423 25.0532 93.9765 25.2713C91.3591 25
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
        <div className="ai-assistant-panel" style={{
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
    style={{ width: w, height: h, maxWidth: '100%', cursor: 'pointer', transform: `rotate(${rotate}deg)` }}
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

if (typeof document !== 'undefined') {
  const responsiveStyles = document.createElement('style');
  responsiveStyles.innerHTML = `
    /* Responsive Layout & Fixes */
    html, body { max-width: 100vw; overflow-x: hidden; }
    * { box-sizing: border-box; }
    img, svg { max-width: 100%; }
    
    @media (max-width: 1024px) {
      .bento-grid { grid-template-columns: repeat(2, 1fr) !important; }
      .bento-lg, .bento-md { grid-column: span 2 !important; }
      .bento-sm { grid-column: span 1 !important; }
    }
    
    @media (max-width: 768px) {
      .hide-mobile { display: none !important; }
      .mobile-col { flex-direction: column !important; align-items: flex-start !important; }
      .mobile-wrap { flex-wrap: wrap !important; }
      .px-mobile { padding-left: 16px !important; padding-right: 16px !important; }
      
      header, nav { padding-left: 16px !important; padding-right: 16px !important; }
      section { padding-left: 16px !important; padding-right: 16px !important; }
      
      .bento-grid { grid-template-columns: 1fr !important; }
      .bento-lg, .bento-md, .bento-sm { grid-column: span 1 !important; grid-row: auto !important; }
      
      .hero-title { font-size: 44px !important; line-height: 1.1 !important; }
      .hero-subtitle { font-size: 52px !important; }
      
      .ai-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
      .ai-grid-text { order: 1; }
      .ai-grid-preview { order: 2; }
      
      .footer-layout { flex-direction: column !important; gap: 32px !important; }
      .footer-links { gap: 32px !important; flex-wrap: wrap !important; }
      
      .collab-layout { flex-direction: column !important; }
      .activity-panel { width: 100% !important; border-left: none !important; border-top: 1px solid rgba(15,23,42,0.06); }
      .card-content { grid-template-columns: 1fr !important; gap: 8px !important; }
      
      .nav-links { display: none !important; }
      .flashcard { width: 100% !important; height: auto !important; aspect-ratio: 4/3; min-height: 300px; }
      .header-info { display: none !important; }
      
      .ai-assistant-panel { width: calc(100% - 32px) !important; height: calc(100vh - 100px) !important; max-height: 520px !important; bottom: 80px !important; right: 16px !important; }
    }
  `;
  document.head.appendChild(responsiveStyles);
}
