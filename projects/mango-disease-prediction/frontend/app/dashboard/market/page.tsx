"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Filter,
  RefreshCw,
  MapPin,
  Calendar,
  Layers,
  ArrowUpRight,
  Info,
  CheckCircle,
  AlertCircle,
  X,
  IndianRupee,
  BarChart3,
  Activity,
  SlidersHorizontal,
  ChevronRight,
  Tag,
  Download,
  Building,
  Sparkles,
} from "lucide-react";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/animations/page-transition";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { NeonBadge } from "@/components/ui/neon-badge";
import {
  getKarnatakaMarketPrices,
  getMarketTrends,
  refreshMarketPrices,
  type MarketPriceRecord,
  type MarketPricesResponse,
  type MarketTrendData,
} from "@/lib/api-client";
import { useLocalizedText } from "@/lib/localization";

export default function MarketPricesPage() {
  const { term } = useLocalizedText();

  const [marketData, setMarketData] = useState<MarketPricesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVariety, setSelectedVariety] = useState("ALL");
  const [selectedDistrict, setSelectedDistrict] = useState("ALL");
  const [sortBy, setSortBy] = useState<string>("price_desc");

  // Trend Modal State
  const [selectedTrendRecord, setSelectedTrendRecord] = useState<MarketPriceRecord | null>(null);
  const [trendDays, setTrendDays] = useState<7 | 30>(30);
  const [trendData, setTrendData] = useState<MarketTrendData | null>(null);
  const [isTrendLoading, setIsTrendLoading] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const showToast = useCallback((type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  // Fetch Market Data
  const loadMarketData = useCallback(async () => {
    try {
      const res = await getKarnatakaMarketPrices({
        variety: selectedVariety !== "ALL" ? selectedVariety : undefined,
        district: selectedDistrict !== "ALL" ? selectedDistrict : undefined,
        sort_by: sortBy,
      });
      if (res && res.records) {
        setMarketData(res);
      }
    } catch (err: any) {
      console.error("Failed to load market prices:", err);
      showToast("error", "Failed to fetch live market prices from AGMARKNET gateway.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedVariety, selectedDistrict, sortBy, showToast]);

  useEffect(() => {
    loadMarketData();
  }, [loadMarketData]);

  // Handle Refresh Button
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await refreshMarketPrices();
      await loadMarketData();
      showToast("success", `Market data synced with AGMARKNET (${res.totalRecords} records updated).`);
    } catch (err: any) {
      showToast("error", "Failed to refresh market prices from remote source.");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Open Trend Chart Modal
  const handleOpenTrendModal = async (record: MarketPriceRecord) => {
    setSelectedTrendRecord(record);
    setIsTrendLoading(true);
    try {
      const data = await getMarketTrends(record.variety, record.market, trendDays);
      setTrendData(data);
    } catch (err) {
      console.error("Failed to load trends:", err);
    } finally {
      setIsTrendLoading(false);
    }
  };

  // Update trend duration
  const handleTrendDaysChange = async (days: 7 | 30) => {
    setTrendDays(days);
    if (!selectedTrendRecord) return;
    setIsTrendLoading(true);
    try {
      const data = await getMarketTrends(selectedTrendRecord.variety, selectedTrendRecord.market, days);
      setTrendData(data);
    } catch (err) {
      console.error("Failed to load trends:", err);
    } finally {
      setIsTrendLoading(false);
    }
  };

  // Filtered Records based on search
  const filteredRecords = useMemo(() => {
    if (!marketData?.records) return [];
    let list = marketData.records;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.variety.toLowerCase().includes(q) ||
          r.district.toLowerCase().includes(q) ||
          r.market.toLowerCase().includes(q) ||
          (r.grade && r.grade.toLowerCase().includes(q))
      );
    }
    return list;
  }, [marketData, searchQuery]);

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header with Government Attribution and Sync Trigger */}
        <StaggerItem>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-white/[0.04] to-white/[0.01] border border-white/8 backdrop-blur-md">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                  <Store className="w-5 h-5" />
                </div>
                <h1 className="text-white font-display font-bold text-2xl tracking-tight">
                  {term("Karnataka Mango Market Prices")}
                </h1>
                <NeonBadge label="Official AGMARKNET" variant="mango" />
              </div>
              <p className="text-gray-400 text-xs sm:text-sm mt-1 ml-10">
                {term("Real-time wholesale auction rates, mandi arrivals, and 30-day historical trend analytics across Karnataka APMC mandis")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-end md:self-auto">
              <div className="text-right hidden sm:block">
                <span className="text-[10px] text-gray-500 block">Government Data Feed</span>
                <span className="text-xs font-mono text-yellow-400 font-semibold">
                  {marketData?.lastSynced || "Synced Today, 10:30 AM"}
                </span>
              </div>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-yellow-500 hover:bg-yellow-400 text-black border border-yellow-400/50 shadow-lg shadow-yellow-500/20 transition-all cursor-pointer ${
                  isRefreshing ? "opacity-75 cursor-wait" : "hover:scale-[1.02] active:scale-[0.98]"
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                <span>{isRefreshing ? term("Syncing...") : term("Refresh Market Data")}</span>
              </button>
            </div>
          </div>
        </StaggerItem>

        {/* Global Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-xl border flex items-center justify-between shadow-xl ${
                toast.type === "success"
                  ? "bg-green-500/15 border-green-500/40 text-green-300"
                  : "bg-red-500/15 border-red-500/40 text-red-300"
              }`}
            >
              <div className="flex items-center gap-3">
                {toast.type === "success" ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                )}
                <p className="text-xs sm:text-sm font-medium">{toast.message}</p>
              </div>
              <button onClick={() => setToast(null)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Summary KPI Cards */}
        {marketData?.summary && (
          <StaggerItem>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <GlassCard className="p-5" hover={false}>
                <span className="text-xs text-gray-400 block font-medium">State Modal Average Rate</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-bold text-yellow-400 font-mono">
                    ₹{marketData.summary.stateAveragePricePerKg}
                  </span>
                  <span className="text-xs text-gray-400">/ kg</span>
                </div>
                <span className="text-[11px] text-gray-500 block mt-1 font-mono">
                  ₹{marketData.summary.stateAveragePricePerQuintal.toLocaleString()} / Quintal
                </span>
              </GlassCard>

              <GlassCard className="p-5" hover={false}>
                <span className="text-xs text-gray-400 block font-medium">Top Gainer Today</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-bold text-green-400 font-mono">
                    +{marketData.summary.topGainer?.change || 0}%
                  </span>
                  <span className="text-xs text-green-400/90 font-medium">
                    (₹{marketData.summary.topGainer?.pricePerKg || 0}/kg)
                  </span>
                </div>
                <span className="text-[11px] text-gray-400 block mt-1 truncate">
                  {marketData.summary.topGainer?.variety} · {marketData.summary.topGainer?.market}
                </span>
              </GlassCard>

              <GlassCard className="p-5" hover={false}>
                <span className="text-xs text-gray-400 block font-medium">Highest Mandi Benchmark</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-bold text-white font-mono">
                    ₹{marketData.summary.highestPrice?.pricePerKg || 0}
                  </span>
                  <span className="text-xs text-gray-400">/ kg</span>
                </div>
                <span className="text-[11px] text-yellow-300/80 block mt-1 truncate">
                  {marketData.summary.highestPrice?.variety} · {marketData.summary.highestPrice?.market}
                </span>
              </GlassCard>

              <GlassCard className="p-5" hover={false}>
                <span className="text-xs text-gray-400 block font-medium">Total Tracked APMC Mandis</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-bold text-cyan-400 font-mono">
                    {marketData.totalTrackedMandis} Mandis
                  </span>
                </div>
                <span className="text-[11px] text-gray-400 block mt-1">
                  {marketData.summary.totalArrivalsTodayTonnes}t Total Daily Arrivals
                </span>
              </GlassCard>
            </div>
          </StaggerItem>
        )}

        {/* Search & Filter Controls */}
        <StaggerItem>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/8 backdrop-blur-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Box */}
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cultivar variety, district, or APMC mandi name..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3 text-gray-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Variety Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 font-medium">Variety:</span>
                <select
                  value={selectedVariety}
                  onChange={(e) => setSelectedVariety(e.target.value)}
                  className="bg-black/60 border border-white/15 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-yellow-500/50 cursor-pointer"
                >
                  <option value="ALL" className="bg-[#0a0b0f]">
                    All Varieties
                  </option>
                  {marketData?.availableVarieties?.map((v) => (
                    <option key={v} value={v} className="bg-[#0a0b0f]">
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              {/* District Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 font-medium">District:</span>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="bg-black/60 border border-white/15 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-yellow-500/50 cursor-pointer"
                >
                  <option value="ALL" className="bg-[#0a0b0f]">
                    All Districts
                  </option>
                  {marketData?.availableDistricts?.map((d) => (
                    <option key={d} value={d} className="bg-[#0a0b0f]">
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 font-medium">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-black/60 border border-white/15 text-yellow-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-yellow-500/50 cursor-pointer"
                >
                  <option value="price_desc" className="bg-[#0a0b0f]">
                    Highest Price (₹/kg)
                  </option>
                  <option value="price_asc" className="bg-[#0a0b0f]">
                    Lowest Price (₹/kg)
                  </option>
                  <option value="change_desc" className="bg-[#0a0b0f]">
                    Highest Price Gain (↑ %)
                  </option>
                  <option value="change_asc" className="bg-[#0a0b0f]">
                    Highest Price Drop (↓ %)
                  </option>
                  <option value="arrivals_desc" className="bg-[#0a0b0f]">
                    Highest Daily Arrivals
                  </option>
                </select>
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* Market Records Cards Grid */}
        <StaggerItem>
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <GlassCard key={n} className="h-52 animate-pulse p-6" hover={false}>
                  <div className="h-4 w-32 bg-white/10 rounded mb-3" />
                  <div className="h-8 w-24 bg-white/15 rounded mb-4" />
                  <div className="h-16 w-full bg-white/5 rounded" />
                </GlassCard>
              ))}
            </div>
          ) : filteredRecords.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRecords.map((record) => {
                const isUp = record.direction === "up";
                const isDown = record.direction === "down";
                return (
                  <GlassCard
                    key={record.id}
                    className="p-5 flex flex-col justify-between space-y-4 hover:border-yellow-500/40 transition-all group"
                    hover={false}
                  >
                    {/* Top Row: Variety, Mandi, and Trend Badge */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-white font-bold text-base group-hover:text-yellow-400 transition-colors">
                            {record.variety}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="font-medium text-gray-300">{record.market}</span>
                            <span className="text-gray-500">({record.district})</span>
                          </div>
                        </div>

                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border shrink-0 ${
                            isUp
                              ? "bg-green-500/15 text-green-400 border-green-500/30"
                              : isDown
                              ? "bg-red-500/15 text-red-400 border-red-500/30"
                              : "bg-gray-500/15 text-gray-400 border-gray-500/30"
                          }`}
                        >
                          {isUp && <TrendingUp className="w-3.5 h-3.5" />}
                          {isDown && <TrendingDown className="w-3.5 h-3.5" />}
                          {!isUp && !isDown && <Minus className="w-3.5 h-3.5" />}
                          {record.priceChange > 0 ? `+${record.priceChange}%` : `${record.priceChange}%`}
                        </span>
                      </div>

                      {record.grade && (
                        <span className="inline-block text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-gray-400 border border-white/10 font-mono mt-2">
                          {record.grade}
                        </span>
                      )}
                    </div>

                    {/* Price Figures (₹/kg and ₹/Quintal) */}
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-black/40 border border-white/5">
                      <div>
                        <span className="text-[10px] text-gray-500 block uppercase tracking-wider">
                          Modal Avg Price
                        </span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-xl font-bold font-mono text-yellow-400">
                            ₹{record.pricePerKgAvg}
                          </span>
                          <span className="text-xs text-gray-400">/ kg</span>
                        </div>
                        <span className="text-[10px] text-gray-500 block font-mono mt-0.5">
                          ₹{record.avgPrice.toLocaleString()} / Q
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-gray-500 block uppercase tracking-wider">
                          Mandi Price Range
                        </span>
                        <span className="text-xs font-mono font-bold text-white block mt-1">
                          ₹{record.pricePerKgMin} - ₹{record.pricePerKgMax}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono block">
                          ₹{record.minPrice} - ₹{record.maxPrice} / Q
                        </span>
                      </div>
                    </div>

                    {/* Footer: Arrivals & Trend Button */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                      <span className="text-[11px] text-gray-400 font-mono">
                        Arrivals: <strong className="text-white">{record.arrivalQuantityTonnes}t</strong>
                      </span>

                      <button
                        type="button"
                        onClick={() => handleOpenTrendModal(record)}
                        className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 font-semibold px-2.5 py-1 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 transition-all cursor-pointer"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Price Trends</span>
                      </button>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          ) : (
            <GlassCard className="p-12 text-center space-y-3" hover={false}>
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-400">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="text-white font-semibold text-base">No recent data</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                No active AGMARKNET mandi price records matched your selected variety, district, or search criteria.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedVariety("ALL");
                  setSelectedDistrict("ALL");
                }}
                className="text-xs text-yellow-400 font-semibold hover:underline"
              >
                Clear all filters
              </button>
            </GlassCard>
          )}
        </StaggerItem>

        {/* Footer Government Data Attribution */}
        <StaggerItem>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-yellow-400 shrink-0" />
              <span>
                <strong>Data Source:</strong> AGMARKNET / Directorate of Marketing & Inspection (DMI), Ministry of Agriculture & Farmers Welfare, Govt. of India.
              </span>
            </div>
            <span className="font-mono text-gray-500">State: Karnataka (All 31 Districts Covered)</span>
          </div>
        </StaggerItem>

        {/* ─── 7-DAY & 30-DAY HISTORICAL TREND MODAL ─── */}
        <AnimatePresence>
          {selectedTrendRecord && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl p-6 md:p-8 rounded-3xl bg-[#0e111a] border border-yellow-500/30 shadow-2xl space-y-6 my-8"
              >
                {/* Modal Header */}
                <div className="flex items-start justify-between border-b border-white/10 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider font-mono">
                        Price Movement Analysis
                      </span>
                      <NeonBadge label="AGMARKNET Time Series" variant="mango" />
                    </div>
                    <h2 className="text-white font-display text-xl font-bold mt-1">
                      {selectedTrendRecord.variety} Price Trends
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {selectedTrendRecord.market} ({selectedTrendRecord.district} District)
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedTrendRecord(null)}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Duration Switcher (7-Day vs 30-Day) */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTrendDaysChange(7)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        trendDays === 7
                          ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/20"
                          : "bg-white/5 text-gray-400 hover:text-white"
                      }`}
                    >
                      7-Day Trend
                    </button>
                    <button
                      onClick={() => handleTrendDaysChange(30)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        trendDays === 30
                          ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/20"
                          : "bg-white/5 text-gray-400 hover:text-white"
                      }`}
                    >
                      30-Day Trend
                    </button>
                  </div>

                  {trendData && (
                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 block">Period Movement</span>
                      <span
                        className={`text-xs font-bold font-mono ${
                          trendData.percentageChange > 0
                            ? "text-green-400"
                            : trendData.percentageChange < 0
                            ? "text-red-400"
                            : "text-gray-300"
                        }`}
                      >
                        {trendData.percentageChange > 0 ? `+${trendData.percentageChange}%` : `${trendData.percentageChange}%`}
                      </span>
                    </div>
                  )}
                </div>

                {/* SVG Trend Chart Visualization */}
                {isTrendLoading ? (
                  <div className="h-56 rounded-2xl bg-black/40 border border-white/5 animate-pulse flex items-center justify-center text-gray-500 text-xs">
                    Loading historical time-series...
                  </div>
                ) : trendData && trendData.points && trendData.points.length > 0 ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono pb-2 border-b border-white/5">
                        <span>High: ₹{trendData.maxPricePerKg} / kg</span>
                        <span>Avg: ₹{trendData.averagePricePerKg} / kg</span>
                        <span>Low: ₹{trendData.minPricePerKg} / kg</span>
                      </div>

                      {/* Interactive SVG Sparkline / Curve */}
                      <div className="relative h-44 w-full pt-4">
                        <TrendSvgChart points={trendData.points} />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono pt-1">
                        <span>{trendData.points[0]?.date}</span>
                        <span>Latest: {trendData.points[trendData.points.length - 1]?.date}</span>
                      </div>
                    </div>

                    {/* Stats Grid in Modal */}
                    <div className="grid grid-cols-3 gap-3 text-center text-xs">
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <span className="text-[10px] text-gray-500 block">Start Price</span>
                        <span className="text-white font-bold font-mono">₹{trendData.startPricePerKg} / kg</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <span className="text-[10px] text-gray-500 block">Current Price</span>
                        <span className="text-yellow-400 font-bold font-mono">₹{trendData.currentPricePerKg} / kg</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <span className="text-[10px] text-gray-500 block">Trend Stance</span>
                        <span
                          className={`font-bold uppercase text-[10px] ${
                            trendData.trendDirection === "up"
                              ? "text-green-400"
                              : trendData.trendDirection === "down"
                              ? "text-red-400"
                              : "text-gray-400"
                          }`}
                        >
                          {trendData.trendDirection === "up" ? "Bullish (↑)" : trendData.trendDirection === "down" ? "Bearish (↓)" : "Stable (→)"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400 text-xs">No historical points recorded.</div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSelectedTrendRecord(null)}
                    className="px-5 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    Close Analysis
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </StaggerContainer>
    </PageTransition>
  );
}

// ──────────────────────────────────────────────
// Lightweight High-Performance SVG Curve Chart
// ──────────────────────────────────────────────

function TrendSvgChart({ points }: { points: Array<{ date: string; avgPrice: number; pricePerKg?: number }> }) {
  if (!points || points.length < 2) return null;

  const width = 600;
  const height = 150;
  const padding = 20;

  const values = points.map((p) => p.pricePerKg ?? p.avgPrice / 100.0);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const getX = (index: number) => padding + (index / (points.length - 1)) * (width - 2 * padding);
  const getY = (val: number) => height - padding - ((val - minVal) / range) * (height - 2 * padding);

  const pathCoordinates = points.map((p, i) => `${getX(i)},${getY(p.pricePerKg ?? p.avgPrice / 100.0)}`).join(" L ");
  const linePath = `M ${pathCoordinates}`;
  const areaPath = `M ${getX(0)},${height} L ${pathCoordinates} L ${getX(points.length - 1)},${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
      <defs>
        <linearGradient id="marketAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Horizontal grid guide lines */}
      <line x1={padding} y1={getY(maxVal)} x2={width - padding} y2={getY(maxVal)} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
      <line x1={padding} y1={getY((maxVal + minVal) / 2)} x2={width - padding} y2={getY((maxVal + minVal) / 2)} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
      <line x1={padding} y1={getY(minVal)} x2={width - padding} y2={getY(minVal)} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />

      {/* Area Gradient */}
      <path d={areaPath} fill="url(#marketAreaGrad)" />

      {/* Line Curve */}
      <path d={linePath} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Data Points */}
      {points.map((p, i) => {
        const cx = getX(i);
        const cy = getY(p.pricePerKg ?? p.avgPrice / 100.0);
        return (
          <g key={p.date} className="group">
            <circle cx={cx} cy={cy} r="3.5" fill="#0e111a" stroke="#f59e0b" strokeWidth="2" />
            <text
              x={cx}
              y={cy - 8}
              textAnchor="middle"
              className="fill-yellow-300 font-mono text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ₹{p.pricePerKg ?? Math.round(p.avgPrice / 100)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
