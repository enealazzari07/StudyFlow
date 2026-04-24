// StudyFlow — Dashboard (v2: floating sidebar, compact, calm)
const { useState, useEffect, useRef } = React;

const DOCK_ITEMS = [
  { id: 'home', label: 'Start', icon: <Icons.Home size={18}/> },
  { id: 'cards', label: 'Lernsets', icon: <Icons.Cards size={18}/> },
  { id: 'docs', label: 'Dokumente', icon: <Icons.Doc size={18}/> },
  { id: 'ai', label: 'Flow AI', icon: <Icons.Sparkles size={18}/>, href: 'ai-upload.html' },
  { id: 'stats', label: 'Fortschritt', icon: <Icons.Chart size={18}/> },
  { id: 'settings', label: 'Einstellungen', icon: <Icons.Settings size={18}/> },
];

// ─── Create Set Modal ────────────────────────────────────────
const CreateSetModal = ({ onClose, onCreated, userId }) => {
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('📚');
  const [description, setDescription] = useState('');
  const [folder, setFolder] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError('');
    const { data, error: err } = await window.sb.from('study_sets').insert({
      owner_id: userId,
      title: title.trim(),
      emoji: emoji || '📚',
      description: description.trim() || null,
      folder: folder.trim() || null,
    }).select().single();
    setLoading(false);
    if (err) { setError(err.message); return; }
    onCreated(data);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 20, padding: 32, width: 480, boxShadow: '0 20px 60px rgba(15,23,42,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: 'Instrument Sans', fontSize: 20, fontWeight: 600, color: '#0f172a', marginBottom: 24 }}>Neues Lernset erstellen</div>
        {error && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#991b1b', marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Emoji</label>
              <input value={emoji} onChange={e => setEmoji(e.target.value)} className="input-paper" style={{ width: 60, textAlign: 'center', fontSize: 22 }} maxLength={2}/>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Titel *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="input-paper" placeholder="z.B. Mikroökonomie II" required autoFocus/>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Beschreibung (optional)</label>
            <input value={description} onChange={e => setDescription(e.target.value)} className="input-paper" placeholder="Kurze Beschreibung…"/>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Ordner (optional)</label>
            <input value={folder} onChange={e => setFolder(e.target.value)} className="input-paper" placeholder="z.B. Sommersemester 26"/>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex: 1, justifyContent: 'center', padding: '11px 0' }}>Abbrechen</button>
            <button type="submit" disabled={loading || !title.trim()} className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '11px 0', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Erstelle…' : <><Icons.Plus size={14}/> Erstellen</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Sidebar ─────────────────────────────────────────────────
const Sidebar = ({ user, profile, sets, onNewSet, onSignOut }) => {
  const folders = [...new Set((sets || []).map(s => s.folder).filter(Boolean))];
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Nutzer';

  return (
    <aside style={{
      width: 240,
      flexShrink: 0,
      margin: '14px 0 14px 14px',
      background: 'white',
      borderRadius: 18,
      border: '1px solid rgba(15,23,42,0.06)',
      boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.04)',
      padding: '20px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      height: 'calc(100vh - 28px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 4px' }}>
        <Icons.Logo size={26}/>
        <div style={{ fontFamily: 'Caveat', fontSize: 24, fontWeight: 600, color: '#0f172a' }}>StudyFlow</div>
      </div>

      <button onClick={onNewSet} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '9px 14px', fontSize: 13 }}>
        <Icons.Plus size={14}/> Neues Lernset
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, padding: '0 8px' }}>Bibliothek</div>
        {[
          { label: 'Alle Lernsets', count: sets ? sets.length : 0, icon: <Icons.Cards size={15}/>, active: true },
          { label: 'Dokumente', count: 0, icon: <Icons.Doc size={15}/>, href: 'ai-upload.html' },
          { label: 'Favoriten', count: 0, icon: <Icons.Star size={15}/> },
          { label: 'Geteilt mit mir', count: 0, icon: <Icons.Users size={15}/> },
        ].map(item => (
          <div key={item.label} onClick={() => item.href && (window.location.href = item.href)} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '7px 10px', borderRadius: 8,
            background: item.active ? '#f1f5f9' : 'transparent',
            color: item.active ? '#0f172a' : '#475569',
            fontSize: 13, fontWeight: item.active ? 500 : 400,
            cursor: 'pointer',
          }}>
            {item.icon}
            <span style={{ flex: 1 }}>{item.label}</span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{item.count}</span>
          </div>
        ))}
      </div>

      {folders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, padding: '0 8px' }}>Ordner</div>
          {folders.map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', fontSize: 13, color: '#475569', cursor: 'pointer', borderRadius: 8 }}>
              <Icons.Folder size={15}/>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px', borderTop: '1px solid rgba(15,23,42,0.06)', paddingTop: 14 }}>
        <Avatar name={displayName} color="#6366f1" size={30}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{profile?.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}</div>
        </div>
        <button onClick={onSignOut} title="Abmelden" style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
          <Icons.Settings size={15}/>
        </button>
      </div>
    </aside>
  );
};

