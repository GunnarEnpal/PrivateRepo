# DV Gegenkündigung Pilot – Agent Dashboard

React + Vite Dashboard für den Enpal Energy DV-Gegenkündigung Piloten.  
Liest Kundendaten aus Airtable (`TERMINATIONS_CUSTOMERS`) und schreibt Gesprächsdokumentation zurück.

---

## Neue Airtable-Spalten (musst du manuell in Airtable anlegen)

In der Tabelle **`TERMINATIONS_CUSTOMERS`** brauchst du diese **5 neuen Felder**:

| Feldname | Typ | Beschreibung |
|---|---|---|
| `DV_PILOT_STATUS` | **Single Select** | Optionen: `Offen`, `Eskaliert`, `Erledigt` |
| `DV_ANRUF_VERSUCHE` | **Number** | Integer, 0–3 |
| `DV_GESPRAECHSERGEBNIS` | **Single Select** | Optionen (s.u.) |
| `DV_GESPRAECHSNOTIZ` | **Long Text** | Freitext für Gesprächsnotizen |
| `DV_NAECHSTER_SCHRITT` | **Single Select** | Optionen (s.u.) |
| `DV_LETZTER_KONTAKT` | **Date** | Wird automatisch beim Speichern gesetzt |
| `DV_KUENDIGUNG_EINGELEITET` | **Checkbox** | Wird gesetzt wenn "Kündigung DV einleiten" geklickt |

### Optionen für `DV_GESPRAECHSERGEBNIS`:
- Erreicht – DV-Kündigung angekündigt
- Erreicht – Kunde akzeptiert
- Erreicht – Kunde unzufrieden / eskaliert
- Erreicht – Rückfragen offen
- Nicht erreicht – Mailbox
- Nicht erreicht – kein Anschluss
- Falsche Nummer
- Sonstiges

### Optionen für `DV_NAECHSTER_SCHRITT`:
- Kein weiterer Schritt
- Erneut anrufen
- Schriftlich informieren
- Eskalation intern
- Kündigung DV einleiten
- Warten auf Kundenrückmeldung

---

## Setup lokal

```bash
git clone <dein-repo>
cd dv-dashboard
npm install
cp .env.example .env.local
# .env.local befüllen (s.u.)
npm run dev
```

### `.env.local` befüllen:
```
VITE_AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX   # In Airtable: Help → API Docs
VITE_AIRTABLE_API_KEY=patXXXXXXXXXXXXXX   # airtable.com/create/tokens
```

**Wichtig:** Der API Token braucht mindestens:
- Scope: `data.records:read` + `data.records:write`
- Access: deine Base

---

## Deploy auf Netlify

### Option A – Netlify UI (empfohlen)
1. Repo auf GitHub pushen
2. netlify.com → "Add new site" → "Import from Git"
3. Build command: `npm run build` · Publish dir: `dist`
4. **Site settings → Environment variables** → beide Variablen eintragen
5. Deploy

### Option B – Netlify CLI
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify env:set VITE_AIRTABLE_BASE_ID appXXX
netlify env:set VITE_AIRTABLE_API_KEY patXXX
netlify deploy --prod
```

### Nach dem Deploy
Jeder neue Push auf `main` deployt automatisch.

---

## Sicherheitshinweis

Der Airtable API Key ist im Frontend sichtbar (`VITE_` Prefix = public).  
Für Produktionsbetrieb empfohlen:
- Netlify Functions als Proxy verwenden (API Key bleibt server-side)
- Airtable Token auf minimale Scopes beschränken
- IP-Allowlisting auf Netlify-IPs wenn möglich
