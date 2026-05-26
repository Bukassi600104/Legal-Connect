import Link from "next/link";
import { LogoMark } from "@/components/shared/logo";

interface LegalSection {
  title: string;
  body: string[];
}

interface LegalDocumentPageProps {
  title: string;
  description: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export function LegalDocumentPage({
  title,
  description,
  lastUpdated,
  sections,
}: LegalDocumentPageProps) {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[15px] font-bold text-brand hover:text-brand-dark"
        >
          <LogoMark className="size-5" />
          LegalConnect NG
        </Link>

        <header className="mt-8 border-b border-border-custom pb-6">
          <p className="text-[13px] font-bold uppercase text-muted-text">
            Last updated {lastUpdated}
          </p>
          <h1 className="mt-2 text-[34px] font-extrabold leading-tight text-text-primary sm:text-[44px]">
            {title}
          </h1>
          <p className="mt-3 text-[17px] leading-7 text-muted-text">
            {description}
          </p>
        </header>

        <div className="divide-y divide-border-custom">
          {sections.map((section) => (
            <section key={section.title} className="py-6">
              <h2 className="text-[21px] font-extrabold text-text-primary">
                {section.title}
              </h2>
              <div className="mt-3 space-y-3">
                {section.body.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-[15px] leading-7 text-muted-text"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-8 rounded-2xl bg-[#F7F9F9] p-5">
          <p className="text-[15px] font-bold text-text-primary">
            Need help?
          </p>
          <p className="mt-1 text-[14px] leading-6 text-muted-text">
            Contact LegalConnect NG support for product questions. For legal
            advice, please contact a qualified lawyer directly through the
            marketplace.
          </p>
          <Link
            href="/help"
            className="mt-4 inline-flex h-9 items-center rounded-full bg-brand px-5 text-[15px] font-bold text-white hover:bg-brand-dark"
          >
            Visit Help
          </Link>
        </footer>
      </div>
    </main>
  );
}
