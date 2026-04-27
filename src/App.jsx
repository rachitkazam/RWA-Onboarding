import { useState, useEffect, useRef, useCallback } from "react";
import Papa from "papaparse";

// Replace with your deployed Apps Script URL
const API_URL = "https://script.google.com/a/macros/kazam.in/s/AKfycbx9e0u1LXqJxDTxxwTwNNEkFpXo-PIxkBsSmKYC6KAkOOLXN_-3h8FpU21hwXsRwNuS3w/exec";

// Google OAuth — restricted to @kazam.in
const GOOGLE_CLIENT_ID = "450055929584-1kdid7qospqa3u2f7ceg3nv9sh1udeoa.apps.googleusercontent.com";
const ALLOWED_DOMAIN = "kazam.in";

// Published CSV URL for loading full society details during edit
const MASTER_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS8DOTWVjesipRMah7trHQ2DTYjVUAW1wHBAAh5wvZMbHcQvROjpPKhZ7fmPkXxEDPP1QTgSZA0fBvj/pub?gid=179090357&single=true&output=csv";

// Embedded society list — search works instantly, no API call needed
// To refresh: export Society_Master as CSV, run the Python script, paste updated JSON
const EMBEDDED_SOCIETIES = [{"id": "KZ-RWA-001", "name": "ADARSH RHYTHM", "city": "Bengaluru"}, {"id": "KZ-RWA-002", "name": "Aditi Eloquent Apt", "city": "Bengaluru"}, {"id": "KZ-RWA-003", "name": "Alpine Pyramiad", "city": "Bengaluru"}, {"id": "KZ-RWA-004", "name": "Arcadia Apartment", "city": "Bengaluru"}, {"id": "KZ-RWA-005", "name": "BDA Jnanabharathi Residential Enclave", "city": "Bengaluru"}, {"id": "KZ-RWA-006", "name": "BDA Sahyadri Apt", "city": "Bengaluru"}, {"id": "KZ-RWA-007", "name": "Bosch EC3 (360 Business Park)", "city": "Bengaluru"}, {"id": "KZ-RWA-008", "name": "Chandragiri BDA", "city": "Bengaluru"}, {"id": "KZ-RWA-009", "name": "Concorde Spring Meadows", "city": "Bengaluru"}, {"id": "KZ-RWA-010", "name": "Confident Aquila", "city": "Bengaluru"}, {"id": "KZ-RWA-011", "name": "Definer kingdom Apartment HMCL", "city": "Bengaluru"}, {"id": "KZ-RWA-012", "name": "Disha Courtyard", "city": "Bengaluru"}, {"id": "KZ-RWA-013", "name": "DS MAX SAANJH", "city": "Bengaluru"}, {"id": "KZ-RWA-014", "name": "DSR Sunshine", "city": "Bengaluru"}, {"id": "KZ-RWA-015", "name": "GK jewel city", "city": "Bengaluru"}, {"id": "KZ-RWA-016", "name": "Global Edifice Celesta", "city": "Bengaluru"}, {"id": "KZ-RWA-017", "name": "Godrej Royale Wood", "city": "Bengaluru"}, {"id": "KZ-RWA-018", "name": "Golden Abode Apt", "city": "Bengaluru"}, {"id": "KZ-RWA-019", "name": "Golden Palms Apartment", "city": "Bengaluru"}, {"id": "KZ-RWA-020", "name": "Gomati Iris Apartment", "city": "Bengaluru"}, {"id": "KZ-RWA-021", "name": "Gowri Apartment", "city": "Bengaluru"}, {"id": "KZ-RWA-022", "name": "Hilife Rio", "city": "Bengaluru"}, {"id": "KZ-RWA-023", "name": "Jains Aashraya Apt", "city": "Bengaluru"}, {"id": "KZ-RWA-024", "name": "JRK Gardens", "city": "Bengaluru"}, {"id": "KZ-RWA-025", "name": "JW marriot", "city": "Bengaluru"}, {"id": "KZ-RWA-026", "name": "KHB Platinum Apt", "city": "Bengaluru"}, {"id": "KZ-RWA-027", "name": "MAHAVEER CHALET", "city": "Bengaluru"}, {"id": "KZ-RWA-028", "name": "Mahaveer Lakes", "city": "Bengaluru"}, {"id": "KZ-RWA-029", "name": "Mahaveer Rhyolite", "city": "Bengaluru"}, {"id": "KZ-RWA-030", "name": "Mahaveer Varna", "city": "Bengaluru"}, {"id": "KZ-RWA-031", "name": "Meda Green", "city": "Bengaluru"}, {"id": "KZ-RWA-032", "name": "NITESH FOREST HILLS", "city": "Bengaluru"}, {"id": "KZ-RWA-033", "name": "Pariwar Pragathi", "city": "Bengaluru"}, {"id": "KZ-RWA-034", "name": "Pioneer Sun Blossom", "city": "Bengaluru"}, {"id": "KZ-RWA-035", "name": "Pionier Lakedew residency HMCL", "city": "Bengaluru"}, {"id": "KZ-RWA-036", "name": "Prestige Notting Hills", "city": "Bengaluru"}, {"id": "KZ-RWA-037", "name": "Purva Atria Platina", "city": "Bengaluru"}, {"id": "KZ-RWA-038", "name": "Purva Heights", "city": "Bengaluru"}, {"id": "KZ-RWA-039", "name": "Radiant Silver Bell", "city": "Bengaluru"}, {"id": "KZ-RWA-040", "name": "RS Sanchike", "city": "Bengaluru"}, {"id": "KZ-RWA-041", "name": "Sai Krupa Elite", "city": "Bengaluru"}, {"id": "KZ-RWA-042", "name": "Sai Nanadana Apartment", "city": "Bengaluru"}, {"id": "KZ-RWA-043", "name": "Saiven Siesta", "city": "Bengaluru"}, {"id": "KZ-RWA-044", "name": "Sattva East Apartment", "city": "Bengaluru"}, {"id": "KZ-RWA-045", "name": "Shrishti Enclave", "city": "Bengaluru"}, {"id": "KZ-RWA-046", "name": "SNR Verity", "city": "Bengaluru"}, {"id": "KZ-RWA-047", "name": "SRI TIRUMALA SYMPHONY", "city": "Bengaluru"}, {"id": "KZ-RWA-048", "name": "The Orchard Apartment", "city": "Bengaluru"}, {"id": "KZ-RWA-049", "name": "Trendsquares Ortus", "city": "Bengaluru"}, {"id": "KZ-RWA-050", "name": "Vistara Classic Apt", "city": "Bengaluru"}, {"id": "KZ-RWA-051", "name": "VMAKS Chalet", "city": "Bengaluru"}, {"id": "KZ-RWA-052", "name": "Wework Kazam", "city": "Bengaluru"}, {"id": "KZ-RWA-053", "name": "Wonderwall Bricks & Milestone", "city": "Bengaluru"}, {"id": "KZ-RWA-054", "name": "ACE GOLFSHIRE Apartment Noida", "city": "Noida"}, {"id": "KZ-RWA-055", "name": "Air force Naval", "city": "Delhi"}, {"id": "KZ-RWA-056", "name": "Batla Appartment", "city": "Delhi"}, {"id": "KZ-RWA-057", "name": "Batukji Appartment", "city": "Delhi"}, {"id": "KZ-RWA-058", "name": "Bhagat Singh", "city": "Delhi"}, {"id": "KZ-RWA-059", "name": "Bharat Mandpam", "city": "Delhi"}, {"id": "KZ-RWA-060", "name": "Eden towers Apartment Dwarka", "city": "Delhi"}, {"id": "KZ-RWA-061", "name": "Ganpati Apartments", "city": "Delhi"}, {"id": "KZ-RWA-062", "name": "Gulistan Apartment", "city": "Delhi"}, {"id": "KZ-RWA-063", "name": "Habitate Apartment", "city": "Delhi"}, {"id": "KZ-RWA-064", "name": "Himalya Apartment", "city": "Delhi"}, {"id": "KZ-RWA-065", "name": "Hmm Employees CGHS LTD", "city": "Delhi"}, {"id": "KZ-RWA-066", "name": "Kallol Apartment", "city": "Delhi"}, {"id": "KZ-RWA-067", "name": "Khukhrain Sabha", "city": "Delhi"}, {"id": "KZ-RWA-068", "name": "M k Residency Dwarka (HMCL)", "city": "Delhi"}, {"id": "KZ-RWA-069", "name": "Meera Bai CGHS", "city": "Delhi"}, {"id": "KZ-RWA-070", "name": "Nagin Lake Apartment", "city": "Delhi"}, {"id": "KZ-RWA-071", "name": "Navkunj Apartment", "city": "Delhi"}, {"id": "KZ-RWA-072", "name": "Neelachal Apartment", "city": "Delhi"}, {"id": "KZ-RWA-073", "name": "Neelgiri Apartment", "city": "Delhi"}, {"id": "KZ-RWA-074", "name": "Palm City Apartment", "city": "Delhi"}, {"id": "KZ-RWA-075", "name": "Rashmi Apartment", "city": "Delhi"}, {"id": "KZ-RWA-076", "name": "Sai Apartment", "city": "Delhi"}, {"id": "KZ-RWA-077", "name": "Satyam Apartment", "city": "Delhi"}, {"id": "KZ-RWA-078", "name": "Siddhartha Kunj", "city": "Delhi"}, {"id": "KZ-RWA-079", "name": "Sunder Enclave (HMCL)", "city": "Delhi"}, {"id": "KZ-RWA-080", "name": "The Arya Cghs Ltd Rohini", "city": "Delhi"}, {"id": "KZ-RWA-081", "name": "The Grand HeroMotoCorp", "city": "Delhi"}, {"id": "KZ-RWA-082", "name": "The Kangra Adarsh apartment", "city": "Delhi"}, {"id": "KZ-RWA-083", "name": "True Friends CGHS", "city": "Delhi"}, {"id": "KZ-RWA-084", "name": "Vidut Nikunj Apartment", "city": "Delhi"}, {"id": "KZ-RWA-085", "name": "Vishwakarma Apartment", "city": "Delhi"}, {"id": "KZ-RWA-086", "name": "Bestech Park View", "city": "Dharuhera"}, {"id": "KZ-RWA-087", "name": "Adel Redwood", "city": "Faridabad"}, {"id": "KZ-RWA-088", "name": "Blossom Green", "city": "Faridabad"}, {"id": "KZ-RWA-089", "name": "Park Floor 1 Faridabad", "city": "Faridabad"}, {"id": "KZ-RWA-090", "name": "Sai Vatika", "city": "Faridabad"}, {"id": "KZ-RWA-091", "name": "Aditya City Apartments", "city": "Ghaziabad"}, {"id": "KZ-RWA-092", "name": "Arc Angles Apt", "city": "Ghaziabad"}, {"id": "KZ-RWA-093", "name": "Cosmos Golden Heights", "city": "Ghaziabad"}, {"id": "KZ-RWA-094", "name": "Crossing Republic", "city": "Ghaziabad"}, {"id": "KZ-RWA-095", "name": "Gaur city", "city": "Ghaziabad"}, {"id": "KZ-RWA-096", "name": "High End Paradise HMCL", "city": "Ghaziabad"}, {"id": "KZ-RWA-097", "name": "MCC Signature homes", "city": "Ghaziabad"}, {"id": "KZ-RWA-098", "name": "Milan Vihar 2", "city": "Ghaziabad"}, {"id": "KZ-RWA-099", "name": "Shipra Ravera", "city": "Ghaziabad"}, {"id": "KZ-RWA-100", "name": "Emaar Palm Gardens", "city": "Gurgaon"}, {"id": "KZ-RWA-101", "name": "Hero Motocrop  Gurgaon Plant", "city": "Gurgaon"}, {"id": "KZ-RWA-102", "name": "Hero Motocrop Udyog Vihar", "city": "Gurgaon"}, {"id": "KZ-RWA-103", "name": "Mapsko Royale Ville", "city": "Gurgaon"}, {"id": "KZ-RWA-104", "name": "Hero Motocorp Haridwar Plant", "city": "Hardwar"}, {"id": "KZ-RWA-105", "name": "Alekya Towers", "city": "Hyderabad"}, {"id": "KZ-RWA-106", "name": "Aparna KANOPY Tulip", "city": "Hyderabad"}, {"id": "KZ-RWA-107", "name": "Beema Pride", "city": "Hyderabad"}, {"id": "KZ-RWA-108", "name": "ENVIRISE", "city": "Hyderabad"}, {"id": "KZ-RWA-109", "name": "GKRS BLISS 1", "city": "Hyderabad"}, {"id": "KZ-RWA-110", "name": "JANAPRIYA UTOPIA", "city": "Hyderabad"}, {"id": "KZ-RWA-111", "name": "Kendriya vihar phase 2", "city": "Hyderabad"}, {"id": "KZ-RWA-112", "name": "KSR 2GETHERMENTS", "city": "Hyderabad"}, {"id": "KZ-RWA-113", "name": "Mythris The Town", "city": "Hyderabad"}, {"id": "KZ-RWA-114", "name": "Paradise Homes", "city": "Hyderabad"}, {"id": "KZ-RWA-115", "name": "Shree Tirumala Millennium Phase 2", "city": "Hyderabad"}, {"id": "KZ-RWA-116", "name": "SRI NIVASA HEIGHTS", "city": "Hyderabad"}, {"id": "KZ-RWA-117", "name": "TNR Shakuntala", "city": "Hyderabad"}, {"id": "KZ-RWA-118", "name": "Vasusri Sunraise Apt", "city": "Hyderabad"}, {"id": "KZ-RWA-119", "name": "Venkatadri Heights", "city": "Hyderabad"}, {"id": "KZ-RWA-120", "name": "Hero Motocorp Kukas Plant", "city": "Jaipur"}, {"id": "KZ-RWA-121", "name": "Sai Sastha crystal", "city": "Mumbai"}, {"id": "KZ-RWA-122", "name": "Hero Motocorp Neemrana Plant", "city": "Neemrana"}, {"id": "KZ-RWA-123", "name": "ACE Platinum", "city": "Noida"}, {"id": "KZ-RWA-124", "name": "Amrapali princely estate HMCL", "city": "Noida"}, {"id": "KZ-RWA-125", "name": "Apex Aura", "city": "Noida"}, {"id": "KZ-RWA-126", "name": "Blossom County", "city": "Noida"}, {"id": "KZ-RWA-127", "name": "Celestial Palace (HMCL)", "city": "Noida"}, {"id": "KZ-RWA-128", "name": "French Apartment", "city": "Noida"}, {"id": "KZ-RWA-129", "name": "Harmukh Apartments", "city": "Noida"}, {"id": "KZ-RWA-130", "name": "Kings Park", "city": "Noida"}, {"id": "KZ-RWA-131", "name": "Shivalik Homes", "city": "Noida"}, {"id": "KZ-RWA-132", "name": "Stellar Sigma Apartments", "city": "Noida"}, {"id": "KZ-RWA-133", "name": "Sun Twilight Mall Greater Noida", "city": "Noida"}, {"id": "KZ-RWA-134", "name": "B-4, Arv New Town", "city": "Pune"}, {"id": "KZ-RWA-135", "name": "B-5, Arv New Town", "city": "Pune"}, {"id": "KZ-RWA-136", "name": "B-6, Arv New Town", "city": "Pune"}, {"id": "KZ-RWA-137", "name": "Ganga Ambernath society", "city": "Pune"}, {"id": "KZ-RWA-138", "name": "Hinjewadi Hills", "city": "Pune"}, {"id": "KZ-RWA-139", "name": "Kalpaturu serenity", "city": "Pune"}, {"id": "KZ-RWA-140", "name": "Mahuligad Society", "city": "Pune"}, {"id": "KZ-RWA-141", "name": "Mantra Majestic", "city": "Pune"}, {"id": "KZ-RWA-142", "name": "MARVEL IDEAL SPACIO", "city": "Pune"}, {"id": "KZ-RWA-143", "name": "Mont Very Grand 2", "city": "Pune"}, {"id": "KZ-RWA-144", "name": "Omega Paradise", "city": "Pune"}, {"id": "KZ-RWA-145", "name": "Optima Heights", "city": "Pune"}, {"id": "KZ-RWA-146", "name": "Park Infinia", "city": "Pune"}, {"id": "KZ-RWA-147", "name": "PRISTINE PACIFIC", "city": "Pune"}, {"id": "KZ-RWA-148", "name": "Royal Oak society", "city": "Pune"}, {"id": "KZ-RWA-149", "name": "Sanskriti Phase-1 & 2", "city": "Pune"}, {"id": "KZ-RWA-150", "name": "Shree Ram Kailash Society", "city": "Pune"}, {"id": "KZ-RWA-151", "name": "Spirea Society", "city": "Pune"}, {"id": "KZ-RWA-152", "name": "Sunville Society", "city": "Pune"}, {"id": "KZ-RWA-153", "name": "Tanish O2", "city": "Pune"}, {"id": "KZ-RWA-154", "name": "Tanish park Wing A", "city": "Pune"}, {"id": "KZ-RWA-155", "name": "Tanish park Wing B", "city": "Pune"}, {"id": "KZ-RWA-156", "name": "Tanish park Wing C", "city": "Pune"}, {"id": "KZ-RWA-157", "name": "Tanish park Wing D", "city": "Pune"}, {"id": "KZ-RWA-158", "name": "Tanish park Wing E", "city": "Pune"}, {"id": "KZ-RWA-159", "name": "Tanish park Wing F", "city": "Pune"}, {"id": "KZ-RWA-160", "name": "Tanish park Wing G", "city": "Pune"}, {"id": "KZ-RWA-161", "name": "Tanish park Wing H", "city": "Pune"}, {"id": "KZ-RWA-162", "name": "Tanish park Wing I", "city": "Pune"}, {"id": "KZ-RWA-163", "name": "Tanish park Wing J", "city": "Pune"}, {"id": "KZ-RWA-164", "name": "Tanish Pride Society", "city": "Pune"}, {"id": "KZ-RWA-165", "name": "Yash ravi park society", "city": "Pune"}, {"id": "KZ-RWA-166", "name": "Hero Motocorp Chittoor Plant (Sri City)", "city": "Sri City"}, {"id": "KZ-RWA-167", "name": "Hero Motocrop  Vadodara Plant", "city": "Vadodara"}, {"id": "KZ-RWA-168", "name": "Riddhi Granduer", "city": "Hyderabad"}, {"id": "KZ-RWA-169", "name": "Palm Grove Heights", "city": "Gurgaon"}, {"id": "KZ-RWA-170", "name": "Galaxy North Ave 2", "city": "Ghaziabad"}, {"id": "KZ-RWA-171", "name": "Sai Keerthi Prime", "city": "Hyderabad"}, {"id": "KZ-RWA-172", "name": "Amrapali Silicon City", "city": "Noida"}, {"id": "KZ-RWA-173", "name": "Mantra Moments", "city": "Pune"}, {"id": "KZ-RWA-174", "name": "Sai Nandana Marvella", "city": "Bangalore"}, {"id": "KZ-RWA-175", "name": "SMP Sai Samarth Society", "city": "Pune"}, {"id": "KZ-RWA-176", "name": "SS Brindavanam Apartment", "city": "Bangalore"}, {"id": "KZ-RWA-177", "name": "Vasudha Spring Apartment", "city": "Bangalore"}];

