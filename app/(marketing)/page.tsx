import Link from "next/link";
import { BarChart3, Shield, Zap } from "lucide-react";
import { CrelLogo } from "@/components/brand/crel-logo";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Shield,
    title: "Privacy-first",
    desc: "No third-party trackers. You control your data on Supabase.",
  },
  {
    icon: Zap,
    title: "Under 6KB script",
    desc: "Vanilla JS tracker with batching, SPA support, and retries.",
  },
  {
    icon: BarChart3,
    title: "Real-time dashboard",
    desc: "Pageviews, sessions, UTM sources, devices, and custom events.",
  },
];

export default function LandingPage() {
  return (
    <div className="apple-hero-gradient flex min-h-full flex-col">
      <header className="apple-glass sticky top-0 z-50 border-b border-border/60">
        <div className="mx-auto flex w-full max-w-[980px] items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center" aria-label="Crel home">
            <CrelLogo height={28} priority className="max-w-[8.5rem]" />
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link href="/login">
              <Button variant="ghost" className="apple-pill text-[14px] font-normal">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="apple-pill h-9 px-5 text-[14px]">Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[980px] flex-1 flex-col items-center px-6 pb-24 pt-16 text-center sm:pt-24">
        <p className="mb-6 text-[12px] font-medium uppercase tracking-widest text-muted-foreground">
          Open source · Privacy-first
        </p>
        <h1 className="text-balance max-w-[800px] text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[56px] lg:text-[64px]">
          Analytics you own.
        </h1>
        <p className="mt-4 max-w-[540px] text-[19px] leading-relaxed text-muted-foreground sm:text-[21px] sm:leading-[1.4]">
          Lightweight web analytics with a script under 6KB. Built on Next.js and
          Supabase. No cookies required.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg" className="apple-pill h-11 min-w-[140px] text-[15px]">
              Start for free
            </Button>
          </Link>
          <Link href="/login">
            <Button
              size="lg"
              variant="outline"
              className="apple-pill h-11 min-w-[140px] border-border/80 bg-card/50 text-[15px] backdrop-blur-sm"
            >
              View dashboard
            </Button>
          </Link>
        </div>
        <div className="mt-28 grid w-full gap-5 sm:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border/60 bg-card/80 p-8 text-left shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md"
            >
              <f.icon className="mb-4 h-9 w-9 text-primary" strokeWidth={1.75} />
              <h3 className="text-[19px] font-semibold tracking-[-0.02em]">{f.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-[12px] text-muted-foreground">
        <p>© {new Date().getFullYear()} Crel. Open source under MIT.</p>
      </footer>
    </div>
  );
}
