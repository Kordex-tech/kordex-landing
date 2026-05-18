# KORDEX Landing

Static landing page and demo for KORDEX Industrial Safety Intelligence.

## What Is Here

This repo currently contains a framework-free website:

- Landing page: `index.html`, `assets/css/landing.css`, `assets/js/contact-form.js`, `assets/js/i18n.js`
- Interactive demo: `demo.html`, `assets/css/demo.css`, `assets/js/demo.js`
- Images: `assets/images/`
- Local Node server: `server.js`
- Netlify function: `netlify/functions/contact.js`

There is no app framework, database, test runner, package lockfile, or source/build directory split.

## Run

```sh
npm start
```

Open:

- `http://localhost:3000/`
- `http://localhost:3000/demo.html`

## Business Logic

The only backend business logic today is lead capture.

`assets/js/contact-form.js` serializes the contact form and tries these endpoints in order:

1. `/api/contact`
2. `/.netlify/functions/contact`

`server.js` and `netlify/functions/contact.js` both:

- validate required contact fields,
- validate email format,
- block honeypot submissions through the hidden `website` field,
- normalize budget-owner and pilot-readiness values,
- calculate `pilot_readiness_score`,
- derive `willing_to_pay_now`,
- add UTM, referrer, user-agent, IP, timestamp, and trace ID metadata,
- optionally forward the lead to `CONTACT_WEBHOOK_URL`.

The local Node server also appends accepted leads to `leads.jsonl`.

## Current Gaps

- Contact business rules are duplicated between local and Netlify handlers.
- There are no automated tests.
- There is no shared module boundary for lead validation/scoring.
- There is no deployment config beyond the Netlify function and `.replit`.
- `kordex-landing.tar.gz` is tracked even though it appears to be a deployment/archive artifact.

## Suggested Next Structure

If this grows beyond a static page, move toward:

```text
public/
  index.html
  demo.html
  assets/
src/
  landing/
  demo/
  contact/
    leadRules.js
    leadRules.test.js
netlify/
  functions/
server.js
README.md
AGENTS.md
```

The first useful refactor would be extracting duplicated lead validation and scoring into one shared module.
