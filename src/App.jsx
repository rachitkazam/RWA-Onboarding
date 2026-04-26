import { useState, useEffect, useRef, useCallback } from "react";
import Papa from "papaparse";

// ═══════════════════════════════════════════════════════════
// Replace with your deployed Apps Script URL
const API_URL = "https://script.google.com/a/macros/kazam.in/s/AKfycbx9e0u1LXqJxDTxxwTwNNEkFpXo-PIxkBsSmKYC6KAkOOLXN_-3h8FpU21hwXsRwNuS3w/exec";

// ═══════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════
const T = {
  bg: "#f6f7f9", card: "#ffffff", border: "#e4e7ee", borderLight: "#f0f1f4",
  text: "#111827", sec: "#6b7280", ter: "#9ca3af",
  accent: "#0d9488", accentDark: "#0f766e", accentBg: "#ccfbf1",
  green: "#16a34a", greenBg: "#dcfce7", red: "#dc2626", redBg: "#fef2f2",
  yellow: "#d97706", yellowBg: "#fffbeb", blue: "#2563eb", blueBg: "#eff6ff",
  font: "'Outfit', -apple-system, sans-serif", mono: "'JetBrains Mono', monospace",
};

const CITIES = ["Bengaluru", "Delhi", "Faridabad", "Ghaziabad", "Greater Noida", "Gurgaon", "Hyderabad", "Mumbai", "Noida", "Pune", "Other"];
const STATES = ["Karnataka", "Delhi", "Haryana", "Maharashtra", "Telangana", "Uttar Pradesh", "Other"];
const DUTY_OPTIONS = ["Inclusive", "Exclusive"];

// ═══════════════════════════════════════════════════════════
// DATA LAYER — Read from CSV, Write to Apps Script
// ═══════════════════════════════════════════════════════════
const MASTER_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS8DOTWVjesipRMah7trHQ2DTYjVUAW1wHBAAh5wvZMbHcQvROjpPKhZ7fmPkXxEDPP1QTgSZA0fBvj/pub?gid=179090357&single=true&output=csv";

function parseCSV(text) {
  return new Promise((resolve) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().replace(/^\uFEFF/, ''),
      complete: (r) => resolve(r.data),
    });
  });
}

async function loadSocieties() {
  const res = await fetch(MASTER_CSV);
  const text = await res.text();
  const rows = await parseCSV(text);
  return rows
    .filter(r => r.society_id && r.society_name)
    .map(r => ({
      id: (r.society_id || "").trim(),
      name: (r.society_name || "").trim(),
      city: (r.city || "").trim(),
      status: (r.status || "Active").trim(),
    }));
}

async function loadSocietyById(societyId) {
  const res = await fetch(MASTER_CSV);
  const text = await res.text();
  const rows = await parseCSV(text);
  return rows.find(r => (r.society_id || "").trim() === societyId) || null;
}

async function apiPost(data) {
  try {
    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch (e) {
    // Expected — no-cors can't read response, but POST still goes through
  }
  await new Promise(r => setTimeout(r, 2500));
  return { success: true };
}

// ═══════════════════════════════════════════════════════════
// FORM COMPONENTS
// ═══════════════════════════════════════════════════════════
const Field = ({ label, required, error, children, hint }) => (
  <div style={{ marginBottom: 20 }}>
    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 5 }}>
      {label} {required && <span style={{ color: T.red }}>*</span>}
    </label>
    {children}
    {hint && <div style={{ fontSize: 11.5, color: T.ter, marginTop: 4 }}>{hint}</div>}
    {error && <div style={{ fontSize: 12, color: T.red, marginTop: 4, fontWeight: 500 }}>{error}</div>}
  </div>
);

const inputStyle = (error) => ({
  width: "100%", padding: "11px 14px", border: `1.5px solid ${error ? T.red : T.border}`,
  borderRadius: 8, fontSize: 14, fontFamily: T.font, outline: "none", boxSizing: "border-box",
});

