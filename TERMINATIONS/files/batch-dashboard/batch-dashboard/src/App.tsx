import { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import {
  CaretDownIcon, CaretUpIcon,
  UserIcon, PhoneCallIcon, CheckCircleIcon, XCircleIcon, ClockIcon,
  MedalIcon, CurrencyCircleDollarIcon, StarIcon, ProhibitIcon,
  HourglassIcon, EnvelopeIcon, ArrowUpIcon, ArrowDownIcon, ArrowRightIcon,
  MagnifyingGlassIcon, StackIcon, TrendUpIcon, SortAscendingIcon,
  ArrowsClockwiseIcon, WarningIcon,
} from '@phosphor-icons/react';

import { useAirtableData } from './useAirtableData';
import type { BatchRecord, CsatSortOption, MonthSelection, StatusTab, ViewMode } from './types';
import { safeToFixed, getMonthBounds, MONTH_NAMES, CUTOFF_DONE } from './types';

// ─── Config Panel ────────────────────────────────────────────────────────────
function ConfigPanel({ onSave }: { onSave: (pat: string, baseId: string) => void }) {
  const [pat, setPat] = useState(localStorage.getItem('airtable_pat') || '');
  const [baseId, setBaseId] = useState(localStorage.getItem('airtable_base_id') || '');

  return (
    <div className="config-overlay">
      <div className="config-card">
        <div className="config-icon">
          <CurrencyCircleDollarIcon size={32} weight="fill" />
        </div>
        <h2>Batch Auswertung</h2>
        <p>Bitte gib deinen Airtable Personal Access Token und die Base ID ein.</p>
        <div className="config-field">
          <label>Personal Access Token (PAT)</label>
          <input
            type="password"
            placeholder="pat_..."
            value={pat}
            onChange={e => setPat(e.target.value)}
          />
        </div>
        <div className="config-field">
          <label>Base ID</label>
          <input
            type="text"
            placeholder="appXXXXXXXXXXXXXX"
            value={baseId}
            onChange={e => setBaseId(e.target.value)}
          />
        </div>
        <button
          className="config-btn"
          disabled={!pat.trim() || !baseId.trim()}
          onClick={() => onSave(pat.trim(), baseId.trim())}
        >
          Dashboard laden
        </button>
        <p className="config-hint">
          Die Daten werden nur in deinem Browser gespeichert und nie an Dritte übermittelt.
        </p>
      </div>
    </div>
  );
}

// ─── Stars ───────────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number | null }) {
  if (rating === null) return <span className="muted">–</span>;
  const full = Math.floor(rating);
  const empty = 5 - full;
  const color = rating >= 4 ? '#048A0E' : rating >= 3 ? '#FFBA05' : '#DC043B';
  return (
    <span className="stars">
      {[...Array(full)].map((_, i) => <StarIcon key={`f${i}`} size={13} weight="fill" color={color} />)}
      {[...Array(empty)].map((_, i) => <StarIcon key={`e${i}`} size={13} weight="regular" color="#ccc" />)}
      <span className="star-val">({safeToFixed(rating, 1)})</span>
    </span>
  );
}

