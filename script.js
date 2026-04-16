const CONTACT_MESSAGES = {
  en: {
    sending: "Sending...",
    success: "Thanks. We will contact you within 24 hours.",
    error: "Something went wrong. Please email rafael.costa@kordex.org",
    defaultButton: "Request a Safety Sprint",
  },
  de: {
    sending: "Wird gesendet...",
    success: "Danke. Wir melden uns innerhalb von 24 Stunden.",
    error: "Etwas ist schiefgelaufen. Bitte schreiben Sie an rafael.costa@kordex.org",
    defaultButton: "Safety Sprint anfragen",
  },
};

function getCurrentLang() {
  return document.documentElement.lang || "en";
}

function getContactMessageSet() {
  return CONTACT_MESSAGES[getCurrentLang()] || CONTACT_MESSAGES.en;
}

function fillTrackingFields(form) {
  const params = new URLSearchParams(window.location.search);
  const assign = (name, value) => {
    const field = form.querySelector(`[name="${name}"]`);
    if (field) field.value = value || "";
  };

  assign("page_url", window.location.href);
  assign("referrer", document.referrer || "");
  assign("utm_source", params.get("utm_source"));
  assign("utm_medium", params.get("utm_medium"));
  assign("utm_campaign", params.get("utm_campaign"));
  assign("utm_term", params.get("utm_term"));
  assign("utm_content", params.get("utm_content"));
}

function serializeContactForm(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  return {
    ...data,
    budget_owner_present: data.budget_owner_present || "",
    pilot_readiness: data.pilot_readiness || "",
  };
}

async function submitLead(payload) {
  const endpoints = ["/api/contact", "/.netlify/functions/contact"];
  let lastError = new Error("no contact endpoint available");

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        return await res.json().catch(() => ({ ok: true }));
      }

      if (res.status === 404) {
        lastError = new Error(`endpoint_not_found:${endpoint}`);
        continue;
      }

      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${text}`.trim());
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError;
}

function setFormState({ button, status, type, message, disabled }) {
  button.disabled = disabled;
  if (message) {
    if (type === "sending") {
      button.textContent = message;
      status.textContent = "";
      status.className = "form-status";
      return;
    }

    status.textContent = message;
    status.className = `form-status ${type === "success" ? "is-success" : "is-error"}`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const button = form.querySelector('button[type="submit"]');
  const status = document.getElementById("contactStatus");

  fillTrackingFields(form);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    fillTrackingFields(form);

    if (!form.reportValidity()) {
      return;
    }

    const text = getContactMessageSet();
    const payload = serializeContactForm(form);

    setFormState({
      button,
      status,
      type: "sending",
      message: text.sending,
      disabled: true,
    });

    try {
      await submitLead(payload);

      form.reset();
      fillTrackingFields(form);
      button.textContent = text.defaultButton;
      setFormState({
        button,
        status,
        type: "success",
        message: text.success,
        disabled: false,
      });
    } catch (err) {
      console.error("contact submit failed", err);
      button.textContent = text.defaultButton;
      setFormState({
        button,
        status,
        type: "error",
        message: text.error,
        disabled: false,
      });
    }
  });
});
