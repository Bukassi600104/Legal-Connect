import { LegalDocumentPage } from "@/components/shared/legal-document-page";

export default function PrivacyPage() {
  return (
    <LegalDocumentPage
      title="Privacy Policy"
      description="This policy describes the information LegalConnect NG collects and how it is used to operate the marketplace."
      lastUpdated="May 26, 2026"
      sections={[
        {
          title: "Information We Collect",
          body: [
            "We collect account details such as name, email, phone number, role, profile details, lawyer credentials, messages, posts, follows, bookmarks, consultation requests, and subscription activity.",
            "We may also collect device, usage, log, and cookie information to secure, operate, improve, and measure the platform.",
          ],
        },
        {
          title: "How We Use Information",
          body: [
            "We use information to create accounts, show lawyer profiles, enable discovery, support messaging and booking intent, review verification requests, process lawyer subscriptions, prevent abuse, and improve the product.",
            "Public profile and feed content may be visible to visitors and search engines unless a feature clearly marks content as private.",
          ],
        },
        {
          title: "Sharing",
          body: [
            "We share information between clients and lawyers when a user initiates contact, sends messages, or submits booking intent. Payment providers receive information needed to process subscriptions.",
            "We do not sell personal information. We may disclose information when required by law, to enforce platform rules, or to protect users and the service.",
          ],
        },
        {
          title: "Security",
          body: [
            "LegalConnect NG uses Firebase, access rules, authenticated sessions, and operational controls to protect data. No internet service can guarantee perfect security.",
            "Users should avoid sending highly sensitive documents or privileged legal information until they have confirmed the lawyer-client relationship and preferred secure channel with their lawyer.",
          ],
        },
      ]}
    />
  );
}
