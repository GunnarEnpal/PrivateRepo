import type { AirtableRecord } from './airtable';
import { getFieldAsString, getFieldAsNumber, getFieldAsBoolean, getFieldAsDate } from './airtable';
import { F } from './fields';

export type ViewMode = 'overview' | 'detail';
export type StatusTab = 'all' | 'inProgress' | 'done' | 'blocked' | 'callbackNeeded' | 'csatIIPending';
export type CsatSortOption = 'improvement' | 'name' | 'csatAfter';
export type MonthSelection = 'current' | 'previous';

export interface BatchRecord {
  id: string;
  name: string;
  raw: AirtableRecord;
  status: string;
  customerName: string;
  vorUndNachname: string;
  csatCases: number;
  inProgressCsat: number;
  callTime: number | null;
  avgCsat: number | null;
  earliestCsat: string | null;
  latestCsat: string | null;
  provisionBase: number;
  provisionBonus: number;
  totalProvision: number;
  csatIIRating: number | null;
  lowestCsatI: number | null;
  csatImprovement: number | null;
  csatIIKommentar: string;
  endDate: string | null;
  inProgressSubStatus: string;
  sendCsatII: boolean | null;
  blockiertEscalationTs: string | null;
  blockiertTelefonTs: string | null;
  csatIIRespondedTs: string | null;
  retentionAgentTs: string | null;
  doneTimestamp: string | null;
  preCallRecherche: string | null;
  callsSuccessfulEnpal: number | null;
  solutionCommunicated: boolean | null;
  csatIISentTimestamp: string | null;
  bearbeitungszeitTage: number | null;
  closedCases: number;
  hasEnergyResponsibility: boolean;
}

export interface CsatRecord {
  id: string;
  raw: AirtableRecord;
  rating: number | null;
  ratingII: number | null;
  responseTimestamp: string | null;
  csatIIDate: string | null;
  customerSatisfaction: string;
}

export interface UserRecord {
  id: string;
  raw: AirtableRecord;
  collaboratorId: string | null;
  collaboratorName: string | null;
  provisionZiel: number | null;
  avgBearbeitungszeit: number | null;
  provisionGesamtSumme: number | null;
  provisionBaseSumme: number | null;
  provisionBonusSumme: number | null;
}

