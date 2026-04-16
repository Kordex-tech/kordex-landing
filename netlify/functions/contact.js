const crypto = require("crypto");

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

function buildLeadPayload(body, headers) {
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

  return {
    trace_id: `LANDING-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
    received_at: new Date().toISOString(),
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
    user_agent: cleanString(headers["user-agent"], 500),
    ip: cleanString(headers["x-forwarded-for"], 200),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ ok: false, error: "method_not_allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const lead = buildLeadPayload(body, event.headers || {});

    const webhookUrl = process.env.CONTACT_WEBHOOK_URL || "";
    const webhookToken = process.env.CONTACT_WEBHOOK_TOKEN || "";

    if (webhookUrl) {
      const headers = {
        "Content-Type": "application/json",
      };
      if (webhookToken) {
        headers.Authorization = `Bearer ${webhookToken}`;
      }

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(lead),
      });

      if (!response.ok) {
        return {
          statusCode: 502,
          body: JSON.stringify({
            ok: false,
            error: `forward_failed_${response.status}`,
          }),
        };
      }
    }

    console.log("[LANDING_CONTACT]", JSON.stringify(lead));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ok: true,
        trace_id: lead.trace_id,
        forwarded: Boolean(webhookUrl),
      }),
    };
  } catch (err) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ok: false,
        error: err.message || "bad_request",
      }),
    };
  }
};
