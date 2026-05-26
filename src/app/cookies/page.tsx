import { LegalDocumentPage } from "@/components/shared/legal-document-page";

export default function CookiesPage() {
  return (
    <LegalDocumentPage
      title="Cookie Notice"
      description="LegalConnect NG uses cookies and similar technologies to keep accounts secure and improve the product."
      lastUpdated="May 26, 2026"
      sections={[
        {
          title: "Essential Cookies",
          body: [
            "Essential cookies help keep users signed in, protect sessions, remember authentication state, and support core marketplace functionality.",
            "These cookies are necessary for secure account and dashboard experiences.",
          ],
        },
        {
          title: "Analytics And Product Signals",
          body: [
            "We may use privacy-conscious analytics and product signals to understand page usage, conversion paths, errors, and feature adoption.",
            "These signals help us improve lawyer discovery, onboarding, search, pricing, and support experiences.",
          ],
        },
        {
          title: "Your Choices",
          body: [
            "Browser settings can block or delete cookies, but some account features may stop working correctly without essential cookies.",
            "As the platform matures, LegalConnect NG should provide clearer in-product consent controls for optional analytics and marketing cookies.",
          ],
        },
      ]}
    />
  );
}
