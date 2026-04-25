// StudyFlow — Statistiken
const { useState, useEffect, useMemo } = React;

// ─── Helpers ─────────────────────────────────────────────────
function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

function buildHeatmapData(reviews) {
  // Build a map: dateStr → count
  const counts = {};
  (reviews || []).forEach(r => {
    const d = toDateStr(new Date(r.reviewed_at));
    counts[d] = (counts[d] || 0) + 1;
  });

  // Build 14 weeks (98 days) ending today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cells = [];
  for (let i = 97; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = toDateStr(d);
    cells.push({ date: d, key, count: counts[key] || 0 });
  }

  const max = Math.max(1, ...cells.map(c => c.count));
  return cells.map(c => ({ ...c, intensity: c.count === 0 ? 0 : Math.max(0.15, c.count / max) }));
}

function computeStreak(cells) {
  const today = toDateStr(new Date());
  let streak = 0;
  const days = [...cells].reverse(); // today first
  for (const cell of days) {
    if (cell.count > 0) streak++;
    else if (toDateStr(cell.date) <= today) break;
  }
  return streak;
}

function weekdayLabel(i) {
  return ['Mo', '', 'Mi', '', 'Fr', '', 'So'][i];
}

function monthLabels(cells) {
  // Return positions (col index) where month changes
  const labels = [];
  let lastMonth = -1;
  cells.forEach((cell, i) => {
    const col = Math.floor(i / 7);
    const month = cell.date.getMonth();
    if (month !== lastMonth) {
      labels.push({ col, label: cell.date.toLocaleDateString('de-DE', { month: 'short' }) });
      lastMonth = month;
    }
  });
  return labels;
}

