# AGENTS.md

## Project

KORDEX landing is a small static marketing site with a contact form and an interactive safety telemetry demo.

The repository is intentionally simple: no framework, no build step, no bundler. Keep it that way unless there is a clear product reason to add one.

## Structure

- `index.html` - main landing page markup.
- `demo.html` - interactive telemetry demo page.
- `assets/css/landing.css` - main landing page styling.
- `assets/css/demo.css` - demo page styling.
- `assets/js/contact-form.js` - landing page contact form behavior.
- `assets/js/i18n.js` - client-side translations and language switching.
- `assets/js/demo.js` - demo interaction and generated demo data.
- `assets/images/logo.jpg` - brand asset.
- `server.js` - local/static Node server and `/api/contact` handler.
- `netlify/functions/contact.js` - Netlify contact form handler.
- `.replit` - Replit runtime config.
- `STRUCTURE.md` - repository layout and ownership map.

## Runtime

Run locally with:

```sh
npm start
```

The server listens on `PORT` or `3000`.

## Contact Form Logic

The form posts JSON from `assets/js/contact-form.js` to two possible endpoints:

1. `/api/contact` for the local Node server in `server.js`.
2. `/.netlify/functions/contact` for Netlify deployment.

Both handlers validate required fields, block a honeypot field named `website`, derive lead metadata, and optionally forward the lead to `CONTACT_WEBHOOK_URL`.

Required submitted fields:

- `name`
- `email`
- `company`
- `pain`
- `budget_owner_present`
- `pilot_readiness`

Environment variables:

- `CONTACT_WEBHOOK_URL` - optional destination for forwarded leads.
- `CONTACT_WEBHOOK_TOKEN` - optional bearer token for forwarding.

## Business Rules

Current scoring rules are duplicated in `server.js` and `netlify/functions/contact.js`:

- `pilot_readiness = ready_now` maps to score `1.0`.
- `pilot_readiness = this_quarter` maps to score `0.75`.
- `pilot_readiness = exploring` maps to score `0.35`.
- Unknown readiness maps to score `0.0`.
- `budget_owner_present = yes` maps to `true`.
- `budget_owner_present = no` maps to `false`.
- Other budget-owner values map to `null`.
- `willing_to_pay_now` is `true` only when `pilot_readiness` is `ready_now`.

If these rules change, update both handlers or first extract shared logic so the rule exists in one place.

## Editing Rules

- Prefer small, direct changes over introducing a framework.
- Keep HTML, CSS, and JS dependency-free unless the product need is strong.
- Preserve all supported languages when changing visible landing page copy.
- Update `assets/js/i18n.js` when changing translated text in `index.html`.
- Keep the Node handler and Netlify handler behavior aligned.
- Do not commit generated lead data such as `leads.jsonl`.
- Avoid committing deployment archives such as `.tar.gz` unless explicitly needed.

## Verification

For landing page changes:

```sh
npm start
```

Then check:

- `/` renders the landing page.
- `/demo.html` renders the telemetry demo.
- Language switching still works.
- Contact form validation still works.

For contact form changes, test both endpoint shapes when possible:

- Local: `POST /api/contact`
- Netlify: `POST /.netlify/functions/contact`
