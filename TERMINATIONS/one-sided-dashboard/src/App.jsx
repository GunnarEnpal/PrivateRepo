import { useState, useEffect, useCallback } from "react";

const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;
const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY;
const TABLE_NAME = "TERMINATIONS_CUSTOMERS";

// ── Simple local user store ────────────────────────────────────────────────────
const USERS = [
  { username: "admin",   password: "enpal2024" },
  { username: "agent1",  password: "agent1pw"  },
  { username: "agent2",  password: "agent2pw"  },
];

// ── Filter options ─────────────────────────────────────────────────────────────
const CLEANUP_FILTER_OPTIONS = [
  { value: "",                                       label: "Alle anzeigen" },
  { value: "__EMPTY__",                              label: "(Leer / kein Wert)" },
  { value: "ONLY_PROD_CANCELLED_CONS_ELZ_ENDED",    label: "ONLY_PROD_CANCELLED_CONS_ELZ_ENDED" },
  { value: "ONLY_PROD_CANCELLED_CONS_IN_ELZ",       label: "ONLY_PROD_CANCELLED_CONS_IN_ELZ" },
  { value: "ONLY_CONS_CANCELLED_PROD_ELZ_ENDED",    label: "ONLY_CONS_CANCELLED_PROD_ELZ_ENDED" },
  { value: "ONLY_CONS_CANCELLED_PROD_IN_ELZ",       label: "ONLY_CONS_CANCELLED_PROD_IN_ELZ" },
];

const GESPRAECHSERGEBNIS_OPTIONS = [
  "Erreicht – DV-Kündigung angekündigt",
  "Erreicht – Kunde akzeptiert",
  "Erreicht – Kunde unzufrieden / eskaliert",
  "Erreicht – Rückfragen offen",
  "Nicht erreicht – Mailbox",
  "Nicht erreicht – kein Anschluss",
  "Falsche Nummer",
  "Sonstiges",
];

const NAECHSTER_SCHRITT_OPTIONS = [
  "Kein weiterer Schritt",
  "Erneut anrufen",
  "Schriftlich informieren",
  "Eskalation intern",
  "Kündigung DV einleiten",
  "Warten auf Kundenrückmeldung",
];

