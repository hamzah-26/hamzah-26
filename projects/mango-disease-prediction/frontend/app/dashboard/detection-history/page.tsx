"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  Search,
  Filter,
  Calendar,
  Trash2,
  RefreshCw,
  Info,
  ChevronRight,
  List,
  Grid,
  Check,
  X,
  Microscope,
  FlaskConical,
  Leaf,
  ShieldCheck,
  AlertTriangle,
  ArrowUpDown,
  Download,
} from "lucide-react";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/animations/page-transition";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { NeonBadge } from "@/components/ui/neon-badge";
import {
  getDiseaseHistory,
  pruneDiseaseHistory,
  deleteDiseaseHistoryRecord,
  type DiseaseHistoryRecord,
} from "@/lib/api-client";
import { useLocalizedText } from "@/lib/localization";
import { DISEASE_SOLUTIONS_MAP } from "@/data/karnataka-mango-advisory";

const confidenceLevels = [
  { min: 90, label: "Very High", color: "#22c55e" },
  { min: 75, label: "High", color: "#4ade80" },
  { min: 60, label: "Moderate", color: "#f59e0b" },
  { min: 0, label: "Low", color: "#ef4444" },
];

export default function DetectionHistoryPage() {
  const { term, language } = useLocalizedText();
  const [history, setHistory] = useState<DiseaseHistoryRecord[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilterDisease, setHistoryFilterDisease] = useState("all");
  const [historyFilterSeverity, setHistoryFilterSeverity] = useState("all");
  const [historySortOrder, setHistorySortOrder] = useState<"newest" | "oldest" | "highest-conf">("newest");
  const [historyViewMode, setHistoryViewMode] = useState<"table" | "cards">("table");
  const [selectedHistoryModal, setSelectedHistoryModal] = useState<DiseaseHistoryRecord | null>(null);
  const [isPruning, setIsPruning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [historyNotification, setHistoryNotification] = useState<string | null>(null);

  // Fetch Detection History from Backend
  const refreshHistory = () => {
    setIsLoading(true);
    getDiseaseHistory(50)
      .then((data) => {
        if (Array.isArray(data)) {
          setHistory(data);
        }
      })
      .catch((err) => console.warn("Failed to fetch disease history:", err))
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    refreshHistory();
  }, []);

  const getConfidenceColor = (conf: number) => {
    return confidenceLevels.find((l) => conf >= l.min)?.color ?? "#ef4444";
  };

  const handlePruneHistory = async () => {
    try {
      setIsPruning(true);
      const res = await pruneDiseaseHistory(50);
      setHistory(res.history || []);
      setHistoryNotification(`Successfully pruned database to ${res.count || 0} recent records.`);
      setTimeout(() => setHistoryNotification(null), 4000);
    } catch (err) {
      console.error("Prune history failed:", err);
    } finally {
      setIsPruning(false);
    }
  };

  const handleDeleteRecord = async (e: React.MouseEvent, recordId: number) => {
    e.stopPropagation();
    if (!window.confirm(`Delete scan record #${recordId}?`)) return;
    try {
      await deleteDiseaseHistoryRecord(recordId);
      setHistory((prev) => prev.filter((r) => r.id !== recordId));
      if (selectedHistoryModal?.id === recordId) {
        setSelectedHistoryModal(null);
      }
      setHistoryNotification(`Record #${recordId} deleted successfully.`);
      setTimeout(() => setHistoryNotification(null), 3000);
    } catch (err) {
      console.error("Delete record failed:", err);
    }
  };

  // Filtered and Sorted History
  const filteredHistory = useMemo(() => {
    const list = history.filter((record) => {
      const matchSearch =
        historySearch === "" ||
        record.image.toLowerCase().includes(historySearch.toLowerCase()) ||
        record.disease.toLowerCase().includes(historySearch.toLowerCase()) ||
        record.date.toLowerCase().includes(historySearch.toLowerCase());

      const matchDisease =
        historyFilterDisease === "all" ||
        record.disease.toLowerCase().replace(/\s+/g, "") === historyFilterDisease.toLowerCase().replace(/\s+/g, "");

      const matchSeverity =
        historyFilterSeverity === "all" ||
        record.severity.toLowerCase() === historyFilterSeverity.toLowerCase();

      return matchSearch && matchDisease && matchSeverity;
    });

    return list.sort((a, b) => {
      if (historySortOrder === "newest") return b.id - a.id;
      if (historySortOrder === "oldest") return a.id - b.id;
      if (historySortOrder === "highest-conf") return b.confidence - a.confidence;
      return 0;
    });
  }, [history, historySearch, historyFilterDisease, historyFilterSeverity, historySortOrder]);

  return (
    <PageTransition>
      <StaggerContainer className="space-y-4 max-w-7xl mx-auto pb-10">
        {/* ─── Hero Header ─── */}
        <StaggerItem>
          <div
            className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] p-4 sm:p-5 shadow-xl backdrop-blur-xl"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--surface) 96%, transparent) 0%, color-mix(in srgb, var(--surface-soft) 92%, transparent) 50%, color-mix(in srgb, var(--background-elevated) 96%, transparent) 100%)",
            }}
          >
            {/* Ambient Radial Glows */}
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-amber-500/[0.08] blur-[70px] pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-52 h-52 rounded-full bg-emerald-500/[0.08] blur-[60px] pointer-events-none" />

            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 220, damping: 16 }}
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, rgba(245,158,11,0.25), rgba(34,197,94,0.2))",
                    border: "1px solid rgba(245,158,11,0.35)",
                    boxShadow: "0 0 20px rgba(245,158,11,0.2)",
                  }}
                >
                  <History className="w-6 h-6 text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                </motion.div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <h1 className="font-display font-black text-lg sm:text-xl text-[var(--text-primary)] tracking-tight">
                      {term("Pathology Detection History")}
                    </h1>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Recent 50 Auto-Retained
                    </span>
                  </div>
                  <p className="text-[var(--text-muted)] text-xs max-w-2xl leading-relaxed">
                    {term("Comprehensive audit log of leaf scans, multi-task CNN confidence scores, lesion severity ratings, and treatment recommendations across Karnataka orchards.")}
                  </p>
                </div>
              </div>

              {/* Status Chips */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <NeonBadge label={`${filteredHistory.length} Records`} variant="mango" size="sm" />
                <button
                  onClick={handlePruneHistory}
                  disabled={isPruning}
                  className="px-3 py-1.5 rounded-xl bg-[var(--surface-soft)] hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-amber-400 border border-[var(--border-subtle)] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Purge database to ensure exactly recent 50 records"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPruning ? "animate-spin text-amber-400" : ""}`} />
                  <span>{term("Prune to 50 Max")}</span>
                </button>
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* ─── History Toolbar & Content ─── */}
        <StaggerItem>
          <GlassCard className="p-4 sm:p-5 border-[var(--border-subtle)] shadow-xl" hover={false}>
            {/* Notification Banner */}
            {historyNotification && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3.5 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{historyNotification}</span>
              </motion.div>
            )}

            {/* Filter / Search Controls Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4 pb-3 border-b border-[var(--border-subtle)]">
              {/* Search input */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={term("Search by leaf file, disease name, or scan date...")}
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-8 pr-7 py-2 rounded-xl bg-[var(--surface-soft)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:outline-none focus:border-amber-400/60 transition-all"
                />
                {historySearch && (
                  <button
                    onClick={() => setHistorySearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Filters & View Mode */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Disease Filter */}
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                  <select
                    value={historyFilterDisease}
                    onChange={(e) => setHistoryFilterDisease(e.target.value)}
                    className="px-2.5 py-2 rounded-xl bg-[var(--surface-soft)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-secondary)] focus:outline-none focus:border-amber-400 transition-all cursor-pointer"
                  >
                    <option value="all">{term("All Diseases")}</option>
                    <option value="anthracnose">{term("Anthracnose")}</option>
                    <option value="bacterialcanker">{term("Bacterial Canker")}</option>
                    <option value="powderymildew">{term("Powdery Mildew")}</option>
                    <option value="dieback">{term("Die Back")}</option>
                    <option value="gallmidge">{term("Gall Midge")}</option>
                    <option value="cuttingweevil">{term("Cutting Weevil")}</option>
                    <option value="sootymould">{term("Sooty Mould")}</option>
                    <option value="healthy">{term("Healthy")}</option>
                  </select>
                </div>

                {/* Severity Filter */}
                <select
                  value={historyFilterSeverity}
                  onChange={(e) => setHistoryFilterSeverity(e.target.value)}
                  className="px-2.5 py-2 rounded-xl bg-[var(--surface-soft)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-secondary)] focus:outline-none focus:border-amber-400 transition-all cursor-pointer"
                >
                  <option value="all">{term("All Severities")}</option>
                  <option value="High">{term("High Severity")}</option>
                  <option value="Medium">{term("Medium Severity")}</option>
                  <option value="Low">{term("Low Severity")}</option>
                  <option value="None">{term("Healthy (None)")}</option>
                </select>

                {/* Sort Order */}
                <div className="flex items-center gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                  <select
                    value={historySortOrder}
                    onChange={(e) => setHistorySortOrder(e.target.value as any)}
                    className="px-2.5 py-2 rounded-xl bg-[var(--surface-soft)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-secondary)] focus:outline-none focus:border-amber-400 transition-all cursor-pointer"
                  >
                    <option value="newest">{term("Newest First")}</option>
                    <option value="oldest">{term("Oldest First")}</option>
                    <option value="highest-conf">{term("Highest Confidence")}</option>
                  </select>
                </div>

                {/* View Mode Toggle */}
                <div className="flex p-0.5 rounded-xl bg-black/60 border border-white/10 ml-auto md:ml-0">
                  <button
                    onClick={() => setHistoryViewMode("table")}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      historyViewMode === "table" ? "bg-amber-500 text-black shadow-sm" : "text-gray-400 hover:text-white"
                    }`}
                    title="Detailed List Table"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setHistoryViewMode("cards")}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      historyViewMode === "cards" ? "bg-amber-500 text-black shadow-sm" : "text-gray-400 hover:text-white"
                    }`}
                    title="Visual Cards Grid"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content Rendering */}
            {isLoading ? (
              <div className="text-center py-16 text-[var(--text-muted)] text-sm flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                <span>Loading detection history...</span>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-12 bg-[var(--surface-soft)] rounded-xl border border-[var(--border-subtle)]">
                <Info className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-[var(--text-primary)] text-sm font-bold">{term("No matching detection records found")}</p>
                <p className="text-[var(--text-muted)] text-xs mt-0.5">{term("Try adjusting your search query, disease class, or severity filter.")}</p>
              </div>
            ) : historyViewMode === "table" ? (
              /* ── TABLE VIEW ── */
              <div className="overflow-x-auto">
                <div className="min-w-[680px]">
                  {/* Table Header */}
                  <div className="grid grid-cols-[48px_1fr_150px_100px_100px_80px] gap-3 px-4 py-2.5 mb-1.5 bg-[var(--surface-soft)] rounded-xl border border-[var(--border-subtle)] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    <span>#</span>
                    <span>{term("Specimen Image")}</span>
                    <span>{term("Pathology Class")}</span>
                    <span>{term("Confidence")}</span>
                    <span>{term("Severity")}</span>
                    <span className="text-right">{term("Action")}</span>
                  </div>

                  <div className="space-y-1.5 max-h-[560px] overflow-y-auto pr-1 scrollbar-thin">
                    {filteredHistory.map((record, i) => (
                      <motion.div
                        key={record.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.01 + i * 0.012 }}
                        onClick={() => setSelectedHistoryModal(record)}
                        className="grid grid-cols-[48px_1fr_150px_100px_100px_80px] gap-3 items-center px-4 py-3 rounded-xl bg-[var(--surface-soft)] border border-transparent hover:bg-[var(--surface)] hover:border-[var(--border-subtle)] transition-all cursor-pointer group shadow-xs"
                      >
                        <div className="w-7 h-7 rounded-lg bg-[var(--background-elevated)] flex items-center justify-center text-xs font-black text-[var(--text-muted)] group-hover:text-amber-400 transition-colors">
                          {record.id}
                        </div>

                        <div className="min-w-0">
                          <p className="text-[var(--text-primary)] text-xs sm:text-sm font-bold truncate group-hover:text-amber-400 transition-colors">
                            {record.image}
                          </p>
                          <p className="text-[var(--text-muted)] text-[11px] flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            <span>{record.date}</span>
                          </p>
                        </div>

                        <span className="text-[var(--text-primary)] text-xs font-bold">{term(record.disease)}</span>

                        <span className="text-xs font-black" style={{ color: getConfidenceColor(record.confidence) }}>
                          {record.confidence}%
                        </span>

                        <div>
                          <NeonBadge
                            label={term(record.severity)}
                            variant={
                              record.severity === "None"
                                ? "neon"
                                : record.severity === "High"
                                ? "red"
                                : "mango"
                            }
                            size="sm"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => handleDeleteRecord(e, record.id)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                            title="Delete from history"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* ── CARDS GRID VIEW ── */
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin">
                {filteredHistory.map((record) => (
                  <div
                    key={record.id}
                    onClick={() => setSelectedHistoryModal(record)}
                    className="p-3.5 rounded-xl bg-[var(--surface-soft)] border border-[var(--border-subtle)] hover:border-amber-400/40 hover:bg-[var(--surface)] transition-all cursor-pointer group space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-white/5 text-[10px] font-black text-amber-400 flex items-center justify-center">
                          #{record.id}
                        </span>
                        <div>
                          <div className="text-[var(--text-primary)] font-black text-sm group-hover:text-amber-400 transition-colors">
                            {term(record.disease)}
                          </div>
                          <div className="text-[var(--text-muted)] text-[10px]">{record.date}</div>
                        </div>
                      </div>

                      <NeonBadge
                        label={term(record.severity)}
                        variant={record.severity === "None" ? "neon" : record.severity === "High" ? "red" : "mango"}
                        size="sm"
                      />
                    </div>

                    <div className="p-2.5 rounded-lg bg-[var(--background-elevated)] border border-[var(--border-subtle)] flex items-center justify-between text-xs">
                      <span className="text-[var(--text-muted)] font-medium truncate max-w-[140px] text-[11px]">{record.image}</span>
                      <span className="font-black text-xs" style={{ color: getConfidenceColor(record.confidence) }}>
                        {record.confidence}% {term("Conf.")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
                      <span className="group-hover:text-amber-400 font-semibold flex items-center gap-0.5">
                        <span>{term("View Details & Solution")}</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                      <button
                        onClick={(e) => handleDeleteRecord(e, record.id)}
                        className="p-1 rounded text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </StaggerItem>

        {/* ── Modal for Selected History Record ── */}
        <AnimatePresence>
          {selectedHistoryModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-xl rounded-2xl bg-[var(--surface)] border border-[var(--border-strong)] p-5 shadow-2xl space-y-3.5"
              >
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                      <Microscope className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-[var(--text-primary)] font-black text-sm sm:text-base">
                        {term("History Scan Record")} #{selectedHistoryModal.id}
                      </h3>
                      <p className="text-[var(--text-muted)] text-xs">{term("Logged on")} {selectedHistoryModal.date}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedHistoryModal(null)}
                    className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-gray-300 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-[var(--surface-soft)] border border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)]">{term("Pathology Diagnosis")}:</span>
                    <div className="text-[var(--text-primary)] font-black text-sm sm:text-base mt-0.5">{term(selectedHistoryModal.disease)}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--surface-soft)] border border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)]">{term("Model Confidence")}:</span>
                    <div className="text-emerald-400 font-black text-sm sm:text-base mt-0.5">{selectedHistoryModal.confidence}%</div>
                  </div>
                </div>

                {/* Exact Solution Preview */}
                {DISEASE_SOLUTIONS_MAP[selectedHistoryModal.disease] && (
                  <div className="p-3.5 rounded-xl bg-amber-500/[0.08] border border-amber-500/25 space-y-2 text-xs">
                    <div className="text-amber-400 font-bold flex items-center gap-1.5">
                      <FlaskConical className="w-4 h-4" />
                      <span>{term("Recommended Chemical & Organic Treatment:")}</span>
                    </div>
                    <p className="text-[var(--text-primary)] leading-relaxed">
                      {DISEASE_SOLUTIONS_MAP[selectedHistoryModal.disease].chemicalPesticides.primaryChemical} at{" "}
                      {DISEASE_SOLUTIONS_MAP[selectedHistoryModal.disease].chemicalPesticides.dosage}
                    </p>
                    <div className="text-[var(--text-muted)] text-[11px] pt-1 border-t border-amber-500/20">
                      <strong className="text-emerald-400">{term("Organic alternative:")}</strong>{" "}
                      {DISEASE_SOLUTIONS_MAP[selectedHistoryModal.disease].organicSolutions.botanical}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <GlowButton variant="outline" size="sm" onClick={() => setSelectedHistoryModal(null)}>
                    {term("Close")}
                  </GlowButton>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </StaggerContainer>
    </PageTransition>
  );
}
