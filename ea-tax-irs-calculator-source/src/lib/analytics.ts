/**
 * Analytics hooks are DISABLED BY DEFAULT and only ever track anonymous
 * event names — never input values, calculation results, or dollar
 * amounts. No taxpayer data leaves the browser. See PRIVACY.md.
 *
 * To enable, set NEXT_PUBLIC_ANALYTICS_ENABLED=true and wire `track` below
 * to a privacy-respecting analytics provider of your choice. As shipped,
 * this module only logs to the console in development and is a no-op
 * otherwise — there is no network call anywhere in this file.
 */
export type AnalyticsEvent =
  | "calculator_started"
  | "estimate_completed"
  | "methodology_opened"
  | "calendly_cta_clicked"
  | "penalty_abatement_link_clicked";

const ANALYTICS_ENABLED = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true";

export function track(event: AnalyticsEvent): void {
  if (!ANALYTICS_ENABLED) return;
  if (process.env.NODE_ENV !== "production") {
    console.debug("[analytics]", event);
  }
}
