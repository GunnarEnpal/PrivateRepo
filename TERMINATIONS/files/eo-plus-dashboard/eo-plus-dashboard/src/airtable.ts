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

async function fetchPage(tableIdOrName: string, offset?: string): Promise<{ records: AirtableRecord[]; offset?: string }> {
  const params = new URLSearchParams({ pageSize: '100' });
  if (offset) params.set('offset', offset);
  const res = await fetch(
    `https://api.airtable.com/v0/${getBaseId()}/${encodeURIComponent(tableIdOrName)}?${params}`,
    { headers: { Authorization: `Bearer ${getPAT()}` } }
  );
  if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function fetchAllRecords(tableIdOrName: string): Promise<AirtableRecord[]> {
  const all: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    const page = await fetchPage(tableIdOrName, offset);
    all.push(...page.records);
    offset = page.offset;
  } while (offset);
  return all;
}

export function str(record: AirtableRecord, field: string): string {
  const v = record.fields[field];
  if (v == null) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' || typeof v === 'boolean') return String(v).trim();
  if (Array.isArray(v)) return v.map((x: unknown) => (x && typeof x === 'object' && 'name' in x ? (x as { name: string }).name : String(x))).join(', ').trim();
  if (typeof v === 'object' && 'name' in v) return String((v as { name: string }).name).trim();
  return '';
}
