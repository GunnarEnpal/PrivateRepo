# Batch Auswertung Dashboard

Standalone React + Vite Dashboard, das das Airtable Block durch die Airtable REST API ersetzt. Deploybar auf Netlify (oder überall wo statische Sites laufen).

## Features

- Übersicht aller Batches mit Statusfilter (In Progress, Done, Blockiert, Rückruf, CSAT II ausstehend)
- Provision-Übersicht pro Monat (aktuell / vorheriger Monat)
- CSAT Before / After Vergleich
- Provision pro Tag Chart
- Base vs. Bonus Aufteilung
- Suche & Sortierung

## Setup

### Option A: Netlify Environment Variables (empfohlen für Production)

1. Repository in GitHub pushen
2. In Netlify: **Site Settings → Environment Variables** hinzufügen:
   - `VITE_AIRTABLE_PAT` = dein Personal Access Token
   - `VITE_AIRTABLE_BASE_ID` = deine Base ID (z.B. `appXXXXXXXX`)
3. Deploy

### Option B: Lokale .env.local (für Entwicklung)

```bash
cp .env.example .env.local
# .env.local ausfüllen:
# VITE_AIRTABLE_PAT=pat_...
# VITE_AIRTABLE_BASE_ID=appXXXXXX
```

### Option C: Im Browser eingeben

Wenn keine Env-Variablen gesetzt sind, erscheint beim ersten Aufruf ein Konfigurationsfeld. PAT und Base ID werden im `localStorage` des Browsers gespeichert.

## Lokale Entwicklung

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output liegt in `dist/` – direkt auf Netlify / Vercel / GitHub Pages deploybar.

## Airtable Personal Access Token erstellen

1. https://airtable.com/create/tokens aufrufen
2. **+ Add a token** klicken
3. Scopes: `data.records:read` für alle 3 Tabellen (CSAT, Batches, Users)
4. Token kopieren → als `VITE_AIRTABLE_PAT` setzen

## Table IDs anpassen

Die Field IDs in `src/fields.ts` entsprechen den Feldern aus dem Original-Block.
Falls sich Felder geändert haben, dort anpassen.

Die Table IDs sind in `src/airtable.ts` als `TABLE_IDS` und können über `.env` überschrieben werden:
```
VITE_TABLE_CSAT=tbl...
VITE_TABLE_BATCHES=tbl...
VITE_TABLE_USERS=tbl...
```