// ─── TopBar ──────────────────────────────────────────────────
const TopBar = ({ search, onSearch }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
    <div style={{ flex: 1, maxWidth: 380, position: 'relative' }}>
      <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
        <Icons.Search size={15}/>
      </div>
      <input
        className="input-paper"
        placeholder="Suchen…"
        value={search}
        onChange={e => onSearch(e.target.value)}
        style={{ paddingLeft: 36, background: 'white', padding: '8px 12px 8px 36px', fontSize: 13 }}
      />
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button style={{ background: 'white', border: '1px solid #e2e8f0', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: 'inherit' }}>
        🔥 —
      </button>
      <button style={{ background: 'white', border: '1px solid #e2e8f0', padding: 7, borderRadius: 8, cursor: 'pointer', color: '#475569', display: 'flex' }}>
        <Icons.Bell size={15}/>
      </button>
    </div>
  </div>
);

// ─── Set Row ─────────────────────────────────────────────────
const SetRow = ({ set, onDelete }) => {
  const pct = set.total_cards ? Math.round((set.mastered_cards / set.total_cards) * 100) : 0;
  const isDraft = set.total_cards === 0;

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`"${set.title}" wirklich löschen?`)) return;
    await window.sb.from('study_sets').delete().eq('id', set.id);
    onDelete(set.id);
  };

  const lastStudy = set.updated_at
    ? (() => {
        const diff = Date.now() - new Date(set.updated_at).getTime();
        const h = Math.floor(diff / 3600000);
        if (h < 1) return 'Gerade eben';
        if (h < 24) return `vor ${h} Std.`;
        const d = Math.floor(h / 24);
        if (d === 1) return 'Gestern';
        return `vor ${d} T.`;
      })()
    : '—';

  return (
    <a href={`lernset.html?id=${set.id}`} style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) 110px 90px 70px 80px',
      alignItems: 'center',
      gap: 14,
      padding: '10px 14px',
      background: 'white',
      borderRadius: 10,
      border: '1px solid rgba(15,23,42,0.05)',
      transition: 'border-color 0.15s, background 0.15s',
      textDecoration: 'none',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#fafbfc'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(15,23,42,0.05)'; e.currentTarget.style.background = 'white'; }}
    >
      <div style={{ minWidth: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 16 }}>{set.emoji || '📚'}</span>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{set.title}</div>
          {!isDraft && pct === 100 && <span style={{ fontSize: 10, color: '#059669', background: '#d1fae5', padding: '1px 6px', borderRadius: 4, fontWeight: 500, flexShrink: 0 }}>Fertig</span>}
          {isDraft && <span style={{ fontSize: 10, color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, fontWeight: 500, flexShrink: 0 }}>Entwurf</span>}
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {set.total_cards} Karten
          <span style={{ color: '#cbd5e1' }}>·</span>
          {lastStudy}
        </div>
      </div>

      <div>
        {!isDraft ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 3 }}>
              <span>{pct}%</span>
              <span>{set.mastered_cards}/{set.total_cards}</span>
            </div>
            <div style={{ height: 4, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: '#0f172a', borderRadius: 999 }}></div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 11.5, color: '#94a3b8' }}>—</div>
        )}
      </div>

      <div style={{ fontSize: 12, color: '#64748b' }}>
        {set.due_cards > 0 ? (
          <span style={{ color: '#dc2626', fontWeight: 500 }}>{set.due_cards} fällig</span>
        ) : (
          <span style={{ color: '#94a3b8' }}>keine fällig</span>
        )}
      </div>

      <div>
        <div style={{ fontSize: 11.5, color: '#cbd5e1' }}>Nur ich</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
        <a href={`lern-modus.html?id=${set.id}`} onClick={e => e.stopPropagation()} style={{
          padding: '5px 10px', background: '#0f172a', color: 'white',
          border: 'none', borderRadius: 6, fontSize: 11.5, fontFamily: 'inherit',
          cursor: 'pointer', fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center',
        }}>
          Lernen
        </a>
        <button onClick={handleDelete} style={{ padding: 5, background: 'none', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
          <Icons.MoreH size={14}/>
        </button>
      </div>
    </a>
  );
};