// ─── Heatmap Block ────────────────────────────────────────────
const HeatmapBlock = ({ cells, streak }) => {
  const [hovered, setHovered] = useState(null);
  const mLabels = useMemo(() => monthLabels(cells), [cells]);
  const totalActive = cells.filter(c => c.count > 0).length;

  // Arrange cells into 14 columns × 7 rows (col-major: cells[0..6] = week 0, Mo–So)
  const cols = [];
  for (let col = 0; col < 14; col++) {
    cols.push(cells.slice(col * 7, col * 7 + 7));
  }

  return (
    <div style={{ background: 'white', border: '1px solid rgba(15,23,42,0.06)', borderRadius: 16, padding: '24px 28px', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'Instrument Sans', fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Lernaktivität</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Letzte 14 Wochen</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontFamily: 'Caveat', fontSize: 32, fontWeight: 600, color: '#0f172a', lineHeight: 1 }}>{streak}</span>
            <span style={{ fontSize: 13, color: '#64748b' }}>Tage Streak</span>
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{totalActive} aktive Tage</div>
        </div>
      </div>

      {/* Month labels */}
      <div style={{ position: 'relative', marginBottom: 4 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', paddingLeft: 28 }}>
          {Array.from({ length: 14 }).map((_, col) => {
            const ml = mLabels.find(m => m.col === col);
            return (
              <div key={col} style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, height: 16 }}>
                {ml ? ml.label : ''}
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'flex', gap: 4 }}>
        {/* Weekday labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginRight: 4, justifyContent: 'space-between' }}>
          {[0,1,2,3,4,5,6].map(i => (
            <div key={i} style={{ height: 13, fontSize: 10, color: '#94a3b8', lineHeight: '13px', fontWeight: 500 }}>
              {weekdayLabel(i)}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 3, flex: 1 }}>
          {cols.map((week, col) =>
            week.map((cell, row) => (
              <div
                key={`${col}-${row}`}
                onMouseEnter={() => setHovered(cell)}
                onMouseLeave={() => setHovered(null)}
                title={`${cell.date.toLocaleDateString('de-DE', { day:'numeric', month:'short' })}: ${cell.count} Karten`}
                style={{
                  aspectRatio: 1,
                  borderRadius: 3,
                  background: cell.intensity === 0 ? '#f1f5f9' : `rgba(99,102,241,${cell.intensity})`,
                  cursor: 'default',
                  transition: 'transform 0.1s',
                  transform: hovered?.key === cell.key ? 'scale(1.3)' : 'scale(1)',
                  outline: hovered?.key === cell.key ? '1.5px solid rgba(99,102,241,0.5)' : 'none',
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* Tooltip */}
      {hovered && (
        <div style={{ marginTop: 12, fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: hovered.intensity === 0 ? '#f1f5f9' : `rgba(99,102,241,${hovered.intensity})`, flexShrink: 0 }}/>
          <span style={{ fontWeight: 500, color: '#0f172a' }}>
            {hovered.date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          <span>—</span>
          <span>{hovered.count === 0 ? 'Kein Lernen' : `${hovered.count} Karten gelernt`}</span>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: hovered ? 0 : 16, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 10, color: '#94a3b8' }}>weniger</span>
        {[0, 0.15, 0.3, 0.55, 0.8, 1].map(v => (
          <div key={v} style={{ width: 10, height: 10, borderRadius: 2, background: v === 0 ? '#f1f5f9' : `rgba(99,102,241,${v})` }}/>
        ))}
        <span style={{ fontSize: 10, color: '#94a3b8' }}>mehr</span>
      </div>
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color = '#6366f1', icon }) => (
  <div style={{ background: 'white', borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{label}</div>
      <div style={{ width: 32, height: 32, borderRadius: 10, background: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
    </div>
    <div style={{ fontFamily: 'Instrument Sans', fontSize: 28, fontWeight: 600, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{sub}</div>}
  </div>
);

// ─── Set Mastery List ─────────────────────────────────────────
const SetMasteryList = ({ sets }) => {
  if (!sets || sets.length === 0) return null;
  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 2px 8px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
      <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
        <div style={{ fontFamily: 'Instrument Sans', fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Lernsets — Fortschritt</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {sets.map((s, i) => {
          const pct = s.total > 0 ? Math.round((s.mastered / s.total) * 100) : 0;
          const barColor = pct >= 80 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#6366f1';
          return (
            <a key={s.id} href={`lernset.html?id=${s.id}`} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 22px', borderTop: i > 0 ? '1px solid rgba(15,23,42,0.04)' : 'none', textDecoration: 'none', transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#fafbfc'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #c7d2fe' }}>
                <Icons.Cards size={16}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                <div style={{ marginTop: 5, height: 5, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 999, transition: 'width 0.5s ease' }}/>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'Instrument Sans', fontSize: 20, fontWeight: 600, color: barColor, letterSpacing: '-0.02em' }}>{pct}%</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{s.mastered}/{s.total} Karten</div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};

// ─── Weekly Bar Chart ─────────────────────────────────────────
const WeeklyChart = ({ dailyCounts }) => {
  // Last 7 days
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0,0,0,0);
    const key = toDateStr(d);
    days.push({ label: d.toLocaleDateString('de-DE', { weekday: 'short' }), count: dailyCounts[key] || 0 });
  }
  const max = Math.max(1, ...days.map(d => d.count));

  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 2px 8px rgba(15,23,42,0.04)', padding: '20px 22px' }}>
      <div style={{ fontFamily: 'Instrument Sans', fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 20 }}>Diese Woche</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 100 }}>
        {days.map((d, i) => {
          const h = Math.max(4, Math.round((d.count / max) * 88));
          const isToday = i === 6;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              {d.count > 0 && <div style={{ fontSize: 10, color: isToday ? '#6366f1' : '#94a3b8', fontWeight: 500 }}>{d.count}</div>}
              <div style={{ width: '100%', height: h, borderRadius: 5, background: isToday ? '#6366f1' : (d.count > 0 ? '#c7d2fe' : '#f1f5f9'), transition: 'height 0.4s ease' }}/>
              <div style={{ fontSize: 11, color: isToday ? '#6366f1' : '#94a3b8', fontWeight: isToday ? 600 : 400 }}>{d.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────
const StatsPage = () => {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [sets, setSets] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    (async () => {
      const session = await window.requireAuth();
      if (!session) return;
      const uid = session.user.id;

      const [{ data: prof }, { data: revs }, { data: rawSets }] = await Promise.all([
        window.sb.from('profiles').select('*').eq('id', uid).single(),
        window.sb.from('card_reviews')
          .select('reviewed_at')
          .eq('user_id', uid)
          .gte('reviewed_at', new Date(Date.now() - 98 * 86400000).toISOString())
          .order('reviewed_at'),
        window.sb.from('study_sets')
          .select('id, title, cards(id, mastery_level)')
          .eq('owner_id', uid)
          .order('updated_at', { ascending: false }),
      ]);

      setProfile(prof);
      setReviews(revs || []);

      const enrichedSets = (rawSets || []).map(s => ({
        id: s.id,
        title: s.title,
        total: s.cards ? s.cards.length : 0,
        mastered: s.cards ? s.cards.filter(c => c.mastery_level === 'mastered' || c.mastery_level === 'good').length : 0,
      }));
      setSets(enrichedSets);
      setLoading(false);
    })();
  }, []);

  const cells = useMemo(() => buildHeatmapData(reviews), [reviews]);
  const streak = useMemo(() => computeStreak(cells), [cells]);

  const totalReviewed = reviews.length;
  const weekAgo = toDateStr(new Date(Date.now() - 7 * 86400000));
  const weekReviews = reviews.filter(r => r.reviewed_at >= weekAgo).length;

  const allCards = sets.flatMap(s => Array.from({ length: s.total }));
  const allMastered = sets.reduce((acc, s) => acc + s.mastered, 0);
  const allTotal = sets.reduce((acc, s) => acc + s.total, 0);
  const masteryPct = allTotal > 0 ? Math.round((allMastered / allTotal) * 100) : 0;

  const dailyCounts = useMemo(() => {
    const m = {};
    reviews.forEach(r => { const d = toDateStr(new Date(r.reviewed_at)); m[d] = (m[d] || 0) + 1; });
    return m;
  }, [reviews]);

  const avgPerActiveDay = useMemo(() => {
    const activeDays = Object.keys(dailyCounts).length;
    return activeDays > 0 ? Math.round(totalReviewed / activeDays) : 0;
  }, [dailyCounts, totalReviewed]);

  const displayName = profile?.display_name || 'Nutzer';

  const DOCK_ITEMS = [
    { id: 'home', label: 'Dashboard', icon: <Icons.Home size={18}/>, href: 'dashboard.html' },
    { id: 'cards', label: 'Lernsets', icon: <Icons.Cards size={18}/>, href: 'dashboard.html' },
    { id: 'notes', label: 'Notes', icon: <Icons.Doc size={18}/>, href: 'dokument.html' },
    { id: 'stats', label: 'Statistiken', icon: <Icons.Chart size={18}/> },
    { id: 'settings', label: 'Einstellungen', icon: <Icons.Settings size={18}/>, href: 'dashboard.html?tab=settings' },
  ];

  if (loading) return (
    <div className="dot-paper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'Caveat', fontSize: 24, color: '#64748b' }}>Lädt…</div>
    </div>
  );

  return (
    <div className="dot-paper" style={{ minHeight: '100vh' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', background: 'white', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <a href="dashboard.html" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13 }}>
            <Icons.ArrowLeft size={14}/> Dashboard
          </a>
          <div style={{ height: 20, width: 1, background: '#e2e8f0' }}/>
          <div style={{ fontFamily: 'Instrument Sans', fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Statistiken</div>
        </div>
        <div style={{ fontSize: 13, color: '#64748b' }}>
          Servus, <span style={{ color: '#0f172a', fontWeight: 500 }}>{displayName.split(' ')[0]}</span>
        </div>
      </header>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '28px 32px 100px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <StatCard
            label="Streak"
            value={`${streak} T.`}
            sub="Tage in Folge"
            color="#f59e0b"
            icon={<Icons.Bolt size={15}/>}
          />
          <StatCard
            label="Diese Woche"
            value={weekReviews}
            sub="Karten gelernt"
            color="#6366f1"
            icon={<Icons.Cards size={15}/>}
          />
          <StatCard
            label="Gemeistert"
            value={`${masteryPct}%`}
            sub={`${allMastered} von ${allTotal} Karten`}
            color="#10b981"
            icon={<Icons.Check size={15}/>}
          />
          <StatCard
            label="Ø pro Tag"
            value={avgPerActiveDay}
            sub="Karten (aktive Tage)"
            color="#8b5cf6"
            icon={<Icons.Chart size={15}/>}
          />
        </div>

        {/* Heatmap */}
        <HeatmapBlock cells={cells} streak={streak}/>

        {/* Weekly chart + set mastery side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, alignItems: 'start' }}>
          <WeeklyChart dailyCounts={dailyCounts}/>
          <SetMasteryList sets={sets}/>
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 60 }}>
        <Dock items={DOCK_ITEMS} active="stats" onSelect={(id) => {
          const item = DOCK_ITEMS.find(i => i.id === id);
          if (item?.href) window.location.href = item.href;
        }}/>
      </div>
      <AIAssistant/>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<StatsPage/>);
