import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { fetchAllRecords, str } from './airtable';
import type { AirtableRecord } from './airtable';

// ─── Config ───────────────────────────────────────────────────────────────────

const TABLE_NAME = import.meta.env.VITE_TABLE_TERMINATIONS || 'TERMINATIONS_CUSTOMERS';

const FIELDS = {
  END_DATE_MONTH:     'MAKO_EARLIEST_TERMINATION_MONTH',
  REQUEST_DATE_MONTH: 'ODS_EARLIEST_TERMINATIONS_REQUEST_MONTH',
  CONTRACT_NAME:      'CONTRACT_NAME',
  SCOPE_KEY:          'TERMINATION_SCOPE_KEY',
  SOURCE_TYPE:        'MAKO_TERMINATION_SOURCE_TYPE',
  IN_ELZ:             'MAKO_TERMINATION_IN_ELZ',
};

const EO_PLUS_NAMES = ['Enpal One+ (CONS) Enpal Vergütung (One+) (PROD)'];

const SCOPES = [
  { key: 'CONS', label: 'Nur Strom (CONS)', color: '#2563eb', bg: '#eff6ff' },
  { key: 'PROD', label: 'Nur DV (PROD)',    color: '#10b981', bg: '#ecfdf5' },
  { key: 'BOTH', label: 'Beide',             color: '#f59e0b', bg: '#fffbeb' },
] as const;

type ScopeKey = 'CONS' | 'PROD' | 'BOTH';
type DateMode = 'end' | 'request';
type SourceFilter = 'all' | 'incoming' | 'outgoing';
type ElzFilter = 'all' | 'elz' | 'non_elz';

const MONTH_DE = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];

