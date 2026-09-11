"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Bell, Menu, Search, LogOut, User as UserIcon, Shield, ChevronDown,
  AlertTriangle, Info, CheckCheck, Sparkles, ShieldAlert, ArrowRight, X,
  Microscope, TrendingUp, DollarSign, CloudSun, Brain, GitBranch, Settings,
  Command, Sparkle, ArrowUpRight, ExternalLink, RefreshCw, Radio, Newspaper,
  Store, Volume2, VolumeX,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { ThemeLanguageControls } from "@/components/app/theme-language-controls";
import { NeonBadge } from "@/components/ui/neon-badge";
import { useLocalizedText } from "@/lib/localization";
import { useDashboardStore } from "@/store/dashboard-store";
import { useAuthStore } from "@/store/auth-store";
import {
  trackAndNotifyNewArticles,
  isNotificationSoundEnabled,
  setNotificationSoundEnabled,
  playNotificationSound,
} from "@/lib/notification-sound";
import {
  getNewsFeed,
  markNewsAsRead,
  markAllNewsAsRead,
  refreshNewsFeed,
  type NewsArticle,
  type NewsFeedResponse,
} from "@/lib/api-client";
import Link from "next/link";

const pageLabels: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard Overview", subtitle: "AI Agriculture Intelligence Platform" },
  "/dashboard/ai-agent": { title: "AI Copilot Agent", subtitle: "Multimodal Agronomy Intelligence & Decision Copilot" },
  "/dashboard/disease-detection": { title: "Disease Detection", subtitle: "AI-powered leaf analysis using ResNet-50 + GradCAM" },
  "/dashboard/yield-prediction": { title: "Yield Prediction", subtitle: "XGBoost-powered seasonal forecasting engine" },
  "/dashboard/revenue-analytics": { title: "Revenue Analytics", subtitle: "Premium fintech-grade agricultural revenue insights" },
  "/dashboard/climate-monitoring": { title: "Climate Intelligence", subtitle: "Real-time weather and environmental monitoring" },
  "/dashboard/ai-recommendations": { title: "AI Recommendations", subtitle: "Automated farmer decision support system" },
  "/dashboard/dataflow": { title: "AI Dataflow", subtitle: "Cinematic AI processing pipeline visualization" },
  "/dashboard/settings": { title: "Settings", subtitle: "Platform configuration and preferences" },
  "/dashboard/market": { title: "Market Prices", subtitle: "Karnataka APMC wholesale mango auction rates & trends" },
};

interface SearchIndexItem {
  id: string;
  category: "Modules" | "Diseases" | "Analytics" | "Tools";
  title: string;
  subtitle: string;
  href: string;
  icon: any;
  keywords: string[];
}

