import { useState, useEffect, useCallback } from 'react';
import { fetchAllRecords, TABLE_IDS } from './airtable';
import { parseBatchRecord, parseCsatRecord, parseUserRecord } from './types';
import type { BatchRecord, CsatRecord, UserRecord } from './types';

export interface DataState {
  batches: BatchRecord[];
  csats: CsatRecord[];
  users: UserRecord[];
  loading: boolean;
  error: string | null;
  lastFetch: Date | null;
  refetch: () => void;
}

export function useAirtableData(): DataState {
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [csats, setCsats] = useState<CsatRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [trigger, setTrigger] = useState(0);

  const refetch = useCallback(() => setTrigger(t => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function load() {
      try {
        const [batchRaw, csatRaw, userRaw] = await Promise.all([
          fetchAllRecords(TABLE_IDS.batches),
          fetchAllRecords(TABLE_IDS.csat),
          fetchAllRecords(TABLE_IDS.users),
        ]);

        if (cancelled) return;

        setBatches(batchRaw.map(parseBatchRecord));
        setCsats(csatRaw.map(parseCsatRecord));
        setUsers(userRaw.map(parseUserRecord));
        setLastFetch(new Date());
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [trigger]);

  return { batches, csats, users, loading, error, lastFetch, refetch };
}