function fmtMonth(ym: string): string {
  const [y, m] = ym.split('-');
  return `${MONTH_DE[parseInt(m) - 1]} ${y}`;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

interface Prepared {
  counts: Record<ScopeKey, Record<string, number>>;
  totals: Record<ScopeKey, number>;
  allMonths: string[];
}

function prepare(
  records: AirtableRecord[],
  dateMode: DateMode,
  sourceFilter: SourceFilter,
  elzFilter: ElzFilter,
  fromMonth: string,
  toMonth: string,
): Prepared {
  const eopRecs = records.filter(r => EO_PLUS_NAMES.includes(str(r, FIELDS.CONTRACT_NAME)));
  const counts: Record<ScopeKey, Record<string, number>> = { CONS: {}, PROD: {}, BOTH: {} };
  const totals: Record<ScopeKey, number> = { CONS: 0, PROD: 0, BOTH: 0 };
  const monthsSet = new Set<string>();

  for (const r of eopRecs) {
    if (sourceFilter !== 'all') {
      const st = str(r, FIELDS.SOURCE_TYPE).toLowerCase();
      if (sourceFilter === 'incoming' && !st.includes('incoming')) continue;
      if (sourceFilter === 'outgoing' && !st.includes('outgoing')) continue;
    }
    if (elzFilter !== 'all') {
      const inElz = str(r, FIELDS.IN_ELZ) !== '';
      if (elzFilter === 'elz' && !inElz) continue;
      if (elzFilter === 'non_elz' && inElz) continue;
    }
    const ym = dateMode === 'end'
      ? str(r, FIELDS.END_DATE_MONTH)
      : str(r, FIELDS.REQUEST_DATE_MONTH);
    if (!ym) continue;
    if (fromMonth && ym < fromMonth) continue;
    if (toMonth && ym > toMonth) continue;

    const scope = str(r, FIELDS.SCOPE_KEY) as ScopeKey;
    if (!['CONS', 'PROD', 'BOTH'].includes(scope)) continue;
    counts[scope][ym] = (counts[scope][ym] || 0) + 1;
    totals[scope]++;
    monthsSet.add(ym);
  }

  return { counts, totals, allMonths: Array.from(monthsSet).sort() };
}

// ─── Config screen ────────────────────────────────────────────────────────────

function ConfigScreen({ onSave }: { onSave: (pat: string, baseId: string) => void }) {
  const [pat, setPat] = useState(localStorage.getItem('at_pat') || '');
  const [baseId, setBaseId] = useState(localStorage.getItem('at_base_id') || '');
  return (
    <div className="cfg-overlay">
      <div className="cfg-card">
        <h2>EO+ Kündigungstypen</h2>
        <p>Airtable Zugangsdaten eingeben</p>
        <div className="cfg-field">
          <label>Personal Access Token</label>
          <input type="password" placeholder="pat_..." value={pat} onChange={e => setPat(e.target.value)} />
        </div>
        <div className="cfg-field">
          <label>Base ID</label>
          <input type="text" placeholder="appXXXXXX" value={baseId} onChange={e => setBaseId(e.target.value)} />
        </div>
        <button
          className="cfg-btn"
          disabled={!pat.trim() || !baseId.trim()}
          onClick={() => { localStorage.setItem('at_pat', pat.trim()); localStorage.setItem('at_base_id', baseId.trim()); onSave(pat.trim(), baseId.trim()); }}
        >
          Dashboard laden
        </button>
      </div>
    </div>
  );
}

// ─── Segment Toggle ───────────────────────────────────────────────────────────

function Toggle<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="toggle-wrap">
      {options.map((o, i) => (
        <button
          key={o.value}
          className={`toggle-btn ${value === o.value ? 'toggle-active' : ''} ${i > 0 ? 'toggle-border' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Donut ────────────────────────────────────────────────────────────────────

function Donut({ totals }: { totals: Record<ScopeKey, number> }) {
  const total = totals.CONS + totals.PROD + totals.BOTH;
  if (total === 0) return null;
  const R = 36, cx = 44, cy = 44, stroke = 14, circ = 2 * Math.PI * R;
  let offset = 0;
  const arcs = SCOPES.map(s => {
    const pct = total > 0 ? totals[s.key] / total : 0;
    const arc = { ...s, da: `${pct * circ} ${circ - pct * circ}`, do: -offset * circ };
    offset += pct;
    return arc;
  });
  return (
    <svg width={88} height={88} viewBox="0 0 88 88">
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
      {arcs.map(a => (
        <circle key={a.key} cx={cx} cy={cy} r={R} fill="none"
          stroke={a.color} strokeWidth={stroke}
          strokeDasharray={a.da} strokeDashoffset={a.do}
          strokeLinecap="butt" transform={`rotate(-90 ${cx} ${cy})`} />
      ))}
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#111827">{total}</text>
    </svg>
  );
}

// ─── KPI Tiles ────────────────────────────────────────────────────────────────

function KpiTiles({ totals }: { totals: Record<ScopeKey, number> }) {
  const total = totals.CONS + totals.PROD + totals.BOTH;
  return (
    <div className="kpi-row">
      {SCOPES.map(s => {
        const pct = total > 0 ? ((totals[s.key] / total) * 100).toFixed(1) : '0.0';
        return (
          <div key={s.key} className="kpi-tile" style={{ borderTopColor: s.color }}>
            <div className="kpi-label">{s.label}</div>
            <div className="kpi-nums">
              <span className="kpi-count">{totals[s.key]}</span>
              <span className="kpi-pct">{pct}%</span>
            </div>
            <div className="kpi-sub">Anteil aller EO+ Kündigungen</div>
          </div>
        );
      })}
      <div className="kpi-donut">
        <Donut totals={totals} />
        <div className="kpi-donut-label">Verteilung</div>
      </div>
    </div>
  );
}

// ─── Timeline Chart ───────────────────────────────────────────────────────────

interface TooltipState {
  x: number; y: number;
  month: string;
  lines: { label: string; color: string; value: number }[];
}

function TimelineChart({ counts, allMonths }: { counts: Record<ScopeKey, Record<string, number>>; allMonths: string[] }) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const PAD = { top: 36, right: 28, bottom: 60, left: 58 };
  const SVG_H = 300;
  const n = allMonths.length;
  const svgW = Math.max(520, n * 22 + PAD.left + PAD.right);
  const drawW = svgW - PAD.left - PAD.right;
  const drawH = SVG_H - PAD.top - PAD.bottom;
  const plotW = Math.max(1, n - 1);

  const series = useMemo(() => SCOPES.map(s => ({
    ...s,
    values: allMonths.map(m => counts[s.key][m] || 0),
  })), [counts, allMonths]);

  const maxY = Math.max(...series.flatMap(s => s.values), 1) * 1.18;
  const xPos = (i: number) => PAD.left + (plotW > 0 ? (i / plotW) * drawW : 0);
  const yPos = (v: number) => PAD.top + drawH - (v / maxY) * drawH;
  const yTicks = Array.from({ length: 6 }, (_, i) => maxY * (i / 5));
  const xStep = n <= 12 ? 1 : n <= 24 ? 2 : n <= 48 ? 3 : 6;

  const handleMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || n === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) * (svgW / rect.width) - PAD.left;
    const idx = Math.max(0, Math.min(n - 1, Math.round((relX / drawW) * plotW)));
    const month = allMonths[idx];
    if (!month) { setTooltip(null); return; }
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      month: fmtMonth(month),
      lines: series.map(s => ({ label: s.label, color: s.color, value: s.values[idx] })),
    });
  }, [n, svgW, drawW, plotW, allMonths, series]);

  if (n === 0) return (
    <div className="chart-empty">Keine Daten für den gewählten Zeitraum.</div>
  );

  return (
    <div className="chart-wrap" onMouseLeave={() => setTooltip(null)}>
      <svg ref={svgRef} width="100%" height={SVG_H}
        viewBox={`0 0 ${svgW} ${SVG_H}`} preserveAspectRatio="none"
        style={{ display: 'block', minWidth: 520, overflow: 'visible' }}
        onMouseMove={handleMove}
      >
        {/* Grid */}
        {yTicks.map((tick, ti) => (
          <g key={ti}>
            <line x1={PAD.left} y1={yPos(tick)} x2={svgW - PAD.right} y2={yPos(tick)}
              stroke={ti === 0 ? '#e5e7eb' : '#f3f4f6'} strokeWidth="1" />
            <text x={PAD.left - 8} y={yPos(tick) + 4} textAnchor="end" fontSize="10" fill="#9ca3af">
              {Math.round(tick)}
            </text>
          </g>
        ))}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={SVG_H - PAD.bottom} stroke="#e5e7eb" strokeWidth="1" />
        <line x1={PAD.left} y1={SVG_H - PAD.bottom} x2={svgW - PAD.right} y2={SVG_H - PAD.bottom} stroke="#e5e7eb" strokeWidth="1" />

        {/* Y label */}
        <text transform={`rotate(-90,${PAD.left - 42},${PAD.top + drawH / 2})`}
          x={PAD.left - 42} y={PAD.top + drawH / 2}
          textAnchor="middle" fontSize="10" fill="#6b7280">Anzahl Kündigungen</text>

        {/* X axis */}
        {allMonths.map((m, idx) => {
          if (idx % xStep !== 0) return null;
          const [year, mon] = m.split('-');
          const isJan = mon === '01';
          return (
            <g key={m}>
              {isJan && <line x1={xPos(idx)} y1={PAD.top} x2={xPos(idx)} y2={SVG_H - PAD.bottom}
                stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3 2" />}
              <text x={xPos(idx)} y={SVG_H - PAD.bottom + 15} textAnchor="middle" fontSize="9.5"
                fill={isJan ? '#374151' : '#9ca3af'} fontWeight={isJan ? '700' : '400'}>
                {MONTH_DE[parseInt(mon) - 1]}
              </text>
              {isJan && <text x={xPos(idx)} y={SVG_H - PAD.bottom + 28} textAnchor="middle" fontSize="9" fill="#6b7280" fontWeight="700">{year}</text>}
            </g>
          );
        })}

        {/* Lines */}
        {n >= 2 && series.map(({ key, color, values }) => (
          <g key={key}>
            <polyline
              points={values.map((v, i) => `${xPos(i)},${yPos(v)}`).join(' ')}
              fill="none" stroke={color} strokeWidth="2.5"
              strokeLinejoin="round" strokeLinecap="round" />
            {n <= 60 && values.map((v, i) => (
              <circle key={i} cx={xPos(i)} cy={yPos(v)} r={4}
                fill={color} stroke="#fff" strokeWidth="1.5" />
            ))}
          </g>
        ))}

        {/* Crosshair */}
        {tooltip && svgRef.current && (
          <line
            x1={tooltip.x * (svgW / svgRef.current.getBoundingClientRect().width)}
            y1={PAD.top}
            x2={tooltip.x * (svgW / svgRef.current.getBoundingClientRect().width)}
            y2={SVG_H - PAD.bottom}
            stroke="#9ca3af" strokeWidth="1" strokeDasharray="3 2" />
        )}
      </svg>

      {tooltip && (
        <div className="chart-tooltip" style={{ left: tooltip.x + 16, top: Math.max(0, tooltip.y - 16) }}>
          <div className="tt-month">{tooltip.month}</div>
          {tooltip.lines.map(l => (
            <div key={l.label} className="tt-line">
              <span className="tt-dot" style={{ background: l.color }} />
              <span className="tt-lbl">{l.label}</span>
              <span className="tt-val">{l.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ records }: { records: AirtableRecord[] }) {
  const eopCount = records.filter(r => EO_PLUS_NAMES.includes(str(r, FIELDS.CONTRACT_NAME))).length;
  const [dateMode, setDateMode] = useState<DateMode>('end');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [elzFilter, setElzFilter] = useState<ElzFilter>('all');
  const [fromMonth, setFromMonth] = useState('');
  const [toMonth, setToMonth] = useState('');

  const { counts, totals, allMonths } = useMemo(
    () => prepare(records, dateMode, sourceFilter, elzFilter, fromMonth, toMonth),
    [records, dateMode, sourceFilter, elzFilter, fromMonth, toMonth]
  );

  return (
    <div className="dash">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Enpal One+ Kündigungstypen</h1>
          <p className="dash-sub">Was wurde gekündigt? – CONS, DV oder Beide</p>
        </div>
        <span className="dash-meta">{eopCount} EO+ Datensätze</span>
      </div>

      <div className="dash-card">
        <div className="dash-card-header">
          <h2 className="dash-card-title">Kündigungstyp EO+ – Was wurde gekündigt?</h2>
          <p className="dash-card-sub">Nur Strom (CONS) · Nur DV (PROD) · Beide · gefiltert auf Enpal One+ Verträge</p>
        </div>

        {/* Controls */}
        <div className="controls">
          <div className="ctrl-group">
            <div className="ctrl-label">Datumsbasis</div>
            <Toggle<DateMode> value={dateMode} onChange={setDateMode} options={[
              { value: 'end', label: 'Abmeldedatum' },
              { value: 'request', label: 'Kündigungsdatum' },
            ]} />
          </div>
          <div className="ctrl-group">
            <div className="ctrl-label">Source Type</div>
            <Toggle<SourceFilter> value={sourceFilter} onChange={setSourceFilter} options={[
              { value: 'all', label: 'Alle' },
              { value: 'incoming', label: 'Incoming' },
              { value: 'outgoing', label: 'Outgoing' },
            ]} />
          </div>
          <div className="ctrl-group">
            <div className="ctrl-label">ELZ</div>
            <Toggle<ElzFilter> value={elzFilter} onChange={setElzFilter} options={[
              { value: 'all', label: 'Alle' },
              { value: 'elz', label: 'In ELZ' },
              { value: 'non_elz', label: 'Nicht in ELZ' },
            ]} />
          </div>
          <div className="ctrl-group">
            <div className="ctrl-label">Von</div>
            <input type="month" className="month-input" value={fromMonth} onChange={e => setFromMonth(e.target.value)} />
          </div>
          <div className="ctrl-group">
            <div className="ctrl-label">Bis</div>
            <input type="month" className="month-input" value={toMonth} onChange={e => setToMonth(e.target.value)} />
          </div>
          {(fromMonth || toMonth) && (
            <button className="reset-btn" onClick={() => { setFromMonth(''); setToMonth(''); }}>✕ Reset</button>
          )}
          <div className="legend">
            {SCOPES.map(s => (
              <span key={s.key} className="legend-item">
                <svg width="24" height="12" style={{ flexShrink: 0, overflow: 'visible' }}>
                  <line x1="0" y1="6" x2="24" y2="6" stroke={s.color} strokeWidth="2.5" />
                  <circle cx="12" cy="6" r="3.5" fill={s.color} stroke="#fff" strokeWidth="1.5" />
                </svg>
                {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Teil A */}
        <section className="section">
          <div className="section-title">Teil A – Verteilung der Kündigungstypen</div>
          <KpiTiles totals={totals} />
        </section>

        {/* Teil B */}
        <section className="section">
          <div className="section-title">Teil B – Zeitverlauf nach Kündigungstyp</div>
          <TimelineChart counts={counts} allMonths={allMonths} />
        </section>

        {/* Footer */}
        <div className="footer-meta">
          <span>{allMonths.length} Monate{(fromMonth || toMonth) ? ' (gefiltert)' : ''}</span>
          <span>·</span>
          <span>Basis: {dateMode === 'end' ? 'MAKO_EARLIEST_TERMINATION_MONTH' : 'ODS_EARLIEST_TERMINATIONS_REQUEST_MONTH'}</span>
          <span>·</span>
          <span>Scope: TERMINATION_SCOPE_KEY</span>
        </div>
      </div>
    </div>
  );
}

// ─── App root ─────────────────────────────────────────────────────────────────

export default function App() {
  const hasEnvCreds = !!(import.meta.env.VITE_AIRTABLE_PAT && import.meta.env.VITE_AIRTABLE_BASE_ID);
  const hasLocalCreds = !!(localStorage.getItem('at_pat') && localStorage.getItem('at_base_id'));
  const [configured, setConfigured] = useState(hasEnvCreds || hasLocalCreds);
  const [records, setRecords] = useState<AirtableRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) return;
    setLoading(true);
    setError(null);
    fetchAllRecords(TABLE_NAME)
      .then(setRecords)
      .catch(e => setError(e instanceof Error ? e.message : 'Fehler'))
      .finally(() => setLoading(false));
  }, [configured]);

  if (!configured) return <ConfigScreen onSave={() => setConfigured(true)} />;
  if (loading) return <div className="loading"><div className="spinner" /><p>Lade Daten…</p></div>;
  if (error) return <div className="loading"><p style={{ color: '#dc2626' }}>{error}</p><button className="cfg-btn" onClick={() => { setConfigured(false); }}>Neu konfigurieren</button></div>;

  return <Dashboard records={records} />;
}