const globalSearchIndex: SearchIndexItem[] = [
  {
    id: "ai-agent",
    category: "Modules",
    title: "AI Copilot Agronomist Agent",
    subtitle: "Real-time AI Chatbot for mango disease treatments, drip irrigation & market strategy",
    href: "/dashboard/ai-agent",
    icon: Sparkles,
    keywords: ["agent", "copilot", "chat", "assistant", "ai", "agronomist", "bot", "llm", "gemini", "groq", "prescription", "ask"],
  },
  {
    id: "disease-detection",
    category: "Modules",
    title: "Disease Detection Engine",
    subtitle: "Upload leaf photos for ResNet-50 AI diagnosis & Grad-CAM analysis",
    href: "/dashboard/disease-detection",
    icon: Microscope,
    keywords: ["leaf", "disease", "resnet", "gradcam", "diagnosis", "predict", "scan"],
  },
  {
    id: "anthracnose",
    category: "Diseases",
    title: "Anthracnose (Colletotrichum gloeosporioides)",
    subtitle: "Dark sunken lesions, leaf spot diagnosis & copper fungicide advisory",
    href: "/dashboard/disease-detection",
    icon: Microscope,
    keywords: ["anthracnose", "fungus", "spot", "dark", "lesion"],
  },
  {
    id: "powdery-mildew",
    category: "Diseases",
    title: "Powdery Mildew (Oidium mangiferae)",
    subtitle: "White powdery coating analysis & sulfur spray recommendations",
    href: "/dashboard/disease-detection",
    icon: Microscope,
    keywords: ["powdery", "mildew", "white", "dust", "oidium"],
  },
  {
    id: "bacterial-canker",
    category: "Diseases",
    title: "Bacterial Canker (Xanthomonas)",
    subtitle: "Water-soaked leaf lesions, raised spots & bactericide treatment",
    href: "/dashboard/disease-detection",
    icon: Microscope,
    keywords: ["bacterial", "canker", "xanthomonas", "water", "canker"],
  },
  {
    id: "die-back",
    category: "Diseases",
    title: "Die Back (Lasiodiplodia theobromae)",
    subtitle: "Twig discoloration, drying leaves & branch pruning advisory",
    href: "/dashboard/disease-detection",
    icon: Microscope,
    keywords: ["dieback", "die back", "twig", "drying", "wither"],
  },
  {
    id: "sooty-mould",
    category: "Diseases",
    title: "Sooty Mould (Meliola mangiferae)",
    subtitle: "Black honeydew surface mold & insect pest control guidance",
    href: "/dashboard/disease-detection",
    icon: Microscope,
    keywords: ["sooty", "mould", "black", "mold", "honeydew"],
  },
  {
    id: "cutting-weevil",
    category: "Diseases",
    title: "Cutting Weevil (Deporaus marginatus)",
    subtitle: "Fresh leaf blade cuts, petiole damage & biological pest control",
    href: "/dashboard/disease-detection",
    icon: Microscope,
    keywords: ["cutting", "weevil", "insect", "pest", "leaf cut"],
  },
  {
    id: "gall-midge",
    category: "Diseases",
    title: "Gall Midge (Procontarinia matteiana)",
    subtitle: "Leaf gall warts, blister lesions & systemic insecticide treatment",
    href: "/dashboard/disease-detection",
    icon: Microscope,
    keywords: ["gall", "midge", "blister", "pimple", "wart"],
  },
  {
    id: "healthy",
    category: "Diseases",
    title: "Healthy Leaf Baseline",
    subtitle: "Optimal chlorophyll levels, clear foliage & preventive maintenance",
    href: "/dashboard/disease-detection",
    icon: Microscope,
    keywords: ["healthy", "normal", "clear", "good", "green"],
  },
  {
    id: "yield-prediction",
    category: "Modules",
    title: "Yield Forecasting Engine",
    subtitle: "XGBoost seasonal harvest prediction & tree density estimation",
    href: "/dashboard/yield-prediction",
    icon: TrendingUp,
    keywords: ["yield", "tonnes", "harvest", "xgboost", "predict", "tons", "production"],
  },
  {
    id: "revenue-analytics",
    category: "Analytics",
    title: "Revenue & Financial Analytics",
    subtitle: "Gross revenue calculations, net profit, margin & market grading",
    href: "/dashboard/revenue-analytics",
    icon: DollarSign,
    keywords: ["revenue", "money", "profit", "fintech", "price", "rupees", "income", "margin"],
  },
  {
    id: "climate-monitoring",
    category: "Analytics",
    title: "Climate & Environmental Intelligence",
    subtitle: "Real-time soil moisture, ambient humidity & weather forecasting",
    href: "/dashboard/climate-monitoring",
    icon: CloudSun,
    keywords: ["climate", "weather", "rain", "temperature", "humidity", "moisture", "soil"],
  },
  {
    id: "ai-recommendations",
    category: "Tools",
    title: "AI Farmer Decision Advisory",
    subtitle: "Automated drip irrigation & pesticide application recommendations",
    href: "/dashboard/ai-recommendations",
    icon: Brain,
    keywords: ["recommendations", "advisory", "farmer", "action", "irrigation", "spray"],
  },
  {
    id: "dataflow",
    category: "Tools",
    title: "AI Neural Pipeline Visualizer",
    subtitle: "Inspect ResNet-50 + GradCAM multi-task neural network topology",
    href: "/dashboard/dataflow",
    icon: GitBranch,
    keywords: ["dataflow", "pipeline", "model", "architecture", "resnet", "layers"],
  },
  {
    id: "settings",
    category: "Tools",
    title: "Platform Preferences & Settings",
    subtitle: "Theme customization (Dark/Light), language switcher & account profile",
    href: "/dashboard/settings",
    icon: Settings,
    keywords: ["settings", "theme", "language", "profile", "account", "dark mode"],
  },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const toggleSidebar = useDashboardStore((state) => state.toggleSidebar);
  const { user, logout } = useAuthStore();
  const { term } = useLocalizedText();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Real Karnataka Mango News Feed State
  const [newsFeed, setNewsFeed] = useState<NewsArticle[]>([]);
  const [newsCategory, setNewsCategory] = useState<string>("ALL");
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [isNewsRefreshing, setIsNewsRefreshing] = useState(false);
  const [lastNewsUpdate, setLastNewsUpdate] = useState<string>("Today, 11:00 AM IST");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const page = pageLabels[pathname] ?? { title: "MangoDL", subtitle: "AI Agriculture Platform" };
  const userInitial = user?.fullName ? user.fullName.charAt(0).toUpperCase() : "M";

  const unreadCount = newsFeed.filter((n) => !n.read).length;

  useEffect(() => {
    setSoundEnabled(isNotificationSoundEnabled());
  }, []);

  const loadNews = useCallback(async (cat: string = "ALL") => {
    setIsNewsLoading(true);
    try {
      const data = await getNewsFeed({ category: cat !== "ALL" ? cat : undefined });
      if (data && data.articles) {
        setNewsFeed(data.articles);
        if (data.lastUpdated) setLastNewsUpdate(data.lastUpdated);
        const articleIds = data.articles.map((a) => a.id);
        trackAndNotifyNewArticles(articleIds, isNotificationSoundEnabled());
      }
    } catch (err) {
      console.warn("Failed to load news feed:", err);
    } finally {
      setIsNewsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNews(newsCategory);
  }, [loadNews, newsCategory]);

  const handleMarkAsRead = async (articleId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await markNewsAsRead(articleId);
      setNewsFeed((prev) => prev.map((a) => (a.id === articleId ? { ...a, read: true } : a)));
    } catch (err) {
      console.warn("Failed to mark article as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNewsAsRead();
      setNewsFeed((prev) => prev.map((a) => ({ ...a, read: true })));
    } catch (err) {
      console.warn("Failed to mark all as read:", err);
    }
  };

  const handleRefreshNews = async () => {
    setIsNewsRefreshing(true);
    try {
      await refreshNewsFeed();
      await loadNews(newsCategory);
    } catch (err) {
      console.warn("Failed to refresh news feed:", err);
    } finally {
      setIsNewsRefreshing(false);
    }
  };

  // Shortcut Listener (Ctrl+K or Cmd+K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setSearchOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-focus search input on modal open
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
    }
  }, [searchOpen]);

  // Dismiss dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    router.push("/login");
  };

  // Search Results Filtering
  const filteredSearchItems = searchQuery.trim() === ""
    ? globalSearchIndex.slice(0, 6)
    : globalSearchIndex.filter((item) => {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.keywords.some((k) => k.toLowerCase().includes(q))
        );
      });

  const handleSelectSearchItem = (href: string) => {
    setSearchOpen(false);
    router.push(href);
  };

  const categories = [
    { id: "ALL", label: "All News" },
    { id: "Crop Protection", label: "Disease & Sprays" },
    { id: "Market", label: "Market & Prices" },
    { id: "Weather", label: "Weather Alerts" },
    { id: "Export", label: "Exports & Trade" },
    { id: "Schemes", label: "Govt Schemes" },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] px-4 backdrop-blur-xl md:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-soft)] text-[var(--text-secondary)] transition-all hover:bg-[var(--surface-strong)] hover:text-[var(--text-primary)]"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-base font-semibold leading-tight text-[var(--text-primary)]">{term(page.title)}</h1>
            <p className="text-xs text-[var(--text-muted)]">{term(page.subtitle)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-soft)] px-3 py-1.5 sm:flex">
            <Activity className="h-3.5 w-3.5 text-green-400" />
            <span className="text-xs font-medium text-[var(--text-secondary)]">{term("Live")}</span>
            <NeonBadge label={term("Online")} variant="neon" pulse size="sm" />
          </div>

          {/* ─── Global Search Trigger Button ─── */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--text-secondary)] transition-all hover:bg-[var(--surface-strong)] hover:text-[var(--text-primary)] hover:border-yellow-500/40 cursor-pointer"
          >
            <Search className="h-4 w-4 text-yellow-400" />
            <span className="hidden sm:inline">{term("Search platform...")}</span>
            <kbd className="rounded border border-[var(--border-subtle)] bg-[var(--surface-strong)] px-1.5 py-0.5 text-[10px] font-mono text-gray-400">
              Ctrl K
            </kbd>
          </button>

          <ThemeLanguageControls compact />

          {/* ─── Real Karnataka Mango News Feed Bell & Panel ─── */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative rounded-xl p-2 text-[var(--text-muted)] transition-all hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow-500 px-1 text-[9px] font-bold text-black shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute right-0 mt-2 w-80 sm:w-[440px] rounded-2xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] p-4 shadow-2xl backdrop-blur-xl z-50 space-y-3"
                >
                  {/* Panel Header */}
                  <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400">
                        <Newspaper className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs sm:text-sm block">
                          Karnataka Mango News Feed
                        </span>
                        <span className="text-[10px] text-gray-400 block">
                          PIB · ICAR-IIHR · APEDA · KMDB
                        </span>
                      </div>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-400 border border-yellow-500/30 shrink-0">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Notification Sound Mute / Unmute Toggle */}
                      <button
                        type="button"
                        onClick={() => {
                          const next = !soundEnabled;
                          setSoundEnabled(next);
                          setNotificationSoundEnabled(next);
                          if (next) {
                            playNotificationSound();
                          }
                        }}
                        title={soundEnabled ? "Alert Chime Enabled (Click to Mute)" : "Alert Chime Muted (Click to Enable)"}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          soundEnabled
                            ? "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                            : "bg-white/5 text-gray-500 hover:text-white"
                        }`}
                      >
                        {soundEnabled ? (
                          <Volume2 className="w-3.5 h-3.5" />
                        ) : (
                          <VolumeX className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleRefreshNews}
                        disabled={isNewsRefreshing}
                        title="Sync News Feed"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isNewsRefreshing ? "animate-spin text-yellow-400" : ""}`} />
                      </button>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllAsRead}
                          className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-yellow-400 transition-colors font-medium cursor-pointer"
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                          Mark all read
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                    {categories.map((c) => {
                      const isActive = newsCategory === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setNewsCategory(c.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                            isActive
                              ? "bg-yellow-500 text-black shadow-md shadow-yellow-500/20 font-bold"
                              : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          {c.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Real News Articles List */}
                  <div className="max-h-96 overflow-y-auto space-y-2.5 pr-1">
                    {isNewsLoading ? (
                      <div className="space-y-2 py-4">
                        {[1, 2, 3].map((n) => (
                          <div key={n} className="h-20 rounded-xl bg-white/5 animate-pulse" />
                        ))}
                      </div>
                    ) : newsFeed.length === 0 ? (
                      <div className="py-8 text-center text-xs text-gray-500">
                        No articles available in this category.
                      </div>
                    ) : (
                      newsFeed.map((article) => (
                        <div
                          key={article.id}
                          className={`p-3.5 rounded-xl border transition-all space-y-2 group ${
                            !article.read
                              ? "bg-white/[0.04] border-yellow-500/30 hover:border-yellow-500/60"
                              : "bg-transparent border-white/5 opacity-70 hover:opacity-100 hover:bg-white/[0.02]"
                          }`}
                        >
                          {/* Article Meta Bar */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
                                {article.category}
                              </span>
                              <span className="text-[10px] text-gray-400 font-medium">
                                {article.source}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] text-gray-500 font-mono">
                                {article.publishedAt}
                              </span>
                              {!article.read && (
                                <span className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                              )}
                            </div>
                          </div>

                          {/* Headline */}
                          <h4 className="text-xs font-bold text-white group-hover:text-yellow-300 transition-colors leading-snug">
                            {article.title}
                          </h4>

                          {/* Summary */}
                          <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2">
                            {article.summary}
                          </p>

                          {/* Action Links Bar */}
                          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                            {/* EXACT Original URL Link */}
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => handleMarkAsRead(article.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-yellow-400 hover:text-yellow-300 hover:underline cursor-pointer"
                            >
                              <span>Read Full Article</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>

                            {!article.read && (
                              <button
                                type="button"
                                onClick={(e) => handleMarkAsRead(article.id, e)}
                                className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Panel Footer */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                    <span>Last updated: {lastNewsUpdate}</span>
                    <Link
                      href="/dashboard/market"
                      onClick={() => setNotifOpen(false)}
                      className="text-yellow-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Store className="w-3 h-3" />
                      <span>Live APMC Mandi Rates</span>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ─── User Profile Dropdown ─── */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 rounded-xl p-1 transition-all hover:bg-[var(--surface-soft)] cursor-pointer"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 text-sm font-bold text-black shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                {userInitial}
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400 hidden sm:block" />
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-64 rounded-2xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] p-3 shadow-2xl backdrop-blur-xl z-50 space-y-3"
                >
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-[var(--surface-soft)]">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 text-base font-bold text-black">
                      {userInitial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{user?.fullName || "User"}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate">{user?.email || "user@mangodl.ai"}</p>
                    </div>
                  </div>

                  <div className="px-2 py-1 flex items-center justify-between border-t border-b border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
                    <span>Role</span>
                    <NeonBadge label={user?.role || "Manager"} variant="mango" size="sm" />
                  </div>

                  <div className="space-y-1">
                    <Link href="/dashboard/settings" onClick={() => setUserMenuOpen(false)}>
                      <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)] transition-colors cursor-pointer">
                        <UserIcon className="h-4 w-4 text-yellow-400" />
                        <span>Account Settings</span>
                      </div>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 text-red-400" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </header>

      {/* ─── GLOBAL SEARCH ENGINE MODAL (CTRL+K) ─── */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSearchOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Command Palette Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -16 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] shadow-2xl backdrop-blur-2xl"
            >
              {/* Input Header */}
              <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-4 py-3.5">
                <Search className="h-5 w-5 text-yellow-400 shrink-0 animate-pulse" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search diseases, harvest yield, climate, analytics, or tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/5"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <kbd className="hidden sm:inline-block rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono text-gray-400 shrink-0">
                  ESC
                </kbd>
              </div>

              {/* Results List */}
              <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
                {filteredSearchItems.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <Search className="h-8 w-8 text-gray-600 mx-auto" />
                    <p className="text-sm font-medium text-gray-400">No matching search results found</p>
                    <p className="text-xs text-gray-600">Try searching for "Anthracnose", "Yield", "Revenue", or "Climate"</p>
                  </div>
                ) : (
                  <>
                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 flex items-center justify-between">
                      <span>{searchQuery.trim() ? "Search Results" : "Quick Actions & Modules"}</span>
                      <span>{filteredSearchItems.length} items</span>
                    </div>

                    {filteredSearchItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <motion.div
                          key={item.id}
                          whileHover={{ x: 3, backgroundColor: "rgba(255,255,255,0.05)" }}
                          onClick={() => handleSelectSearchItem(item.href)}
                          className="flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-yellow-500/20 cursor-pointer transition-all group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-400 group-hover:bg-yellow-500/20 group-hover:scale-105 transition-all">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-white group-hover:text-yellow-400 transition-colors truncate">
                                  {item.title}
                                </span>
                                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-medium text-gray-400 border border-white/5 shrink-0">
                                  {item.category}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-400 truncate mt-0.5">{item.subtitle}</p>
                            </div>
                          </div>

                          <ArrowUpRight className="h-4 w-4 text-gray-500 opacity-0 group-hover:opacity-100 group-hover:text-yellow-400 transition-all shrink-0 ml-2" />
                        </motion.div>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="border-t border-white/10 px-4 py-2.5 bg-black/40 flex items-center justify-between text-[11px] text-gray-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] text-gray-300 font-mono">↑↓</kbd> navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] text-gray-300 font-mono">↵</kbd> select
                  </span>
                </div>
                <span>MangoDL Global Search v2.0</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
