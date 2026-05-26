import { LegalDocumentPage } from "@/components/shared/legal-document-page";

export default function HelpPage() {
  return (
    <LegalDocumentPage
      title="Help Center"
      description="Quick guidance for clients, lawyers, and partners using LegalConnect NG."
      lastUpdated="May 26, 2026"
      sections={[
        {
          title: "For Clients",
          body: [
            "Use Explore to search by specialization, location, verification status, and profile details. Review lawyer profiles before starting contact or booking intent.",
            "LegalConnect NG helps you find lawyers, but it does not replace independent judgment. Ask questions, confirm fees, and agree engagement terms directly with the lawyer.",
          ],
        },
        {
          title: "For Lawyers",
          body: [
            "Create a lawyer account, complete your profile, add specializations and location, submit verification documents, and publish useful legal insights to build credibility.",
            "Paid plans improve visibility and growth tools. Keep your profile accurate so clients understand your services and availability.",
          ],
        },
        {
          title: "Verification Support",
          body: [
            "Lawyers may be asked to provide a Supreme Court Enrollment Number, Call to Bar certificate, practising fee evidence, and a government-issued ID.",
            "Rejected requests can be resubmitted with clearer or corrected documentation.",
          ],
        },
        {
          title: "Safety",
          body: [
            "Report suspicious profiles, misleading claims, spam, or abusive content. Do not send payments outside agreed channels without confirming the lawyer and engagement terms.",
            "For urgent legal emergencies, contact a lawyer directly or seek immediate local assistance.",
          ],
        },
      ]}
    />
  );
}
