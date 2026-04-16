const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const CONTACT_WEBHOOK_URL = process.env.CONTACT_WEBHOOK_URL || "";
const CONTACT_WEBHOOK_TOKEN = process.env.CONTACT_WEBHOOK_TOKEN || "";

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 100_000) {
        reject(new Error("payload too large"));
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function cleanString(value, max = 2000) {
  return String(value || "").trim().slice(0, max);
}

function parseBudgetOwner(value) {
  if (value === "yes") return true;
  if (value === "no") return false;
  return null;
}

function pilotReadinessScore(value) {
  switch (value) {
    case "ready_now":
      return 1.0;
    case "this_quarter":
      return 0.75;
    case "exploring":
      return 0.35;
    default:
      return 0.0;
  }
}

function buildLeadPayload(body, req) {
  const name = cleanString(body.name, 120);
  const email = cleanString(body.email, 180).toLowerCase();
  const company = cleanString(body.company, 180);
  const role = cleanString(body.role, 180);
  const pain = cleanString(body.pain, 4000);
  const budgetOwnerValue = cleanString(body.budget_owner_present, 32);
  const pilotReadiness = cleanString(body.pilot_readiness, 32);

  if (!name || !email || !company || !pain || !budgetOwnerValue || !pilotReadiness) {
    throw new Error("missing required fields");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("invalid email");
  }
  if (cleanString(body.website, 255)) {
    throw new Error("spam blocked");
  }

  const receivedAt = new Date().toISOString();
  const traceId = `LANDING-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

  return {
    trace_id: traceId,
    received_at: receivedAt,
    source: "landing_contact_form",
    source_page: cleanString(body.page_url, 1000),
    referrer: cleanString(body.referrer, 1000),
    name,
    email,
    company,
    role,
    pain,
    budget_owner_present: parseBudgetOwner(budgetOwnerValue),
    budget_owner_raw: budgetOwnerValue,
    pilot_readiness: pilotReadiness,
    pilot_readiness_score: pilotReadinessScore(pilotReadiness),
    willing_to_pay_now: pilotReadiness === "ready_now",
    utm: {
      source: cleanString(body.utm_source, 200),
      medium: cleanString(body.utm_medium, 200),
      campaign: cleanString(body.utm_campaign, 200),
      term: cleanString(body.utm_term, 200),
      content: cleanString(body.utm_content, 200),
    },
    user_agent: cleanString(req.headers["user-agent"], 500),
    ip:
      cleanString(req.headers["x-forwarded-for"], 200) ||
      cleanString(req.socket.remoteAddress, 120),
  };
}

async function forwardLead(lead) {
  if (!CONTACT_WEBHOOK_URL) {
    return { forwarded: false, reason: "webhook_not_configured" };
  }

  const headers = {
    "Content-Type": "application/json",
  };
  if (CONTACT_WEBHOOK_TOKEN) {
    headers.Authorization = `Bearer ${CONTACT_WEBHOOK_TOKEN}`;
  }

  const response = await fetch(CONTACT_WEBHOOK_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(lead),
  });

  if (!response.ok) {
    throw new Error(`forward_failed_${response.status}`);
  }

  return { forwarded: true };
}

function json(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/api/contact") {
    try {
      const raw = await readBody(req);
      const body = JSON.parse(raw);
      const lead = buildLeadPayload(body, req);

      fs.appendFileSync("leads.jsonl", `${JSON.stringify(lead)}\n`);

      let forwardResult = { forwarded: false, reason: "not_attempted" };
      try {
        forwardResult = await forwardLead(lead);
      } catch (err) {
        console.error("[LEAD_FORWARD_ERROR]", err.message);
        forwardResult = { forwarded: false, reason: err.message };
      }

      console.log(`[LEAD] ${lead.received_at} ${lead.email} ${lead.company} trace=${lead.trace_id}`);
      json(res, 200, { ok: true, trace_id: lead.trace_id, ...forwardResult });
    } catch (err) {
      json(res, 400, { ok: false, error: err.message || "bad_request" });
    }
    return;
  }

  let filePath = req.url === "/" ? "/index.html" : req.url;
  filePath = path.join(__dirname, filePath);

  const ext = path.extname(filePath);
  const contentType = MIME[ext] || "application/octet-stream";

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  } catch {
    if (ext === "") {
      const index = fs.readFileSync(path.join(__dirname, "index.html"));
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(index);
    } else {
      res.writeHead(404);
      res.end("not found");
    }
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`KORDEX landing running on port ${PORT}`);
});