export function parseBatchRecord(r: AirtableRecord): BatchRecord {
  const resp = r.fields[F.RESPONSIBILITY];
  const hasEnergy = Array.isArray(resp)
    ? resp.some((v: unknown) => typeof v === 'object' && v !== null && 'name' in v && (v as {name:string}).name === 'Energy')
    : false;

  return {
    id: r.id,
    name: getFieldAsString(r, 'Name') || r.id.slice(-6),
    raw: r,
    status: getFieldAsString(r, F.STATUS),
    customerName: getFieldAsString(r, F.CUSTOMER_NAME),
    vorUndNachname: getFieldAsString(r, F.VOR_UND_NACHNAME),
    csatCases: getFieldAsNumber(r, F.CSAT_CASES) ?? 0,
    inProgressCsat: getFieldAsNumber(r, F.IN_PROGRESS_CSAT) ?? 0,
    callTime: getFieldAsNumber(r, F.CALL_TIME),
    avgCsat: getFieldAsNumber(r, F.AVG_CSAT),
    earliestCsat: getFieldAsDate(r, F.EARLIEST_CSAT),
    latestCsat: getFieldAsDate(r, F.LATEST_CSAT),
    provisionBase: getFieldAsNumber(r, F.PROVISION_BASE) ?? 0,
    provisionBonus: getFieldAsNumber(r, F.PROVISION_BONUS) ?? 0,
    totalProvision: getFieldAsNumber(r, F.TOTAL_PROVISION) ?? 0,
    csatIIRating: getFieldAsNumber(r, F.CSAT_II_RATING),
    lowestCsatI: getFieldAsNumber(r, F.LOWEST_CSAT_I),
    csatImprovement: getFieldAsNumber(r, F.CSAT_IMPROVEMENT),
    csatIIKommentar: getFieldAsString(r, F.CSAT_II_KOMMENTAR),
    endDate: getFieldAsDate(r, F.END_DATE),
    inProgressSubStatus: getFieldAsString(r, F.IN_PROGRESS_SUB_STATUS),
    sendCsatII: getFieldAsBoolean(r, F.SEND_CSAT_II),
    blockiertEscalationTs: getFieldAsDate(r, F.BLOCKIERT_ESCALATION_TS),
    blockiertTelefonTs: getFieldAsDate(r, F.BLOCKIERT_TELEFON_TS),
    csatIIRespondedTs: getFieldAsDate(r, F.CSAT_II_RESPONDED_TS),
    retentionAgentTs: getFieldAsDate(r, F.RETENTION_AGENT_TS),
    doneTimestamp: getFieldAsDate(r, F.DONE_TIMESTAMP),
    preCallRecherche: getFieldAsString(r, F.PRE_CALL_RECHERCHE) || null,
    callsSuccessfulEnpal: getFieldAsNumber(r, F.CALLS_SUCCESSFUL_ENPAL),
    solutionCommunicated: getFieldAsBoolean(r, F.SOLUTION_COMMUNICATED),
    csatIISentTimestamp: getFieldAsDate(r, F.CSAT_II_SENT_TIMESTAMP),
    bearbeitungszeitTage: getFieldAsNumber(r, F.BEARBEITUNGSZEIT_TAGE),
    closedCases: getFieldAsNumber(r, F.CLOSED_CASES) ?? 0,
    hasEnergyResponsibility: hasEnergy,
  };
}

export function parseCsatRecord(r: AirtableRecord): CsatRecord {
  return {
    id: r.id,
    raw: r,
    rating: getFieldAsNumber(r, F.CSAT_RATING),
    ratingII: getFieldAsNumber(r, F.CSAT_RATING_II),
    responseTimestamp: getFieldAsDate(r, F.CSAT_RESPONSE_TIMESTAMP),
    csatIIDate: getFieldAsDate(r, F.CSAT_II_DATE),
    customerSatisfaction: getFieldAsString(r, F.CUSTOMER_SATISFACTION),
  };
}

export function parseUserRecord(r: AirtableRecord): UserRecord {
  const collab = r.fields[F.USER_COLLABORATOR] as { id?: string; name?: string } | null;
  return {
    id: r.id,
    raw: r,
    collaboratorId: collab?.id ?? null,
    collaboratorName: collab?.name ?? null,
    provisionZiel: getFieldAsNumber(r, F.PROVISION_ZIEL),
    avgBearbeitungszeit: getFieldAsNumber(r, F.AVG_BEARBEITUNGSZEIT),
    provisionGesamtSumme: getFieldAsNumber(r, F.PROVISION_GESAMT_SUMME),
    provisionBaseSumme: getFieldAsNumber(r, F.PROVISION_BASE_SUMME),
    provisionBonusSumme: getFieldAsNumber(r, F.PROVISION_BONUS_SUMME),
  };
}

export function safeToFixed(value: unknown, decimals = 0): string {
  if (typeof value === 'number' && !isNaN(value)) return value.toFixed(decimals);
  return '0';
}

export function getMonthBounds(selection: MonthSelection): { first: Date; last: Date; month: number; year: number } {
  const today = new Date();
  let month: number, year: number;
  if (selection === 'current') {
    month = today.getMonth();
    year = today.getFullYear();
  } else {
    const prev = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    month = prev.getMonth();
    year = prev.getFullYear();
  }
  return {
    first: new Date(year, month, 1),
    last: new Date(year, month + 1, 0, 23, 59, 59, 999),
    month,
    year,
  };
}

export const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

export const CUTOFF_DONE = new Date('2026-04-08');
