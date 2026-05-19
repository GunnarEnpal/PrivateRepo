// Airtable REST API client
// Docs: https://airtable.com/developers/web/api/introduction

function getPAT(): string {
  return (import.meta.env.VITE_AIRTABLE_PAT as string)
    || (typeof window !== 'undefined' ? localStorage.getItem('airtable_pat') || '' : '');
}
function getBaseId(): string {
  return (import.meta.env.VITE_AIRTABLE_BASE_ID as string)
    || (typeof window !== 'undefined' ? localStorage.getItem('airtable_base_id') || '' : '');
}

export const TABLE_IDS = {
  csat: import.meta.env.VITE_TABLE_CSAT || 'tblf7lrSvnPWEAnFR',
  batches: import.meta.env.VITE_TABLE_BATCHES || 'tblo4iOxLLLvxVop7',
  users: import.meta.env.VITE_TABLE_USERS || 'tblnY4kgD3VcMixOx',
} as const;

export interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
  createdTime: string;
}

async function fetchPage(tableId: string, offset?: string): Promise<{ records: AirtableRecord[]; offset?: string }> {
  const params = new URLSearchParams({ pageSize: '100' });
  if (offset) params.set('offset', offset);

  const res = await fetch(
    `https://api.airtable.com/v0/${getBaseId()}/${tableId}?${params}`,
    {
      headers: {
        Authorization: `Bearer ${getPAT()}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Airtable API error ${res.status}: ${err}`);
  }

  return res.json();
}

export async function fetchAllRecords(tableId: string): Promise<AirtableRecord[]> {
  const allRecords: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const page = await fetchPage(tableId, offset);
    allRecords.push(...page.records);
    offset = page.offset;
  } while (offset);

  return allRecords;
}

// Helper: safely get a field value
export function getField<T>(record: AirtableRecord, fieldId: string, fallback: T): T {
  const val = record.fields[fieldId];
  if (val === null || val === undefined) return fallback;
  return val as T;
}

export function getFieldAsString(record: AirtableRecord, fieldId: string): string {
  const val = record.fields[fieldId];
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) return val.map((v: unknown) => (typeof v === 'object' && v !== null && 'name' in v ? (v as {name: string}).name : String(v))).join(', ');
  if (typeof val === 'object' && val !== null && 'name' in val) return (val as { name: string }).name;
  return JSON.stringify(val);
}

export function getFieldAsNumber(record: AirtableRecord, fieldId: string): number | null {
  const val = record.fields[fieldId];
  if (val === null || val === undefined) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

export function getFieldAsBoolean(record: AirtableRecord, fieldId: string): boolean | null {
  const val = record.fields[fieldId];
  if (val === null || val === undefined) return null;
  return Boolean(val);
}

export function getFieldAsDate(record: AirtableRecord, fieldId: string): string | null {
  const val = record.fields[fieldId];
  if (!val || typeof val !== 'string') return null;
  return val;
}
