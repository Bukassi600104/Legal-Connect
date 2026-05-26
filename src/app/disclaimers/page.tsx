import { LegalDocumentPage } from "@/components/shared/legal-document-page";

export const metadata = {
  title: "Disclaimers",
  description:
    "Important marketplace, legal advice, verification, payment, and third-party disclaimers for LegalConnect NG.",
};

export default function DisclaimersPage() {
  return (
    <LegalDocumentPage
      title="Disclaimers"
      description="Important boundaries for using LegalConnect NG as a legal marketplace and professional network."
      lastUpdated="May 26, 2026"
      sections={[
        {
          title: "Not a law firm",
          body: [
            "LegalConnect NG is a technology marketplace and professional network. It is not a law firm and does not provide legal advice, legal representation, or legal opinions.",
          ],
        },
        {
          title: "Lawyer-client relationships",
          body: [
            "Contacting a lawyer through LegalConnect NG does not automatically create a lawyer-client relationship. Engagement terms, fees, confidentiality, and scope of work should be agreed directly between the client and the lawyer.",
          ],
        },
        {
          title: "Verification limits",
          body: [
            "Verification signals indicate that submitted credential information was reviewed against current platform requirements. Verification does not guarantee quality, outcome, availability, professional standing at every future date, or suitability for a specific matter.",
          ],
        },
        {
          title: "Payments and fees",
          body: [
            "Lawyer subscription payments are processed by payment providers. Client consultation fees shown on profiles or pages are guidance only unless separately agreed with the lawyer.",
          ],
        },
        {
          title: "Content accuracy",
          body: [
            "Posts, comments, profiles, and messages are created by users. LegalConnect NG may moderate content, but users should independently verify important information before acting on it.",
          ],
        },
      ]}
    />
  );
}
