import { useEffect, useState } from "react";

const initialForm = {
  residentName: "",
  address: "Barangay Poblacion, Cajidiocan",
  purok: "",
  wasteType: "Biodegradable",
  weightKg: "",
  collectorName: "",
  collectionDate: new Date().toISOString().slice(0, 10),
  status: "Scheduled",
  notes: "",
};

const STATUSES = ["Scheduled", "Collected", "Missed"];

const API_URL = import.meta.env.VITE_API_URL || "";
async function request(url, options) {
  const response = await fetch(`${API_URL}${url}`, options);
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Settings
  const [barangayProfile, setBarangayProfile] = useState({
    name: "Barangay Poblacion, Cajidiocan",
    contact: "0917-123-4567",
  });
  const [wasteCategories, setWasteCategories] = useState([
    "Biodegradable",
    "Recyclable",
    "Residual",
    "Hazardous",
  ]);
  const [newCategory, setNewCategory] = useState("");
  const [trucks, setTrucks] = useState([
    { id: 1, driver: "Juan Dela Cruz", plate: "ABC-1234" },
    { id: 2, driver: "Pedro Reyes", plate: "XYZ-5678" },
  ]);
  const [newDriver, setNewDriver] = useState("");
  const [newPlate, setNewPlate] = useState("");

  // Help
  const [checklist, setChecklist] = useState([
    { id: 1, purok: "Purok 1 – Centro", done: false },
    { id: 2, purok: "Purok 2 – Riverside", done: false },
    { id: 3, purok: "Purok 3 – Proper", done: false },
    { id: 4, purok: "Purok 4 – Highway", done: false },
  ]);

  // Contact Us
  const emptyReport = {
    reporterName: "",
    purok: "",
    issueType: "Missed Collection",
    details: "",
  };
  const [reportForm, setReportForm] = useState(emptyReport);
  const [submittedReports, setSubmittedReports] = useState([]);

  async function loadData() {
    setLoading(true);
    try {
      const [collectionData, summaryData] = await Promise.all([
        request("/api/collections"),
        request("/api/reports/summary"),
      ]);
      setRecords(collectionData);
      setSummary(summaryData);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(event) {
    Event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await request("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, weightKg: Number(form.weightKg) }),
      });
      setForm({ ...initialForm, address: barangayProfile.name });
      setMessage("Collection record saved.");
      await loadData();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id, status) {
    try {
      await request(`/api/collections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setMessage(`Record marked as ${status}.`);
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deleteRecord(id) {
    if (!window.confirm("Delete this record?")) return;
    try {
      await request(`/api/collections/${id}`, { method: "DELETE" });
      setMessage("Record deleted.");
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function updateForm(field, value) {
    setForm({ ...form, [field]: value });
  }

  function addCategory() {
    const name = newCategory.trim();
    if (!name || wasteCategories.includes(name)) return;
    setWasteCategories([...wasteCategories, name]);
    setNewCategory("");
  }

  function addTruck() {
    if (!newDriver.trim() || !newPlate.trim()) return;
    setTrucks([
      ...trucks,
      { id: Date.now(), driver: newDriver.trim(), plate: newPlate.trim() },
    ]);
    setNewDriver("");
    setNewPlate("");
  }

  function toggleChecklist(id) {
    setChecklist(
      checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c))
    );
  }

  function submitReport(event) {
    event.preventDefault();
    setSubmittedReports([
      { ...reportForm, id: Date.now(), date: new Date().toLocaleString() },
      ...submittedReports,
    ]);
    setReportForm(emptyReport);
    setMessage("Report submitted. Thank you!");
  }

  const statusMap = (summary?.statusSummary || []).reduce((acc, item) => {
    acc[item._id] = item;
    return acc;
  }, {});

  const collectedWeight = statusMap.Collected?.weightKg || 0;
  const scheduledCount = statusMap.Scheduled?.count || 0;
  const missedCount = statusMap.Missed?.count || 0;
  const wasteSummary = summary?.wasteSummary || [];
  const maxWeight = Math.max(...wasteSummary.map((w) => w.weightKg), 1);

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "settings", label: "Settings" },
    { id: "help", label: "Help" },
    { id: "contact", label: "Contact Us" },
  ];

  return (
    <>
      <style>{css}</style>

      <header className="hero">
        <p className="eyebrow">BARANGAY ENVIRONMENT OFFICE</p>
        <h1>Eco-Waste Collection Tracker</h1>
        <p>Record collections and monitor barangay waste reports.</p>
        <nav className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? "tab active" : "tab"}
              onClick={() => {
                setActiveTab(tab.id);
                setMessage("");
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="container">
        {message && <div className="message">{message}</div>}

        {/* ============ DASHBOARD ============ */}
        {activeTab === "dashboard" && (
          <>
            <section className="stats">
              <article>
                <span>Total records</span>
                <strong>{summary?.totalRecords ?? records.length}</strong>
              </article>
              <article>
                <span>Collected weight</span>
                <strong>{collectedWeight.toFixed(2)} kg</strong>
              </article>
              <article>
                <span>Scheduled</span>
                <strong>{scheduledCount}</strong>
              </article>
              <article>
                <span>Missed</span>
                <strong>{missedCount}</strong>
              </article>
            </section>

            <section className="panel">
              <h2>Waste breakdown</h2>
              {wasteSummary.length > 0 ? (
                <div className="bars">
                  {wasteSummary.map((item) => {
                    const percent = Math.round((item.weightKg / maxWeight) * 100);
                    return (
                      <div className="bar-card" key={item._id}>
                        <div className="bar-head">
                          <span>{item._id}</span>
                          <span>{item.weightKg.toFixed(2)} kg</span>
                        </div>
                        <div className="bar-note">
                          {item.count} {item.count === 1 ? "record" : "records"} collected
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="muted">
                  No collected waste records yet. Mark a record as "Collected" to
                  See the breakdown.
                </p>
              )}
            </section>

            <section className="panel">
              <h2>Add collection record</h2>
              <form className="form-grid" onSubmit={handleSubmit}>
                <label>
                  Resident or establishment / Collection point
                  <input
                    required
                    value={form.residentName}
                    onChange={(e) => updateForm("residentName", e.target.value)}
                    placeholder="e.g., Purok 1 Waiting Shed"
                  />
                </label>
                <label>
                  Address
                  <input
                    Required
                    Value={form.address}
                    onChange={(e) => updateForm("address", e.target.value)}
                  />
                </label>
                <label>
                  Purok
                  <select
                    required
                    value={form.purok}
                    onChange={(e) => updateForm("purok", e.target.value)}
                  >
                    <option value="">Select purok</option>
                    {checklist.map((c) => (
                      <option key={c.id} value={c.purok}>
                        {c.purok}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Waste type
                  <select
                    value={form.wasteType}
                    onChange={(e) => updateForm("wasteType", e.target.value)}
                  >
                    {wasteCategories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Weight (kg)
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.weightKg}
                    onChange={(e) => updateForm("weightKg", e.target.value)}
                  />
                </label>
                <label>
                  Collector name
                  <select
                    required
                    value={form.collectorName}
                    onChange={(e) => updateForm("collectorName", e.target.value)}
                  >
                    <option value="">Select driver</option>
                    {trucks.map((t) => (
                      <option key={t.id} value={t.driver}>
                        {t.driver} ({t.plate})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Collection date
                  <input
                    required
                    type="date"
                    value={form.collectionDate}
                    onChange={(e) => updateForm("collectionDate", e.target.value)}
                  />
                </label>
                <label>
                  Status
                  <select
                    value={form.status}
                    onChange={(e)=> updateForm("status", e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label className="full">
                  Notes
                  <textarea
                    rows="2"
                    value={form.notes}
                    onChange={(e) => updateForm("notes", e.target.value)}
                  />
                </label>
                <button className="primary full" type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save record"}
                </button>
              </form>
            </section>

            <section className="panel">
              <h2>Collection records</h2>
              {loading ? (
                <p className="muted">Loading records...</p>
              ) : records.length === 0 ? (
                <p className="muted">No records yet. Add your first collection above.</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Collection point</th>
                        <th>Purok</th>
                        <th>Type</th>
                        <th>kg</th>
                        <th>Collector</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r) => (
                        <tr key={r._id}>
                          <td>{String(r.collectionDate).slice(0, 10)}</td>
                          <td>{r.residentName}</td>
                          <td>{r.purok}</td>
                          <td>{r.wasteType}</td>
                          <td>{Number(r.weightKg).toFixed(2)}</td>
                          <td>{r.collectorName}</td>
                          <td>
                            <select
                              value={r.status}
                              onChange={(e) => updateStatus(r._id, e.target.value)}
                            >
                              {STATUSES.map((s) => (
                                <option key={s}>{s}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="danger"
                              onClick={() => deleteRecord(r._id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {/* ============ SETTINGS ============ */}
        {activeTab === "settings" && (
          <>
            <section className="panel">
              <h2>Barangay profile</h2>
              <div className="form-grid">
                <label>
                  Name
                  <input
                    value={barangayProfile.name}
                    onChange={(e) =>
                      setBarangayProfile({ ...barangayProfile, name: e.target.value })
                    }
                  />
                </label>
                <label>
                  Contact number
                  <input
                    value={barangayProfile.contact}
                    onChange={(e) =>
                      setBarangayProfile({ ...barangayProfile, contact: e.target.value })
                    }
                  />
                </label>
              </div>
            </section>

            <section className="panel">
              <h2>Waste categories</h2>
              <div className="chips">
                {wasteCategories.map((c) => (
                  <span className="chip" key={c}>
                    {c}
                    <button
                      Type="button"
                      onClick={() =>
                        setWasteCategories(wasteCategories.filter((x) => x !== c))
                      }
                    >
                      X
                    </button>
                  </span>
                ))}
              </div>
              <div className="row">
                <input
                  placeholder="New category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
                <button type="button" className="primary" onClick={addCategory}>
                  Add category
                </button>
              </div>
            </section>

            <section className="panel">
              <h2>Trucks and drivers</h2>
              <ul className="list">
                {trucks.map((t) => (
                  <li key={t.id}>
                    <span>
                      {t.driver} – {t.plate}
                    </span>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => setTrucks(trucks.filter((x) => x.id !== t.id))}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <div className="row">
                <input
                  placeholder="Driver name"
                  value={newDriver}
                  onChange={(e) => setNewDriver(e.target.value)}
                />
                <input
                  placeholder="Plate number"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value)}
                />
                <button type="button" className="primary" onClick={addTruck}>
                  Add truck
                </button>
              </div>
            </section>
          </>
        )}

        {/* ============ HELP ============ */}
        {activeTab === "help" && (
          <>
            <section className="panel">
              <h2>Daily collection checklist</h2>
              <ul className="list">
                {checklist.map((item) => (
                  <li key={item.id}>
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => toggleChecklist(item.id)}
                      />
                      <span className={item.done ? "done" : ""}>{item.purok}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <p className="muted">
                {checklist.filter((c) => c.done).length} of {checklist.length} puroks
                Finished today.
              </p>
            </section>

            <section className="panel">
              <h2>How to use this tracker</h2>
              <ol className="steps">
                <li>Open the Dashboard and fill in the "Add collection record" form.</li>
                <li>Set the status to Scheduled, Collected, or Missed.</li>
                <li>Change a status later from the records table.</li>
                <li>Check the waste breakdown to see how many kg were collected.</li>
                <li>Use Contact Us to report a missed pickup or other issue.</li>
              </ol>
            </section>
          </>
        )}

        {/* ============ CONTACT US ============ */}
        {activeTab === "contact" && (
          <>
            <section className="panel">
              <h2>Report an issue</h2>
              <form className="form-grid" onSubmit={submitReport}>
                <label>
                  Your name
                  <input
                    required
                    value={reportForm.reporterName}
                    onChange={(e) =>
                      setReportForm({ ...reportForm, reporterName: e.target.value })
                    }
                  />
                </label>
                <label>
                  Purok
                  <input
                    required
                    value={reportForm.purok}
                    onChange={(e) =>
                      setReportForm({ ...reportForm, purok: e.target.value })
                    }
                  />
                </label>
                <label>
                  Issue type
                  <select
                    value={reportForm.issueType}
                    onChange={(e) =>
                      setReportForm({ ...reportForm, issueType: e.target.value })
                    }
                  >
                    <option>Missed Collection</option>
                    <option>Illegal Dumping</option>
                    <option>Overflowing Bin</option>
                    <option>Other</option>
                  </select>
                </label>
                <label className="full">
                  Details
                  <textarea
                    required
                    rows="3"
                    value={reportForm.details}
                    onChange={(e) =>
                      setReportForm({ ...reportForm, details: e.target.value })
                    }
                  />
                </label>
                <button className="primary full" type="submit">
                  Submit report
                </button>
              </form>
              <p className="muted">
                Or call the barangay office: {barangayProfile.contact}
              </p>
            </section>

            <section className="panel">
              <h2>Submitted reports</h2>
              {submittedReports.length === 0 ? (
                <p className="muted">No reports yet.</p>
              ) : (
                <ul className="list">
                  {submittedReports.map((r) => (
                    <li key={r.id} className="stack">
                      <strong>{r.issueType}</strong>
                      <span>
                        {r.reporterName} – {r.purok} – {r.date}
                      </span>
                      <span>{r.details}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}

const css = `
{ box-sizing: border-box; }
Body { margin: 0; font-family: system-ui, Arial, sans-serif; background: #f1f5f2; color: #1e293b; }
.hero { background: #15803d; color: #fff; padding: 1.5rem 1rem; }
.hero h1 { margin: 0.25rem 0; }
.hero p { margin: 0.25rem 0; }
.eyebrow { font-size: 0.75rem; letter-spacing: 0.08em; opacity: 0.85; }
.tabs { display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap; }
.tab { padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; background: #fff; color: #1e293b; }
.tab.active { background: #14532d; color: #fff; }
.container { max-width: 1100px; margin: 0 auto; padding: 1rem; }
.message { background: #dcfce7; border: 1px solid #86efac; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
.stats article { background: #fff; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0; }
.stats span { display: block; color: #64748b; font-size: 0.85rem; }
.stats strong { font-size: 1.6rem; }
.panel { background: #fff; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 1.5rem; }
.panel h2 { margin-top: 0; }
.bars { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
.bar-card { padding: 1rem; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; }
.bar-head { display: flex; justify-content: space-between; font-weight: 600; }
.bar-note { font-size: 0.85rem; color: #64748b; margin: 0.25rem 0 0.5rem; }
.bar-track { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
.bar-fill { height: 100%; background: #15803d; transition: width 0.3s ease; }
.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
.form-grid label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.9rem; font-weight: 600; }
.full { grid-column: 1 / -1; }
Input, select, textarea { padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; font: inherit; }
Button { font: inherit; }
.primary { background: #15803d; color: #fff; border: none; padding: 0.6rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 600; }
.primary:disabled { opacity: 0.6; cursor: not-allowed; }
.danger { background: #fee2e2; color: #b91c1c; border: none; padding: 0.35rem 0.7rem; border-radius: 6px; cursor: pointer; }
.muted { color: #64748b; }
.table-wrap { overflow-x: auto; }
Table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
Th, td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
.row { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.75rem; }
.row input { flex: 1; min-width: 150px; }
.chips { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.chip { background: #dcfce7; padding: 0.3rem 0.7rem; border-radius: 999px; display: inline-flex; gap: 0.4rem; align-items: center; }
.chip button { border: none; background: none; cursor: pointer; color: #b91c1c; }
.list { list-style: none; padding: 0; margin: 0; }
.list li { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0; border-bottom: 1px solid #e2e8f0; gap: 0.5rem; }
.list li.stack { flex-direction: column; align-items: flex-start; }
.check { display: flex; gap: 0.5rem; align-items: center; }
.done { text-decoration: line-through; color: #64748b; }
.steps { padding-left: 1.25rem; line-height: 1.7; }
`;