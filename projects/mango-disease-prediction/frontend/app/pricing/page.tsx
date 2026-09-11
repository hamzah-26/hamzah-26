"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Leaf,
  Check,
  Zap,
  Shield,
  ArrowRight,
  Store,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  HelpCircle,
  Clock,
  PhoneCall,
  Crown,
} from "lucide-react";
import { GlowButton } from "@/components/ui/glow-button";
import { NeonBadge } from "@/components/ui/neon-badge";
import { ThemeLanguageControls } from "@/components/app/theme-language-controls";
import { useLocalizedText } from "@/lib/localization";
import { getKarnatakaMarketPrices, type MarketPricesResponse } from "@/lib/api-client";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const { term } = useLocalizedText();
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [marketData, setMarketData] = useState<MarketPricesResponse | null>(null);
  const [selectedVariety, setSelectedVariety] = useState<string>("ALL");
  const [isLoadingMarket, setIsLoadingMarket] = useState(true);

  // Fetch live market data
  useEffect(() => {
    let isMounted = true;
    getKarnatakaMarketPrices()
      .then((res) => {
        if (isMounted && res?.records) {
          setMarketData(res);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch market data for pricing page:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingMarket(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const varieties = [
    { id: "ALL", label: "All Cultivars" },
    { id: "Badami", label: "Badami (Alphonso)" },
    { id: "Totapuri", label: "Totapuri" },
    { id: "Raspuri", label: "Raspuri" },
    { id: "Banganapalli", label: "Banganapalli" },
    { id: "Neelam", label: "Neelam" },
  ];

  const displayedRecords = (marketData?.records || []).filter((r) => {
    if (selectedVariety === "ALL") return true;
    return r.variety.toLowerCase().includes(selectedVariety.toLowerCase());
  }).slice(0, 6);

  const pricingPlans = [
    {
      id: "starter",
      name: "Starter / Community",
      badge: "Free Forever",
      priceMonthly: "₹0",
      priceAnnual: "₹0",
      period: "forever",
      description: "Essential AI diagnostic tools for smallholder orchardists and hobby growers.",
      features: [
        "10 Daily SE-CNN Leaf Disease Scans",
        "8-Class Karnataka Pathology Detection",
        "Public AGMARKNET Mandi Price Tracker",
        "Standard Chemical & Organic Guidelines",
        "Community Knowledge Base Access",
      ],
      popular: false,
      cta: "Get Started Free",
      href: "/dashboard",
    },
    {
      id: "pro",
      name: "Precision Grower",
      badge: "Most Popular",
      priceMonthly: "₹499",
      priceAnnual: "₹399",
      period: "per month, billed annually",
      description: "Complete AI intelligence suite for commercial mango farmers & orchard managers.",
      features: [
        "Unlimited Neural Pathology Scans",
        "Grad-CAM Attention Heatmaps (SmoothGrad++)",
        "10 Karnataka Cultivars Agronomy Engine",
        "Live APMC Price Movement Alerts",
        "Orchard Block & Zone Mapping (5 Blocks)",
        "Spray Log & Treatment Schedule Tracker",
        "Real-Time Weather & Disease Forecast",
      ],
      popular: true,
      cta: "Start 14-Day Free Trial",
      href: "/dashboard",
    },
    {
      id: "enterprise",
      name: "Commercial Estate",
      badge: "High Acreage",
      priceMonthly: "₹1,999",
      priceAnnual: "₹1,599",
      period: "per month, billed annually",
      description: "Multi-orchard telemetry, yield projection & financial auditing for large plantations.",
      features: [
        "Everything in Precision Grower",
        "Multi-Orchard & Multi-Block Scaling",
        "XGBoost Seasonal Yield Forecasting",
        "Full Financial & Profit Analytics",
        "Expense, Fertilizer & Labor Cost Auditing",
        "Automated Data Export (JSON/CSV)",
        "Priority 24/7 Agro-Expert Support",
      ],
      popular: false,
      cta: "Contact Enterprise",
      href: "/dashboard/help-center",
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* Background ambient lighting */}
      <div className="pointer-events-none fixed inset-0">
        <div
          className="absolute left-1/4 top-0 h-[30rem] w-[30rem] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(245,158,11,0.2) 0%, transparent 70%)", filter: "blur(90px)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 h-[26rem] w-[26rem] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, rgba(34,197,94,0.18) 0%, transparent 70%)", filter: "blur(90px)" }}
        />
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 shadow-[0_0_14px_rgba(245,158,11,0.24)] group-hover:scale-105 transition-transform">
              <Leaf className="h-5 w-5 text-black" />
            </div>
            <div>
              <div className="font-display text-lg font-bold text-[var(--text-primary)]">
                Mango<span className="text-yellow-400">DL</span>
              </div>
              <div className="text-xs text-[var(--text-muted)]">Precision Agro-Intelligence</div>
            </div>
          </Link>

          <div className="hidden gap-8 text-sm text-[var(--text-secondary)] md:flex items-center">
            <Link href="/" className="hover:text-[var(--text-primary)] transition-colors font-medium">
              {term("Features")}
            </Link>
            <Link href="/pricing" className="text-amber-400 font-bold">
              {term("Pricing")}
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <ThemeLanguageControls compact />
            <GlowButton variant="mango" size="sm" onClick={() => router.push("/dashboard")}>
              {term("Launch App")}
              <ArrowRight className="w-3.5 h-3.5" />
            </GlowButton>
          </div>
        </div>
      </motion.nav>

      {/* Pricing Header */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pt-12 pb-8 md:px-6 md:pt-16 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Transparent Pricing · Karnataka Agriculture</span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-[var(--text-primary)] tracking-tight max-w-2xl mx-auto leading-tight">
          Tailored Plans for Every Mango Orchard
        </h1>

        <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed">
          From family mango groves in Srinivasapur and Dharwad to large export estates, access military-grade neural disease detection and real-time market telemetry.
        </p>

        {/* Monthly / Annual Toggle */}
        <div className="pt-2 flex items-center justify-center gap-3">
          <span className={`text-xs font-bold ${billingCycle === "monthly" ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>
            Monthly Billing
          </span>
          <button
            type="button"
            onClick={() => setBillingCycle((prev) => (prev === "monthly" ? "annual" : "monthly"))}
            className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-[var(--surface-soft)] transition-colors duration-200 ease-in-out focus:outline-none ring-1 ring-white/10"
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-amber-400 shadow-lg ring-0 transition duration-200 ease-in-out ${
                billingCycle === "annual" ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-bold ${billingCycle === "annual" ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>
              Annual Billing
            </span>
            <span className="px-2 py-0.2 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Save 20%
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-12 md:px-6">
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {pricingPlans.map((plan) => {
            const price = billingCycle === "annual" ? plan.priceAnnual : plan.priceMonthly;
            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 ${
                  plan.popular
                    ? "bg-[color-mix(in_srgb,var(--surface)_94%,transparent)] border-2 border-amber-400/80 shadow-[0_0_30px_rgba(245,158,11,0.18)] -translate-y-1"
                    : "card-glass border border-[var(--border-subtle)] hover:border-[var(--border-strong)]"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-[11px] font-black uppercase tracking-wider shadow-md">
                    {plan.badge}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-black text-lg text-[var(--text-primary)]">{plan.name}</h3>
                    {!plan.popular && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--surface-soft)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">{plan.description}</p>

                  <div className="pt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-3xl sm:text-4xl font-black text-[var(--text-primary)]">{price}</span>
                      <span className="text-xs text-[var(--text-muted)] font-medium">/{billingCycle === "annual" ? "mo" : "mo"}</span>
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)] block mt-0.5">{plan.period}</span>
                  </div>

                  {/* Feature List */}
                  <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2.5">
                    <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                      Included Capabilities:
                    </span>
                    {plan.features.map((feat) => (
                      <div key={feat} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  <GlowButton
                    variant={plan.popular ? "mango" : "outline"}
                    className="w-full text-xs font-bold py-2.5 justify-center shadow-md"
                    onClick={() => router.push(plan.href)}
                  >
                    <span>{plan.cta}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </GlowButton>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── LIVE KARNATAKA MANGO MARKET PRICES (FULL COMPREHENSIVE SECTION) ─── */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 py-8 md:px-6">
        <div className="card-glass p-6 md:p-8 space-y-6 relative overflow-hidden border border-[var(--border-subtle)] shadow-xl">
          {/* Background ambient glow */}
          <div
            className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none opacity-20"
            style={{ background: "radial-gradient(circle, rgba(245,158,11,0.2) 0%, transparent 70%)", filter: "blur(60px)" }}
          />

          {/* Header & Source Attribution */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 rounded-lg bg-yellow-500/15 border border-yellow-500/30 text-yellow-400">
                  <Store className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-yellow-400 tracking-wider uppercase">
                  Real-Time APMC Mandi Intelligence
                </span>
                <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                Karnataka Mango Market Prices & Wholesale Rates
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Live wholesale auction data across Srinivasapur, Ramanagara, Kolar, Dharwad & Bengaluru Mandis
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-[var(--text-muted)] block font-medium">
                  Source: AGMARKNET / Govt Data.gov.in
                </span>
                <span className="text-[11px] font-mono text-yellow-400/90 block">
                  Updated: {marketData?.lastSynced || "Today, 10:30 AM IST"}
                </span>
              </div>
              <GlowButton variant="mango" size="sm" onClick={() => router.push("/dashboard")} className="gap-1.5 text-xs py-2 px-3.5">
                <span>View Full Market Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </GlowButton>
            </div>
          </div>

          {/* Variety Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {varieties.map((v) => {
              const isActive = selectedVariety === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariety(v.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)] border border-transparent"
                  }`}
                >
                  {v.label}
                </button>
              );
            })}
          </div>

          {/* Live Market Price Cards Grid */}
          {isLoadingMarket ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-36 rounded-2xl bg-[var(--surface-soft)] animate-pulse border border-[var(--border-subtle)]" />
              ))}
            </div>
          ) : displayedRecords.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedRecords.map((item) => {
                const isUp = item.direction === "up";
                const isDown = item.direction === "down";
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-[color-mix(in_srgb,var(--surface)_85%,transparent)] border border-[var(--border-subtle)] hover:border-yellow-500/40 transition-all space-y-3 group"
                  >
                    {/* Header: Variety & Mandi */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-sm text-[var(--text-primary)] group-hover:text-yellow-300 transition-colors">
                          {item.variety}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mt-0.5">
                          <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">{item.market} ({item.district})</span>
                        </div>
                      </div>

                      {/* Trend Badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border shrink-0 ${
                          isUp
                            ? "bg-green-500/15 text-green-400 border-green-500/30"
                            : isDown
                            ? "bg-red-500/15 text-red-400 border-red-500/30"
                            : "bg-gray-500/15 text-gray-400 border-gray-500/30"
                        }`}
                      >
                        {isUp && <TrendingUp className="w-3 h-3" />}
                        {isDown && <TrendingDown className="w-3 h-3" />}
                        {!isUp && !isDown && <Minus className="w-3 h-3" />}
                        {item.priceChange > 0 ? `+${item.priceChange}%` : `${item.priceChange}%`}
                      </span>
                    </div>

                    {/* Primary Metric: Price per KG */}
                    <div className="flex items-baseline justify-between pt-1">
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
                          Modal Average Price
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="font-mono text-2xl font-extrabold text-yellow-400">
                            ₹{item.pricePerKgAvg}
                          </span>
                          <span className="text-xs text-[var(--text-secondary)] font-medium">/ kg</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
                          APMC Quintal Rate
                        </span>
                        <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                          ₹{item.avgPrice.toLocaleString()} / Q
                        </span>
                      </div>
                    </div>

                    {/* Range Bar & Arrivals */}
                    <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono">
                      <span>Range: ₹{item.pricePerKgMin} - ₹{item.pricePerKgMax} / kg</span>
                      <span className="text-yellow-400/90 font-medium">
                        {item.arrivalQuantityTonnes}t Arrivals
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-[var(--surface-soft)] border border-[var(--border-subtle)]">
              <p className="text-sm text-[var(--text-muted)]">No recent data available for this cultivar.</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--border-subtle)] px-4 py-6 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm text-[var(--text-muted)] md:flex-row md:items-center md:justify-between">
          <span>MangoDL © 2026</span>
          <span>{term("AI-Powered Agriculture Intelligence · Built with Deep Learning")}</span>
        </div>
      </footer>
    </main>
  );
}