// ─── Stats ───────────────────────────────────────────────────
const StatsRow = ({ stats }) => {
  const items = [
    { label: 'Fällig heute', value: stats.dueToday || '0', sub: 'Karten' },
    { label: 'Diese Woche', value: stats.weekReviews || '0', sub: 'Karten geübt' },
    { label: 'Gemeistert', value: stats.masteryPct || '0%', sub: 'aller Karten' },
    { label: 'Lernsets', value: stats.totalSets || '0', sub: 'gesamt' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
      {items.map(s => (
        <div key={s.label} style={{ background: 'white', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(15,23,42,0.05)' }}>
          <div style={{ fontSize: 11, color: '#64748b' }}>{s.label}</div>
          <div style={{ fontFamily: 'Instrument Sans', fontSize: 22, fontWeight: 600, color: '#0f172a', marginTop: 2, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
};

// ─── Empty State ─────────────────────────────────────────────
const EmptyState = ({ onNewSet }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16, color: '#94a3b8', padding: 40 }}>
    <div style={{ fontSize: 48 }}>📚</div>
    <div style={{ fontFamily: 'Caveat', fontSize: 24, color: '#64748b' }}>Noch keine Lernsets</div>
    <div style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center', maxWidth: 300 }}>Erstelle dein erstes Lernset oder lade ein Dokument hoch, um loszulegen.</div>
    <button onClick={onNewSet} className="btn-primary" style={{ padding: '10px 20px' }}>
      <Icons.Plus size={14}/> Erstes Lernset erstellen
    </button>
  </div>
);

// ─── Dashboard ───────────────────────────────────────────────
const Dashboard = () => {
  const [active, setActive] = useState('home');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sets, setSets] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    (async () => {
      const session = await window.requireAuth();
      if (!session) return;

      const u = session.user;
      setUser(u);

      // Load profile
      const { data: prof } = await window.sb.from('profiles').select('*').eq('id', u.id).single();
      setProfile(prof);

      await loadSets(u.id);
      setLoading(false);
    })();
  }, []);

  const loadSets = async (userId) => {
    const { data: rawSets } = await window.sb
      .from('study_sets')
      .select('*, cards(id, mastery_level, next_review)')
      .eq('owner_id', userId)
      .order('updated_at', { ascending: false });

    if (!rawSets) return;

    const now = new Date().toISOString();
    const enriched = rawSets.map(s => ({
      ...s,
      total_cards: s.cards ? s.cards.length : 0,
      mastered_cards: s.cards ? s.cards.filter(c => c.mastery_level === 'mastered').length : 0,
      due_cards: s.cards ? s.cards.filter(c => c.next_review && c.next_review <= now).length : 0,
    }));

    setSets(enriched);

    // Compute global stats
    const allCards = enriched.flatMap(s => s.cards || []);
    const dueToday = allCards.filter(c => c.next_review && c.next_review <= now).length;
    const mastered = allCards.filter(c => c.mastery_level === 'mastered').length;
    const masteryPct = allCards.length ? Math.round((mastered / allCards.length) * 100) + '%' : '0%';

    // Reviews this week
    const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const { count: weekReviews } = await window.sb.from('card_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId || user?.id)
      .gte('reviewed_at', weekAgo);

    setStats({ dueToday, weekReviews: weekReviews || 0, masteryPct, totalSets: enriched.length });
  };

  const handleSignOut = async () => {
    await window.sb.auth.signOut();
    window.location.href = 'login.html';
  };

  const handleSetCreated = (newSet) => {
    setSets(prev => [{ ...newSet, total_cards: 0, mastered_cards: 0, due_cards: 0, cards: [] }, ...prev]);
    setStats(prev => ({ ...prev, totalSets: (prev.totalSets || 0) + 1 }));
  };

  const handleSetDeleted = (id) => {
    setSets(prev => prev.filter(s => s.id !== id));
  };

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Nutzer';

  const filteredSets = sets
    .filter(s => {
      if (search) return s.title.toLowerCase().includes(search.toLowerCase());
      if (filter === 'due') return s.due_cards > 0;
      if (filter === 'shared') return false;
      return true;
    });

  if (loading) return (
    <div className="dot-paper" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'Caveat', fontSize: 24, color: '#64748b' }}>Lädt…</div>
    </div>
  );

  return (
    <div className="dot-paper" style={{ height: '100vh', overflow: 'hidden', display: 'flex' }}>
      <Sidebar user={user} profile={profile} sets={sets} onNewSet={() => setShowModal(true)} onSignOut={handleSignOut}/>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '18px 22px 14px', minWidth: 0, gap: 16, overflow: 'hidden' }}>
        <TopBar search={search} onSearch={setSearch}/>

        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h1 style={{ fontFamily: 'Instrument Sans', fontSize: 24, fontWeight: 600, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
              Servus, {displayName.split(' ')[0]}.
            </h1>
            {stats.dueToday > 0 && (
              <span style={{ fontSize: 13, color: '#64748b' }}>
                <span style={{ color: '#0f172a', fontWeight: 500 }}>{stats.dueToday} Karten</span> fällig
              </span>
            )}
          </div>
        </div>

        <StatsRow stats={stats}/>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <h2 style={{ fontFamily: 'Instrument Sans', fontSize: 15, fontWeight: 600, color: '#0f172a', margin: 0 }}>Alle Lernsets</h2>
              <div style={{ display: 'flex', gap: 2, background: '#f1f5f9', padding: 2, borderRadius: 7 }}>
                {[
                  { k: 'all', l: 'Alle' },
                  { k: 'due', l: 'Fällig' },
                ].map(t => (
                  <button key={t.k} onClick={() => setFilter(t.k)} style={{
                    padding: '4px 10px', background: filter === t.k ? 'white' : 'transparent',
                    border: 'none', borderRadius: 5, fontSize: 11.5,
                    color: filter === t.k ? '#0f172a' : '#64748b',
                    fontWeight: filter === t.k ? 500 : 400,
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: filter === t.k ? '0 1px 2px rgba(15,23,42,0.08)' : 'none',
                  }}>{t.l}</button>
                ))}
              </div>
            </div>
          </div>

          {filteredSets.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) 110px 90px 70px 80px',
              gap: 14,
              padding: '0 14px',
              fontSize: 10.5, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              <div>Name</div>
              <div>Fortschritt</div>
              <div>Status</div>
              <div>Team</div>
              <div></div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 4, paddingBottom: 70 }}>
            {filteredSets.length > 0
              ? filteredSets.map(s => <SetRow key={s.id} set={s} onDelete={handleSetDeleted}/>)
              : <EmptyState onNewSet={() => setShowModal(true)}/>
            }
          </div>
        </div>
      </main>

      <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 60 }}>
        <Dock items={DOCK_ITEMS} active={active} onSelect={(id) => {
          const item = DOCK_ITEMS.find(i => i.id === id);
          if (item?.href) window.location.href = item.href;
          else setActive(id);
        }}/>
      </div>

      <AIAssistant/>

      {showModal && (
        <CreateSetModal
          userId={user?.id}
          onClose={() => setShowModal(false)}
          onCreated={handleSetCreated}
        />
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Dashboard/>);
