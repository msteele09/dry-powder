// Sends Dry Powder push notifications. Run by .github/workflows/notify.yml.
// MODE: "close" (weekday market-close summary), "weekly" (Sunday check-in) or "test".
import webpush from "web-push";

// The public key is not secret; it matches VAPID_PUBLIC in index.html.
const DEFAULT_PUBLIC = "BGn0xAU7YUEcO_vldQ3YwTsDO_ZPCYatXGTU8S7rNBTyUeHkSZ2iWnSJqdzVBF8DdLwhvBoDUAUMHqyzzkoTi8g";
const env = process.env;
const { VAPID_PRIVATE_KEY, MODE = "test", APP_URL = "" } = env;
const VAPID_PUBLIC_KEY = env.VAPID_PUBLIC_KEY || DEFAULT_PUBLIC;
// DRY_POWDER_DEVICE is the code the app shows: {"sub": <push subscription>, "av": <Alpha Vantage key>}.
// PUSH_SUBSCRIPTION and ALPHA_VANTAGE_KEY still work as separate secrets.
let device = {};
try { device = env.DRY_POWDER_DEVICE ? JSON.parse(env.DRY_POWDER_DEVICE) : {}; } catch { console.error("DRY_POWDER_DEVICE isn't valid. Copy the device code from the app again."); process.exit(1); }
const PUSH_SUBSCRIPTION = device.sub ? JSON.stringify(device.sub) : env.PUSH_SUBSCRIPTION;
const ALPHA_VANTAGE_KEY = env.ALPHA_VANTAGE_KEY || device.av || "";
if (!VAPID_PRIVATE_KEY || !PUSH_SUBSCRIPTION) {
  console.log("Missing the VAPID_PRIVATE_KEY or DRY_POWDER_DEVICE secret. Nothing sent.");
  process.exit(0);
}

// Keep in sync with PB_EVENTS in index.html.
const EVENTS = [
  ["2026-11-03", "AMD earnings and midterm elections"],
  ["2026-11-06", "Jobs report"],
  ["2026-11-10", "Inflation report and CoreWeave earnings"],
  ["2026-11-17", "Nvidia earnings, the biggest test"],
  ["2026-12-09", "Fed rate decision"],
  ["2027-01-28", "Big Tech year-end earnings start (approx.)"],
  ["2027-04-15", "Last day for 2026 Roth IRA deposits"],
];
const PULSE = [["VOO", "S&P 500"], ["QQQ", "Nasdaq"], ["NVDA", "Nvidia"], ["SOXX", "Chips"]];

// Dates in US Eastern time, since that's when the market closes.
const etDate = (offsetDays = 0) => {
  const d = new Date(Date.now() + offsetDays * 864e5);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
};
const daysUntil = iso => Math.round((Date.parse(iso + "T12:00:00Z") - Date.parse(etDate() + "T12:00:00Z")) / 864e5);

async function quote(sym) {
  const r = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${sym}&datatype=json&apikey=${ALPHA_VANTAGE_KEY}`);
  const j = await r.json();
  const q = j["Global Quote"];
  if (!q || !q["05. price"]) return null;
  return { price: Number(q["05. price"]), pct: parseFloat(q["10. change percent"]), day: q["07. latest trading day"] };
}
const fmt = p => (p > 0 ? "+" : "") + p.toFixed(1) + "%";

async function build() {
  const today = etDate(), tomorrow = etDate(1);
  const evToday = EVENTS.find(e => e[0] === today), evTomorrow = EVENTS.find(e => e[0] === tomorrow);
  const next = EVENTS.find(e => daysUntil(e[0]) > 0);

  if (MODE === "weekly") {
    const lines = ["Update your balances and log this week's spending."];
    if (next) lines.push(`Next up: ${next[1]} in ${daysUntil(next[0])} day${daysUntil(next[0]) === 1 ? "" : "s"}.`);
    return { title: "Sunday money check-in", body: lines.join(" "), url: "./#overview", tag: "weekly" };
  }
  if (MODE === "close") {
    const parts = []; let worst = 0, stale = false;
    if (ALPHA_VANTAGE_KEY) {
      for (const [sym, label] of PULSE) {
        try {
          const q = await quote(sym);
          if (q && !Number.isNaN(q.pct)) { parts.push(`${label} ${fmt(q.pct)}`); worst = Math.min(worst, q.pct); if (q.day !== today) stale = true; }
        } catch {}
      }
    }
    if (stale && parts.length && !evTomorrow) { console.log("Market closed today (holiday). Nothing sent."); return null; }
    let title = "Market close";
    if (worst <= -5) title = "Big drop today: check your buy plan";
    else if (worst <= -3) title = "Rough day for AI stocks";
    const lines = [];
    if (parts.length) lines.push(parts.join(" · ") + ".");
    if (evToday) lines.push(`Today: ${evToday[1]}.`);
    if (evTomorrow) lines.push(`Tomorrow: ${evTomorrow[1]}.`);
    if (!lines.length) { console.log("No quotes and no events. Nothing sent."); return null; }
    return { title, body: lines.join(" "), url: worst <= -3 ? "./#playbook" : "./#investments", tag: "close" };
  }
  return { title: "Dry Powder", body: "Test notification from GitHub. Alerts are set up.", url: "./#overview", tag: "test" };
}

const msg = await build();
if (msg) {
  const subject = APP_URL || "https://github.com";
  webpush.setVapidDetails(subject, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log("Sending:", msg.title, "|", msg.body);
  try {
    await webpush.sendNotification(JSON.parse(PUSH_SUBSCRIPTION), JSON.stringify(msg), { TTL: 6 * 3600 });
    console.log("Sent.");
  } catch (e) {
    console.error("Push failed:", e.statusCode, e.body || e.message);
    if (e.statusCode === 404 || e.statusCode === 410) console.error("This device code expired. Open Dry Powder, tap Turn on notifications again, and update the DRY_POWDER_DEVICE secret.");
    process.exit(1);
  }
}
