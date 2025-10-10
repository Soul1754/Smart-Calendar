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
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/calendar");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Hero animations
      gsap.from(".hero-badge", { opacity: 0, y: -30, duration: 0.8, ease: "back.out(1.7)" });
      gsap.from(".hero-title", { opacity: 0, y: 50, duration: 1, delay: 0.3, ease: "power3.out" });
      gsap.from(".hero-subtitle", {
        opacity: 0,
        y: 30,
        duration: 0.8,
        delay: 0.6,
        ease: "power2.out",
      });
      gsap.from(".hero-cta", {
        opacity: 0,
        scale: 0.8,
        duration: 0.6,
        delay: 0.9,
        ease: "back.out(1.7)",
      });

      // Floating shapes
      gsap.to(".floating-shape", {
        y: "+=30",
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: { amount: 1.5 },
      });

      // Stats animation
      gsap.from(".stat-card", {
        scrollTrigger: { trigger: ".stats-section", start: "top 80%" },
        opacity: 0,
        y: 40,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
      });

      // Feature cards
      gsap.from(".feature-card", {
        scrollTrigger: { trigger: ".features-section", start: "top 80%" },
        opacity: 0,
        y: 60,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out",
      });

      // Benefits
      gsap.from(".benefit-item", {
        scrollTrigger: { trigger: ".benefits-section", start: "top 80%" },
        opacity: 0,
        x: -40,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
      });

      // Testimonials
      gsap.from(".testimonial-card", {
        scrollTrigger: { trigger: ".testimonials-section", start: "top 80%" },
        opacity: 0,
        scale: 0.9,
        duration: 0.8,
        stagger: 0.15,
        ease: "back.out(1.7)",
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const features = [
    {
      icon: CalendarIcon,
      title: "Smart Scheduling",
      description:
        "AI-powered calendar that learns your preferences and suggests optimal meeting times.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: SparklesIcon,
      title: "AI Assistant",
      description:
        "Natural language chatbot to create, reschedule, and manage your meetings effortlessly.",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: ClockIcon,
      title: "Time Optimization",
      description: "Automatically find the best time slots that work for all participants.",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: UsersIcon,
      title: "Multi-Calendar",
      description: "Connect Google and Microsoft calendars for unified scheduling experience.",
      color: "from-green-500 to-emerald-500",
    },
  ];

  const stats = [
    { value: "10K+", label: "Active Users", icon: UsersIcon },
    { value: "500K+", label: "Meetings Scheduled", icon: CalendarIcon },
    { value: "95%", label: "Time Saved", icon: ClockIcon },
    { value: "4.9/5", label: "User Rating", icon: SparklesIcon },
  ];

  if (isAuthenticated) return null;

  return (
    <div ref={heroRef} className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">Smart Calendar</span>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => router.push("/login")}>
              Log in
            </Button>
            <Button onClick={() => router.push("/signup")}>Get Started</Button>
          </div>
        </div>
      </header>
      <section className="relative overflow-hidden pt-32 pb-20 px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="floating-shape absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="floating-shape absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center space-y-8">
            <div className="hero-badge inline-block">
              <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                AI-Powered Calendar Management
              </span>
            </div>
            <h1 className="hero-title text-5xl md:text-7xl font-bold text-foreground leading-tight">
              Your Calendar,{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Reimagined with AI
              </span>
            </h1>
            <p className="hero-subtitle text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Schedule meetings effortlessly with natural language. Connect multiple calendars and
              let AI find the perfect time for everyone.
            </p>
            <div className="hero-cta flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" onClick={() => router.push("/signup")} className="group">
                Get Started Free{" "}
                <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push("/login")}>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section py-16 px-4 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="stat-card text-center">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything you need to manage your time
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features to help you stay organized and productive
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="feature-card p-6 rounded-lg bg-card border border-border hover:border-primary transition-colors"
                >
                  <div className="mb-4 p-3 w-fit rounded-lg bg-primary/10">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="rounded-2xl bg-gradient-to-r from-primary to-accent p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to transform your scheduling?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of users who are already saving time with Smart Calendar
            </p>

          </div>
        </div>
      </section>
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto max-w-6xl text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Smart Calendar. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
