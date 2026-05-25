import Link from "next/link";
import {
  Search,
  MessageCircle,
  Calendar,
  Star,
  ArrowRight,
  Scale,
  Users,
  BadgeCheck,
  TrendingUp,
} from "lucide-react";

// ============ HERO SECTION ============

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white py-20 pt-28 md:py-28 md:pt-36 lg:py-32 lg:pt-40">
      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-[40px] leading-tight font-extrabold tracking-tight text-text-primary md:text-[56px] lg:text-[64px]">
            Find Trusted Lawyers
            <span className="block text-brand">in Nigeria</span>
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-[17px] leading-relaxed text-muted-text md:text-[20px]">
            Connect with verified legal professionals. Get expert insights,
            book consultations, and find the representation you deserve.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/explore"
              className="inline-flex h-[52px] items-center gap-2 rounded-full bg-brand px-8 text-[17px] font-bold text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand-dark"
            >
              <Search className="size-5" />
              Find a Lawyer
            </Link>
            <Link
              href="/signup/lawyer"
              className="inline-flex h-[52px] items-center gap-2 rounded-full border border-border-custom px-8 text-[17px] font-bold text-text-primary transition-all hover:bg-[#E7E9EA]"
            >
              Join as a Lawyer
              <ArrowRight className="size-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ STATS BAR ============

