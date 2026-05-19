import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { fetchAll, fStr, fNum, fRaw } from './airtable';
import type { AirtableRecord } from './airtable';

// ─── Config ───────────────────────────────────────────────────────────────────

const TABLE = import.meta.env.VITE_TABLE_TERMINATIONS || 'TERMINATIONS_CUSTOMERS';

const F = {
  REQUEST_DATE:         'ODS_EARLIEST_TERMINATIONS_REQUEST',
  ELZ_FLAG:             'MAKO_TERMINATION_IN_ELZ',
  ELZ_MONTHS_REMAINING: 'MAKO_TERMINATION_ELZ_MONTHS_REMAINING',
  CONTRACT_NAME:        'CONTRACT_NAME',
  TERMINATION_SCOPE:    'TERMINATION_SCOPE',
} as const;

const ONEPLUS = ['Enpal One+ (CONS) Enpal Vergütung (One+) (PROD)'];

const MONTH_DE = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];

type Phase = 'post_elz' | 'in_elz' | 'short_elz' | 'long_elz';

const COLORS_SIMPLE: Record<string, string> = {
  in_elz:   '#dc2626',
  post_elz: '#d1d5db',
};
const COLORS_DETAIL: Record<string, string> = {
  long_elz:        '#991b1b',
  short_elz:       '#f97316',
  in_elz:          '#dc2626',
  post_elz:        '#d1d5db',
};
const LABELS_SIMPLE: Record<string, string> = {
  in_elz:   'In ELZ',
  post_elz: 'Nach ELZ',
};
const LABELS_DETAIL: Record<string, string> = {
  long_elz:  'Noch >6 Monate ELZ',
  short_elz: 'Noch 1–6 Monate ELZ',
  in_elz:    'In ELZ (Dauer unbekannt)',
  post_elz:  'Nach ELZ',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toYM(val: unknown): string | null {
  if (!val) return null;
  const m = String(val).trim().match(/^(\d{4}-\d{2})/);
  return m ? m[1] : null;
}

function isTruthy(val: unknown): boolean {
  if (val == null || val === false || val === 0 || val === '' || val === '0' || val === 'false' || val === 'False') return false;
  return true;
}

function fmtMonth(ym: string): string {
  const [y, m] = ym.split('-');
  return `${MONTH_DE[parseInt(m) - 1]} ${y}`;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

interface PhaseData {
  post_elz: number;
  in_elz: number;
  short_elz: number;
  long_elz: number;
}

interface MonthEntry { cons: PhaseData; dv: PhaseData; }

function emptyPhase(): PhaseData { return { post_elz: 0, in_elz: 0, short_elz: 0, long_elz: 0 }; }

function prepareData(records: AirtableRecord[]) {
  const byMonth: Record<string, MonthEntry> = {};
  const monthsSet = new Set<string>();

  for (const r of records) {
    if (!ONEPLUS.includes(fStr(r, F.CONTRACT_NAME))) continue;
    const ym = toYM(fStr(r, F.REQUEST_DATE) || fRaw(r, F.REQUEST_DATE));
    if (!ym) continue;
    monthsSet.add(ym);
    if (!byMonth[ym]) byMonth[ym] = { cons: emptyPhase(), dv: emptyPhase() };

    // ELZ phase
    const inElz = isTruthy(fRaw(r, F.ELZ_FLAG));
    const months = fNum(r, F.ELZ_MONTHS_REMAINING);
    let phase: Phase;
    if (!inElz) phase = 'post_elz';
    else if (months === null) phase = 'in_elz';
    else if (months > 6) phase = 'long_elz';
    else phase = 'short_elz';

    // CONS vs DV
    const scope = fStr(r, F.TERMINATION_SCOPE).toUpperCase();
    const hasCons = scope === '' || scope.includes('CONS');
    const hasDv   = scope === '' || scope.includes('PROD') || scope.includes('DV');
    if (hasCons) byMonth[ym].cons[phase]++;
    if (hasDv)   byMonth[ym].dv[phase]++;
  }

  return { byMonth, allMonths: Array.from(monthsSet).sort() };
}

function totalPhase(d: PhaseData, detail: boolean): number {
  if (detail) return d.long_elz + d.short_elz + d.in_elz + d.post_elz;
  return (d.long_elz + d.short_elz + d.in_elz) + d.post_elz;
}

function inElzTotal(d: PhaseData): number {
  return d.long_elz + d.short_elz + d.in_elz;
}

// ─── Config screen ────────────────────────────────────────────────────────────

function ConfigScreen({ onSave }: { onSave: () => void }) {
  const [pat, setPat] = useState(localStorage.getItem('at_pat') || '');
  const [baseId, setBaseId] = useState(localStorage.getItem('at_base_id') || '');
  return (
    <div className="cfg-overlay">
      <div className="cfg-card">
        <h2>ELZ-Status Dashboard</h2>
        <p>Airtable Zugangsdaten eingeben</p>
        <div className="cfg-field">
          <label>Personal Access Token</label>
          <input type="password" placeholder="pat_..." value={pat} onChange={e => setPat(e.target.value)} />
        </div>
        <div className="cfg-field">
          <label>Base ID</label>
          <input type="text" placeholder="appXXXXXX" value={baseId} onChange={e => setBaseId(e.target.value)} />
        </div>
        <button className="cfg-btn" disabled={!pat.trim() || !baseId.trim()}
          onClick={() => { localStorage.setItem('at_pat', pat.trim()); localStorage.setItem('at_base_id', baseId.trim()); onSave(); }}>
          Dashboard laden
        </button>
      </div>
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="toggle-wrap">
      {options.map((o, i) => (
        <button key={o.value}
          className={`toggle-btn${value === o.value ? ' active' : ''}${i > 0 ? ' bordered' : ''}`}
          onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

interface TooltipData {
  x: number; y: number; month: string;
  cons: PhaseData; dv: PhaseData;
  consTotal: number; dvTotal: number;
}

function ElzBarChart({ records }: { records: AirtableRecord[] }) {
  const [detail, setDetail] = useState(false);
  const [fromMonth, setFromMonth] = useState('');
  const [toMonth, setToMonth] = useState('');
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { byMonth, allMonths } = useMemo(() => prepareData(records), [records]);

  const visible = useMemo(() => allMonths.filter(m =>
    (!fromMonth || m >= fromMonth) && (!toMonth || m <= toMonth)
  ), [allMonths, fromMonth, toMonth]);

  const n = visible.length;
  const PAD = { top: 48, right: 28, bottom: 72, left: 58 };
  const SVG_H = 360;
  const PX_PER = 56;
  const svgW = Math.max(560, n * PX_PER + PAD.left + PAD.right);
  const drawW = svgW - PAD.left - PAD.right;
  const drawH = SVG_H - PAD.top - PAD.bottom;
  const yBase = PAD.top + drawH;
  const slotW = n > 0 ? drawW / n : drawW;
  const gap = slotW * 0.18;
  const barW = (slotW - gap) / 2;
  const xStep = n <= 12 ? 1 : n <= 24 ? 2 : 3;

  const monthData = useMemo(() => visible.map(m => {
    const e = byMonth[m] || { cons: emptyPhase(), dv: emptyPhase() };
    return {
      month: m,
      cons: e.cons,
      dv: e.dv,
      consTotal: totalPhase(e.cons, detail),
      dvTotal: totalPhase(e.dv, detail),
    };
  }), [visible, byMonth, detail]);

  const maxVal = Math.max(...monthData.map(d => Math.max(d.consTotal, d.dvTotal)), 1);
  const yScale = drawH / (maxVal * 1.2);
  const yTicks = Array.from({ length: 6 }, (_, i) => Math.round(maxVal * 1.2 * i / 5));

  const stackOrder: Phase[] = detail
    ? ['post_elz', 'in_elz', 'short_elz', 'long_elz']
    : ['post_elz', 'in_elz'];

  const colOf = (ph: string) => detail ? COLORS_DETAIL[ph] : COLORS_SIMPLE[ph];
  const lblOf = (ph: string) => detail ? LABELS_DETAIL[ph] : LABELS_SIMPLE[ph];

  const legendPhases: Phase[] = detail
    ? ['long_elz', 'short_elz', 'in_elz', 'post_elz']
    : ['in_elz', 'post_elz'];

  // Render one stacked bar
  function renderBar(xStart: number, data: PhaseData, total: number, isDv: boolean) {
    if (total === 0) return null;
    const segs: React.ReactNode[] = [];
    let yOff = yBase;
    for (const ph of stackOrder) {
      const count = data[ph];
      if (!count) continue;
      const h = count * yScale;
      yOff -= h;
      const isTop = stackOrder.slice(stackOrder.indexOf(ph) + 1).every(p => !data[p]);
      segs.push(
        <rect key={ph} x={xStart} y={yOff} width={barW} height={h}
          fill={colOf(ph)} rx={isTop ? 3 : 0} />
      );
    }
    // Hatch overlay for DV
    if (isDv) {
      segs.push(
        <rect key="hatch" x={xStart} y={yBase - total * yScale} width={barW} height={total * yScale}
          fill="url(#hatch)" rx={3} style={{ pointerEvents: 'none' }} />
      );
    }
    // Labels
    const barTop = yBase - total * yScale;
    const elzN = inElzTotal(data);
    const pct = total > 0 ? Math.round(elzN / total * 100) : 0;
    segs.push(
      <text key="lbl-n" x={xStart + barW / 2} y={barTop - 4}
        textAnchor="middle" fontSize="9" fill="#374151" fontWeight="700">{total}</text>
    );
    if (elzN > 0) {
      segs.push(
        <text key="lbl-pct" x={xStart + barW / 2} y={barTop - 15}
          textAnchor="middle" fontSize="8" fill={detail ? COLORS_DETAIL.long_elz : COLORS_SIMPLE.in_elz}
          fontWeight="700">{pct}%</text>
      );
    }
    return <g>{segs}</g>;
  }

  const handleMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || n === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) * (svgW / rect.width) - PAD.left;
    const idx = Math.max(0, Math.min(n - 1, Math.floor(relX / slotW)));
    const d = monthData[idx];
    if (!d) { setTooltip(null); return; }
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, month: fmtMonth(d.month), cons: d.cons, dv: d.dv, consTotal: d.consTotal, dvTotal: d.dvTotal });
  }, [n, svgW, slotW, monthData, PAD]);

  const ttpBlock = (label: string, data: PhaseData, total: number) => (
    <div className="tt-block">
      <div className="tt-block-title">{label} ({total})</div>
      {(detail ? ['long_elz','short_elz','in_elz','post_elz'] as Phase[] : ['in_elz','post_elz'] as Phase[]).map(ph => {
        const c = data[ph];
        if (!c) return null;
        return (
          <div key={ph} className="tt-row">
            <span className="tt-dot" style={{ background: colOf(ph) }} />
            <span className="tt-lbl">{lblOf(ph)}</span>
            <span className="tt-val">{c}</span>
            <span className="tt-pct">{(c / total * 100).toFixed(1)}%</span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="chart-container">
      {/* Controls */}
      <div className="controls">
        <div className="ctrl-group">
          <div className="ctrl-label">Ansicht</div>
          <Toggle<'simple'|'detail'>
            value={detail ? 'detail' : 'simple'}
            onChange={v => setDetail(v === 'detail')}
            options={[{ value: 'simple', label: 'Einfach' }, { value: 'detail', label: 'Detail' }]}
          />
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
        {/* Legend */}
        <div className="legend">
          <span className="legend-item">
            <svg width="14" height="14"><rect width="14" height="14" fill="#374151" rx="2"/></svg>
            CONS-Kündigung
          </span>
          <span className="legend-item">
            <svg width="14" height="14">
              <rect width="14" height="14" fill="#374151" rx="2" opacity=".4"/>
              <line x1="0" y1="0" x2="14" y2="14" stroke="#fff" strokeWidth="2"/>
              <line x1="7" y1="0" x2="14" y2="7" stroke="#fff" strokeWidth="2"/>
              <line x1="0" y1="7" x2="7" y2="14" stroke="#fff" strokeWidth="2"/>
            </svg>
            DV-Kündigung
          </span>
          <span className="legend-sep" />
          {legendPhases.map(ph => (
            <span key={ph} className="legend-item">
              <span className="legend-dot" style={{ background: colOf(ph) }} />
              {lblOf(ph)}
            </span>
          ))}
        </div>
      </div>

      {/* Chart */}
      {n === 0 ? (
        <div className="chart-empty">Keine Enpal One+ Daten für den gewählten Zeitraum.</div>
      ) : (
        <div className="chart-wrap" onMouseLeave={() => setTooltip(null)}>
          <svg ref={svgRef} width="100%" height={SVG_H}
            viewBox={`0 0 ${svgW} ${SVG_H}`} preserveAspectRatio="none"
            style={{ display: 'block', minWidth: 560, overflow: 'visible' }}
            onMouseMove={handleMove}
          >
            <defs>
              <pattern id="hatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="5" stroke="#fff" strokeWidth="2.2" />
              </pattern>
            </defs>

            {/* Y grid */}
            {yTicks.map((tick, ti) => {
              const y = yBase - tick * yScale;
              return (
                <g key={ti}>
                  <line x1={PAD.left} y1={y} x2={svgW - PAD.right} y2={y}
                    stroke={ti === 0 ? '#e5e7eb' : '#f3f4f6'} strokeWidth="1" />
                  <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{tick}</text>
                </g>
              );
            })}

            {/* Axes */}
            <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={yBase} stroke="#e5e7eb" strokeWidth="1" />
            <line x1={PAD.left} y1={yBase} x2={svgW - PAD.right} y2={yBase} stroke="#e5e7eb" strokeWidth="1" />
            <text transform={`rotate(-90,${PAD.left - 42},${PAD.top + drawH / 2})`}
              x={PAD.left - 42} y={PAD.top + drawH / 2}
              textAnchor="middle" fontSize="10" fill="#6b7280">Anzahl Kündigungen</text>

            {/* Bars */}
            {monthData.map((d, idx) => {
              const [year, mon] = d.month.split('-');
              const isJan = mon === '01';
              const slotX = PAD.left + idx * slotW;
              const xCons = slotX;
              const xDv   = slotX + barW + gap;
              return (
                <g key={d.month}>
                  {isJan && (
                    <line x1={slotX} y1={PAD.top} x2={slotX} y2={yBase}
                      stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3 2" />
                  )}
                  {renderBar(xCons, d.cons, d.consTotal, false)}
                  {renderBar(xDv, d.dv, d.dvTotal, true)}
                  {idx % xStep === 0 && (
                    <g>
                      <text x={slotX + slotW / 2} y={yBase + 16}
                        textAnchor="middle" fontSize="9.5"
                        fill={isJan ? '#374151' : '#9ca3af'} fontWeight={isJan ? '700' : '400'}>
                        {MONTH_DE[parseInt(mon) - 1]}
                      </text>
                      {isJan && (
                        <text x={slotX + slotW / 2} y={yBase + 29}
                          textAnchor="middle" fontSize="9" fill="#6b7280" fontWeight="700">{year}</text>
                      )}
                    </g>
                  )}
                  <text x={xCons + barW / 2} y={yBase + 44} textAnchor="middle" fontSize="7.5" fill="#9ca3af">CONS</text>
                  <text x={xDv   + barW / 2} y={yBase + 44} textAnchor="middle" fontSize="7.5" fill="#9ca3af">DV</text>
                </g>
              );
            })}

            {/* Crosshair */}
            {tooltip && svgRef.current && (
              <line
                x1={tooltip.x * (svgW / svgRef.current.getBoundingClientRect().width)}
                y1={PAD.top}
                x2={tooltip.x * (svgW / svgRef.current.getBoundingClientRect().width)}
                y2={yBase}
                stroke="#9ca3af" strokeWidth="1" strokeDasharray="3 2" />
            )}
          </svg>

          {/* Tooltip */}
          {tooltip && (
            <div className="chart-tooltip" style={{ left: tooltip.x + 16, top: Math.max(0, tooltip.y - 16) }}>
              <div className="tt-month">{tooltip.month}</div>
              {ttpBlock('CONS-Kündigung', tooltip.cons, tooltip.consTotal)}
              <div className="tt-divider" />
              {ttpBlock('DV-Kündigung', tooltip.dv, tooltip.dvTotal)}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="footer-meta">
        <span>{n} Monate{(fromMonth || toMonth) ? ' (gefiltert)' : ''}</span>
        <span>·</span>
        <span>Zeitstempel: ODS_EARLIEST_TERMINATIONS_REQUEST (Eingang Kündigung)</span>
        <span>·</span>
        <span>ELZ: MAKO_TERMINATION_IN_ELZ</span>
        {detail && <><span>·</span><span>Monate: MAKO_TERMINATION_ELZ_MONTHS_REMAINING</span></>}
      </div>
    </div>
  );
}

// ─── App root ─────────────────────────────────────────────────────────────────

export default function App() {
  const hasEnv = !!(import.meta.env.VITE_AIRTABLE_PAT && import.meta.env.VITE_AIRTABLE_BASE_ID);
  const hasLocal = !!(localStorage.getItem('at_pat') && localStorage.getItem('at_base_id'));
  const [configured, setConfigured] = useState(hasEnv || hasLocal);
  const [records, setRecords] = useState<AirtableRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) return;
    setLoading(true);
    setError(null);
    fetchAll(TABLE)
      .then(setRecords)
      .catch(e => setError(e instanceof Error ? e.message : 'Fehler'))
      .finally(() => setLoading(false));
  }, [configured]);

  if (!configured) return <ConfigScreen onSave={() => setConfigured(true)} />;
  if (loading) return <div className="loading"><div className="spinner" /><p>Lade Daten…</p></div>;
  if (error) return (
    <div className="loading">
      <p style={{ color: '#dc2626', maxWidth: 400, textAlign: 'center' }}>{error}</p>
      <button className="cfg-btn" onClick={() => setConfigured(false)}>Neu konfigurieren</button>
    </div>
  );

  const eopCount = records.filter(r => ONEPLUS.includes(fStr(r, F.CONTRACT_NAME))).length;

  return (
    <div className="app">
      <div className="app-header">
        <div>
          <h1>ELZ-Status zum Kündigungszeitpunkt – Enpal One+</h1>
          <p>Monatliche Entwicklung nach CONS- und DV-Kündigung · Eingang der Kündigungen</p>
        </div>
        <span className="app-meta">{records.length} Datensätze · {eopCount} EO+</span>
      </div>
      <div className="app-card">
        <div className="app-card-header">
          <h2>ELZ-Status zum Kündigungszeitpunkt</h2>
          <p>CONS- vs. DV-Kündigung · Einfach: In ELZ / Nach ELZ · Detail: &gt;6M / 1–6M / Nach ELZ</p>
        </div>
        <ElzBarChart records={records} />
      </div>
    </div>
  );
}
