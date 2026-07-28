# Privacy

This document describes the privacy posture of the source code in this repository. The same content
is published in the application itself at `/privacy`.

## Summary

This calculator is privacy-first by construction:

- All calculations run entirely client-side, in the browser (`src/calculation/*` has no server-side
  code path and makes no network requests).
- No database, no server-side storage, and no hidden form submissions exist anywhere in this codebase.
- No session recordings, no advertising trackers, no third-party scripts are included.
- The form intentionally has no Social Security number field, no IRS account number field, no
  document upload, and no address field — the UI explicitly instructs users not to enter this
  information even in free-text notes.
- No automatic `localStorage`/`sessionStorage` persistence of entered values — refreshing the page
  clears everything.

## Analytics

`src/lib/analytics.ts` defines a small set of anonymous event names (`calculator_started`,
`estimate_completed`, `methodology_opened`, `calendly_cta_clicked`). The tracking function is
**disabled by default** (gated behind `NEXT_PUBLIC_ANALYTICS_ENABLED=true`) and, even if enabled,
never receives dollar amounts, dates, or any other entered value — only the event name itself. As
shipped, the function makes no network call at all.

## Third-party links

The application links out to `calendly.com` (for scheduling) and `eataxresolutions.com` (the main
site). These are standard outbound links opened with `rel="noopener noreferrer"` and
`target="_blank"` where appropriate; no data is passed to these destinations via query parameters.

## Your responsibility

If you print or download a CSV/summary from this calculator, that file is generated locally in your
browser and is not transmitted anywhere by this application — but it is your responsibility to store
or delete it appropriately once created, since it may contain your entered financial figures.
