# Repository Structure

This repository is a framework-free static site with two HTML entry points and a small contact backend.

## Current Layout

```text
.
├── AGENTS.md
├── README.md
├── STRUCTURE.md
├── index.html
├── demo.html
├── package.json
├── server.js
├── assets/
│   ├── css/
│   │   ├── landing.css
│   │   └── demo.css
│   ├── images/
│   │   └── logo.jpg
│   └── js/
│       ├── contact-form.js
│       ├── demo.js
│       └── i18n.js
└── netlify/
    └── functions/
        └── contact.js
```

## Ownership

- `index.html` owns landing page content and form markup.
- `demo.html` owns the telemetry demo markup.
- `assets/css/landing.css` owns landing page presentation.
- `assets/css/demo.css` owns demo page presentation.
- `assets/js/contact-form.js` owns browser-side lead submission.
- `assets/js/i18n.js` owns language detection and translated landing copy.
- `assets/js/demo.js` owns synthetic demo data and demo interactions.
- `server.js` owns local static serving and the local `/api/contact` endpoint.
- `netlify/functions/contact.js` owns the deployed Netlify contact endpoint.

## Business Logic Locations

Lead capture logic is currently split across:

- `assets/js/contact-form.js`
- `server.js`
- `netlify/functions/contact.js`

The server and Netlify handlers currently duplicate validation and scoring. If the logic grows, extract shared lead rules before adding more conditions.

## Static Asset Rules

- CSS lives in `assets/css/`.
- Browser JavaScript lives in `assets/js/`.
- Images live in `assets/images/`.
- Root HTML files should only reference assets through the `assets/` path.
- Keep generated data and deployment archives out of the source structure unless explicitly needed.
