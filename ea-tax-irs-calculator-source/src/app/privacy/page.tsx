import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Privacy | EA Tax Resolutions",
  description: "How the IRS Penalty and Interest Calculator handles your data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold text-ea-evergreen">Privacy</h1>
        <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed text-ea-black">
          <p>
            This calculator is designed to be privacy-first. All calculations run entirely in your browser.
            Nothing you type is transmitted to a server, stored in a database, or saved automatically.
          </p>
          <ul className="list-disc pl-5">
            <li>No database and no server-side storage of your entries.</li>
            <li>No hidden form submissions.</li>
            <li>No session recordings.</li>
            <li>No advertising trackers.</li>
            <li>No Social Security number field, IRS account number field, document upload, or address field — please do not enter this information.</li>
            <li>No automatic localStorage of your entries.</li>
          </ul>
          <p>
            Optional, anonymous usage analytics (such as &quot;calculator started&quot; or &quot;estimate
            completed&quot;) are disabled by default and, if ever enabled, never include the dollar amounts
            or dates you enter — only the fact that an event occurred.
          </p>
          <p>
            Refreshing or closing this page clears everything you entered. If you use the print or download
            options, the resulting file is created locally in your browser and is your responsibility to
            store securely.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