// ─── CSAT Before/After Item ───────────────────────────────────────────────────
interface CsatItem { name: string; csatI: number; csatII: number; improvement: number; kommentar: string; }
function CsatBeforeAfterItem({ item }: { item: CsatItem }) {
  const [open, setOpen] = useState(false);
  const beforeColor = item.csatI >= 4 ? '#048A0E' : item.csatI >= 3 ? '#FFBA05' : '#DC043B';
  const afterColor = item.csatII >= 4 ? '#048A0E' : item.csatII >= 3 ? '#FFBA05' : '#DC043B';
  const impColor = item.improvement > 0 ? '#048A0E' : item.improvement < 0 ? '#DC043B' : '#888';

  return (
    <div className="csat-row" onClick={() => item.kommentar && setOpen(!open)}>
      <div className="csat-row-main">
        <span className="csat-name" title={item.name}>{item.name}</span>
        <div className="csat-score-circle" style={{ borderColor: beforeColor, color: beforeColor }}>{item.csatI}</div>
        <div className="csat-arrow-line" style={{ background: `linear-gradient(to right, ${beforeColor}, ${afterColor})` }}>
          <div className="csat-arrow-tip" style={{ borderLeftColor: afterColor }} />
        </div>
        <div className="csat-score-filled" style={{ background: afterColor }}>{item.csatII}</div>
        <div className="csat-badge" style={{ background: impColor }}>
          {item.improvement > 0 && <ArrowUpIcon size={13} weight="bold" />}
          {item.improvement < 0 && <ArrowDownIcon size={13} weight="bold" />}
          <span>{item.improvement > 0 ? '+' : ''}{item.improvement}</span>
        </div>
        {item.kommentar && (
          <div className="csat-chevron">{open ? <CaretUpIcon size={16} /> : <CaretDownIcon size={16} />}</div>
        )}
      </div>
      {open && item.kommentar && (
        <div className="csat-comment">
          <span className="csat-comment-label">CSAT II Kommentar:</span>
          <p>{item.kommentar}</p>
        </div>
      )}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  if (status === 'Done') return <span className="badge badge-done"><CheckCircleIcon size={12} weight="fill" />Done</span>;
  if (status === 'In Progress') return <span className="badge badge-progress"><UserIcon size={12} weight="fill" />In Progress</span>;
  if (status.includes('Blockiert')) return <span className="badge badge-blocked"><ProhibitIcon size={12} weight="fill" />Blockiert</span>;
  return <span className="badge badge-default">{status || '–'}</span>;
}

// ─── Mini donut ───────────────────────────────────────────────────────────────
function Donut({ pct, label }: { pct: number; label: string }) {
  const dash = pct;
  return (
    <div className="donut-wrap">
      <svg className="donut-svg" viewBox="0 0 36 36">
        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none" stroke="#E5E7EB" strokeWidth="3" />
        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none" stroke="#166EE1" strokeWidth="3"
          strokeDasharray={`${dash}, 100`} strokeLinecap="round" />
      </svg>
      <span className="donut-label">{label}</span>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  // Config state
  const [pat, setPat] = useState<string>(() =>
    import.meta.env.VITE_AIRTABLE_PAT || localStorage.getItem('airtable_pat') || ''
  );
  const [baseId, setBaseId] = useState<string>(() =>
    import.meta.env.VITE_AIRTABLE_BASE_ID || localStorage.getItem('airtable_base_id') || ''
  );
  const [configured, setConfigured] = useState(() => !!(
    (import.meta.env.VITE_AIRTABLE_PAT && import.meta.env.VITE_AIRTABLE_BASE_ID) ||
    (localStorage.getItem('airtable_pat') && localStorage.getItem('airtable_base_id'))
  ));

  const handleSaveConfig = useCallback((p: string, b: string) => {
    localStorage.setItem('airtable_pat', p);
    localStorage.setItem('airtable_base_id', b);
    // Inject into env-like variables for the API client
    (window as unknown as Record<string, unknown>).__AIRTABLE_PAT__ = p;
    (window as unknown as Record<string, unknown>).__AIRTABLE_BASE_ID__ = b;
    setPat(p);
    setBaseId(b);
    setConfigured(true);
  }, []);

  if (!configured) return <ConfigPanel onSave={handleSaveConfig} />;

  return <Dashboard />;
}

function Dashboard() {
  const { batches, csats, loading, error, lastFetch, refetch } = useAirtableData();

  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'improvement' | 'provision' | 'csatI' | 'date'>('improvement');
  const [csatSortBy, setCsatSortBy] = useState<CsatSortOption>('improvement');
  const [monthSelection, setMonthSelection] = useState<MonthSelection>('current');

  const { first, last, month, year } = useMemo(() => getMonthBounds(monthSelection), [monthSelection]);

  // Filter batches for the selected month
  const monthBatches = useMemo(() => batches.filter(b => {
    if (!b.retentionAgentTs) return false;
    const d = new Date(b.retentionAgentTs);
    return d >= first && d <= last;
  }), [batches, first, last]);

  // Status filtering
  const filteredBatches = useMemo(() => {
    return monthBatches.filter(b => {
      const status = b.status;
      if (status === 'Done') {
        if (!b.endDate) return false;
        if (new Date(b.endDate) < CUTOFF_DONE) return false;
      }
      switch (statusTab) {
        case 'inProgress':
          return status === 'In Progress' && !b.inProgressSubStatus.includes('Kunde erneut anrufen') && !b.blockiertEscalationTs && !b.blockiertTelefonTs;
        case 'done':
          return status === 'Done';
        case 'blocked':
          return status === 'In Progress' && (!!b.blockiertEscalationTs || !!b.blockiertTelefonTs);
        case 'callbackNeeded':
          return b.inProgressSubStatus.includes('Kunde erneut anrufen');
        case 'csatIIPending':
          return b.sendCsatII === true && !b.csatIIRespondedTs;
        default:
          return status === 'Done' || status === 'In Progress' || status.includes('Blockiert');
      }
    }).sort((a, b_) => {
      const p = (s: string) => s === 'In Progress' ? 0 : s === 'Done' ? 1 : 2;
      const diff = p(a.status) - p(b_.status);
      if (diff !== 0) return diff;
      if (a.earliestCsat && b_.earliestCsat)
        return new Date(a.earliestCsat).getTime() - new Date(b_.earliestCsat).getTime();
      return 0;
    });
  }, [monthBatches, statusTab]);

  // Counts
  const counts = useMemo(() => {
    const total = monthBatches.filter(b => b.status === 'Done' || b.status === 'In Progress' || b.status.includes('Blockiert'));
    const done = total.filter(b => b.status === 'Done' && b.endDate && new Date(b.endDate) >= CUTOFF_DONE);
    const inProg = total.filter(b => b.status === 'In Progress' && !b.inProgressSubStatus.includes('Kunde erneut anrufen') && !b.blockiertEscalationTs && !b.blockiertTelefonTs);
    const blocked = total.filter(b => b.status === 'In Progress' && (!!b.blockiertEscalationTs || !!b.blockiertTelefonTs));
    const callback = monthBatches.filter(b => b.inProgressSubStatus.includes('Kunde erneut anrufen'));
    const csatPending = monthBatches.filter(b => b.sendCsatII === true && !b.csatIIRespondedTs);
    return { total: total.length, done: done.length, inProg: inProg.length, blocked: blocked.length, callback: callback.length, csatPending: csatPending.length };
  }, [monthBatches]);

  // Stats
  const stats = useMemo(() => {
    let totalCsatCases = 0, closedCases = 0, avgImpSum = 0, avgImpCnt = 0;
    let improved = 0, same = 0, worsened = 0;
    const csatComparison: CsatItem[] = [];

    monthBatches.forEach(b => {
      totalCsatCases += b.csatCases;
      closedCases += b.closedCases;
      if (b.csatImprovement !== null) {
        avgImpSum += b.csatImprovement;
        avgImpCnt++;
        if (b.csatImprovement > 0) improved++;
        else if (b.csatImprovement < 0) worsened++;
        else same++;
      }
      if (b.lowestCsatI !== null && b.csatIIRating !== null) {
        csatComparison.push({
          name: (b.vorUndNachname || b.customerName || b.id).substring(0, 15),
          csatI: b.lowestCsatI,
          csatII: b.csatIIRating,
          improvement: b.csatIIRating - b.lowestCsatI,
          kommentar: b.csatIIKommentar,
        });
      }
    });

    csatComparison.sort((a, b) => b.improvement - a.improvement);

    return {
      totalCsatCases,
      closedCases,
      completionRate: totalCsatCases > 0 ? (closedCases / totalCsatCases) * 100 : 0,
      avgImprovement: avgImpCnt > 0 ? avgImpSum / avgImpCnt : 0,
      improved, same, worsened,
      csatComparison,
    };
  }, [monthBatches]);

  // Provision data
  const provisionData = useMemo(() => {
    const perDay: Record<string, { base: number; bonus: number }> = {};
    let totalMonth = 0;

    monthBatches.forEach(b => {
      if (b.doneTimestamp) {
        const d = new Date(b.doneTimestamp);
        if (d >= first && d <= last) {
          const key = `${d.getDate()}.${d.getMonth() + 1}`;
          if (!perDay[key]) perDay[key] = { base: 0, bonus: 0 };
          perDay[key].base += b.provisionBase;
          totalMonth += b.provisionBase;
        }
      }
      if (b.csatIIRespondedTs && b.provisionBonus > 0) {
        const d = new Date(b.csatIIRespondedTs);
        if (d >= first && d <= last) {
          const key = `${d.getDate()}.${d.getMonth() + 1}`;
          if (!perDay[key]) perDay[key] = { base: 0, bonus: 0 };
          perDay[key].bonus += b.provisionBonus;
          totalMonth += b.provisionBonus;
        }
      } else if (!b.csatIIRespondedTs && b.provisionBonus > 0 && b.doneTimestamp) {
        const d = new Date(b.doneTimestamp);
        if (d >= first && d <= last) {
          const key = `${d.getDate()}.${d.getMonth() + 1}`;
          if (!perDay[key]) perDay[key] = { base: 0, bonus: 0 };
          perDay[key].bonus += b.provisionBonus;
          totalMonth += b.provisionBonus;
        }
      }
    });

    const today = new Date();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const workingDays = Math.round(daysInMonth * 5 / 7);
    // Build all days up to today for the chart
    const provisionPerDay = [];
    for (let d = 1; d <= (month === today.getMonth() && year === today.getFullYear() ? today.getDate() : daysInMonth); d++) {
      const key = `${d}.${month + 1}`;
      const data = perDay[key];
      provisionPerDay.push({ date: key, total: data ? data.base + data.bonus : 0 });
    }

    let baseSum = 0, bonusSum = 0;
    monthBatches.forEach(b => {
      if (b.doneTimestamp) {
        const d = new Date(b.doneTimestamp);
        if (d >= first && d <= last) baseSum += b.provisionBase;
      }
      if (b.csatIIRespondedTs && b.provisionBonus > 0) {
        const d = new Date(b.csatIIRespondedTs);
        if (d >= first && d <= last) bonusSum += b.provisionBonus;
      } else if (!b.csatIIRespondedTs && b.provisionBonus > 0 && b.doneTimestamp) {
        const d = new Date(b.doneTimestamp);
        if (d >= first && d <= last) bonusSum += b.provisionBonus;
      }
    });

    return { total: totalMonth, provisionPerDay, baseSum, bonusSum, workingDays };
  }, [monthBatches, first, last, month, year]);

  // Sorted + searched batch list
  const displayBatches = useMemo(() => {
    let list = [...filteredBatches];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(b =>
        (b.vorUndNachname || b.customerName).toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q)
      );
    }
    list.sort((a, b_) => {
      switch (sortBy) {
        case 'improvement': return (b_.csatImprovement ?? -999) - (a.csatImprovement ?? -999);
        case 'provision': return (b_.totalProvision ?? 0) - (a.totalProvision ?? 0);
        case 'csatI': return (a.lowestCsatI ?? 999) - (b_.lowestCsatI ?? 999);
        case 'date': {
          if (!a.earliestCsat && !b_.earliestCsat) return 0;
          if (!a.earliestCsat) return 1;
          if (!b_.earliestCsat) return -1;
          return new Date(b_.earliestCsat).getTime() - new Date(a.earliestCsat).getTime();
        }
        default: return 0;
      }
    });
    return list;
  }, [filteredBatches, searchQuery, sortBy]);

  const sortedCsats = useMemo(() => {
    const data = [...stats.csatComparison];
    if (csatSortBy === 'name') return data.sort((a, b) => a.name.localeCompare(b.name));
    if (csatSortBy === 'csatAfter') return data.sort((a, b) => b.csatII - a.csatII);
    return data.sort((a, b) => b.improvement - a.improvement);
  }, [stats.csatComparison, csatSortBy]);

  const dailyTarget = 0; // No user record in standalone – user can add target in config later

  const formatDate = (ts: string | null) => {
    if (!ts) return '';
    const d = new Date(ts);
    return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
  };

  const getActionStatus = (b: BatchRecord) => {
    if (b.status === 'Done') {
      if (b.csatIIRespondedTs) return (
        <div className="action-cell">
          <span className="action-done"><CheckCircleIcon size={13} weight="fill" />Abgeschlossen · {formatDate(b.doneTimestamp)}</span>
          <span className="action-sub">CSAT2: {formatDate(b.csatIIRespondedTs)}</span>
        </div>
      );
      if (!b.hasEnergyResponsibility && !b.sendCsatII) return (
        <span className="action-done"><CheckCircleIcon size={13} weight="fill" />Abgeschlossen · {formatDate(b.doneTimestamp)}</span>
      );
    }
    if (b.sendCsatII && !b.csatIIRespondedTs) {
      const days = b.csatIISentTimestamp ? Math.floor((Date.now() - new Date(b.csatIISentTimestamp).getTime()) / 86400000) : 0;
      return <span className="badge badge-warn"><EnvelopeIcon size={13} />Warte · {days}d</span>;
    }
    return <span className="badge badge-default"><ClockIcon size={13} />In Bearbeitung</span>;
  };

  const getMonthProvision = (b: BatchRecord) => {
    let mp = 0;
    if (b.doneTimestamp) { const d = new Date(b.doneTimestamp); if (d >= first && d <= last) mp += b.provisionBase; }
    if (b.csatIIRespondedTs && b.provisionBonus > 0) { const d = new Date(b.csatIIRespondedTs); if (d >= first && d <= last) mp += b.provisionBonus; }
    else if (!b.csatIIRespondedTs && b.provisionBonus > 0 && b.doneTimestamp) { const d = new Date(b.doneTimestamp); if (d >= first && d <= last) mp += b.provisionBonus; }
    return mp;
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <p>Lade Daten aus Airtable…</p>
    </div>
  );

  if (error) return (
    <div className="error-screen">
      <WarningIcon size={48} color="#DC043B" />
      <h2>Fehler beim Laden</h2>
      <p>{error}</p>
      <button className="config-btn" onClick={refetch}>Erneut versuchen</button>
    </div>
  );

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-title">
            <h1>Batch Auswertung</h1>
            {lastFetch && <p className="header-sub">Zuletzt aktualisiert: {lastFetch.toLocaleTimeString('de-DE')}</p>}
          </div>
          <div className="header-controls">
            <select className="select-sm" value={monthSelection} onChange={e => setMonthSelection(e.target.value as MonthSelection)}>
              <option value="current">Aktueller Monat</option>
              <option value="previous">Vorheriger Monat</option>
            </select>
            <button className="icon-btn" onClick={refetch} title="Daten neu laden">
              <ArrowsClockwiseIcon size={18} />
            </button>
            <div className="view-toggle">
              <button className={viewMode === 'overview' ? 'active' : ''} onClick={() => setViewMode('overview')}>Übersicht</button>
              <button className={viewMode === 'detail' ? 'active' : ''} onClick={() => setViewMode('detail')}>Detail</button>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        {/* Provision highlight */}
        <div className="provision-card">
          <div className="provision-icon"><CurrencyCircleDollarIcon size={20} weight="fill" /></div>
          <div>
            <div className="provision-label">Provision {MONTH_NAMES[month]} {year}</div>
          </div>
          <div className="provision-amount">{safeToFixed(provisionData.total, 0)}€</div>
        </div>

        {/* KPI row */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon"><StackIcon size={20} /></div>
            </div>
            <div className="kpi-label">Batches</div>
            <div className="kpi-value">{counts.total}</div>
          </div>

          <div className="kpi-card kpi-hero">
            <div className="kpi-label">Ø CSAT Improvement</div>
            <div className="kpi-hero-value">
              <ArrowUpIcon size={28} weight="bold" />
              {stats.avgImprovement >= 0 ? '+' : ''}{safeToFixed(stats.avgImprovement, 2)}
            </div>
            <div className="kpi-hero-sub">HERO METRIC · Status = Done</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header"><CheckCircleIcon size={18} color="#166EE1" /></div>
            <div className="kpi-label">Abschlussquote</div>
            <div className="kpi-completion">
              <Donut pct={stats.completionRate} label={`${safeToFixed(stats.completionRate, 0)}%`} />
              <div>
                <div className="kpi-value-sm">{stats.closedCases} / {stats.totalCsatCases}</div>
                <div className="kpi-sub">Cases abgeschlossen</div>
              </div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header"><ClockIcon size={18} /></div>
            <div className="kpi-label">CSAT II Response</div>
            <div className="kpi-value">{stats.improved + stats.same + stats.worsened}</div>
            <div className="kpi-sub">↑ {stats.improved} · = {stats.same} · ↓ {stats.worsened}</div>
          </div>
        </div>

        {/* Status tabs */}
        <div className="status-tabs">
          {([
            { key: 'all', label: 'Alle', count: counts.total },
            { key: 'inProgress', label: 'In Bearbeitung', count: counts.inProg, icon: <PhoneCallIcon size={14} /> },
            { key: 'done', label: 'Abgeschlossen', count: counts.done, icon: <CheckCircleIcon size={14} /> },
            { key: 'blocked', label: 'Blockiert', count: counts.blocked, icon: <XCircleIcon size={14} /> },
            { key: 'callbackNeeded', label: 'Rückruf', count: counts.callback, icon: <PhoneCallIcon size={14} />, pulse: counts.callback > 0 },
            { key: 'csatIIPending', label: 'CSAT II ausstehend', count: counts.csatPending, icon: <ClockIcon size={14} /> },
          ] as Array<{ key: StatusTab; label: string; count: number; icon?: React.ReactNode; pulse?: boolean }>).map(tab => (
            <button
              key={tab.key}
              className={`tab-btn tab-${tab.key} ${statusTab === tab.key ? 'tab-active' : ''}`}
              onClick={() => setStatusTab(tab.key)}
            >
              {tab.pulse && <span className="tab-pulse" />}
              {tab.icon}
              {tab.label}
              <span className="tab-count">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Overview table */}
        {viewMode === 'overview' && (
          <div className="table-card">
            <div className="table-header">
              <h2>Batches ({filteredBatches.length}) — {MONTH_NAMES[month]} {year}</h2>
              <div className="table-controls">
                <div className="search-wrap">
                  <MagnifyingGlassIcon size={15} className="search-icon" />
                  <input
                    className="search-input"
                    type="text"
                    placeholder="Suchen…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <select className="select-sm" value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}>
                  <option value="improvement">Improvement ↓</option>
                  <option value="provision">Provision ↓</option>
                  <option value="csatI">CSAT I ↑</option>
                  <option value="date">Datum ↓</option>
                </select>
              </div>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Batch ID</th>
                    <th>Kunde</th>
                    <th className="center">Cases</th>
                    <th className="center">CSAT I</th>
                    <th className="center">CSAT II</th>
                    <th>Aktion</th>
                    <th className="right">€ je Kunde</th>
                    <th className="right">€ diesen Monat</th>
                  </tr>
                </thead>
                <tbody>
                  {displayBatches.map((b, idx) => {
                    const mp = getMonthProvision(b);
                    return (
                      <tr key={b.id} className={idx % 2 === 0 ? 'row-even' : 'row-odd'}>
                        <td><StatusBadge status={b.status} /></td>
                        <td><span className="mono muted">{b.name}</span></td>
                        <td><span className="fw-medium">{b.vorUndNachname || b.customerName || '–'}</span></td>
                        <td className="center">{b.csatCases}</td>
                        <td className="center muted">{b.lowestCsatI !== null ? `(${safeToFixed(b.lowestCsatI, 1)})` : '–'}</td>
                        <td className="center">
                          {b.csatIIRating !== null ? (
                            <div className="csat-ii-cell">
                              <span className="csat-ii-badge" style={{
                                background: b.csatIIRating >= 4 ? '#048A0E' : b.csatIIRating >= 3 ? '#FFBA05' : '#DC043B',
                                color: b.csatIIRating >= 3 && b.csatIIRating < 4 ? '#1a1a1a' : '#fff'
                              }}>
                                <StarIcon size={14} weight="fill" />{safeToFixed(b.csatIIRating, 1)}
                              </span>
                              {b.csatImprovement !== null && (
                                <span className="imp-badge" style={{
                                  background: b.csatImprovement > 0 ? '#048A0E' : b.csatImprovement < 0 ? '#DC043B' : '#888',
                                  color: '#fff'
                                }}>
                                  {b.csatImprovement > 0 ? <ArrowUpIcon size={12} weight="bold" /> : b.csatImprovement < 0 ? <ArrowDownIcon size={12} weight="bold" /> : <ArrowRightIcon size={12} weight="bold" />}
                                  {b.csatImprovement > 0 ? '+' : ''}{safeToFixed(b.csatImprovement, 1)}
                                </span>
                              )}
                            </div>
                          ) : <span className="muted">–</span>}
                        </td>
                        <td>{getActionStatus(b)}</td>
                        <td className="right">
                          {b.totalProvision > 0
                            ? <span className={`euro-badge ${b.totalProvision >= 10 ? 'euro-high' : 'euro-low'}`}>{safeToFixed(b.totalProvision, 0)}€</span>
                            : <span className="muted">–</span>}
                        </td>
                        <td className="right">
                          {mp > 0
                            ? <span className="euro-badge euro-month">{safeToFixed(mp, 0)}€</span>
                            : <span className="muted">–</span>}
                        </td>
                      </tr>
                    );
                  })}
                  {displayBatches.length === 0 && (
                    <tr><td colSpan={9} className="empty-row">Keine Batches für diesen Filter</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detail view */}
        {viewMode === 'detail' && (
          <div className="detail-grid">
            {/* Provision chart */}
            <div className="chart-card">
              <div className="chart-header">
                <h3>Provision pro Tag</h3>
              </div>
              <div className="chart-body">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={provisionData.provisionPerDay} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#fff', border: 'none', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,.12)', fontSize: 13 }}
                      formatter={(v: number) => [`${safeToFixed(v, 0)} €`, 'Provision']}
                    />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                      {provisionData.provisionPerDay.map((entry, i) => (
                        <Cell key={i} fill={entry.total > 0 ? '#166EE1' : '#E5E7EB'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CSAT Before/After */}
            <div className="chart-card csat-card">
              <div className="chart-header">
                <h3>CSAT Before / After</h3>
                <div className="sort-toggle">
                  {(['improvement', 'name', 'csatAfter'] as CsatSortOption[]).map(k => (
                    <button key={k} className={csatSortBy === k ? 'active' : ''} onClick={() => setCsatSortBy(k)}>
                      {k === 'improvement' ? 'Improvement' : k === 'name' ? 'Name' : 'CSAT After'}
                    </button>
                  ))}
                </div>
              </div>
              {sortedCsats.length > 0 && (
                <div className="csat-summary">
                  <span>Avg: <strong>+{safeToFixed(stats.avgImprovement, 2)}</strong></span>
                  <span>Best: <strong>+{sortedCsats[0]?.improvement ?? 0}</strong></span>
                  <span>Cases: <strong>{sortedCsats.length}</strong></span>
                </div>
              )}
              <div className="csat-list">
                {sortedCsats.length === 0
                  ? <div className="empty-row">Keine CSAT II Daten vorhanden</div>
                  : sortedCsats.map((item, i) => <CsatBeforeAfterItem key={i} item={item} />)
                }
              </div>
            </div>

            {/* Base vs Bonus */}
            <div className="chart-card">
              <h3>Base vs. Bonus</h3>
              <div className="bvb-labels">
                <span><span className="dot dot-blue" />Base: {safeToFixed(provisionData.baseSum, 0)}€</span>
                <span><span className="dot dot-green" />Bonus: {safeToFixed(provisionData.bonusSum, 0)}€</span>
              </div>
              <div className="bvb-bar">
                <div className="bvb-base" style={{
                  width: `${provisionData.baseSum + provisionData.bonusSum > 0
                    ? (provisionData.baseSum / (provisionData.baseSum + provisionData.bonusSum)) * 100
                    : 50}%`
                }} />
                <div className="bvb-bonus" style={{
                  width: `${provisionData.baseSum + provisionData.bonusSum > 0
                    ? (provisionData.bonusSum / (provisionData.baseSum + provisionData.bonusSum)) * 100
                    : 50}%`
                }} />
              </div>
              <div className="bvb-total">Gesamt: {safeToFixed(provisionData.total, 0)}€</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
