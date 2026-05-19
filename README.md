# Retention Energy · Terminations Dashboard

Live-Dashboard das Daten direkt aus Airtable zieht. Kein Build-Step, kein Framework.

## Struktur

```
retention-dashboard/
├── index.html                        ← Das Dashboard
├── netlify.toml                      ← Netlify Config
├── netlify/
│   └── functions/
│       └── airtable.mjs             ← API Proxy (versteckt den Airtable Key)
└── README.md
```

---

## Deploy in 5 Minuten

### 1. GitHub Repo erstellen

1. GitHub → **New repository** → Name z.B. `retention-dashboard`
2. **Private** auswählen
3. Alle Dateien hochladen (oder `git push`)

### 2. Netlify verbinden

1. [netlify.com](https://netlify.com) → kostenloser Account
2. **Add new site → Import an existing project**
3. GitHub auswählen → dein Repo auswählen
4. Build-Einstellungen so lassen (kein Build Command nötig)
5. **Deploy site** klicken

### 3. API Key als Environment Variable setzen

1. Netlify → dein Site → **Site configuration → Environment variables**
2. **Add a variable**:
   - Key: `AIRTABLE_KEY`
   - Value: dein Airtable Personal Access Token
3. Speichern → **Trigger deploy** (oben rechts)

> **API Key erstellen:** airtable.com → Account (oben rechts) → Developer Hub → Personal access tokens → Create token
> Benötigte Scopes: `data.records:read`
> Zugriff: deine Base `Retention Energy`

### 4. Fertig

Netlify gibt dir eine URL wie `https://dein-name.netlify.app` — die kannst du ans Team schicken.

---

## Optionale Anpassungen

### Auto-Refresh alle X Minuten
In `index.html` ganz unten vor `</script>` einfügen:
```javascript
setInterval(refreshData, 10 * 60 * 1000); // alle 10 Minuten
```

### Andere Tabelle oder Base
In `netlify/functions/airtable.mjs` die Environment Variables ändern oder direkt:
```javascript
const baseId = 'appDEINEANDEREBASE';
const table  = 'ANDERE_TABELLE';
```

Oder in Netlify weitere Environment Variables setzen:
- `AIRTABLE_BASE_ID` → deine Base ID
- `AIRTABLE_TABLE` → Tabellenname

### Custom Domain
Netlify → Domain management → Add custom domain

---

## Sicherheit

- Der Airtable API Key steht nur in Netlify, nie im Code
- Das GitHub Repo ist private — nur dein Team hat Zugriff
- Die Netlify Function ist ein Proxy: Browser → Netlify → Airtable