const selectStyle = {
  width: "100%", padding: "11px 14px", border: `1.5px solid ${T.border}`,
  borderRadius: 8, fontSize: 14, fontFamily: T.font, outline: "none", boxSizing: "border-box",
  background: "#fff", cursor: "pointer",
};

const Input = ({ value, onChange, placeholder, type, error, style: s, disabled }) => (
  <input type={type || "text"} value={value || ""} onChange={e => onChange(e.target.value)}
    placeholder={placeholder} disabled={disabled}
    style={{ ...inputStyle(error), ...s, ...(disabled ? { background: "#f3f4f6", color: T.sec } : {}) }}
    onFocus={e => { if (!disabled) e.target.style.borderColor = T.accent; }}
    onBlur={e => e.target.style.borderColor = error ? T.red : T.border} />
);

const Select = ({ value, onChange, options, placeholder }) => (
  <select value={value || ""} onChange={e => onChange(e.target.value)} style={selectStyle}>
    {placeholder && <option value="">{placeholder}</option>}
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

const Btn = ({ onClick, children, variant, disabled, style: s }) => {
  const styles = {
    primary: { background: T.accent, color: "#fff" },
    dark: { background: T.text, color: "#fff" },
    outline: { background: "none", border: `1.5px solid ${T.border}`, color: T.sec },
    green: { background: T.green, color: "#fff" },
    danger: { background: T.red, color: "#fff" },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: "11px 24px", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600,
        cursor: disabled ? "wait" : "pointer", fontFamily: T.font, ...styles[variant || "primary"],
        opacity: disabled ? 0.6 : 1, ...s }}>
      {children}
    </button>
  );
};

