"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  TrendingUp,
  Brain,
  Layers,
  Sparkles,
  Leaf,
  Shield,
  Zap,
  Lock,
  ShieldAlert,
  AlertTriangle,
  X,
  Smartphone,
  QrCode,
  CheckCircle2,
  CloudSun,
  Activity,
} from "lucide-react";
import { GlowButton } from "@/components/ui/glow-button";
import { NeonBadge } from "@/components/ui/neon-badge";
import { ParticleField } from "@/components/animations/particle-field";
import { ThemeLanguageControls } from "@/components/app/theme-language-controls";
import { useLocalizedText } from "@/lib/localization";
import { useAuthStore } from "@/store/auth-store";

const featureIcons = [Layers, TrendingUp, Brain, Sparkles];

export default function LandingPage() {
  const { term } = useLocalizedText();
  const router = useRouter();
  const { login, demoLogin, isLoading, error, clearError } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const openAuthModal = () => {
    clearError();
    setFormError(null);
    setShowAuthModal(true);
  };

  const handleAuthorizeAndNavigate = () => {
    sessionStorage.setItem("mangodl_auth_token", "authenticated_session_active");
  };

  const handleInstantDemoLogin = async () => {
    clearError();
    setFormError(null);
    handleAuthorizeAndNavigate();
    const success = await demoLogin();
    if (success) {
      router.push("/dashboard");
    }
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFormError(null);

    if (!email || !email.includes("@")) {
      setFormError("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }

    handleAuthorizeAndNavigate();
    const success = await login(email, password);
    if (success) {
      router.push("/dashboard");
    }
  };

  const features = [
    {
      title: term("Disease Detection"),
      description: term("Upload mango leaf images for AI-powered disease diagnosis"),
    },
    {
      title: term("Yield Prediction"),
      description: term("XGBoost-powered seasonal yield forecasting"),
    },
    {
      title: term("Climate Intelligence"),
      description: term("Real-time weather monitoring and climate risk analysis"),
    },
    {
      title: term("AI Recommendations"),
      description: term("Autonomous farmer decision support powered by MangoDL AI"),
    },
  ];

  const stats = [
    { value: "98.75%", label: term("Detection Accuracy") },
    { value: "14,800+", label: term("Unified Leaf Dataset") },
    { value: "8 Classes", label: term("Pathology Categories") },
    { value: "10 Cultivars", label: term("Karnataka Cultivars") },
  ];

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="pointer-events-none fixed inset-0">
        <ParticleField className="opacity-60" />
        <div
          className="absolute left-0 top-0 h-[28rem] w-[28rem] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, rgba(245,158,11,0.16) 0%, transparent 70%)", filter: "blur(88px)" }}
        />
        <div
          className="absolute bottom-0 right-0 h-[24rem] w-[24rem] rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 70%)", filter: "blur(88px)" }}
        />
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 shadow-[0_0_14px_rgba(245,158,11,0.24)]">
              <Leaf className="h-5 w-5 text-black" />
            </div>
            <div>
              <div className="font-display text-lg font-bold text-[var(--text-primary)]">
                Mango<span className="text-yellow-400">DL</span>
              </div>
              <div className="text-xs text-[var(--text-muted)]">AI Agriculture</div>
            </div>
          </div>

          <div className="hidden gap-8 text-sm text-[var(--text-secondary)] md:flex items-center">
            <Link href="/" className="hover:text-[var(--text-primary)] transition-colors font-medium">
              {term("Features")}
            </Link>
            <Link href="/pricing" className="hover:text-amber-400 transition-colors font-medium">
              {term("Pricing")}
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <ThemeLanguageControls compact />
            <GlowButton variant="ghost" size="sm" onClick={openAuthModal}>
              {term("Sign In")}
            </GlowButton>
            <GlowButton variant="mango" size="sm" onClick={openAuthModal}>
              {term("Get Started")}
            </GlowButton>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto flex max-w-6xl flex-col gap-10 px-4 py-14 md:px-6 md:py-18">
        <div className="max-w-3xl">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <NeonBadge label={term("Powered by Deep Learning")} variant="mango" pulse />
            <NeonBadge label={term("SE-MangoLeafXNet + XGBoost")} variant="violet" />
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-[var(--text-primary)]"
          >
            <span className="gradient-text-hero">{term("Deep Learning Approach for")}</span>
            <br />
            <span>{term("Mango Disease Detection &")}</span>
            <br />
            <span className="gradient-text-mango">{term("Yield Prediction Platform")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)] md:text-lg"
          >
            {term("Transforming traditional farming using deep learning and climate intelligence. Monitor, predict, and optimize your mango orchards with military-grade AI.")}
          </motion.p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 + index * 0.06 }}
              className="card-glass p-4"
            >
              <div className="font-display text-2xl font-bold text-[var(--text-primary)]">{stat.value}</div>
              <div className="mt-1 text-sm text-[var(--text-muted)]">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = featureIcons[index];
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.06 }}
                className="card-glass p-5"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-400">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">{feature.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* ─── 2. PREMIUM MOBILE APP DOWNLOAD SECTION (COURSERA-INSPIRED) ─── */}
        <motion.section
          id="mobile-app"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] p-6 sm:p-8 md:p-10 shadow-2xl backdrop-blur-2xl scroll-mt-24"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--surface) 95%, transparent) 0%, color-mix(in srgb, var(--surface-soft) 90%, transparent) 50%, color-mix(in srgb, var(--background-elevated) 95%, transparent) 100%)",
          }}
        >
          {/* Subtle Ambient Radial Glows */}
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-amber-500/[0.12] blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-emerald-500/[0.12] blur-[80px] pointer-events-none" />

          <div className="relative grid md:grid-cols-12 gap-8 items-center">
            {/* Left Column: Heading, Copy, App Badges, QR Code */}
            <div className="md:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile App · Coming Soon</span>
              </div>

              <div>
                <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-[var(--text-primary)] tracking-tight leading-tight">
                  MangoDL, Wherever You Farm
                </h2>
                <p className="mt-2 text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed max-w-lg">
                  Monitor your orchard, detect diseases and track mango prices from your phone. Get instant offline leaf diagnosis and telemetry straight from the field.
                </p>
              </div>

              {/* App Store & Google Play Badges + QR code */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
                <div className="flex flex-col gap-2.5 w-full sm:w-auto">
                  {/* Apple App Store Mockup Badge */}
                  <div className="group relative flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-black/80 hover:bg-black border border-white/15 text-white transition-all shadow-lg cursor-pointer">
                    <svg className="w-6 h-6 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.64 1.35-.57.65-1.06 1.7-0.93 2.73 1.01.08 2.03-.48 2.65-1.23z" />
                    </svg>
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-gray-400 font-medium">Download on the</div>
                      <div className="text-sm font-bold tracking-tight">App Store</div>
                    </div>
                    <span className="ml-auto px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Soon
                    </span>
                  </div>

                  {/* Google Play Store Mockup Badge */}
                  <div className="group relative flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-black/80 hover:bg-black border border-white/15 text-white transition-all shadow-lg cursor-pointer">
                    <svg className="w-6 h-6 fill-current text-emerald-400 shrink-0" viewBox="0 0 24 24">
                      <path d="M3 20.5v-17c0-.83.52-1.28 1.15-.75l10.9 9.25-10.9 9.25c-.63.53-1.15.08-1.15-.75zm12.5-8.5l2.25 1.9-2.25 1.9V12zm-1.6 3.1l-2.4-2.05-5.5 5.5 7.9-3.45zm0-6.2l-7.9-3.45 5.5 5.5 2.4-2.05z" />
                    </svg>
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-gray-400 font-medium">Get it on</div>
                      <div className="text-sm font-bold tracking-tight">Google Play</div>
                    </div>
                    <span className="ml-auto px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Soon
                    </span>
                  </div>
                </div>

                {/* QR Code Placeholder Card */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border-subtle)]">
                  <div className="w-16 h-16 rounded-xl bg-white p-1.5 flex items-center justify-center shrink-0 shadow-inner">
                    <QrCode className="w-full h-full text-black" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[var(--text-primary)]">Scan with Camera</div>
                    <p className="text-[11px] text-[var(--text-muted)] max-w-[130px] leading-tight mt-0.5">
                      Join the Karnataka Mobile Early Access waitlist
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: 3D Smartphone Mockup with MangoDL Mobile UI */}
            <div className="md:col-span-5 flex justify-center">
              <motion.div
                whileHover={{ rotateY: 4, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="relative w-64 sm:w-72 rounded-[2.5rem] bg-gradient-to-b from-neutral-800 to-neutral-950 p-3 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(245,158,11,0.15)] border-4 border-neutral-700/80"
              >
                {/* Phone Notch */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-neutral-900 rounded-full z-20 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-800 mr-2" />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-700" />
                </div>

                {/* Phone Screen */}
                <div className="rounded-[2rem] bg-neutral-950 overflow-hidden border border-white/10 p-3.5 pt-6 space-y-2.5 text-xs">
                  {/* Mini App Bar */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-lg bg-amber-500 flex items-center justify-center">
                        <Leaf className="w-3 h-3 text-black" />
                      </div>
                      <span className="font-bold text-[11px] text-white">MangoDL Mobile</span>
                    </div>
                    <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live APMC
                    </span>
                  </div>

                  {/* Leaf Scan Card Preview */}
                  <div className="p-2.5 rounded-xl bg-neutral-900 border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-gray-400 font-bold uppercase">Field Leaf Scan</span>
                      <span className="text-emerald-400 font-black">96% Conf.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                        <Leaf className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-white font-bold text-[11px]">Anthracnose Lesion</div>
                        <div className="text-amber-400 text-[9px]">Carbendazim 50% WP · 2g/L</div>
                      </div>
                    </div>
                  </div>

                  {/* Climate Status Card */}
                  <div className="p-2.5 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2">
                      <CloudSun className="w-4 h-4 text-cyan-400" />
                      <div>
                        <div className="text-white font-bold">Kolar Orchard Zone</div>
                        <div className="text-gray-400 text-[9px]">29°C · Optimal Spraying Window</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">Safe</span>
                  </div>

                  {/* APMC Ticker Card */}
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-[10px]">
                    <span className="text-gray-300 font-bold">Badami (Alphonso)</span>
                    <span className="text-amber-400 font-mono font-black">₹142/kg <span className="text-emerald-400 text-[9px]">↑+6.4%</span></span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>
      </section>

      {/* ─── PREMIUM SAAS-STYLE FOOTER ─── */}
      <footer className="relative z-10 border-t border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] pt-12 pb-8 px-4 md:px-6 backdrop-blur-md">
        <div className="mx-auto max-w-6xl space-y-10">
          {/* Main Footer Links Grid */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 md:grid-cols-5 lg:gap-10">
            {/* Brand Column */}
            <div className="col-span-2 sm:col-span-2 md:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                  <Leaf className="h-4 w-4 text-black" />
                </div>
                <div>
                  <div className="font-display text-base font-bold text-[var(--text-primary)]">
                    Mango<span className="text-yellow-400">DL</span>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">AI Agriculture</div>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-[var(--text-secondary)] max-w-sm">
                AI-powered disease detection, yield intelligence and mango market insights.
              </p>

              {/* Status Indicator */}
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>All Systems Operational</span>
              </div>
            </div>

            {/* PRODUCT Column */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">Product</div>
              <ul className="space-y-2 text-xs text-[var(--text-muted)]">
                <li>
                  <button type="button" onClick={openAuthModal} className="hover:text-amber-400 transition-colors text-left cursor-pointer">
                    Disease Detection
                  </button>
                </li>
                <li>
                  <button type="button" onClick={openAuthModal} className="hover:text-amber-400 transition-colors text-left cursor-pointer">
                    Yield Prediction
                  </button>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-amber-400 transition-colors">
                    Market Intelligence
                  </Link>
                </li>
                <li>
                  <button type="button" onClick={openAuthModal} className="hover:text-amber-400 transition-colors text-left cursor-pointer">
                    AI Recommendations
                  </button>
                </li>
                <li>
                  <button type="button" onClick={openAuthModal} className="hover:text-amber-400 transition-colors text-left cursor-pointer">
                    Climate Monitor
                  </button>
                </li>
              </ul>
            </div>

            {/* PLATFORM Column */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">Platform</div>
              <ul className="space-y-2 text-xs text-[var(--text-muted)]">
                <li>
                  <button type="button" onClick={openAuthModal} className="hover:text-amber-400 transition-colors text-left cursor-pointer">
                    AI Copilot
                  </button>
                </li>
                <li>
                  <button type="button" onClick={openAuthModal} className="hover:text-amber-400 transition-colors text-left cursor-pointer">
                    Analytics
                  </button>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-amber-400 transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <a href="#mobile-app" className="hover:text-amber-400 transition-colors">
                    Mobile App
                  </a>
                </li>
                <li>
                  <button type="button" onClick={openAuthModal} className="hover:text-amber-400 transition-colors text-left cursor-pointer">
                    Help Center
                  </button>
                </li>
              </ul>
            </div>

            {/* RESOURCES & LEGAL Column */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">Resources</div>
              <ul className="space-y-2 text-xs text-[var(--text-muted)]">
                <li>
                  <button type="button" onClick={openAuthModal} className="hover:text-amber-400 transition-colors text-left cursor-pointer">
                    Documentation
                  </button>
                </li>
                <li>
                  <button type="button" onClick={openAuthModal} className="hover:text-amber-400 transition-colors text-left cursor-pointer">
                    Getting Started
                  </button>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-amber-400 transition-colors">
                    Supported Cultivars
                  </Link>
                </li>
                <li>
                  <button type="button" onClick={openAuthModal} className="hover:text-amber-400 transition-colors text-left cursor-pointer">
                    FAQ & Contact
                  </button>
                </li>
                <li className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap gap-2 text-[11px] text-[var(--text-muted)]">
                  <span className="hover:text-[var(--text-primary)] cursor-pointer">Privacy</span>
                  <span>•</span>
                  <span className="hover:text-[var(--text-primary)] cursor-pointer">Terms</span>
                  <span>•</span>
                  <span className="hover:text-[var(--text-primary)] cursor-pointer">Cookies</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Subtitle Row */}
          <div className="border-t border-[var(--border-subtle)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
            <div>© 2026 MangoDL. All rights reserved.</div>
            <div className="flex items-center gap-2 text-[11px]">
              <span>Built with Deep Learning</span>
              <span>•</span>
              <span>AI for Smarter Agriculture</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── AUTHENTICATION WARNING & SIGN IN PANEL MODAL ─── */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] p-6 md:p-8 shadow-2xl backdrop-blur-2xl"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-strong)] transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header Warning */}
              <div className="text-center space-y-3 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center mx-auto shadow-[0_0_24px_rgba(245,158,11,0.2)]">
                  <Lock className="w-8 h-8 text-yellow-500" />
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <ShieldAlert className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs font-semibold text-amber-600 dark:text-yellow-400 uppercase tracking-wider">Authentication Required</span>
                  </div>
                  <h2 className="text-[var(--text-primary)] font-display text-xl font-bold">Sign In to Dashboard</h2>
                  <p className="text-[var(--text-muted)] text-xs mt-1">
                    You must authenticate to access the MangoDL AI Agriculture Intelligence Platform.
                  </p>
                </div>
              </div>

              {/* Instant 1-Click Demo Login */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleInstantDemoLogin}
                type="button"
                disabled={isLoading}
                className="w-full mb-5 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-300 hover:bg-cyan-500/20 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <Zap className="w-4 h-4 text-cyan-500" />
                <span>⚡ Instant Demo Sign In to Dashboard</span>
                <NeonBadge label="1-Click" variant="cyan" size="sm" />
              </motion.button>

              <div className="relative flex items-center justify-center mb-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--border-subtle)]" />
                </div>
                <span className="relative px-3 bg-[var(--background-elevated)] text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-semibold">
                  Or Sign In with Credentials
                </span>
              </div>

              {/* Form Error Banner */}
              {(error || formError) && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{formError || error}</span>
                </div>
              )}

              {/* Email / Password Form */}
              <form onSubmit={handleCredentialsLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="farmer@mangodl.com"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-soft)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-yellow-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-soft)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-yellow-500 transition-colors"
                  />
                </div>

                <GlowButton
                  variant="mango"
                  type="submit"
                  disabled={isLoading}
                  className="w-full text-xs font-bold py-2.5 justify-center shadow-lg"
                >
                  {isLoading ? "Authenticating..." : "Sign In & Launch Dashboard"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </GlowButton>
              </form>

              {/* Security Badge */}
              <div className="mt-5 text-center text-[10px] text-[var(--text-muted)] flex items-center justify-center gap-1">
                <Shield className="w-3 h-3 text-emerald-400" />
                Protected by MangoDL Security Guard v3.2
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
