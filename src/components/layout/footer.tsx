import Link from "next/link";
import { Logo } from "@/components/shared/logo";

const footerLinks = {
  platform: {
    title: "Platform",
    links: [
      { label: "Find a Lawyer", href: "/explore" },
      { label: "Legal Feed", href: "/feed" },
      { label: "Pricing", href: "/pricing" },
      { label: "For Law Firms", href: "/for-firms" },
    ],
  },
  resources: {
    title: "Resources",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Blog", href: "/blog" },
      { label: "API", href: "/api-docs" },
      { label: "Verification", href: "/verification-info" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "Disclaimers", href: "/disclaimers" },
    ],
  },
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border-custom bg-navy">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Logo
              href="/"
              size="default"
              className="mb-4 [&_span:last-child]:text-white"
            />
            <p className="text-sm leading-relaxed text-white/60">
              Connecting clients with verified legal professionals across
              Nigeria. Trusted, transparent, accessible.
            </p>
          </div>

          {/* Link columns */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h3 className="mb-3 text-sm font-semibold text-white">
                {section.title}
              </h3>
              <ul className="flex flex-col gap-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 transition-colors hover:text-gold"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 md:flex-row">
          <p className="text-xs text-white/40">
            &copy; {currentYear} LegalConnect NG. All rights reserved.
          </p>
          <p className="text-xs text-white/40">
            Made with care in Lagos, Nigeria
          </p>
        </div>
      </div>
    </footer>
  );
}
