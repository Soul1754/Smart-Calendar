import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  CalendarIcon,
  SparklesIcon,
  ClockIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import colors from "../theme/colors";

gsap.registerPlugin(ScrollTrigger);

const Landing = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const featuresRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animations
      gsap.from(".hero-badge", {
        opacity: 0,
        y: -30,
        duration: 0.8,
        ease: "back.out(1.7)",
      });

      gsap.from(".hero-title", {
        opacity: 0,
        y: 50,
        duration: 1,
        delay: 0.3,
        ease: "power3.out",
      });

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

      // Floating shapes animation
      gsap.to(".floating-shape", {
        y: "+=30",
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: {
          amount: 1.5,
        },
      });

      // Feature cards scroll animation
      gsap.from(".feature-card", {
        scrollTrigger: {
          trigger: ".features-section",
          start: "top 80%",
        },
        opacity: 0,
        y: 60,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out",
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
    },
    {
      icon: SparklesIcon,
      title: "AI Assistant",
      description:
        "Natural language chatbot to create, reschedule, and manage your meetings effortlessly.",
    },
    {
      icon: ClockIcon,
      title: "Time Optimization",
      description:
        "Automatically find the best time slots that work for all participants.",
    },
    {
      icon: UsersIcon,
      title: "Team Collaboration",
      description:
        "Seamlessly coordinate schedules with your team and external stakeholders.",
    },
  ];

  return (
    <div
      ref={heroRef}
      className="min-h-screen bg-[#0a0e27] text-white overflow-hidden"
    >
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e27]/80 backdrop-blur-xl border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Smart Calendar
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/login")}
                className="px-6 py-2.5 text-gray-300 hover:text-white transition-colors duration-200"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/register")}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all duration-300"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        {/* Floating Background Shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="floating-shape absolute top-20 left-10 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl"></div>
          <div className="floating-shape absolute bottom-20 right-10 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
          <div className="floating-shape absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-8">
            <SparklesIcon className="w-5 h-5 text-indigo-400" />
            <span className="text-sm text-indigo-300">
              AI-Powered Meeting Management
            </span>
          </div>

          <h1 className="hero-title text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
            Schedule Smarter,
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Meet Better
            </span>
          </h1>

          <p className="hero-subtitle text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto">
            Transform the way you manage meetings with our intelligent calendar
            assistant. Let AI handle the scheduling while you focus on what
            matters.
          </p>

          <div className="hero-cta flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate("/register")}
              className="group px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-lg font-semibold hover:shadow-[0_0_40px_rgba(99,102,241,0.8)] transition-all duration-300 flex items-center gap-2"
            >
              Get Started
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
          </div>

          {/* Stats */}
          {/* <div className="mt-20 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">10K+</div>
              <div className="text-gray-400 mt-2">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">50K+</div>
              <div className="text-gray-400 mt-2">Meetings Scheduled</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">98%</div>
              <div className="text-gray-400 mt-2">Time Saved</div>
            </div>
          </div> */}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0e27] border-t border-gray-800/50 py-8 px-6">
        <div className="max-w-7xl mx-auto text-center text-gray-500">
          <p>&copy; 2025 Smart Calendar. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