// ═══════════════════════════════════════════════════════════
// FILE UPLOAD
// ═══════════════════════════════════════════════════════════
const FileUpload = ({ file, onChange, label, existingUrl }) => {
  const ref = useRef();
  const [dragging, setDragging] = useState(false);
  const handleFile = (f) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => onChange({ name: f.name, size: f.size, data: reader.result });
    reader.readAsDataURL(f);
  };
  const hasExisting = existingUrl && existingUrl !== "" && existingUrl !== "nan" && existingUrl.includes("http");

  return (
    <div>
      <div onClick={() => ref.current.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        style={{
          border: `2px dashed ${file ? T.accent : dragging ? T.accent : T.border}`,
          borderRadius: 10, padding: file ? "12px 16px" : "24px 16px", textAlign: "center",
          cursor: "pointer", background: file ? T.accentBg : "transparent",
        }}>
        <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png" hidden onChange={e => handleFile(e.target.files[0])} />
        {file ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{file.name}</span>
              <span style={{ fontSize: 11, color: T.sec }}>({(file.size / 1024).toFixed(0)} KB)</span>
            </div>
            <button onClick={e => { e.stopPropagation(); onChange(null); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: T.red, fontSize: 16, fontWeight: 700 }}>×</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13, color: T.sec }}>{label || "Click or drag to upload"}</div>
            <div style={{ fontSize: 11, color: T.ter, marginTop: 2 }}>PDF, JPG, PNG (max 10 MB)</div>
          </>
        )}
      </div>
      {!file && hasExisting && (
        <div style={{ fontSize: 12, color: T.green, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
          ✓ Existing file on Drive — <a href={existingUrl} target="_blank" rel="noopener noreferrer" style={{ color: T.accent }}>view</a>
          <span style={{ color: T.ter, marginLeft: 4 }}>Upload new to replace</span>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// CPO SELECT WITH "ADD NEW" OPTION
// ═══════════════════════════════════════════════════════════
function CPOSelect({ value, onChange, cpos, onAddCPO }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await onAddCPO(newName.trim());
    onChange(newName.trim());
    setNewName("");
    setAdding(false);
  };

  if (adding) {
    return (
      <div style={{ display: "flex", gap: 6 }}>
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="New CPO name"
          onKeyDown={e => e.key === "Enter" && handleAdd()}
          style={{ ...inputStyle(), flex: 1, padding: "8px 12px" }} autoFocus />
        <Btn onClick={handleAdd} variant="primary" style={{ padding: "8px 14px", fontSize: 12 }}>Add</Btn>
        <Btn onClick={() => setAdding(false)} variant="outline" style={{ padding: "8px 14px", fontSize: 12 }}>Cancel</Btn>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 6 }}>
      <select value={value || ""} onChange={e => onChange(e.target.value)}
        style={{ ...selectStyle, flex: 1, padding: "8px 12px" }}>
        <option value="">None</option>
        {cpos.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <button onClick={() => setAdding(true)}
        style={{ background: T.accentBg, color: T.accent, border: "none", borderRadius: 6,
          padding: "8px 12px", fontSize: 18, cursor: "pointer", fontWeight: 700, lineHeight: 1 }}
        title="Add new CPO">+</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MODE SELECTOR — NEW vs EDIT
// ═══════════════════════════════════════════════════════════
function ModeSelector({ onNew, onEdit, societies, loading }) {
  const [search, setSearch] = useState("");
  const filtered = societies.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.id.toLowerCase().includes(search.toLowerCase()) ||
    s.city.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 12);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ display: "flex", gap: 14, marginBottom: 32 }}>
        <div onClick={onNew} style={{
          flex: 1, background: T.card, border: `2px solid ${T.border}`, borderRadius: 14,
          padding: "28px 24px", cursor: "pointer", transition: "all 0.15s", textAlign: "center",
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>➕</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>New Society</h3>
          <p style={{ fontSize: 13, color: T.sec, margin: 0 }}>Onboard a new RWA</p>
        </div>
        <div style={{
          flex: 1, background: T.card, border: `2px solid ${T.accent}`, borderRadius: 14,
          padding: "28px 24px", textAlign: "center",
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✏️</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>Edit Existing</h3>
          <p style={{ fontSize: 13, color: T.sec, margin: 0 }}>Update details, upload docs</p>
        </div>
      </div>

      {/* Search for edit */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "24px 28px" }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Search society to edit</h3>
        <Input value={search} onChange={setSearch} placeholder="Type society name, ID, or city..." />
        {loading && <p style={{ color: T.sec, fontSize: 13, marginTop: 12 }}>Loading societies...</p>}
        {search.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {filtered.length === 0 && <p style={{ color: T.sec, fontSize: 13 }}>No results found.</p>}
            {filtered.map(s => (
              <div key={s.id} onClick={() => onEdit(s.id)}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 14px", borderRadius: 8, cursor: "pointer", marginBottom: 4,
                  border: `1px solid ${T.borderLight}`, transition: "background 0.1s",
                }}
                onMouseOver={e => e.currentTarget.style.background = T.accentBg}
                onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: T.sec }}>{s.id} · {s.city}</div>
                </div>
                <span style={{ fontSize: 12, color: T.accent, fontWeight: 600 }}>Edit →</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// FORM STEPS
// ═══════════════════════════════════════════════════════════
function Step1({ form, set, errors, editMode }) {
  return (
    <>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Society Details</h2>
      <p style={{ fontSize: 13, color: T.sec, margin: "0 0 24px" }}>Basic information about the RWA</p>
      {editMode && (
        <Field label="Society ID">
          <Input value={form.society_id} disabled />
        </Field>
      )}
      <Field label="Society / Station Name" required error={errors.society_name}>
        <Input value={form.society_name} onChange={v => set("society_name", v)} placeholder="e.g. Adarsh Rhythm" error={errors.society_name} />
      </Field>
      <div style={{ display: "flex", gap: 14 }}>
        <Field label="City" required error={errors.city}>
          <Select value={form.city} onChange={v => set("city", v)} options={CITIES} placeholder="Select city" />
        </Field>
        <Field label="State" required error={errors.state}>
          <Select value={form.state} onChange={v => set("state", v)} options={STATES} placeholder="Select state" />
        </Field>
      </div>
      <Field label="Full Address">
        <textarea value={form.address || ""} onChange={e => set("address", e.target.value)} placeholder="Building name, street, locality..."
          style={{ ...inputStyle(), height: 70, resize: "vertical" }} />
      </Field>
      <div style={{ display: "flex", gap: 14 }}>
        <Field label="Pincode">
          <Input value={form.pincode} onChange={v => set("pincode", v)} placeholder="560001" />
        </Field>
        <Field label="Google Maps Link">
          <Input value={form.google_maps_link} onChange={v => set("google_maps_link", v)} placeholder="https://maps.app.goo.gl/..." />
        </Field>
      </div>
    </>
  );
}

function Step2({ form, set, errors, cpos, onAddCPO }) {
  return (
    <>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Charger & Tariff Details</h2>
      <p style={{ fontSize: 13, color: T.sec, margin: "0 0 24px" }}>Infrastructure and agreed rates</p>
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: 12, color: T.sec }}>Type</th>
              <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: 12, color: T.sec }}>Count</th>
              <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: 12, color: T.sec }}>CPO</th>
              <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: 12, color: T.sec }}>Society Fee (₹/kWh)</th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: "3.3 kW", ck: "chargers_3_3kw", cpk: "cpo_3_3kw", fk: "society_fee_3_3kw" },
              { label: "7.4 kW", ck: "chargers_7_4kw", cpk: "cpo_7_4kw", fk: "society_fee_7_4kw" },
              { label: "11 kW", ck: "chargers_11kw", cpk: "cpo_11kw", fk: "society_fee_11kw" },
            ].map(r => (
              <tr key={r.label} style={{ borderTop: `1px solid ${T.border}` }}>
                <td style={{ padding: "10px 12px", fontWeight: 600 }}>{r.label}</td>
                <td style={{ padding: "6px 8px" }}>
                  <input type="number" min="0" value={form[r.ck] || ""} onChange={e => set(r.ck, e.target.value)}
                    placeholder="0" style={{ ...inputStyle(), width: 60, padding: "8px" }} />
                </td>
                <td style={{ padding: "6px 8px" }}>
                  <CPOSelect value={form[r.cpk]} onChange={v => set(r.cpk, v)} cpos={cpos} onAddCPO={onAddCPO} />
                </td>
                <td style={{ padding: "6px 8px" }}>
                  <input type="number" min="0" step="0.5" value={form[r.fk] || ""} onChange={e => set(r.fk, e.target.value)}
                    placeholder="0" style={{ ...inputStyle(), width: 70, padding: "8px" }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", gap: 14 }}>
        <Field label="Agreement Date" required error={errors.agreement_date}>
          <Input type="date" value={form.agreement_date} onChange={v => set("agreement_date", v)} error={errors.agreement_date} />
        </Field>
        <Field label="Agreement Tenure" hint='"3 years" or date range'>
          <Input value={form.agreement_tenure} onChange={v => set("agreement_tenure", v)} placeholder="3 years" />
        </Field>
      </div>
      <div style={{ display: "flex", gap: 14 }}>
        <Field label="Electricity Rate (₹/kWh)" required error={errors.electricity_rate}>
          <Input type="number" value={form.electricity_rate} onChange={v => set("electricity_rate", v)} placeholder="6.50" error={errors.electricity_rate} />
        </Field>
        <Field label="Electricity Duty" required>
          <Select value={form.electricity_duty} onChange={v => set("electricity_duty", v)} options={DUTY_OPTIONS} />
        </Field>
      </div>
      <Field label="Finalized Rate (₹/kWh)" required error={errors.finalized_rate}>
        <Input type="number" value={form.finalized_rate} onChange={v => set("finalized_rate", v)} placeholder="6.92" error={errors.finalized_rate} />
      </Field>
    </>
  );
}

function Step3({ form, set, errors }) {
  return (
    <>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Bank Details</h2>
      <p style={{ fontSize: 13, color: T.sec, margin: "0 0 24px" }}>Reimbursement account details</p>
      <Field label="Account Holder Name" required error={errors.ac_holder}>
        <Input value={form.ac_holder} onChange={v => set("ac_holder", v)} placeholder="Society Association Name" error={errors.ac_holder} />
      </Field>
      <Field label="Bank Name" required error={errors.bank_name}>
        <Input value={form.bank_name} onChange={v => set("bank_name", v)} placeholder="HDFC Bank" error={errors.bank_name} />
      </Field>
      <div style={{ display: "flex", gap: 14 }}>
        <Field label="IFSC Code" required error={errors.ifsc}>
          <Input value={form.ifsc} onChange={v => set("ifsc", v.toUpperCase())} placeholder="HDFC0004053" error={errors.ifsc}
            style={{ fontFamily: T.mono, letterSpacing: 1 }} />
        </Field>
        <Field label="Account Number" required error={errors.ac_number}>
          <Input value={form.ac_number} onChange={v => set("ac_number", v)} placeholder="50200020414270" error={errors.ac_number}
            style={{ fontFamily: T.mono, letterSpacing: 1 }} />
        </Field>
      </div>
    </>
  );
}

function Step4({ form, set }) {
  return (
    <>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Upload Documents</h2>
      <p style={{ fontSize: 13, color: T.sec, margin: "0 0 24px" }}>Saved to Kazam's Google Drive</p>
      <Field label="Signed Agreement">
        <FileUpload file={form.agreement_file} onChange={f => set("agreement_file", f)}
          label="Upload signed agreement" existingUrl={form.agreement_link} />
      </Field>
      <Field label="Sample Electricity Bill">
        <FileUpload file={form.electricity_bill_file} onChange={f => set("electricity_bill_file", f)}
          label="Upload electricity bill" existingUrl={form.electricity_bill_link} />
      </Field>
    </>
  );
}

function Step5({ form, set, errors }) {
  return (
    <>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Contact Details</h2>
      <p style={{ fontSize: 13, color: T.sec, margin: "0 0 24px" }}>RWA point of contact and dashboard logins</p>
      <div style={{ display: "flex", gap: 14 }}>
        <Field label="POC Name" required error={errors.poc_name}>
          <Input value={form.poc_name} onChange={v => set("poc_name", v)} placeholder="Manjunath K" error={errors.poc_name} />
        </Field>
        <Field label="POC Phone" required error={errors.poc_phone}>
          <Input value={form.poc_phone} onChange={v => set("poc_phone", v)} placeholder="9876543210" error={errors.poc_phone} />
        </Field>
      </div>
      <Field label="RWA Email(s) for Dashboard Login" required error={errors.rwa_emails}
        hint="Comma-separated if multiple. Each gets login access.">
        <textarea value={form.rwa_emails || ""} onChange={e => set("rwa_emails", e.target.value)}
          placeholder="secretary@society.com, treasurer@society.com"
          style={{ ...inputStyle(errors.rwa_emails), height: 60, resize: "vertical" }} />
      </Field>
    </>
  );
}

function StepReview({ form, editMode }) {
  const S = ({ title, rows }) => (
    <div style={{ marginBottom: 18 }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: T.accent, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.8 }}>{title}</h3>
      {rows.filter(([, v]) => v && v !== "—" && v !== "0" && v !== "").map(([k, v], i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.borderLight}`, fontSize: 13 }}>
          <span style={{ color: T.sec }}>{k}</span>
          <span style={{ fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{v}</span>
        </div>
      ))}
    </div>
  );
  return (
    <>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Review & {editMode ? "Update" : "Submit"}</h2>
      <p style={{ fontSize: 13, color: T.sec, margin: "0 0 24px" }}>Verify all details</p>
      {editMode && (
        <div style={{ background: T.blueBg, border: `1px solid ${T.blue}33`, borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: T.blue }}>
          ✏️ Editing <strong>{form.society_id}</strong> — only changed fields will be updated
        </div>
      )}
      <S title="Society" rows={[
        ["Name", form.society_name], ["City", form.city], ["State", form.state],
        ["Address", form.address], ["Pincode", form.pincode],
        ["Maps", form.google_maps_link ? "✓ Provided" : ""],
      ]} />
      <S title="Chargers" rows={[
        ...(parseInt(form.chargers_3_3kw) > 0 ? [["3.3 kW", `${form.chargers_3_3kw}× — CPO: ${form.cpo_3_3kw || "—"} — Fee: ₹${form.society_fee_3_3kw || 0}`]] : []),
        ...(parseInt(form.chargers_7_4kw) > 0 ? [["7.4 kW", `${form.chargers_7_4kw}× — CPO: ${form.cpo_7_4kw || "—"} — Fee: ₹${form.society_fee_7_4kw || 0}`]] : []),
        ...(parseInt(form.chargers_11kw) > 0 ? [["11 kW", `${form.chargers_11kw}× — CPO: ${form.cpo_11kw || "—"} — Fee: ₹${form.society_fee_11kw || 0}`]] : []),
        ["Agreement", form.agreement_date], ["Tenure", form.agreement_tenure],
        ["Rate", `₹${form.electricity_rate}/kWh (${form.electricity_duty})`],
        ["Finalized", `₹${form.finalized_rate}/kWh`],
      ]} />
      <S title="Bank" rows={[
        ["Holder", form.ac_holder], ["Bank", form.bank_name],
        ["IFSC", form.ifsc], ["A/C", form.ac_number],
      ]} />
      <S title="Documents" rows={[
        ["Agreement", form.agreement_file ? `✓ New: ${form.agreement_file.name}` : (form.agreement_link ? "✓ On Drive" : "Not uploaded")],
        ["Elec. Bill", form.electricity_bill_file ? `✓ New: ${form.electricity_bill_file.name}` : (form.electricity_bill_link ? "✓ On Drive" : "Not uploaded")],
      ]} />
      <S title="Contact" rows={[
        ["POC", `${form.poc_name} (${form.poc_phone})`],
        ["Emails", form.rwa_emails],
      ]} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════
function validateStep(step, form) {
  const e = {};
  if (step === 0) {
    if (!(form.society_name || "").trim()) e.society_name = "Required";
    if (!form.city) e.city = "Required";
    if (!form.state) e.state = "Required";
  } else if (step === 1) {
    if (!form.agreement_date) e.agreement_date = "Required";
    if (!form.electricity_rate || parseFloat(form.electricity_rate) <= 0) e.electricity_rate = "Enter a valid rate";
    if (!form.finalized_rate || parseFloat(form.finalized_rate) <= 0) e.finalized_rate = "Required";
  } else if (step === 2) {
    if (!(form.ac_holder || "").trim()) e.ac_holder = "Required";
    if (!(form.bank_name || "").trim()) e.bank_name = "Required";
    if (!(form.ifsc || "").trim()) e.ifsc = "Required";
    else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifsc)) e.ifsc = "Invalid format";
    if (!(form.ac_number || "").trim()) e.ac_number = "Required";
  } else if (step === 4) {
    if (!(form.poc_name || "").trim()) e.poc_name = "Required";
    if (!(form.poc_phone || "").trim()) e.poc_phone = "Required";
    else if (!/^\d{10}$/.test((form.poc_phone || "").trim())) e.poc_phone = "Enter 10-digit number";
    if (!(form.rwa_emails || "").trim()) e.rwa_emails = "At least one email required";
  }
  return e;
}

// ═══════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════
const STEPS = ["Society", "Tariff", "Bank", "Docs", "Contact", "Review"];

const emptyForm = {
  society_name: "", city: "", state: "", address: "", pincode: "", google_maps_link: "",
  chargers_3_3kw: "0", cpo_3_3kw: "", society_fee_3_3kw: "0",
  chargers_7_4kw: "0", cpo_7_4kw: "", society_fee_7_4kw: "0",
  chargers_11kw: "0", cpo_11kw: "", society_fee_11kw: "0",
  agreement_date: "", agreement_tenure: "",
  electricity_rate: "", electricity_duty: "Inclusive", finalized_rate: "",
  ac_holder: "", bank_name: "", ifsc: "", ac_number: "",
  agreement_file: null, electricity_bill_file: null,
  agreement_link: "", electricity_bill_link: "",
  poc_name: "", poc_phone: "", rwa_emails: "",
};

export default function App() {
  const [mode, setMode] = useState(null); // null=selector, "new", "edit"
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ ...emptyForm });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [societies, setSocieties] = useState([]);
  const [cpos, setCpos] = useState(["Vida", "Kazam"]);
  const [loading, setLoading] = useState(true);
  const [editLoading, setEditLoading] = useState(false);

  // Load societies on mount — directly from published CSV
  useEffect(() => {
    loadSocieties()
      .then(socs => {
        setSocieties(socs);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load societies:", err);
        setLoading(false);
      });
  }, []);

  const set = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const handleAddCPO = async (name) => {
    const res = await apiPost({ action: "addCPO", cpo_name: name });
    setCpos(prev => [...prev, name]);
  };

  const handleNew = () => {
    setForm({ ...emptyForm });
    setMode("new");
    setStep(0);
  };

  const handleEdit = async (societyId) => {
    setEditLoading(true);
    try {
      const s = await loadSocietyById(societyId);
      if (s) {
        const mapped = { ...emptyForm };
        Object.keys(mapped).forEach(k => {
          if (s[k] !== undefined && s[k] !== null) {
            const val = String(s[k]);
            if (val !== "nan" && val !== "undefined") mapped[k] = val;
          }
        });
        mapped.society_id = societyId;
        mapped.rwa_emails = s.rwa_email || "";
        mapped.agreement_file = null;
        mapped.electricity_bill_file = null;
        mapped.agreement_link = s.agreement_link || "";
        mapped.electricity_bill_link = s.electricity_bill_link || "";
        setForm(mapped);
        setMode("edit");
        setStep(0);
      } else {
        alert("Society not found. Try again.");
      }
    } catch (e) {
      alert("Failed to load society data.");
    }
    setEditLoading(false);
  };

  const next = () => {
    const errs = validateStep(step, form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStep(s => s + 1);
  };

  const prev = () => { setErrors({}); setStep(s => s - 1); };

  const submit = async () => {
    setSubmitting(true);
    try {
      const payload = { ...form, action: mode === "edit" ? "update" : "submit" };
      if (form.agreement_file) payload.agreement_file = form.agreement_file.data;
      else delete payload.agreement_file;
      if (form.electricity_bill_file) payload.electricity_bill_file = form.electricity_bill_file.data;
      else delete payload.electricity_bill_file;
      if (!payload.rwa_email) payload.rwa_email = (form.rwa_emails || "").split(",")[0].trim();

      await apiPost(payload);
      setResult({ success: true, societyName: form.society_name, mode });
    } catch (err) {
      setResult({ success: false, error: err.message });
    }
    setSubmitting(false);
  };

  const reset = () => {
    setResult(null); setForm({ ...emptyForm }); setStep(0); setMode(null);
    // Refresh society list
    loadSocieties().then(socs => setSocieties(socs)).catch(() => {});
  };

  // ---- RESULT SCREEN ----
  if (result) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg, fontFamily: T.font }}>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <div style={{ background: T.card, borderRadius: 16, padding: "48px 40px", maxWidth: 460, textAlign: "center", border: `1px solid ${T.border}` }}>
          {result.success ? (
            <>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.greenBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>
                {result.mode === "edit" ? "Society Updated!" : "Society Onboarded!"}
              </h2>
              <p style={{ fontSize: 14, color: T.sec, margin: "0 0 24px", lineHeight: 1.6 }}>
                <strong>{result.societyName}</strong> has been {result.mode === "edit" ? "updated" : "added to the dashboard"}.
              </p>
              <Btn onClick={reset} variant="primary">Done</Btn>
            </>
          ) : (
            <>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.redBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={T.red} strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>Something went wrong</h2>
              <p style={{ fontSize: 14, color: T.sec, margin: "0 0 24px" }}>{result.error || "Please try again."}</p>
              <Btn onClick={() => setResult(null)} variant="dark">Try Again</Btn>
            </>
          )}
        </div>
      </div>
    );
  }

  // ---- HEADER ----
  const Header = () => (
    <div style={{ background: "#fff", borderBottom: `1.5px solid ${T.border}`, padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <span style={{ fontSize: 18, fontWeight: 800, color: T.text }}>Kazam</span>
        <span style={{ fontSize: 13, color: T.sec, marginLeft: 4 }}>
          {mode === "edit" ? "Edit Society" : mode === "new" ? "New Society" : "Society Onboarding"}
        </span>
      </div>
      {mode && (
        <Btn onClick={reset} variant="outline" style={{ padding: "6px 16px", fontSize: 12 }}>← Back</Btn>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.font, color: T.text }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <Header />

      {editLoading && (
        <div style={{ textAlign: "center", padding: 60, color: T.sec }}>Loading society data...</div>
      )}

      {/* MODE SELECTOR */}
      {!mode && !editLoading && (
        <ModeSelector onNew={handleNew} onEdit={handleEdit} societies={societies} loading={loading} />
      )}

      {/* FORM */}
      {mode && !editLoading && (
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px 60px" }}>
          {/* Progress */}
          <div style={{ display: "flex", gap: 4, marginBottom: 32 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ height: 4, borderRadius: 2, marginBottom: 6,
                  background: i <= step ? T.accent : T.border, opacity: i <= step ? 1 : 0.4 }} />
                <span style={{ fontSize: 11, fontWeight: i === step ? 700 : 500, color: i <= step ? T.accent : T.ter }}>{s}</span>
              </div>
            ))}
          </div>

          {/* Edit mode banner */}
          {mode === "edit" && step === 0 && (
            <div style={{ background: T.blueBg, border: `1px solid ${T.blue}33`, borderRadius: 10, padding: "12px 18px", marginBottom: 16, fontSize: 13, color: T.blue }}>
              ✏️ Editing <strong>{form.society_id} — {form.society_name}</strong>. Change any fields and submit to update.
            </div>
          )}

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "28px 32px" }}>
            {step === 0 && <Step1 form={form} set={set} errors={errors} editMode={mode === "edit"} />}
            {step === 1 && <Step2 form={form} set={set} errors={errors} cpos={cpos} onAddCPO={handleAddCPO} />}
            {step === 2 && <Step3 form={form} set={set} errors={errors} />}
            {step === 3 && <Step4 form={form} set={set} />}
            {step === 4 && <Step5 form={form} set={set} errors={errors} />}
            {step === 5 && <StepReview form={form} editMode={mode === "edit"} />}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28, paddingTop: 20, borderTop: `1px solid ${T.borderLight}` }}>
              {step > 0 ? <Btn onClick={prev} variant="outline">← Back</Btn> : <div />}
              {step < 5 ? (
                <Btn onClick={next}>Next →</Btn>
              ) : (
                <Btn onClick={submit} disabled={submitting} variant="green">
                  {submitting ? "Submitting..." : mode === "edit" ? "✓ Update Society" : "✓ Submit & Onboard"}
                </Btn>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
