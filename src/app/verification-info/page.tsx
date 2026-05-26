import { LegalDocumentPage } from "@/components/shared/legal-document-page";

export default function VerificationInfoPage() {
  return (
    <LegalDocumentPage
      title="Verification Policy"
      description="How LegalConnect NG reviews lawyer credentials and displays trust signals."
      lastUpdated="May 26, 2026"
      sections={[
        {
          title: "What Verification Means",
          body: [
            "A verified badge means a lawyer submitted professional credential information that was reviewed by LegalConnect NG administrators.",
            "Verification is a trust signal, not a guarantee of legal outcomes, availability, pricing, or client satisfaction.",
          ],
        },
        {
          title: "Documents Reviewed",
          body: [
            "Verification may include review of Supreme Court Enrollment Number, Call to Bar certificate, current practising fee evidence, identification documents, and other supporting information.",
            "LegalConnect NG may request additional documents when the submitted information is unclear or inconsistent.",
          ],
        },
        {
          title: "Statuses",
          body: [
            "Unverified means no approved verification is on file. Pending means documents have been submitted for review. Verified means the submission was approved. Rejected means the submission did not meet current review requirements.",
            "Verification status may change if credentials expire, information becomes inaccurate, or platform rules are violated.",
          ],
        },
        {
          title: "Client Guidance",
          body: [
            "Clients should still ask lawyers about experience, scope, fees, timeline, and engagement terms before relying on legal services.",
            "LegalConnect NG does not supervise lawyer-client relationships and does not provide legal advice.",
          ],
        },
      ]}
    />
  );
}
