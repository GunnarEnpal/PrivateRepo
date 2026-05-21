import { useState, useEffect, useCallback } from "react";

const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;
const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY;
const TABLE_NAME = "TERMINATIONS_CUSTOMERS";

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

const STATUS_OPTIONS = [
  "Offen",
  "Eskaliert",
  "Erledigt",
];

function Badge({ status }) {
  const colors = {
    Beendet: "bg-red-100 text-red-700 border border-red-200",
    Aktiv: "bg-green-100 text-green-700 border border-green-200",
    Offen: "bg-amber-100 text-amber-700 border border-amber-200",
    Eskaliert: "bg-red-100 text-red-700 border border-red-200",
    Erledigt: "bg-green-100 text-green-700 border border-green-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colors[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "–";
  return new Date(dateStr).toLocaleDateString("de-DE");
}

export default function App() {
  const [records, setRecords] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [tab, setTab] = useState("leitfaden");
  const [search, setSearch] = useState("");

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

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      let url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}?pageSize=50&sort[0][field]=SALESFORCE_CUSTOMER_NAME&sort[0][direction]=asc`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      setRecords(data.records || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

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
      // update local
      setRecords((prev) =>
        prev.map((r) => (r.id === selected.id ? { ...r, fields: { ...r.fields, ...data.fields } } : r))
      );
      setSelected((prev) => ({ ...prev, fields: { ...prev.fields, ...data.fields } }));
      setSaveMsg("✓ Gespeichert");
    } catch (e) {
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

  const incrementAnruf = async (n) => {
    const next = n;
    setAnrufVersuche(next);
  };

  const filtered = records.filter((r) => {
    const name = r.fields.SALESFORCE_CUSTOMER_NAME || "";
    const gcid = r.fields.SALESFORCE_GLOBAL_CUSTOMER_ID || "";
    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      gcid.toLowerCase().includes(search.toLowerCase())
    );
  });

  const f = selected?.fields || {};

  const consStatus = f.MAKO_CONS_TERMINATION_END_DATE ? "Beendet" : "Aktiv";
  const prodStatus = "Aktiv";

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Top bar */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-green-500 rounded flex items-center justify-center text-black font-bold text-sm">E</div>
          <span className="font-semibold text-sm text-gray-100">Enpal Energy — Agent Interface · DV Gegenkündigung Pilot</span>
        </div>
        <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-medium">Pilotgruppe</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
          <div className="p-3 border-b border-gray-800">
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-green-500"
              placeholder="Suche Name / GCID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Queue sections */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-3 pt-3 pb-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Warteschlange ({filtered.filter(r => (r.fields.DV_PILOT_STATUS || "Offen") !== "Erledigt").length})</p>
            </div>
            {loading ? (
              <div className="px-3 py-4 text-xs text-gray-500">Lädt…</div>
            ) : (
              filtered.filter(r => (r.fields.DV_PILOT_STATUS || "Offen") !== "Erledigt").map((rec) => (
                <SidebarItem key={rec.id} rec={rec} selected={selected} onSelect={selectRecord} />
              ))
            )}

            <div className="px-3 pt-4 pb-1 border-t border-gray-800 mt-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Abgeschlossen ({filtered.filter(r => r.fields.DV_PILOT_STATUS === "Erledigt").length})</p>
            </div>
            {filtered.filter(r => r.fields.DV_PILOT_STATUS === "Erledigt").map((rec) => (
              <SidebarItem key={rec.id} rec={rec} selected={selected} onSelect={selectRecord} />
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-950 p-6">
          {!selected ? (
            <div className="flex items-center justify-center h-full text-gray-600">
              <div className="text-center">
                <div className="text-4xl mb-3">☎</div>
                <p className="text-sm">Kunden aus der Warteschlange auswählen</p>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Customer info card */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-sm">👤</div>
                  <h2 className="font-semibold text-gray-100">Kundeninformationen</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InfoField label="Name" value={f.SALESFORCE_CUSTOMER_NAME} />
                  <InfoField label="Telefon" value={f.SALESFORCE_CUSTOMER_PHONE} />
                  <InfoField label="E-Mail" value={f.SALESFORCE_CUSTOMER_EMAIL} />
                  <InfoField label="Adresse" value={f.SALESFORCE_CUSTOMER_ADDRESS} />
                </div>
                {f.SALESFORCE_GLOBAL_CUSTOMER_ID && (
                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <a
                      href={`https://enpal.lightning.force.com/lightning/r/Account/${f.SALESFORCE_ACCOUNT_ID}/view`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 border border-blue-500/20 bg-blue-500/5 rounded px-2.5 py-1"
                    >
                      🔗 Salesforce Dashboard →
                    </a>
                  </div>
                )}
              </div>

              {/* Contract status */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-yellow-400">⚡</span>
                  <h2 className="font-semibold text-gray-100">Vertragsstatus</h2>
                </div>
                <div className="space-y-3">
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

              {/* Tabs */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="flex border-b border-gray-800">
                  <TabBtn active={tab === "leitfaden"} onClick={() => setTab("leitfaden")}>Gesprächsleitfaden</TabBtn>
                  <TabBtn active={tab === "doku"} onClick={() => setTab("doku")}>Dokumentation</TabBtn>
                </div>

                {tab === "leitfaden" && <Leitfaden customerName={f.SALESFORCE_CUSTOMER_NAME} prodEndDate={f.MAKO_PROD_TERMINATION_END_DATE} />}

                {tab === "doku" && (
                  <div className="p-5 space-y-6">
                    {/* Anrufversuche */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-300">Anrufversuche</label>
                        <span className="text-xs text-gray-500">max. 3 – dann schriftlich einleiten</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {[1, 2, 3].map((n) => (
                          <button
                            key={n}
                            onClick={() => incrementAnruf(anrufVersuche === n ? n - 1 : n)}
                            className={`w-9 h-9 rounded-full border text-sm font-semibold transition-all ${
                              anrufVersuche >= n
                                ? "bg-green-500 border-green-500 text-black"
                                : "border-gray-600 text-gray-400 hover:border-gray-400"
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                        <span className="text-xs text-gray-500 ml-2">
                          {anrufVersuche === 0 ? "Noch kein Anrufversuch erfasst." : `${anrufVersuche} Versuch${anrufVersuche > 1 ? "e" : ""} erfasst`}
                        </span>
                      </div>
                    </div>

                    {/* Gesprächsergebnis */}
                    <div>
                      <label className="text-sm font-medium text-gray-300 block mb-2">Gesprächsergebnis</label>
                      <select
                        value={ergebnis}
                        onChange={(e) => setErgebnis(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-green-500"
                      >
                        <option value="">– bitte wählen –</option>
                        {GESPRAECHSERGEBNIS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>

                    {/* Gesprächsnotiz */}
                    <div>
                      <label className="text-sm font-medium text-gray-300 block mb-2">Gesprächsnotiz</label>
                      <textarea
                        value={notiz}
                        onChange={(e) => setNotiz(e.target.value)}
                        rows={4}
                        placeholder="Freitext: Gesprächsverlauf, Kundenreaktion, offene Punkte…"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-green-500 resize-none"
                      />
                    </div>

                    {/* Nächster Schritt */}
                    <div>
                      <label className="text-sm font-medium text-gray-300 block mb-2">Nächster Schritt</label>
                      <select
                        value={naechsterSchritt}
                        onChange={(e) => setNaechsterSchritt(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-green-500"
                      >
                        <option value="">– bitte wählen –</option>
                        {NAECHSTER_SCHRITT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="text-sm font-medium text-gray-300 block mb-2">Fallstatus</label>
                      <div className="flex gap-2">
                        {STATUS_OPTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => setPilotStatus(s)}
                            className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                              pilotStatus === s
                                ? s === "Erledigt" ? "bg-green-500/20 border-green-500 text-green-400"
                                  : s === "Eskaliert" ? "bg-red-500/20 border-red-500 text-red-400"
                                  : "bg-amber-500/20 border-amber-500 text-amber-400"
                                : "border-gray-700 text-gray-400 hover:border-gray-500"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Save buttons */}
                    <div className="flex items-center gap-3 pt-2 border-t border-gray-800">
                      <button
                        onClick={handleKuendigungEinleiten}
                        disabled={saving}
                        className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg text-sm font-semibold hover:bg-white transition disabled:opacity-50"
                      >
                        Kündigung DV einleiten
                      </button>
                      <button
                        onClick={() => handleSave()}
                        disabled={saving}
                        className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-200 rounded-lg text-sm font-medium hover:border-gray-500 transition disabled:opacity-50"
                      >
                        {saving ? "Speichert…" : "Doku speichern"}
                      </button>
                      {saveMsg && (
                        <span className={`text-sm ${saveMsg.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>
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

function SidebarItem({ rec, selected, onSelect }) {
  const f = rec.fields;
  const status = f.DV_PILOT_STATUS || "Offen";
  const consEnd = f.MAKO_CONS_TERMINATION_END_DATE;
  const dateStr = consEnd ? new Date(consEnd).toLocaleDateString("de-DE") : "–";

  return (
    <button
      onClick={() => onSelect(rec)}
      className={`w-full text-left px-3 py-2.5 border-b border-gray-800/50 transition-colors ${
        selected?.id === rec.id ? "bg-green-500/10 border-l-2 border-l-green-500" : "hover:bg-gray-800/50"
      }`}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="text-sm font-medium text-gray-200 truncate">{f.SALESFORCE_CUSTOMER_NAME || "Unbekannt"}</p>
        <Badge status={status} />
      </div>
      <p className="text-xs text-gray-500 mt-0.5">
        {f.SALESFORCE_GLOBAL_CUSTOMER_ID ? `Retail beendet ${dateStr}` : "–"}
      </p>
    </button>
  );
}

function InfoField({ label, value }) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-100">{value || "–"}</p>
    </div>
  );
}

function ContractRow({ label, status, start, elzEnd, terminated, plannedEnd }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-36 text-gray-300 font-medium">{label}</span>
      <Badge status={status} />
      <span className="text-gray-500 text-xs">
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
      className={`px-5 py-3 text-sm font-medium transition-colors ${
        active
          ? "bg-gray-800 text-gray-100 border-b-2 border-green-500"
          : "text-gray-500 hover:text-gray-300"
      }`}
    >
      {children}
    </button>
  );
}

function Leitfaden({ customerName, prodEndDate }) {
  const [open, setOpen] = useState({});
  const toggle = (k) => setOpen((p) => ({ ...p, [k]: !p[k] }));

  const endDate = prodEndDate
    ? new Date(new Date(prodEndDate).getFullYear(), new Date(prodEndDate).getMonth() + 1, 1)
        .toLocaleDateString("de-DE")
    : "[Datum]";

  return (
    <div className="p-5 space-y-4">
      {/* Alert */}
      <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
        <span className="text-amber-400 mt-0.5">⚠</span>
        <p className="text-sm text-amber-300">
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
            „Enpal One+ ist als ein gemeinsames Produkt konzipiert: Der Direktvermarktungsvertrag setzt voraus, dass Sie auch unser Stromkunde sind. Da der Stromliefervertrag nicht mehr aktiv ist, können wir die Direktvermarktung nicht weiterführen. Wir kündigen den Direktvermarktungsvertrag daher zum <strong>{endDate}</strong> ordentlich."
          </ScriptLine>
        </ScriptBlock>

        <div className="mt-3 space-y-1.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Wichtige Infos</p>
          {[
            "Genaues Enddatum nennen (1 Monat Frist, zum nächsten Monatsersten).",
            "Anlage fällt automatisch in EEG-Einspeisevergütung zurück – Kunde muss nichts tun.",
            "Netzbetreiber-Abmeldung übernimmt Enpal – Kunde wird über Abmeldezeitpunkt informiert.",
            "Rückkehr in Enpal One+ ist aktuell nicht möglich.",
          ].map((item, i) => (
            <div key={i} className="flex gap-2 text-sm text-gray-300">
              <span className="text-gray-500 font-mono text-xs mt-0.5">{i + 1}</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Einwand: Versehen */}
      <div className="border border-green-500/20 rounded-lg overflow-hidden">
        <div className="bg-green-500/10 px-4 py-2.5 flex items-center gap-2">
          <span className="text-green-400 text-xs">◇</span>
          <p className="text-sm text-green-300 font-medium">Wenn der Kunde sagt: „Die Kündigung war aus Versehen"</p>
        </div>
        <div className="px-4 py-1 bg-green-500/5">
          <p className="text-xs text-green-400/80 italic py-1.5">Inhaltlich ändert sich nichts – Rückanmeldung ist nicht möglich. Empathisch bleiben, dann sachlich weiterführen.</p>
        </div>
        <div className="px-4 pb-4 pt-2 space-y-2">
          <ScriptLine>„Das tut mir wirklich leid zu hören – ich kann gut verstehen, dass das sehr ärgerlich ist, und ich bedauere, dass wir Ihnen hier nicht mehr helfen können."</ScriptLine>
          <ScriptLine>„Leider ist es uns aktuell technisch nicht möglich, eine bereits umgesetzte Kündigung rückgängig zu machen. Wir arbeiten intensiv daran, das in Zukunft zu ermöglichen – können aber noch keinen Zeitpunkt nennen."</ScriptLine>
        </div>
      </div>

      {/* FAQs */}
      {[
        {
          q: `„Warum kündigen Sie jetzt erst?“`,
          a: `„Sie haben recht – zwischen der Beendigung Ihres Stromliefervertrags und diesem Anruf ist etwas Zeit vergangen. Wir haben das nun systematisch erfasst und gehen proaktiv auf alle betroffenen Kunden zu. Wir entschuldigen uns für die verzögerte Kommunikation.“`
        },
        {
          q: `„Ich möchte den Stromvertrag reaktivieren.“`,
          a: `„Das verstehe ich gut. Leider ist eine Rückanmeldung technisch nicht möglich, sobald ein Vertrag einmal beendet wurde – das gilt für beide Verträge.“`
        },
        {
          q: `„Was passiert mit meiner Enpal-Vergütung?“`,
          a: `„Bis zum Vertragsende erhalten Sie Ihre Enpal-Vergütung anteilig. Danach fällt Ihre Anlage in die staatliche Einspeisevergütung zurück – die Vergütung zahlt dann Ihr Netzbetreiber direkt.“`
        },
        {
          q: `„Kann ich den DV-Vertrag alleine behalten?“`,
          a: `„Nein, leider nicht. Enpal One+ setzt voraus, dass Sie auch unser Stromkunde sind. Ohne aktiven Stromliefervertrag ist die Weiterführung der Direktvermarktung nicht möglich.“`
        },
      ].map((faq) => (
        <div key={faq.q} className="border border-gray-700/50 rounded-lg overflow-hidden">
          <button
            onClick={() => toggle(faq.q)}
            className="w-full text-left px-4 py-3 text-sm font-medium text-gray-200 flex items-center justify-between hover:bg-gray-800/50"
          >
            {faq.q}
            <span className="text-gray-500 text-xs">{open[faq.q] ? "∧" : "∨"}</span>
          </button>
          {open[faq.q] && (
            <div className="px-4 pb-4">
              <ScriptLine>{faq.a}</ScriptLine>
            </div>
          )}
        </div>
      ))}

      {/* Nicht tun */}
      <div>
        <p className="text-sm font-semibold text-gray-300 mb-2">Nicht tun</p>
        <div className="space-y-1.5">
          {[
            "Nicht versprechen, wann Rückanmeldung möglich wird.",
            "Keine Zusagen zur genauen Höhe der Enpal-Vergütung.",
            "Abmeldezeitpunkt der Marktlokation nicht zusagen.",
            "Kein Retention-Angebot machen.",
          ].map((item) => (
            <div key={item} className="flex gap-2 text-sm text-gray-400">
              <span className="text-red-400 mt-0.5">✕</span>
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
    <div className="border border-gray-700/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-2.5 flex items-center gap-2 hover:bg-gray-800/50"
      >
        <span className="text-xs text-gray-500">{open ? "▼" : "▶"}</span>
        <span className="text-sm font-medium text-gray-300">{title}</span>
      </button>
      {open && <div className="px-4 pb-4 pt-1 space-y-3">{children}</div>}
    </div>
  );
}

function ScriptBlock({ label, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">{label}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ScriptLine({ children }) {
  return (
    <p className="text-sm text-gray-300 bg-gray-800/60 border-l-2 border-gray-600 pl-3 py-2 rounded-r" dangerouslySetInnerHTML={{ __html: typeof children === "string" ? children : "" }}>
    </p>
  );
}
