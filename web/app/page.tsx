"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  CalendarIcon,
  SparklesIcon,
  ClockIcon,
  UsersIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/providers/AuthProvider";

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isAuthenticated) router.push("/calendar");
  }, [isAuthenticated, router]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Entrance timeline for hero
      const tl = gsap.timeline();
      tl.from(".brand", { opacity: 0, y: -12, duration: 0.45, ease: "power2.out" })
        .from(".hero-badge", { opacity: 0, y: -20, duration: 0.45, ease: "back.out(1.5)" })
        .from(".hero-title .line", {
          clipPath: "inset(0 0 100% 0)",
          stagger: 0.06,
          duration: 0.7,
          ease: "power3.out",
        })
        .from(".hero-sub", { opacity: 0, y: 18, duration: 0.6, ease: "power2.out" }, "-=0.3")
        .from(
          ".hero-cta",
          { opacity: 0, scale: 0.96, duration: 0.45, ease: "back.out(1.4)" },
          "-=0.3"
        );

      // Floating illustration bob
      gsap.to(".float-bob", {
        y: 18,
        duration: 3.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // Staggered feature reveal on scroll
      gsap.from(".feature", {
        scrollTrigger: { trigger: ".features", start: "top 85%" },
        opacity: 0,
        y: 36,
        stagger: 0.12,
        duration: 0.7,
        ease: "power3.out",
      });

      // Stats pop
      gsap.from(".stat", {
        scrollTrigger: { trigger: ".stats", start: "top 85%" },
        scale: 0.9,
        opacity: 0,
        stagger: 0.12,
        duration: 0.6,
        ease: "back.out(1.5)",
      });

      // subtle parallax for background blobs
      gsap.to(".bg-blob", {
        yPercent: -12,
        scrollTrigger: { scrub: 0.8 },
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  const features = [
    {
      icon: CalendarIcon,
      title: "Smart scheduling",
      description: "Natural language scheduling that actually understands meeting intent.",
    },
    {
      icon: SparklesIcon,
      title: "AI assistant",
      description: "Create, reschedule, summarize — just ask.",
    },
    {
      icon: ClockIcon,
      title: "Time optimizer",
      description: "Auto-groups tasks and spots hidden free time.",
    },
    {
      icon: UsersIcon,
      title: "Unified calendars",
      description: "Google, Outlook, Apple — one synced view.",
    },
  ];

  const stats = [
    { value: "10K+", label: "Active people using Smart Calendar" },
    { value: "500K+", label: "Meetings scheduled" },
    { value: "95%", label: "Avg. time saved per user" },
    { value: "4.9/5", label: "Average rating" },
  ];

  if (isAuthenticated) return null;

  return (
    <div
      ref={rootRef}
      className="min-h-screen bg-[linear-gradient(180deg,#0f1724,transparent)] text-white antialiased"
    >
      {/* NOTE: Add fonts to globals.css:
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@300;400;600&display=swap');
          html { --ff-heading: 'Space Grotesk', system-ui, sans-serif; --ff-body: 'Inter', system-ui, sans-serif; }
      */}

      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/6 backdrop-blur-sm bg-black/30">
        <div className="container mx-auto flex items-center justify-between h-16 px-5">
          <div
            className="flex items-center gap-3 brand cursor-pointer"
            onClick={() => router.push("/")}
          >
            <div className="flex items-center gap-2">
              <div className="rounded-md p-1 bg-gradient-to-br from-[#7c3aed] to-[#06b6d4]">
                <CalendarIcon className="h-6 w-6 text-black/90" />
              </div>
              <span className="font-[600] text-lg" style={{ fontFamily: "var(--ff-heading)" }}>
                Smart <span className="text-[#06b6d4]">Calendar</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              className="text-sm font-medium opacity-90 hover:opacity-100"
              onClick={() => router.push("/login")}
            >
              Log in
            </button>
            <Button onClick={() => router.push("/signup")}>Create account</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="pt-28 pb-20">
        <section className="relative overflow-hidden">
          {/* decorative blobs (parallax) */}
          <div
            className="absolute -left-40 top-10 w-[520px] h-[520px] rounded-full bg-[#7c3aed33] filter blur-[80px] bg-blob"
            aria-hidden
          />
          <div
            className="absolute -right-40 bottom-6 w-[680px] h-[680px] rounded-full bg-[#06b6d433] filter blur-[120px] bg-blob"
            aria-hidden
          />

          <div className="container mx-auto max-w-6xl px-5 relative z-10">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="text-left">
                <div className="inline-block hero-badge rounded-full px-3 py-1 mb-6 text-sm bg-white/8 backdrop-blur-sm border border-white/6">
                  <strong>New</strong> • AI-first scheduling
                </div>

                <h1
                  className="hero-title text-4xl md:text-6xl font-[700] leading-tight mb-4"
                  style={{ fontFamily: "var(--ff-heading)" }}
                >
                  Your calendar,{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#7c3aed] to-[#06b6d4]">
                    but friendlier
                  </span>
                </h1>

                <p className="hero-sub text-lg md:text-xl text-white/80 mb-6 max-w-xl">
                  Smart Calendar helps reduce meeting overhead, auto-suggests times, and drafts
                  quick meeting notes — all with a friendly assistant that understands context.
                </p>

                <div className="flex flex-wrap gap-3 hero-cta">
                  <Button size="lg" onClick={() => router.push("/signup")} className="group">
                    Start free
                    <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => router.push("/login")}>
                    Sign in
                  </Button>
                </div>

                <div className="mt-6 stats flex gap-4 flex-wrap">
                  {stats.map((s, i) => (
                    <div key={i} className="stat rounded-xl bg-white/4 px-3 py-2 text-left">
                      <div className="text-sm text-white/60">{s.label}</div>
                      <div className="text-xl font-bold">{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Illustration card with playful calendar tiles */}
              <div className="relative flex justify-center">
                <div className="w-full max-w-md">
                  <div className="float-bob rounded-3xl bg-gradient-to-br from-[#061026]/60 to-[#061026]/40 p-6 backdrop-blur-md border border-white/6 shadow-2xl">
                    {/* Simple hand-drawn style SVG hero (inline for control) */}
                    <svg
                      viewBox="0 0 720 420"
                      className="w-full h-auto rounded-lg"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <defs>
                        <linearGradient id="g1" x1="0" x2="1">
                          <stop offset="0" stopColor="#7c3aed" stopOpacity="1" />
                          <stop offset="1" stopColor="#06b6d4" stopOpacity="1" />
                        </linearGradient>
                        <filter id="f1" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="18" result="b" />
                          <feBlend in="SourceGraphic" in2="b" />
                        </filter>
                      </defs>

                      <rect
                        x="20"
                        y="30"
                        rx="18"
                        ry="18"
                        width="460"
                        height="320"
                        fill="#0b1220"
                        stroke="#ffffff10"
                        strokeWidth="1"
                      />
                      {/* calendar header */}
                      <rect
                        x="60"
                        y="58"
                        width="380"
                        height="48"
                        rx="10"
                        fill="url(#g1)"
                        filter="url(#f1)"
                      />
                      {/* a few event tiles */}
                      <rect x="80" y="130" rx="8" ry="8" width="140" height="36" fill="#ffffff08" />
                      <rect
                        x="240"
                        y="130"
                        rx="8"
                        ry="8"
                        width="160"
                        height="36"
                        fill="#ffffff06"
                      />
                      <rect x="80" y="180" rx="8" ry="8" width="320" height="36" fill="#ffffff06" />
                      {/* playful avatar */}
                      <circle cx="520" cy="90" r="36" fill="#ffd166" />
                      <text
                        x="520"
                        y="96"
                        fontSize="20"
                        fontFamily="sans-serif"
                        textAnchor="middle"
                        fill="#111"
                      >
                        Me
                      </text>
                      {/* sparkles */}
                      <g transform="translate(520,200) rotate(-20)">
                        <path
                          d="M0-18 L4 -6 L18 -6 L6 2 L10 14 L0 6 L-10 14 L-6 2 L-18 -6 L-4 -6 Z"
                          fill="#fff6"
                        />
                      </g>
                    </svg>
                  </div>

                  {/* small floating mini-card stack for depth */}
                  <div className="absolute -left-8 -bottom-6 rotate-3">
                    <div className="w-36 h-20 rounded-2xl bg-white/6 p-3 border border-white/6 shadow-lg">
                      <div className="text-xs text-white/70">Tomorrow</div>
                      <div className="text-sm font-semibold mt-1">Design sync · 11:30</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="features mt-20 px-5">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} className="feature rounded-2xl p-5 bg-white/3 border border-white/6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#06b6d4] mb-3">
                      <Icon className="h-5 w-5 text-black/90" />
                    </div>
                    <div className="font-semibold mb-1">{f.title}</div>
                    <div className="text-sm text-white/75">{f.description}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonials / Trust (small) */}
        <section className="mt-20 px-5">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-white/6 mb-4">
              Loved by teams
            </div>
            <h3 className="text-2xl font-[600] mb-3" style={{ fontFamily: "var(--ff-heading)" }}>
              Loved by designers & PMs
            </h3>
            <p className="text-white/70 max-w-2xl mx-auto">
              “Cut our meeting time in half — the assistant drafts agendas and finds better slots
              automatically.”
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mt-16 px-5">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="rounded-3xl p-8 bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] shadow-2xl">
              <h3 className="text-2xl font-[700] mb-3">Make your calendar actually useful</h3>
              <p className="text-white/90 mb-6">Try Smart Calendar free — cancel anytime.</p>
              <Button size="lg" onClick={() => router.push("/signup")}>
                Get started — it’s free
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t border-white/6 text-center text-white/60">
        <div className="container mx-auto max-w-6xl px-5">
          <div>
            &copy; {new Date().getFullYear()} Smart Calendar — friendly scheduling for busy people.
          </div>
        </div>
      </footer>
    </div>
  );
}