function StatsBar() {
  const stats = [
    { value: "500+", label: "Verified Lawyers" },
    { value: "36+", label: "States Covered" },
    { value: "16", label: "Specializations" },
    { value: "10K+", label: "Consultations" },
  ];

  return (
    <section className="border-y border-border-custom bg-[#F7F9F9] py-8">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 md:grid-cols-4 lg:px-8">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-2xl font-extrabold text-text-primary md:text-3xl">{stat.value}</p>
            <p className="mt-1 text-[15px] text-muted-text">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ============ HOW IT WORKS ============

function HowItWorks() {
  const steps = [
    {
      step: 1,
      icon: Search,
      title: "Search & Discover",
      description:
        "Browse verified lawyers by specialization, location, or expertise.",
    },
    {
      step: 2,
      icon: Users,
      title: "Review & Connect",
      description:
        "Read profiles, check ratings, and start a conversation directly.",
    },
    {
      step: 3,
      icon: Calendar,
      title: "Book & Consult",
      description:
        "Schedule consultations at your convenience. Video, phone, or in-person.",
    },
  ];

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[31px] font-extrabold text-text-primary md:text-[40px]">
            How It Works
          </h2>
          <p className="mt-3 text-[17px] text-muted-text">
            Three simple steps to connect with the right lawyer.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((item) => (
            <div
              key={item.step}
              className="relative rounded-2xl border border-border-custom p-8 text-center transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-brand/10">
                <item.icon className="size-7 text-brand" />
              </div>
              <div className="absolute left-4 top-4 flex size-7 items-center justify-center rounded-full bg-text-primary text-xs font-bold text-white">
                {item.step}
              </div>
              <h3 className="text-xl font-bold text-text-primary">{item.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-text">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ FEATURES ============

function Features() {
  const features = [
    {
      icon: BadgeCheck,
      title: "Verified Lawyers",
      description:
        "Every lawyer goes through verification. Check SCN numbers and credentials.",
    },
    {
      icon: MessageCircle,
      title: "Direct Messaging",
      description:
        "Chat directly with lawyers before booking. Ask questions freely.",
    },
    {
      icon: TrendingUp,
      title: "Legal Feed",
      description:
        "Stay informed with expert posts on Nigerian law and updates.",
    },
    {
      icon: Star,
      title: "Ratings & Reviews",
      description:
        "Real feedback from real clients for informed decisions.",
    },
    {
      icon: Calendar,
      title: "Easy Booking",
      description:
        "Schedule video, phone, or in-person consultations effortlessly.",
    },
    {
      icon: Scale,
      title: "Secure & Private",
      description:
        "Your conversations and data are encrypted and private.",
    },
  ];

  return (
    <section className="border-t border-border-custom bg-[#F7F9F9] py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[31px] font-extrabold text-text-primary md:text-[40px]">
            Everything You Need
          </h2>
          <p className="mt-3 text-[17px] text-muted-text">
            A complete platform connecting clients with legal professionals
          </p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-border-custom bg-white p-6 transition-all hover:shadow-sm"
            >
              <div className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-brand/10">
                <feature.icon className="size-6 text-brand" />
              </div>
              <h3 className="text-[17px] font-bold text-text-primary">{feature.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-text">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ FOR LAWYERS CTA ============

function ForLawyersCTA() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-text-primary">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div className="p-8 md:p-12 lg:p-16">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand/20 px-3 py-1 text-sm font-bold text-brand">
                <Scale className="size-4" />
                For Legal Professionals
              </div>
              <h2 className="mt-6 text-[31px] font-extrabold text-white md:text-[40px] leading-tight">
                Grow Your Practice
              </h2>
              <p className="mt-4 text-[17px] leading-relaxed text-white/60">
                Join Nigeria&apos;s fastest-growing legal marketplace. Get discovered
                by clients and manage consultations in one platform.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Get verified and build trust with clients",
                  "Share expert content and grow your following",
                  "Manage bookings and consultations effortlessly",
                  "Access analytics to grow your practice",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-[15px] text-white/80"
                  >
                    <BadgeCheck className="mt-0.5 size-4 shrink-0 text-brand" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-10">
                <Link
                  href="/signup/lawyer"
                  className="inline-flex h-[52px] items-center gap-2 rounded-full bg-brand px-8 text-[17px] font-bold text-white transition-all hover:bg-brand-dark"
                >
                  Join as a Lawyer
                  <ArrowRight className="size-5" />
                </Link>
              </div>
            </div>
            <div className="hidden md:flex md:items-center md:justify-center md:p-8">
              <div className="grid w-full max-w-xs gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl bg-white/5 p-4 backdrop-blur">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-brand/20" />
                      <div className="flex-1">
                        <div className="h-3 w-24 rounded bg-white/20" />
                        <div className="mt-1 h-2 w-16 rounded bg-white/10" />
                      </div>
                      <BadgeCheck className="size-5 text-brand" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ FINAL CTA ============

function FinalCTA() {
  return (
    <section className="border-t border-border-custom bg-[#F7F9F9] py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center lg:px-8">
        <h2 className="text-[31px] font-extrabold text-text-primary md:text-[40px]">
          Ready to Get Started?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-[17px] text-muted-text">
          Whether you need legal help or you&apos;re a lawyer looking to grow,
          LegalConnect is the platform for you.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className="inline-flex h-[52px] items-center gap-2 rounded-full bg-brand px-8 text-[17px] font-bold text-white transition-all hover:bg-brand-dark"
          >
            Create Your Account
            <ArrowRight className="size-5" />
          </Link>
          <Link
            href="/explore"
            className="inline-flex h-[52px] items-center gap-2 rounded-full border border-border-custom px-8 text-[17px] font-bold text-text-primary transition-all hover:bg-[#E7E9EA]"
          >
            Browse Lawyers
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============ LANDING NAVBAR ============

function LandingNavbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-md border-b border-border-custom">
      <div className="mx-auto flex h-[60px] max-w-7xl items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center rounded-full bg-brand p-1.5">
            <Scale className="size-5 text-white" />
          </span>
          <span className="text-xl font-extrabold text-text-primary tracking-tight">
            Legal<span className="text-brand">Connect</span>
          </span>
        </div>
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/explore"
            className="text-[15px] font-medium text-muted-text transition-colors hover:text-text-primary"
          >
            Find a Lawyer
          </Link>
          <Link
            href="/pricing"
            className="text-[15px] font-medium text-muted-text transition-colors hover:text-text-primary"
          >
            Pricing
          </Link>
          <Link
            href="/feed"
            className="text-[15px] font-medium text-muted-text transition-colors hover:text-text-primary"
          >
            Feed
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="inline-flex h-9 items-center rounded-full px-4 text-[15px] font-bold text-brand hover:bg-brand/5 transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-9 items-center rounded-full bg-brand px-5 text-[15px] font-bold text-white transition-all hover:bg-brand-dark"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}

// ============ FOOTER ============

function LandingFooter() {
  return (
    <footer className="border-t border-border-custom bg-white py-8">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Scale className="size-5 text-brand" />
            <span className="text-[15px] font-bold text-text-primary">
              Legal<span className="text-brand">Connect</span> NG
            </span>
          </div>
          <div className="flex gap-6 text-[13px] text-muted-text">
            <Link href="/terms" className="hover:text-text-primary">Terms</Link>
            <Link href="/privacy" className="hover:text-text-primary">Privacy</Link>
            <Link href="/cookies" className="hover:text-text-primary">Cookies</Link>
            <Link href="/help" className="hover:text-text-primary">Help</Link>
          </div>
          <p className="text-[13px] text-muted-text">
            &copy; {new Date().getFullYear()} LegalConnect NG
          </p>
        </div>
      </div>
    </footer>
  );
}

// ============ PAGE ============

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingNavbar />
      <main>
        <HeroSection />
        <StatsBar />
        <HowItWorks />
        <Features />
        <ForLawyersCTA />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
