/**
 * Every URL in this file is an official government source (irs.gov,
 * law.cornell.edu mirrors of the U.S. Code, or ecfr.gov). No third-party
 * commentary, tax-preparation-company blog, or summary site is cited here
 * or anywhere else in this application's shipped data or documentation.
 */
export interface OfficialSource {
  id: string;
  title: string;
  url: string;
  topic: "failure-to-file" | "failure-to-pay" | "interest" | "general";
}

export const OFFICIAL_SOURCES: OfficialSource[] = [
  {
    id: "irs-ftf-penalty",
    title: "Failure to file penalty",
    url: "https://www.irs.gov/payments/failure-to-file-penalty",
    topic: "failure-to-file",
  },
  {
    id: "irm-20-1-2",
    title: "IRM 20.1.2 — Failure To File/Failure To Pay Penalties",
    url: "https://www.irs.gov/irm/part20/irm_20-001-002r",
    topic: "failure-to-file",
  },
  {
    id: "irc-6651",
    title: "26 U.S.C. § 6651 — Failure to file tax return or to pay tax",
    url: "https://www.law.cornell.edu/uscode/text/26/6651",
    topic: "failure-to-file",
  },
  {
    id: "irs-ftp-penalty",
    title: "Failure to pay penalty",
    url: "https://www.irs.gov/payments/failure-to-pay-penalty",
    topic: "failure-to-pay",
  },
  {
    id: "irs-interest",
    title: "Interest",
    url: "https://www.irs.gov/payments/interest",
    topic: "interest",
  },
  {
    id: "irs-quarterly-rates",
    title: "Quarterly interest rates",
    url: "https://www.irs.gov/payments/quarterly-interest-rates",
    topic: "interest",
  },
  {
    id: "irm-20-2-5",
    title: "IRM 20.2.5 — Interest on Underpayments",
    url: "https://www.irs.gov/irm/part20/irm_20-002-005r",
    topic: "interest",
  },
  {
    id: "irc-6601",
    title: "26 U.S.C. § 6601 — Interest on underpayment, nonpayment, or extension of time for payment, of tax",
    url: "https://www.law.cornell.edu/uscode/text/26/6601",
    topic: "interest",
  },
  {
    id: "irc-6621",
    title: "26 U.S.C. § 6621 — Determination of rate of interest",
    url: "https://www.law.cornell.edu/uscode/text/26/6621",
    topic: "interest",
  },
  {
    id: "irc-6622",
    title: "26 U.S.C. § 6622 — Interest compounded daily",
    url: "https://www.law.cornell.edu/uscode/text/26/6622",
    topic: "interest",
  },
  {
    id: "cfr-301-6622-1",
    title: "26 CFR § 301.6622-1 — Interest compounded daily",
    url: "https://www.ecfr.gov/current/title-26/section-301.6622-1",
    topic: "interest",
  },
];

export function sourcesForTopic(topic: OfficialSource["topic"]): OfficialSource[] {
  return OFFICIAL_SOURCES.filter((s) => s.topic === topic || s.topic === "general");
}