const STATUS_OPTIONS = ["Offen", "Eskaliert", "Erledigt"];

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTimeout(() => {
      const user = USERS.find(
        (u) => u.username === username.trim() && u.password === password
      );
      if (user) {
        onLogin(user.username);
      } else {
        setError("Benutzername oder Passwort falsch.");
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-50"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* subtle grid bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 w-full max-w-sm mx-4">
        {/* Logo card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header stripe */}
          <div className="bg-[#00C46A] px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center font-black text-[#00C46A] text-lg shadow-sm">
                E
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">Enpal Energy</p>
                <p className="text-white/70 text-xs">Agent Interface</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <h1 className="text-gray-900 font-bold text-xl mb-1">Anmelden</h1>
            <p className="text-gray-400 text-sm mb-7">DV Gegenkündigung Pilot</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Benutzername
                </label>
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-[#00C46A] focus:ring-2 focus:ring-[#00C46A]/10 transition"
                  placeholder="benutzername"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Passwort
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-[#00C46A] focus:ring-2 focus:ring-[#00C46A]/10 transition"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="text-red-500 text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || !username || !password}
                className="w-full bg-[#00C46A] hover:bg-[#00b360] text-white font-semibold text-sm rounded-xl py-2.5 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-[#00C46A]/30 mt-2"
              >
                {loading ? "Anmelden…" : "Anmelden"}
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">
          Enpal Energy · Internes Pilot-Tool
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BADGE
// ═══════════════════════════════════════════════════════════════════════════════
function Badge({ status }) {
  const colors = {
    Beendet:  "bg-red-50 text-red-600 border border-red-200",
    Aktiv:    "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Offen:    "bg-amber-50 text-amber-700 border border-amber-200",
    Eskaliert:"bg-red-50 text-red-600 border border-red-200",
    Erledigt: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${colors[status] || "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "–";
  return new Date(dateStr).toLocaleDateString("de-DE");
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);

  // session restore
  useEffect(() => {
    const saved = sessionStorage.getItem("dv_user");
    if (saved) setCurrentUser(saved);
  }, []);

  const handleLogin = (username) => {
    sessionStorage.setItem("dv_user", username);
    setCurrentUser(username);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("dv_user");
    setCurrentUser(null);
  };

  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;
  return <Dashboard currentUser={currentUser} onLogout={handleLogout} />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
function Dashboard({ currentUser, onLogout }) {
  const [records, setRecords] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [tab, setTab] = useState("leitfaden");
  const [search, setSearch] = useState("");
  const [cleanupFilter, setCleanupFilter] = useState("");

  // Doku fields
  const [anrufVersuche, setAnrufVersuche] = useState(0);
  const [ergebnis, setErgebnis] = useState("");
  const [notiz, setNotiz] = useState("");
  const [naechsterSchritt, setNaechsterSchritt] = useState("");
  const [pilotStatus, setPilotStatus] = useState("Offen");

  const headers = {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    "Content-Type": "application/json",
  };

  const fetchRecords = useCallback(async (filterValue = "") => {
    setLoading(true);
    setRecords([]);
    try {
      let allRecords = [];
      let offset = null;

      // Build server-side filter formula
      let formula = "";
      if (filterValue === "__EMPTY__") {
        formula = `&filterByFormula=${encodeURIComponent('ONE_SIDED_TERMINATION_CLEANUP=""')}`;
      } else if (filterValue) {
        formula = `&filterByFormula=${encodeURIComponent(`ONE_SIDED_TERMINATION_CLEANUP="${filterValue}"`)}`;
      }

      do {
        let url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}?pageSize=100&sort[0][field]=SALESFORCE_CUSTOMER_NAME&sort[0][direction]=asc${formula}`;
        if (offset) url += `&offset=${offset}`;
        const res = await fetch(url, { headers });
        const data = await res.json();
        allRecords = allRecords.concat(data.records || []);
        offset = data.offset || null;
        // Update progressively so user sees records loading in
        setRecords([...allRecords]);
      } while (offset);

    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRecords(cleanupFilter); }, [cleanupFilter]);

  const selectRecord = (rec) => {
    setSelected(rec);
    const f = rec.fields;
    setAnrufVersuche(f.DV_ANRUF_VERSUCHE || 0);
    setErgebnis(f.DV_GESPRAECHSERGEBNIS || "");
    setNotiz(f.DV_GESPRAECHSNOTIZ || "");
    setNaechsterSchritt(f.DV_NAECHSTER_SCHRITT || "");
    setPilotStatus(f.DV_PILOT_STATUS || "Offen");
    setTab("leitfaden");
    setSaveMsg("");
  };

  const handleSave = async (extraFields = {}) => {
    if (!selected) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const payload = {
        fields: {
          DV_ANRUF_VERSUCHE: anrufVersuche,
          DV_GESPRAECHSERGEBNIS: ergebnis,
          DV_GESPRAECHSNOTIZ: notiz,
          DV_NAECHSTER_SCHRITT: naechsterSchritt,
          DV_PILOT_STATUS: pilotStatus,
          DV_LETZTER_KONTAKT: new Date().toISOString().split("T")[0],
          ...extraFields,
        },
      };
      const res = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}/${selected.id}`,
        { method: "PATCH", headers, body: JSON.stringify(payload) }
      );
      const data = await res.json();
      setRecords((prev) =>
        prev.map((r) => (r.id === selected.id ? { ...r, fields: { ...r.fields, ...data.fields } } : r))
      );
      setSelected((prev) => ({ ...prev, fields: { ...prev.fields, ...data.fields } }));
      setSaveMsg("✓ Gespeichert");
    } catch {
      setSaveMsg("⚠ Fehler beim Speichern");
    }
    setSaving(false);
  };

  const handleKuendigungEinleiten = async () => {
    await handleSave({
      DV_KUENDIGUNG_EINGELEITET: true,
      DV_PILOT_STATUS: "Erledigt",
      DV_NAECHSTER_SCHRITT: "Kündigung DV einleiten",
    });
    setPilotStatus("Erledigt");
    setNaechsterSchritt("Kündigung DV einleiten");
  };

  // ── Filtering ────────────────────────────────────────────────────────────────
  const filtered = records.filter((r) => {
    const name = r.fields.SALESFORCE_CUSTOMER_NAME || "";
    const gcid = r.fields.SALESFORCE_GLOBAL_CUSTOMER_ID || "";
    const matchesSearch =
      name.toLowerCase().includes(search.toLowerCase()) ||
      gcid.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const queueRecords    = filtered.filter((r) => (r.fields.DV_PILOT_STATUS || "Offen") !== "Erledigt");
  const completedRecords = filtered.filter((r) => r.fields.DV_PILOT_STATUS === "Erledigt");

  const f = selected?.fields || {};
  const consStatus = f.MAKO_CONS_TERMINATION_END_DATE ? "Beendet" : "Aktiv";

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#00C46A] rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm">
            E
          </div>
          <div>
            <span className="font-bold text-gray-800 text-sm">Enpal Energy</span>
            <span className="text-gray-300 mx-2 text-xs">|</span>
            <span className="text-gray-500 text-xs">DV Gegenkündigung Pilot</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-[#00C46A]/10 text-[#00a858] border border-[#00C46A]/20 px-2.5 py-1 rounded-full font-semibold">
            Pilotgruppe
          </span>
          <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
            <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 uppercase">
              {currentUser[0]}
            </div>
            <span className="text-xs font-medium text-gray-600 hidden sm:block">{currentUser}</span>
            <button
              onClick={onLogout}
              className="text-xs text-gray-400 hover:text-red-500 transition ml-1 px-2 py-1 rounded-lg hover:bg-red-50"
            >
              Abmelden
            </button>
          </div>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ────────────────────────────────────────────────────────── */}
        <aside className="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
          {/* Search + filter */}
          <div className="p-3 border-b border-gray-100 space-y-2">
            <input
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#00C46A] focus:ring-2 focus:ring-[#00C46A]/10 transition"
              placeholder="Suche Name / GCID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {/* ONE_SIDED_TERMINATION_CLEANUP filter */}
            <select
              value={cleanupFilter}
              onChange={(e) => setCleanupFilter(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 focus:outline-none focus:border-[#00C46A] focus:ring-2 focus:ring-[#00C46A]/10 transition appearance-none cursor-pointer"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
            >
              {CLEANUP_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {cleanupFilter && (
              <div className="flex items-center justify-between bg-[#00C46A]/5 border border-[#00C46A]/20 rounded-lg px-2.5 py-1.5">
                <span className="text-xs text-[#00a858] font-medium truncate max-w-[180px]">
                  {CLEANUP_FILTER_OPTIONS.find(o => o.value === cleanupFilter)?.label}
                </span>
                <button
                  onClick={() => setCleanupFilter("")}
                  className="text-gray-400 hover:text-red-400 transition ml-2 flex-shrink-0 text-xs"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Queue list – scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-3 pt-3 pb-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Warteschlange ({queueRecords.length})
              </p>
            </div>
            {loading ? (
              <div className="px-4 py-6 space-y-2">
                {[1,2,3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-3 bg-gray-100 rounded w-3/4 mb-1.5"/>
                    <div className="h-2.5 bg-gray-100 rounded w-1/2"/>
                  </div>
                ))}
              </div>
            ) : (
              queueRecords.map((rec) => (
                <SidebarItem key={rec.id} rec={rec} selected={selected} onSelect={selectRecord} />
              ))
            )}

            <div className="px-3 pt-4 pb-1 border-t border-gray-100 mt-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Abgeschlossen ({completedRecords.length})
              </p>
            </div>
            {completedRecords.map((rec) => (
              <SidebarItem key={rec.id} rec={rec} selected={selected} onSelect={selectRecord} />
            ))}
          </div>
        </aside>

        {/* ── Main content – scrollable ─────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {!selected ? (
            <div className="flex items-center justify-center h-full text-gray-400 min-h-[400px]">
              <div className="text-center">
                <div className="w-16 h-16 bg-white border border-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-2xl">
                  ☎
                </div>
                <p className="text-sm font-medium text-gray-500">Kunden aus der Warteschlange auswählen</p>
                <p className="text-xs text-gray-300 mt-1">{filtered.length} Kunden geladen</p>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto p-6 space-y-5 pb-16">

              {/* ── Customer card ─────────────────────────────────────────── */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 text-base">
                    👤
                  </div>
                  <h2 className="font-bold text-gray-800 text-sm">Kundeninformationen</h2>
                  {f.ONE_SIDED_TERMINATION_CLEANUP && (
                    <span className="ml-auto text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-lg px-2.5 py-1 font-medium">
                      {f.ONE_SIDED_TERMINATION_CLEANUP}
                    </span>
                  )}
                </div>
                <div className="p-5 grid grid-cols-2 gap-3">
                  <InfoField label="Name"    value={f.SALESFORCE_CUSTOMER_NAME} />
                  <InfoField label="Telefon" value={f.SALESFORCE_CUSTOMER_PHONE} />
                  <InfoField label="E-Mail"  value={f.SALESFORCE_CUSTOMER_EMAIL} />
                  <InfoField label="Adresse" value={f.SALESFORCE_CUSTOMER_ADDRESS} />
                </div>
                {f.SALESFORCE_GLOBAL_CUSTOMER_ID && (
                  <div className="px-5 pb-4">
                    <a
                      href={`https://enpal.lightning.force.com/lightning/r/Account/${f.SALESFORCE_ACCOUNT_ID}/view`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 border border-blue-100 bg-blue-50 rounded-lg px-3 py-1.5 font-medium transition hover:bg-blue-100"
                    >
                      🔗 Salesforce Dashboard →
                    </a>
                  </div>
                )}
              </div>

              {/* ── Contract status ───────────────────────────────────────── */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
                  <span className="text-yellow-500 text-base">⚡</span>
                  <h2 className="font-bold text-gray-800 text-sm">Vertragsstatus</h2>
                </div>
                <div className="p-5 space-y-3">
                  <ContractRow
                    label="Retail (CONS)"
                    status={consStatus}
                    start={f.CONS_CONTRACT_START_DATE}
                    elzEnd={f.CONS_CONTRACT_END_OR_SWITCH_DATE}
                    terminated={f.MAKO_CONS_TERMINATION_END_DATE}
                  />
                  <ContractRow
                    label="Direktvermarktung"
                    status="Aktiv"
                    start={f.PROD_CONTRACT_START_DATE}
                    elzEnd={f.PROD_CONTRACT_END_OR_SWITCH_DATE}
                    terminated={f.MAKO_PROD_TERMINATION_END_DATE}
                    plannedEnd={f.MAKO_PROD_TERMINATION_END_DATE}
                  />
                </div>
              </div>

              {/* ── Tabs ──────────────────────────────────────────────────── */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-gray-100">
                  <TabBtn active={tab === "leitfaden"} onClick={() => setTab("leitfaden")}>
                    Gesprächsleitfaden
                  </TabBtn>
                  <TabBtn active={tab === "doku"} onClick={() => setTab("doku")}>
                    Dokumentation
                  </TabBtn>
                </div>

                {tab === "leitfaden" && (
                  <Leitfaden
                    customerName={f.SALESFORCE_CUSTOMER_NAME}
                    prodEndDate={f.MAKO_PROD_TERMINATION_END_DATE}
                  />
                )}

                {tab === "doku" && (
                  <div className="p-5 space-y-6">
                    {/* Anrufversuche */}
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <label className="text-sm font-semibold text-gray-700">Anrufversuche</label>
                        <span className="text-xs text-gray-400">max. 3 – dann schriftlich</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {[1, 2, 3].map((n) => (
                          <button
                            key={n}
                            onClick={() => setAnrufVersuche(anrufVersuche === n ? n - 1 : n)}
                            className={`w-10 h-10 rounded-full border-2 text-sm font-bold transition-all ${
                              anrufVersuche >= n
                                ? "bg-[#00C46A] border-[#00C46A] text-white shadow-sm shadow-[#00C46A]/30"
                                : "border-gray-200 text-gray-400 hover:border-gray-300 bg-white"
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                        <span className="text-xs text-gray-400 ml-1">
                          {anrufVersuche === 0
                            ? "Noch kein Versuch erfasst"
                            : `${anrufVersuche} Versuch${anrufVersuche > 1 ? "e" : ""} erfasst`}
                        </span>
                      </div>
                    </div>

                    {/* Gesprächsergebnis */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-2">
                        Gesprächsergebnis
                      </label>
                      <select
                        value={ergebnis}
                        onChange={(e) => setErgebnis(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#00C46A] focus:ring-2 focus:ring-[#00C46A]/10 transition"
                      >
                        <option value="">– bitte wählen –</option>
                        {GESPRAECHSERGEBNIS_OPTIONS.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </div>

                    {/* Gesprächsnotiz */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-2">
                        Gesprächsnotiz
                      </label>
                      <textarea
                        value={notiz}
                        onChange={(e) => setNotiz(e.target.value)}
                        rows={4}
                        placeholder="Freitext: Gesprächsverlauf, Kundenreaktion, offene Punkte…"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#00C46A] focus:ring-2 focus:ring-[#00C46A]/10 transition resize-none"
                      />
                    </div>

                    {/* Nächster Schritt */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-2">
                        Nächster Schritt
                      </label>
                      <select
                        value={naechsterSchritt}
                        onChange={(e) => setNaechsterSchritt(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#00C46A] focus:ring-2 focus:ring-[#00C46A]/10 transition"
                      >
                        <option value="">– bitte wählen –</option>
                        {NAECHSTER_SCHRITT_OPTIONS.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-2">
                        Fallstatus
                      </label>
                      <div className="flex gap-2">
                        {STATUS_OPTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => setPilotStatus(s)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                              pilotStatus === s
                                ? s === "Erledigt"
                                  ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                                  : s === "Eskaliert"
                                  ? "bg-red-50 border-red-400 text-red-700"
                                  : "bg-amber-50 border-amber-400 text-amber-700"
                                : "border-gray-200 text-gray-400 bg-white hover:border-gray-300"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Save buttons */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                      <button
                        onClick={handleKuendigungEinleiten}
                        disabled={saving}
                        className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition disabled:opacity-50 shadow-sm"
                      >
                        Kündigung DV einleiten
                      </button>
                      <button
                        onClick={() => handleSave()}
                        disabled={saving}
                        className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:border-gray-300 hover:bg-gray-50 transition disabled:opacity-50"
                      >
                        {saving ? "Speichert…" : "Doku speichern"}
                      </button>
                      {saveMsg && (
                        <span
                          className={`text-sm font-medium ${
                            saveMsg.startsWith("✓") ? "text-emerald-600" : "text-red-500"
                          }`}
                        >
                          {saveMsg}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIDEBAR ITEM
// ═══════════════════════════════════════════════════════════════════════════════
function SidebarItem({ rec, selected, onSelect }) {
  const f = rec.fields;
  const status = f.DV_PILOT_STATUS || "Offen";
  const consEnd = f.MAKO_CONS_TERMINATION_END_DATE;
  const dateStr = consEnd ? new Date(consEnd).toLocaleDateString("de-DE") : "–";

  return (
    <button
      onClick={() => onSelect(rec)}
      className={`w-full text-left px-3 py-2.5 border-b border-gray-100/80 transition-all ${
        selected?.id === rec.id
          ? "bg-[#00C46A]/5 border-l-2 border-l-[#00C46A]"
          : "hover:bg-gray-50 border-l-2 border-l-transparent"
      }`}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="text-sm font-semibold text-gray-700 truncate">
          {f.SALESFORCE_CUSTOMER_NAME || "Unbekannt"}
        </p>
        <Badge status={status} />
      </div>
      <p className="text-xs text-gray-400 mt-0.5">
        {f.SALESFORCE_GLOBAL_CUSTOMER_ID ? `Retail beendet ${dateStr}` : "–"}
      </p>
      {f.ONE_SIDED_TERMINATION_CLEANUP && (
        <p className="text-xs text-amber-500 mt-0.5 truncate">
          {f.ONE_SIDED_TERMINATION_CLEANUP}
        </p>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
function InfoField({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
      <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-700">{value || "–"}</p>
    </div>
  );
}

function ContractRow({ label, status, start, elzEnd, terminated, plannedEnd }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-36 text-gray-600 font-semibold text-xs">{label}</span>
      <Badge status={status} />
      <span className="text-gray-400 text-xs">
        Start: {formatDate(start)}
        {elzEnd ? ` · ELZ-Ende: ${formatDate(elzEnd)}` : ""}
        {terminated ? ` · Beendet: ${formatDate(terminated)}` : ""}
        {plannedEnd && !terminated ? ` · Geplantes Ende: ${formatDate(plannedEnd)}` : ""}
      </span>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3.5 text-sm font-semibold transition-all border-b-2 ${
        active
          ? "text-[#00a858] border-[#00C46A] bg-[#00C46A]/5"
          : "text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEITFADEN
// ═══════════════════════════════════════════════════════════════════════════════
function Leitfaden({ customerName, prodEndDate }) {
  const [open, setOpen] = useState({});
  const toggle = (k) => setOpen((p) => ({ ...p, [k]: !p[k] }));

  const endDate = prodEndDate
    ? new Date(
        new Date(prodEndDate).getFullYear(),
        new Date(prodEndDate).getMonth() + 1,
        1
      ).toLocaleDateString("de-DE")
    : "[Datum]";

  return (
    <div className="p-5 space-y-4">
      {/* Alert */}
      <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
        <span className="text-amber-500 mt-0.5 flex-shrink-0">⚠</span>
        <p className="text-sm text-amber-800 font-medium">
          Kein Retention-Versuch. Ziel: transparent informieren, DV-Kündigung ankündigen.
        </p>
      </div>

      {/* Opening */}
      <Section title="Eröffnung" defaultOpen>
        <ScriptBlock label="EINSTIEG (SINNGEMÄSS)">
          <ScriptLine>
            „Guten Tag, mein Name ist [Name], ich rufe von Enpal Energy an. Ich möchte kurz mit Ihnen über Ihren Enpal-One+-Vertrag sprechen – das dauert nicht lange. Passt das kurz?"
          </ScriptLine>
          <ScriptLine>
            „Sie hatten bei uns zwei Verträge im Rahmen von Enpal One+: den Stromliefervertrag und den Direktvermarktungsvertrag für Ihre Solaranlage. Ich rufe an, weil Ihr Stromliefervertrag bereits beendet wurde und wir deshalb jetzt auch den Direktvermarktungsvertrag beenden werden."
          </ScriptLine>
        </ScriptBlock>
      </Section>

      {/* Reason */}
      <Section title="Begründung">
        <ScriptBlock label="ERKLÄRUNG (SINNGEMÄSS)">
          <ScriptLine>
            {`„Enpal One+ ist als ein gemeinsames Produkt konzipiert: Der Direktvermarktungsvertrag setzt voraus, dass Sie auch unser Stromkunde sind. Da der Stromliefervertrag nicht mehr aktiv ist, können wir die Direktvermarktung nicht weiterführen. Wir kündigen den Direktvermarktungsvertrag daher zum <strong>${endDate}</strong> ordentlich."`}
          </ScriptLine>
        </ScriptBlock>

        <div className="mt-3 space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Wichtige Infos</p>
          {[
            "Genaues Enddatum nennen (1 Monat Frist, zum nächsten Monatsersten).",
            "Anlage fällt automatisch in EEG-Einspeisevergütung zurück – Kunde muss nichts tun.",
            "Netzbetreiber-Abmeldung übernimmt Enpal – Kunde wird über Abmeldezeitpunkt informiert.",
            "Rückkehr in Enpal One+ ist aktuell nicht möglich.",
          ].map((item, i) => (
            <div key={i} className="flex gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
              <span className="text-gray-400 font-mono text-xs mt-0.5 flex-shrink-0">{i + 1}</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Einwand: Versehen */}
      <div className="border border-emerald-200 rounded-xl overflow-hidden">
        <div className="bg-emerald-50 px-4 py-2.5 flex items-center gap-2 border-b border-emerald-100">
          <span className="text-emerald-500 text-xs">◇</span>
          <p className="text-sm text-emerald-800 font-semibold">
            Wenn der Kunde sagt: „Die Kündigung war aus Versehen"
          </p>
        </div>
        <div className="px-4 py-1.5 bg-emerald-50/50">
          <p className="text-xs text-emerald-600 italic py-1">
            Inhaltlich ändert sich nichts – Rückanmeldung ist nicht möglich. Empathisch bleiben, dann sachlich weiterführen.
          </p>
        </div>
        <div className="px-4 pb-4 pt-2 space-y-2 bg-white">
          <ScriptLine>„Das tut mir wirklich leid zu hören – ich kann gut verstehen, dass das sehr ärgerlich ist, und ich bedauere, dass wir Ihnen hier nicht mehr helfen können."</ScriptLine>
          <ScriptLine>„Leider ist es uns aktuell technisch nicht möglich, eine bereits umgesetzte Kündigung rückgängig zu machen. Wir arbeiten intensiv daran, das in Zukunft zu ermöglichen – können aber noch keinen Zeitpunkt nennen."</ScriptLine>
        </div>
      </div>

      {/* FAQs */}
      {[
        {
          q: `„Warum kündigen Sie jetzt erst?"`,
          a: `„Sie haben recht – zwischen der Beendigung Ihres Stromliefervertrags und diesem Anruf ist etwas Zeit vergangen. Wir haben das nun systematisch erfasst und gehen proaktiv auf alle betroffenen Kunden zu. Wir entschuldigen uns für die verzögerte Kommunikation."`,
        },
        {
          q: `„Ich möchte den Stromvertrag reaktivieren."`,
          a: `„Das verstehe ich gut. Leider ist eine Rückanmeldung technisch nicht möglich, sobald ein Vertrag einmal beendet wurde – das gilt für beide Verträge."`,
        },
        {
          q: `„Was passiert mit meiner Enpal-Vergütung?"`,
          a: `„Bis zum Vertragsende erhalten Sie Ihre Enpal-Vergütung anteilig. Danach fällt Ihre Anlage in die staatliche Einspeisevergütung zurück – die Vergütung zahlt dann Ihr Netzbetreiber direkt."`,
        },
        {
          q: `„Kann ich den DV-Vertrag alleine behalten?"`,
          a: `„Nein, leider nicht. Enpal One+ setzt voraus, dass Sie auch unser Stromkunde sind. Ohne aktiven Stromliefervertrag ist die Weiterführung der Direktvermarktung nicht möglich."`,
        },
      ].map((faq) => (
        <div key={faq.q} className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => toggle(faq.q)}
            className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-700 flex items-center justify-between hover:bg-gray-50 transition"
          >
            {faq.q}
            <span className="text-gray-400 text-xs ml-2 flex-shrink-0">{open[faq.q] ? "∧" : "∨"}</span>
          </button>
          {open[faq.q] && (
            <div className="px-4 pb-4 bg-white">
              <ScriptLine>{faq.a}</ScriptLine>
            </div>
          )}
        </div>
      ))}

      {/* Nicht tun */}
      <div className="bg-red-50 border border-red-100 rounded-xl p-4">
        <p className="text-sm font-bold text-red-700 mb-2.5">Nicht tun</p>
        <div className="space-y-1.5">
          {[
            "Nicht versprechen, wann Rückanmeldung möglich wird.",
            "Keine Zusagen zur genauen Höhe der Enpal-Vergütung.",
            "Abmeldezeitpunkt der Marktlokation nicht zusagen.",
            "Kein Retention-Angebot machen.",
          ].map((item) => (
            <div key={item} className="flex gap-2 text-sm text-red-700">
              <span className="text-red-400 mt-0.5 flex-shrink-0">✕</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-3 flex items-center gap-2 hover:bg-gray-50 transition"
      >
        <span className="text-gray-400 text-xs">{open ? "▼" : "▶"}</span>
        <span className="text-sm font-semibold text-gray-700">{title}</span>
      </button>
      {open && <div className="px-4 pb-4 pt-1 space-y-3 bg-white">{children}</div>}
    </div>
  );
}

function ScriptBlock({ label, children }) {
  return (
    <div>
      <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">{label}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ScriptLine({ children }) {
  return (
    <p
      className="text-sm text-gray-600 bg-blue-50/50 border-l-2 border-blue-200 pl-3 py-2 rounded-r-lg"
      dangerouslySetInnerHTML={{
        __html: typeof children === "string" ? children : "",
      }}
    />
  );
}