// Load full society details from CSV (for edit mode only)
async function loadSocietyById(societyId) {
  const res = await fetch(MASTER_CSV);
  const text = await res.text();
  return new Promise((resolve) => {
    Papa.parse(text, {
      header: true, skipEmptyLines: true,
      transformHeader: (h) => h.trim().replace(/^\uFEFF/, ''),
      complete: (r) => {
        const match = r.data.find(row => (row.society_id || "").trim() === societyId);
        resolve(match || null);
      }
    });
  });
}

async function apiPost(data) {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.name = "kazam_submit_" + Date.now();
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const form = document.createElement("form");
    form.method = "POST";
    form.action = API_URL;
    form.target = iframe.name;

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "payload";
    input.value = JSON.stringify(data);
    form.appendChild(input);

    document.body.appendChild(form);
    form.submit();

    setTimeout(() => {
      try { document.body.removeChild(form); document.body.removeChild(iframe); } catch(e) {}
      resolve({ success: true });
    }, 4000);
  });
}

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

function OnboardingApp({ user }) {
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

  // Societies loaded from embedded list — always instant, no API needed
  useEffect(() => {
    setSocieties(EMBEDDED_SOCIETIES);
    setLoading(false);
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
    setSocieties(EMBEDDED_SOCIETIES);
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
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {mode && (
          <Btn onClick={reset} variant="outline" style={{ padding: "6px 16px", fontSize: 12 }}>← Back</Btn>
        )}
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {user.picture && <img src={user.picture} alt="" style={{ width: 28, height: 28, borderRadius: "50%" }} />}
            <span style={{ fontSize: 12, color: T.sec, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</span>
          </div>
        )}
      </div>
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

// ═══════════════════════════════════════════════════════════
// AUTH WRAPPER — Google Sign-In restricted to @kazam.in
// ═══════════════════════════════════════════════════════════
function LoginPage({ onLogin, error }) {
  const btnRef = useRef(null);

  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          // Decode JWT to get email
          const payload = JSON.parse(atob(response.credential.split(".")[1]));
          onLogin(payload);
        },
        auto_select: false,
      });
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "signin_with",
        shape: "rectangular",
      });
    };
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch(e){} };
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(145deg, #0c1222 0%, #162032 50%, #0f1b2d 100%)", fontFamily: T.font }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ background: "#fff", borderRadius: 16, padding: "48px 40px", width: 420, maxWidth: "92vw", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <span style={{ fontSize: 26, fontWeight: 800, color: T.text, letterSpacing: -0.8 }}>Kazam</span>
        </div>
        <p style={{ color: T.sec, fontSize: 14, margin: "4px 0 32px" }}>Society Onboarding Portal</p>
        <div ref={btnRef} style={{ display: "flex", justifyContent: "center", marginBottom: 16 }} />
        {error && (
          <div style={{ background: T.redBg, color: T.red, padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, marginTop: 12 }}>
            {error}
          </div>
        )}
        <p style={{ color: T.ter, fontSize: 12, marginTop: 24 }}>Restricted to @kazam.in accounts</p>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    // Check for saved session
    try {
      const saved = sessionStorage.getItem("kazam_user");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [authError, setAuthError] = useState("");

  const handleLogin = (payload) => {
    const email = (payload.email || "").toLowerCase();
    if (!email.endsWith("@" + ALLOWED_DOMAIN)) {
      setAuthError("Access restricted to @" + ALLOWED_DOMAIN + " accounts. You signed in with " + email);
      return;
    }
    const userData = { email, name: payload.name, picture: payload.picture };
    sessionStorage.setItem("kazam_user", JSON.stringify(userData));
    setUser(userData);
    setAuthError("");
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} error={authError} />;
  }

  return <OnboardingApp user={user} />;
}
