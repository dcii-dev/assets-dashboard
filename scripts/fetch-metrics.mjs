import { JWT } from "google-auth-library";
import fs from "node:fs/promises";
import path from "node:path";

const ASSETS = [
  { id: "asset-1", domain: "clampgen.com", gaPropertyId: "540522281" },
  { id: "asset-2", domain: "freelanceratewise.com", gaPropertyId: "540671739" },
  { id: "asset-3", domain: "calmacrocal.com", gaPropertyId: "540909051" },
  { id: "asset-4", domain: "onerepmaxx.com", gaPropertyId: "540671739" },
  { id: "asset-5", domain: "srcsetbuilder.com", gaPropertyId: "542208158" },
];

const SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/webmasters.readonly",
];

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

function dateRangeLast30Days() {
  const today = new Date();
  const end = new Date(today);
  end.setDate(end.getDate() - 1);
  const start = new Date(end);
  start.setDate(start.getDate() - 29);
  return { startDate: fmtDate(start), endDate: fmtDate(end) };
}

function parseServiceAccountKey() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_KEY secret.");
  }
  const parsed = JSON.parse(raw);
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error(
      "Service account JSON is missing client_email/private_key.",
    );
  }
  return parsed;
}

async function getAccessToken() {
  const key = parseServiceAccountKey();
  const client = new JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: SCOPES,
  });
  const token = await client.authorize();
  if (!token?.access_token) {
    throw new Error("Failed to obtain OAuth access token.");
  }
  return token.access_token;
}

async function fetchGaSessions(accessToken, gaPropertyId, startDate, endDate) {
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${gaPropertyId}:runReport`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: "sessions" }],
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GA API failed for ${gaPropertyId}: ${res.status} ${txt}`);
  }

  const json = await res.json();
  const val = json?.rows?.[0]?.metricValues?.[0]?.value;
  return Number.parseInt(val || "0", 10) || 0;
}

async function fetchGscMetrics(accessToken, domain, startDate, endDate) {
  const siteUrl = `sc-domain:${domain}`;
  const endpoint = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions: ["date"],
      rowLimit: 25000,
      type: "web",
      dataState: "final",
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GSC API failed for ${domain}: ${res.status} ${txt}`);
  }

  const json = await res.json();
  const rows = json?.rows || [];

  let clicks = 0;
  let impressions = 0;
  rows.forEach((row) => {
    clicks += Number(row.clicks || 0);
    impressions += Number(row.impressions || 0);
  });

  return {
    clicks: Math.round(clicks),
    impressions: Math.round(impressions),
  };
}

async function writeStatsJson(payload) {
  const target = path.join(process.cwd(), "data", "stats.json");
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function main() {
  const { startDate, endDate } = dateRangeLast30Days();
  const accessToken = await getAccessToken();

  const out = {
    generatedAt: new Date().toISOString(),
    range: { startDate, endDate },
    assets: {},
  };

  for (const asset of ASSETS) {
    const row = {
      domain: asset.domain,
      gaPropertyId: asset.gaPropertyId,
      sessions: 0,
      clicks: 0,
      impressions: 0,
      status: "ok",
      error: "",
    };

    try {
      row.sessions = await fetchGaSessions(
        accessToken,
        asset.gaPropertyId,
        startDate,
        endDate,
      );
    } catch (err) {
      row.status = "error";
      row.error = `GA: ${err.message}`;
    }

    try {
      const gsc = await fetchGscMetrics(
        accessToken,
        asset.domain,
        startDate,
        endDate,
      );
      row.clicks = gsc.clicks;
      row.impressions = gsc.impressions;
    } catch (err) {
      row.status = row.status === "error" ? "partial" : "error";
      row.error = row.error
        ? `${row.error}; GSC: ${err.message}`
        : `GSC: ${err.message}`;
    }

    out.assets[asset.id] = row;
  }

  await writeStatsJson(out);
  console.log("Wrote data/stats.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
