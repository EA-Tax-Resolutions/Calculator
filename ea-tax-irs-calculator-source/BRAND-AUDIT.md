# Brand Audit — EA Tax Resolutions

**Date reviewed:** July 21, 2026
**Screenshots reviewed:** The browser tool's screenshot capability timed out repeatedly during this
session (a tool limitation, not a site issue). In its place, this audit was performed with two
methods that are arguably more precise than a visual screenshot review: (1) `getComputedStyle`
inspection of live DOM elements at https://www.eataxresolutions.com/ and its `/about` page, and (2)
direct canvas pixel-sampling of the official logo PNG to extract its exact color. Both methods were
executed successfully and cross-checked against each other. If a future review has working
screenshot capability, re-verify this document against actual visual renders — the above is a
documented limitation, not a substitute claimed to be equivalent.

## Primary logo color

Sampled directly from the logo image
(`https://images.squarespace-cdn.com/content/v1/6081a3ddeae2fb232b73a5fd/a9261e70-c355-4008-a8a4-409441b4e4c2/Logo%2B1.png`,
841×435px) via canvas pixel analysis: the dominant non-background color is approximately
`rgb(30, 150, 58)` (`#1E963A`).

This was cross-checked against every colored, interactive element actually rendered on the live
site (the "Get Started Now" / "Book a Free Discovery Call" / "Client Login" buttons, and even the
Squarespace cookie-consent banner's own buttons, which inherit the site's primary color): all
render at exactly `rgb(30, 149, 57)` = **`#1E9539`**.

**`#1E9539` is used as the canonical, verified primary green** for this application — not the
user-supplied provisional fallback (`#1F9D3A`), which was close but not exact.

## Supporting colors

The live site does not use a flat, named secondary/accent color system — sections use white
backgrounds or full-bleed background video/imagery with white overlay text, not solid color
blocks. No second brand color could be directly extracted from the site itself. The following
supporting palette is therefore the **user-provided provisional fallback**, retained as a
reasonable, clearly-labeled design decision:

| Role | Hex | Source |
|---|---|---|
| Primary green | `#1E9539` | **Verified** (site buttons + logo sampling) |
| Dark evergreen | `#123C27` | Provisional |
| Black | `#111111` | Provisional (site itself uses pure `#000000`) |
| White | `#FFFFFF` | Verified (site background) |
| Soft background | `#F7F8F6` | Provisional |
| Neutral border | `#DDE3DD` | Provisional (site has no visible borders to sample) |
| Muted text | `#5D665F` | Provisional |
| Amber (failure-to-file accent) | `#D99121` | Provisional |
| Orange (failure-to-pay accent) | `#D56828` | Provisional |
| Coral (interest accent) | `#C9534B` | Provisional |

## Text colors

Body text renders as pure black, `rgb(0, 0, 0)`, on a pure white, `rgb(255, 255, 255)`, background
— a high-contrast, no-frills combination.

## Background colors

No solid colored section backgrounds were found in the scanned areas. Visual variety on the
homepage comes from full-bleed background video/image sections with white overlay text (e.g. the
"We'll Get Your Case Settled" section), not from a flat secondary brand color.

## Heading fonts

**Raleway**, weight 500, used at multiple sizes: ~62px (H1, on the About page), ~43.6px (H2), ~34.4px
(H3), all at desktop viewport width (1280px). No letter-spacing or CSS text-transform is applied —
visible all-caps headings (e.g. "ABOUT EA TAX RESOLUTIONS") are literal uppercase text in the
source, not a CSS effect.

## Body fonts

**proxima-nova** (a licensed Adobe/Typekit font, not available for reuse in this standalone
application), rendered around 12.8px with a line-height of about 23px — notably small by modern
web-typography standards.

**This application substitutes Inter** (SIL Open Font License, freely licensable, loaded via
`next/font/google`) as a modern, highly legible, similarly neutral sans-serif for body copy, while
keeping Raleway for headings to preserve brand continuity.

## Button treatment

Every button and button-like link sampled on the live site (including the cookie-consent banner,
which inherits the site's global button styling) renders identically:

- Solid `#1E9539` fill
- White text, font-weight 500
- **`border-radius: 0`** — perfectly square corners, no rounding at all
- No box-shadow
- Padding of roughly 19px (single value, not asymmetric)

## Border treatment

No visible borders were detected on cards, sections, or containers in the scanned areas — the
current site relies on whitespace and background changes for separation rather than drawn borders
or shadows.

## Spacing scale

Not independently measurable from computed styles alone in the time available for this audit;
section padding on the live site appeared generous based on page-text extraction and layout
proportions, consistent with a spacious, uncluttered design.

## Existing visual strengths

- Clean, high-contrast black-on-white base palette with a single, confident brand green.
- Consistent, unmistakable use of that green across every call-to-action on the site.
- Uncluttered layout with generous whitespace and no competing accent colors.
- Straightforward, jargon-free headline copy ("Do You Owe Back Taxes? We can help!").

## Elements modernized for this application

Per explicit correction from the engagement's CPA reviewer: preserve more of the current identity
than a generic redesign would, rather than defaulting to a heavily-rounded, shadow-heavy "SaaS
dashboard" look.

- **Buttons:** slightly rounded (`rounded-md`, ~6px) rather than the live site's sharp 0px corners
  — a small softening, not a full pill shape.
- **Cards:** moderate rounding (`rounded-lg`/`rounded-xl`), a thin neutral border, and only a
  minimal shadow (`shadow-sm` at most) — the current site has neither rounding nor shadows at all,
  so this is a deliberate, modest addition of depth, not a wholesale redesign.
- **Body font:** Inter in place of the proprietary proxima-nova (a licensing necessity, chosen to be
  visually similar in neutrality and weight).
- **Color discipline:** the amber/orange/coral accent colors are used strictly for penalty/interest
  chart segments and small indicators — never as large background fields — so the green/black/white
  identity remains dominant, exactly as on the live site.
- **Animation:** restrained throughout (opacity/color/number transitions only, no bounce or
  easing flourishes), respecting `prefers-reduced-motion`.

## Logo asset

Downloaded and stored locally at `public/brand/ea-tax-resolutions-logo.png` (841×435px, no alpha
channel) rather than hotlinked, per production requirements. A square, white-padded favicon variant
was generated from this same source file at `public/brand/favicon.png`.
