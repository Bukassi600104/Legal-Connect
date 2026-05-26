import { LegalDocumentPage } from "@/components/shared/legal-document-page";

export default function TermsPage() {
  return (
    <LegalDocumentPage
      title="Terms of Service"
      description="These terms explain how clients, lawyers, and visitors may use LegalConnect NG."
      lastUpdated="May 26, 2026"
      sections={[
        {
          title: "Platform Role",
          body: [
            "LegalConnect NG is a marketplace and professional network that helps people discover and contact legal professionals in Nigeria. LegalConnect NG is not a law firm and does not provide legal advice.",
            "Information shared on public feeds, profiles, and marketplace pages is for general information only. A lawyer-client relationship is formed only when a client and lawyer independently agree to one.",
          ],
        },
        {
          title: "Accounts",
          body: [
            "Users must provide accurate account information and keep login credentials secure. Lawyers are responsible for keeping professional profile, location, availability, fee, and credential information current.",
            "We may restrict, suspend, or remove accounts that impersonate others, misrepresent credentials, abuse the platform, or violate applicable law.",
          ],
        },
        {
          title: "Lawyer Verification",
          body: [
            "Verification badges indicate that submitted credentials have been reviewed by LegalConnect NG or its administrators. Verification does not guarantee legal outcomes, quality of service, or availability.",
            "Lawyers remain responsible for professional conduct, client confidentiality, and compliance with applicable Nigerian legal and professional rules.",
          ],
        },
        {
          title: "Subscriptions",
          body: [
            "Paid lawyer plans provide visibility, profile, and growth features. Subscription prices, billing cycles, and plan benefits are shown on the pricing page before checkout.",
            "LegalConnect NG may update plan benefits over time, but active subscribers will receive reasonable notice of material changes where practical.",
          ],
        },
        {
          title: "Acceptable Use",
          body: [
            "Users may not post unlawful, fraudulent, defamatory, harassing, or misleading content. Users may not scrape, spam, overload, or interfere with the platform.",
            "LegalConnect NG may moderate posts, profiles, messages, and accounts to protect users and preserve marketplace trust.",
          ],
        },
      ]}
    />
  );
}
