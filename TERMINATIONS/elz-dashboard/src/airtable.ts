function getPAT(): string {
  return import.meta.env.VITE_AIRTABLE_PAT || localStorage.getItem('at_pat') || '';
}
function getBaseId(): string {
  return import.meta.env.VITE_AIRTABLE_BASE_ID || localStorage.getItem('at_base_id') || '';
}

export interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

async function fetchPage(table: string, offset?: string): Promise<{ records: AirtableRecord[]; offset?: string }> {
  const p = new URLSearchParams({ pageSize: '100' });
  if (offset) p.set('offset', offset);
  const res = await fetch(
    `https://api.airtable.com/v0/${getBaseId()}/${encodeURIComponent(table)}?${p}`,
    { headers: { Authorization: `Bearer ${getPAT()}` } }
  );
  if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function fetchAll(table: string): Promise<AirtableRecord[]> {
  const all: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    const page = await fetchPage(table, offset);
    all.push(...page.records);
    offset = page.offset;
  } while (offset);
  return all;
}

export function fStr(r: AirtableRecord, field: string): string {
  const v = r.fields[field];
  if (v == null) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return v.map((x: unknown) => (x && typeof x === 'object' && 'name' in x ? (x as { name: string }).name : String(x))).join(', ').trim();
  if (typeof v === 'object' && 'name' in v) return String((v as { name: string }).name).trim();
  return '';
}

export function fNum(r: AirtableRecord, field: string): number | null {
  const v = r.fields[field];
  if (v == null) return null;
  const n = parseFloat(String(v));
  return isNaN(n) ? null : n;
}

export function fRaw(r: AirtableRecord, field: string): unknown {
  return r.fields[field] ?? null;
}
