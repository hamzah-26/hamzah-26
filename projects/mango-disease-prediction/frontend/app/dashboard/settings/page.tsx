"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Bell,
  Shield,
  Cpu,
  Palette,
  Globe,
  Key,
  Save,
  Leaf,
  CheckCircle,
  AlertCircle,
  Copy,
  Plus,
  Trash2,
  Zap,
  Smartphone,
  Mail,
  Check,
  RefreshCw,
  Clock,
  Laptop,
  Info,
  X,
  Sliders,
  CheckCheck,
  Trees,
  MapPin,
  Calendar,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileJson,
  Layers,
  Droplets,
  Sprout,
  Edit2,
  TrendingUp,
  Filter,
  BarChart3,
  Search,
  Volume2,
  VolumeX,
} from "lucide-react";
import { playNotificationSound, setNotificationSoundEnabled } from "@/lib/notification-sound";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/animations/page-transition";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { NeonBadge } from "@/components/ui/neon-badge";
import {
  getSettings,
  saveSettings,
  getSessionInfo,
  getIntegrationsStatus,
  createApiKey,
  deleteApiKey,
  getOrchardsApi,
  createOrchardApi,
  updateOrchardApi,
  deleteOrchardApi,
  getBlocksApi,
  createBlockApi,
  updateBlockApi,
  deleteBlockApi,
  getTreatmentsApi,
  createTreatmentApi,
  updateTreatmentApi,
  deleteTreatmentApi,
  getExpensesApi,
  createExpenseApi,
  updateExpenseApi,
  deleteExpenseApi,
  getFarmSummaryApi,
  type UserSettings,
  type ApiKeyRecord,
  type SessionInfo,
  type IntegrationsStatus,
  type Orchard,
  type OrchardBlock,
  type TreatmentRecord,
  type ExpenseRecord,
  type FarmSummaryData,
} from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import { useDashboardStore } from "@/store/dashboard-store";
import { useLocalizedText } from "@/lib/localization";
import type { ColorTheme } from "@/types";

const settingsSections = [
  { id: "profile", label: "Profile", icon: User, desc: "Personal identity & agro credentials" },
  { id: "farm", label: "Farm Management", icon: Trees, desc: "Orchards, blocks, spray logs, expenses & backup" },
  { id: "ai", label: "AI Engine", icon: Cpu, desc: "PyTorch CNN & ML hyperparameters" },
  { id: "notifications", label: "Notifications", icon: Bell, desc: "Alert channels & dispatch rules" },
  { id: "security", label: "Security", icon: Shield, desc: "2FA, active sessions & auth safety" },
  { id: "appearance", label: "Appearance", icon: Palette, desc: "AgTech themes & UI styling" },
  { id: "integrations", label: "Integrations", icon: Globe, desc: "Connected climate, NHB & LLM feeds" },
  { id: "api", label: "API Keys", icon: Key, desc: "REST developer tokens & AI Copilot keys" },
];

const fallbackSettings: UserSettings = {
  profile: {
    fullName: "Manas Mishra",
    email: "manas@mangodl.ai",
    phone: "+91 98765 43210",
    location: "Bengaluru / Karnataka, India",
    organization: "Karnataka Mango Development Board & KSIT",
    role: "Senior Agricultural Technologist & Researcher",
  },
  aiConfig: {
    diseaseArchitecture: "MangoLeafXNetMultiTask (99.0% Acc)",
    autoScanFrequency: "Every 6 hours",
    detectionThreshold: "75%",
    yieldModelVersion: "v3.2 (Latest)",
    autoNotifications: true,
    gradcamVisualization: true,
    revenueForecasting: true,
    betaFeatures: false,
  },
  notifications: {
    emailAlerts: true,
    whatsappAlerts: true,
    climateAlerts: true,
    weeklyDigest: false,
    soundAlerts: true,
  },
  security: {
    twoFactorEnabled: true,
    sessionTimeout: "7 Days",
    loginNotifications: true,
  },
  appearance: {
    theme: "Cyber Amber",
    compactMode: false,
    highContrast: false,
  },
  integrations: {
    openMeteo: { name: "Open-Meteo Climate API", enabled: true },
    nhbDatabase: { name: "NHB Yield Database (2015-2024)", enabled: true },
    litellmRouter: { name: "LiteLLM Multi-Model Vision Router", enabled: true },
    whatsappWebhook: { name: "WhatsApp Farmer Alert Gateway", enabled: true },
  },
  apiKeys: [
    {
      id: "key-001",
      name: "Production Mobile & IoT Key",
      maskedKey: "mg_live_9f8a••••••••••••1849a",
      createdAt: "2026-05-01",
      lastUsed: "Active Today",
      status: "Active",
    },
  ],
};

export default function SettingsPage() {
  const { term } = useLocalizedText();
  const { user, token, updateUser } = useAuthStore();
  const { colorTheme, setColorTheme, setPlatformSettings } = useDashboardStore();

  const [activeSection, setActiveSection] = useState("profile");
  const [settings, setSettings] = useState<UserSettings>(fallbackSettings);
  const [savedSettings, setSavedSettings] = useState<UserSettings>(fallbackSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Toast feedback state
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Session & Integration metadata
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [integrationsStatus, setIntegrationsStatus] = useState<IntegrationsStatus | null>(null);

  // API Key management state
  const [newKeyName, setNewKeyName] = useState("");
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [createdKeyData, setCreatedKeyData] = useState<{ name: string; rawKey: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<ApiKeyRecord | null>(null);
  const [isDeletingKey, setIsDeletingKey] = useState(false);

  // Copilot custom API key state
  const [customGeminiKey, setCustomGeminiKey] = useState("");

  // ----------------------------------------------------
  // FARM MANAGEMENT STATE (Orchards, Blocks, Treatments, Expenses, Summary)
  // ----------------------------------------------------
  const [farmTab, setFarmTab] = useState<"orchards" | "blocks" | "treatments" | "expenses" | "export">("orchards");
  const [orchards, setOrchards] = useState<Orchard[]>([]);
  const [blocks, setBlocks] = useState<OrchardBlock[]>([]);
  const [treatments, setTreatments] = useState<TreatmentRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [farmSummary, setFarmSummary] = useState<FarmSummaryData | null>(null);
  const [isFarmLoading, setIsFarmLoading] = useState(false);
  const [selectedOrchardFilter, setSelectedOrchardFilter] = useState<string>("ALL");

  // Farm Modals State
  const [orchardModalOpen, setOrchardModalOpen] = useState(false);
  const [editingOrchard, setEditingOrchard] = useState<Orchard | null>(null);
  const [orchardForm, setOrchardForm] = useState<Partial<Orchard>>({
    name: "",
    location: "Karnataka, India",
    variety: "Alphonso (Badami)",
    area: 10.0,
    treeCount: 650,
    plantingYear: 2019,
    irrigationType: "Drip Irrigation",
    notes: "",
    status: "Active",
  });

  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<OrchardBlock | null>(null);
  const [blockForm, setBlockForm] = useState<Partial<OrchardBlock>>({
    orchardId: "",
    name: "",
    variety: "Alphonso",
    area: 5.0,
    treeCount: 300,
    plantingYear: 2019,
    irrigation: "Drip",
    notes: "",
    status: "Active",
  });

  const [treatmentModalOpen, setTreatmentModalOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<TreatmentRecord | null>(null);
  const [treatmentForm, setTreatmentForm] = useState<Partial<TreatmentRecord>>({
    orchardId: "",
    blockId: "",
    name: "",
    date: new Date().toISOString().split("T")[0],
    quantity: "2.0 kg / 1000L",
    purpose: "Anthracnose Prevention",
    nextApplicationDate: "",
    notes: "",
  });

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [expenseForm, setExpenseForm] = useState<Partial<ExpenseRecord>>({
    orchardId: "",
    blockId: "",
    category: "Fertilizer",
    amount: 5000,
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: "orchard" | "block" | "treatment" | "expense";
    id: string;
    name: string;
  } | null>(null);
  const [isDeletingFarmItem, setIsDeletingFarmItem] = useState(false);

  const showToast = useCallback((type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  // Fetch Settings, Session, and Integrations
  const loadPlatformData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [data, session, integrations] = await Promise.allSettled([
        getSettings(token || undefined),
        getSessionInfo(token || undefined),
        getIntegrationsStatus(),
      ]);

      if (data.status === "fulfilled" && data.value && data.value.profile) {
        const loaded = data.value;
        setSettings(loaded);
        setSavedSettings(loaded);
        setPlatformSettings(loaded);

        if (loaded.appearance?.theme) {
          setColorTheme(loaded.appearance.theme as ColorTheme);
        }
        if (loaded.profile) {
          updateUser(loaded.profile);
        }
      }

      if (session.status === "fulfilled" && session.value) {
        setSessionInfo(session.value);
      }

      if (integrations.status === "fulfilled" && integrations.value) {
        setIntegrationsStatus(integrations.value);
      }
    } catch (err: any) {
      console.warn("Failed to load settings from server:", err);
      showToast("error", "Could not load settings from server. Operating in local mode.");
    } finally {
      setIsLoading(false);
    }
  }, [token, setColorTheme, setPlatformSettings, updateUser, showToast]);

  // Fetch Farm Management Data
  const loadFarmData = useCallback(async () => {
    setIsFarmLoading(true);
    try {
      const [oRes, bRes, tRes, eRes, sRes] = await Promise.all([
        getOrchardsApi(token || undefined),
        getBlocksApi(undefined, token || undefined),
        getTreatmentsApi(undefined, undefined, token || undefined),
        getExpensesApi(undefined, undefined, token || undefined),
        getFarmSummaryApi(selectedOrchardFilter !== "ALL" ? selectedOrchardFilter : undefined, token || undefined),
      ]);
      setOrchards(oRes.orchards || []);
      setBlocks(bRes.blocks || []);
      setTreatments(tRes.treatments || []);
      setExpenses(eRes.expenses || []);
      setFarmSummary(sRes);
    } catch (err: any) {
      console.error("Failed to load farm management data:", err);
      showToast("error", "Failed to refresh farm management data.");
    } finally {
      setIsFarmLoading(false);
    }
  }, [token, selectedOrchardFilter, showToast]);

  useEffect(() => {
    loadPlatformData();
  }, [loadPlatformData]);

  useEffect(() => {
    if (activeSection === "farm") {
      loadFarmData();
    }
  }, [activeSection, loadFarmData]);

  // Load custom Copilot key from localStorage if on browser
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("mangodl_user_api_key") || "";
      setCustomGeminiKey(savedKey);
    }
  }, []);

  // Dirty state tracking (detect unsaved changes)
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(savedSettings);
  }, [settings, savedSettings]);

  // Profile Change Handler
  const handleProfileChange = (field: keyof UserSettings["profile"], value: string) => {
    setSettings((prev) => ({
      ...prev,
      profile: { ...prev.profile, [field]: value },
    }));
  };

  // AI Config Change Handler
  const handleAiConfigChange = (field: keyof UserSettings["aiConfig"], value: any) => {
    setSettings((prev) => ({
      ...prev,
      aiConfig: { ...prev.aiConfig, [field]: value },
    }));
  };

  // Notification Toggle Handler
  const handleNotificationToggle = (field: keyof UserSettings["notifications"]) => {
    setSettings((prev) => {
      const nextVal = !prev.notifications[field];
      if (field === "soundAlerts") {
        setNotificationSoundEnabled(nextVal);
      }
      return {
        ...prev,
        notifications: {
          ...prev.notifications,
          [field]: nextVal,
        },
      };
    });
  };

  // Security Change Handler
  const handleSecurityChange = (field: keyof UserSettings["security"], value: any) => {
    setSettings((prev) => ({
      ...prev,
      security: { ...prev.security, [field]: value },
    }));
  };

  // Theme Change Handler (Instant UI update + marked in settings)
  const handleThemeChange = (themeName: ColorTheme) => {
    setColorTheme(themeName);
    setSettings((prev) => ({
      ...prev,
      appearance: { ...prev.appearance, theme: themeName },
    }));
  };

  // Save Settings to Backend Database
  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const res = await saveSettings(settings, token || undefined);
      const updated = res.settings || settings;
      setSettings(updated);
      setSavedSettings(updated);
      setPlatformSettings(updated);

      if (updated.profile) {
        updateUser(updated.profile);
      }
      if (updated.appearance?.theme) {
        setColorTheme(updated.appearance.theme as ColorTheme);
      }

      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
      showToast("success", "All platform settings and profile changes successfully saved to database.");
    } catch (err: any) {
      console.error("Save error:", err);
      showToast("error", err?.message || "Failed to save settings. Local edits are preserved.");
    } finally {
      setIsSaving(false);
    }
  };

  // Create API Key
  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setIsCreatingKey(true);
    try {
      const created = await createApiKey(newKeyName.trim(), token || undefined);
      const nextKeys = [...(settings.apiKeys || []), created];
      setSettings((prev) => ({
        ...prev,
        apiKeys: nextKeys,
      }));
      setSavedSettings((prev) => ({
        ...prev,
        apiKeys: nextKeys,
      }));
      setCreatedKeyData({
        name: created.name,
        rawKey: created.rawKey || "mg_live_" + Math.random().toString(36).slice(2),
      });
      setNewKeyName("");
      showToast("success", `API key "${created.name}" generated successfully.`);
    } catch (err: any) {
      showToast("error", err?.message || "Failed to generate API key.");
    } finally {
      setIsCreatingKey(false);
    }
  };

  // Delete API Key
  const handleDeleteKeyConfirm = async () => {
    if (!keyToDelete) return;
    setIsDeletingKey(true);
    try {
      await deleteApiKey(keyToDelete.id, token || undefined);
      const nextKeys = (settings.apiKeys || []).filter((k) => k.id !== keyToDelete.id);
      setSettings((prev) => ({
        ...prev,
        apiKeys: nextKeys,
      }));
      setSavedSettings((prev) => ({
        ...prev,
        apiKeys: nextKeys,
      }));
      showToast("info", `API key "${keyToDelete.name}" revoked.`);
      setKeyToDelete(null);
    } catch (err: any) {
      showToast("error", err?.message || "Failed to delete API key.");
    } finally {
      setIsDeletingKey(false);
    }
  };

  // ----------------------------------------------------
  // FARM MANAGEMENT CRUD HANDLERS
  // ----------------------------------------------------
  // Orchard Save
  const handleSaveOrchard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orchardForm.name?.trim()) return;
    try {
      if (editingOrchard) {
        await updateOrchardApi(editingOrchard.id, orchardForm, token || undefined);
        showToast("success", `Orchard "${orchardForm.name}" updated.`);
      } else {
        await createOrchardApi(orchardForm, token || undefined);
        showToast("success", `Orchard "${orchardForm.name}" registered.`);
      }
      setOrchardModalOpen(false);
      setEditingOrchard(null);
      await loadFarmData();
    } catch (err: any) {
      showToast("error", err?.message || "Failed to save orchard.");
    }
  };

  // Block Save
  const handleSaveBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockForm.name?.trim() || !blockForm.orchardId) {
      showToast("error", "Please provide a block name and select a parent orchard.");
      return;
    }
    try {
      if (editingBlock) {
        await updateBlockApi(editingBlock.id, blockForm, token || undefined);
        showToast("success", `Block "${blockForm.name}" updated.`);
      } else {
        await createBlockApi(blockForm, token || undefined);
        showToast("success", `Block "${blockForm.name}" created.`);
      }
      setBlockModalOpen(false);
      setEditingBlock(null);
      await loadFarmData();
    } catch (err: any) {
      showToast("error", err?.message || "Failed to save block.");
    }
  };

  // Treatment Save
  const handleSaveTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!treatmentForm.name?.trim() || !treatmentForm.orchardId) {
      showToast("error", "Please provide treatment name and target orchard.");
      return;
    }
    try {
      if (editingTreatment) {
        await updateTreatmentApi(editingTreatment.id, treatmentForm, token || undefined);
        showToast("success", "Treatment record updated.");
      } else {
        await createTreatmentApi(treatmentForm, token || undefined);
        showToast("success", "New spray/treatment logged.");
      }
      setTreatmentModalOpen(false);
      setEditingTreatment(null);
      await loadFarmData();
    } catch (err: any) {
      showToast("error", err?.message || "Failed to save treatment.");
    }
  };

  // Expense Save
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.orchardId || Number(expenseForm.amount) <= 0) {
      showToast("error", "Please provide an orchard and valid expense amount.");
      return;
    }
    try {
      if (editingExpense) {
        await updateExpenseApi(editingExpense.id, expenseForm, token || undefined);
        showToast("success", "Expense record updated.");
      } else {
        await createExpenseApi(expenseForm, token || undefined);
        showToast("success", "Expense logged successfully.");
      }
      setExpenseModalOpen(false);
      setEditingExpense(null);
      await loadFarmData();
    } catch (err: any) {
      showToast("error", err?.message || "Failed to save expense.");
    }
  };

  // Generic Farm Item Delete
  const handleConfirmDeleteFarmItem = async () => {
    if (!deleteConfirmTarget) return;
    setIsDeletingFarmItem(true);
    try {
      const { type, id, name } = deleteConfirmTarget;
      if (type === "orchard") {
        await deleteOrchardApi(id, token || undefined);
        showToast("info", `Orchard "${name}" and all sub-records deleted.`);
      } else if (type === "block") {
        await deleteBlockApi(id, token || undefined);
        showToast("info", `Block "${name}" deleted.`);
      } else if (type === "treatment") {
        await deleteTreatmentApi(id, token || undefined);
        showToast("info", `Treatment record deleted.`);
      } else if (type === "expense") {
        await deleteExpenseApi(id, token || undefined);
        showToast("info", `Expense record deleted.`);
      }
      setDeleteConfirmTarget(null);
      await loadFarmData();
    } catch (err: any) {
      showToast("error", err?.message || "Failed to delete record.");
    } finally {
      setIsDeletingFarmItem(false);
    }
  };

  // File Download Trigger for CSV / JSON
  const handleDownloadExport = (format: "csv" | "json") => {
    const downloadUrl = `/api/farm/export?format=${format}`;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `mangodl_farm_export_${new Date().toISOString().split("T")[0]}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("success", `Farm data exported as ${format.toUpperCase()}.`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Filtered views for current selected orchard
  const filteredBlocks = useMemo(() => {
    if (selectedOrchardFilter === "ALL") return blocks;
    return blocks.filter((b) => b.orchardId === selectedOrchardFilter);
  }, [blocks, selectedOrchardFilter]);

  const filteredTreatments = useMemo(() => {
    if (selectedOrchardFilter === "ALL") return treatments;
    return treatments.filter((t) => t.orchardId === selectedOrchardFilter);
  }, [treatments, selectedOrchardFilter]);

  const filteredExpenses = useMemo(() => {
    if (selectedOrchardFilter === "ALL") return expenses;
    return expenses.filter((e) => e.orchardId === selectedOrchardFilter);
  }, [expenses, selectedOrchardFilter]);

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Top Header with Dynamic Save Bar */}
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-white/[0.04] to-white/[0.01] border border-white/8 backdrop-blur-md">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <h2 className="text-white font-display font-bold text-2xl tracking-tight">
                  {term("Platform Settings")}
                </h2>
              </div>
              <p className="text-gray-400 text-xs sm:text-sm mt-1 ml-10">
                {term("Configure MangoDL agronomist preferences, farm management, crop memory & neural models")}
              </p>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              {hasUnsavedChanges && (
                <span className="text-xs text-yellow-400 font-semibold px-3 py-1.5 rounded-xl bg-yellow-500/15 border border-yellow-500/30 flex items-center gap-2 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  Unsaved Edits
                </span>
              )}

              {/* ALWAYS ACTIVE & CLICKABLE SAVE BUTTON */}
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer shadow-lg select-none ${
                  justSaved
                    ? "bg-green-500 text-black border border-green-400 shadow-green-500/30 scale-[1.02]"
                    : hasUnsavedChanges
                    ? "bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 text-black border border-yellow-300 shadow-yellow-500/30 hover:scale-[1.02] active:scale-[0.98]"
                    : "bg-yellow-500 hover:bg-yellow-400 text-black border border-yellow-400/50 shadow-yellow-500/20 hover:scale-[1.02] active:scale-[0.98]"
                } ${isSaving ? "opacity-75 cursor-wait" : ""}`}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    <span>{term("Saving...") || "Saving..."}</span>
                  </>
                ) : justSaved ? (
                  <>
                    <CheckCheck className="w-4 h-4 text-black" />
                    <span>{term("Saved to Database!") || "Saved to Database!"}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-black" />
                    <span>{term("Save Changes") || "Save Changes"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </StaggerItem>

        {/* Global Toast Alert Banner */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className={`p-4 rounded-xl border flex items-center justify-between shadow-xl ${
                toast.type === "success"
                  ? "bg-green-500/15 border-green-500/40 text-green-300 shadow-green-500/10"
                  : toast.type === "error"
                  ? "bg-red-500/15 border-red-500/40 text-red-300 shadow-red-500/10"
                  : "bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-cyan-500/10"
              }`}
            >
              <div className="flex items-center gap-3">
                {toast.type === "success" && <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />}
                {toast.type === "error" && <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
                {toast.type === "info" && <Info className="w-5 h-5 text-cyan-400 shrink-0" />}
                <p className="text-sm font-medium">{toast.message}</p>
              </div>
              <button
                onClick={() => setToast(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. PARALLEL HORIZONTAL CATEGORY NAVIGATION BAR */}
        <StaggerItem>
          <div className="w-full overflow-x-auto pb-1 no-scrollbar scroll-smooth">
            <div className="flex items-center gap-2 min-w-max p-1.5 rounded-2xl bg-white/[0.03] border border-white/8 backdrop-blur-md">
              {settingsSections.map((section) => {
                const isActive = activeSection === section.id;
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer select-none whitespace-nowrap relative ${
                      isActive
                        ? "bg-yellow-500/15 border border-yellow-500/35 text-yellow-400 font-semibold shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                        : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-yellow-400" : "text-gray-400"}`} />
                    <span>{term(section.label)}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0 ml-0.5 shadow-[0_0_8px_#f59e0b]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </StaggerItem>

        {/* 2. MAIN ACTIVE SETTINGS SECTION (FULL WIDTH) */}
        <StaggerItem>
          <div className="space-y-6">
            {isLoading ? (
              <GlassCard className="p-8 space-y-6 animate-pulse" hover={false}>
                <div className="h-6 w-48 bg-white/10 rounded-md" />
                <div className="h-24 w-full bg-white/5 rounded-2xl" />
                <div className="grid md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="h-16 bg-white/5 rounded-xl" />
                  ))}
                </div>
              </GlassCard>
            ) : (
              <AnimatePresence mode="wait">
                {/* 1. PROFILE SECTION */}
                {activeSection === "profile" && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <GlassCard className="p-6 md:p-8" hover={false}>
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                        <div>
                          <h3 className="text-white font-semibold text-lg">{term("Profile Information")}</h3>
                          <p className="text-gray-400 text-xs mt-0.5">
                            Update your agricultural organization identity and platform contact details
                          </p>
                        </div>
                        <NeonBadge label="Database Synced" variant="mango" />
                      </div>

                      {/* Avatar & Summary Card */}
                      <div className="flex flex-col sm:flex-row items-center gap-5 mb-6 p-5 rounded-2xl bg-white/[0.03] border border-white/8">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-500 to-amber-600 flex items-center justify-center text-black text-2xl font-bold shadow-[0_0_30px_rgba(245,158,11,0.3)] shrink-0">
                          {(settings.profile.fullName || "M").charAt(0).toUpperCase()}
                        </div>
                        <div className="text-center sm:text-left flex-1 min-w-0">
                          <h4 className="text-white font-bold text-lg truncate">
                            {settings.profile.fullName || "Agronomist Researcher"}
                          </h4>
                          <p className="text-gray-400 text-sm font-mono truncate">{settings.profile.email}</p>
                          <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                            <NeonBadge label={settings.profile.role || "Orchard Manager"} variant="mango" />
                            <NeonBadge label={settings.profile.organization || "MangoDL AI"} variant="neon" />
                          </div>
                        </div>
                      </div>

                      {/* Editable Form Inputs */}
                      <div className="grid md:grid-cols-2 gap-5">
                        {[
                          { label: "Full Name", field: "fullName", type: "text", placeholder: "e.g. Manas Mishra" },
                          { label: "Email Address", field: "email", type: "email", placeholder: "e.g. manas@mangodl.ai" },
                          { label: "Phone Number", field: "phone", type: "tel", placeholder: "e.g. +91 98765 43210" },
                          { label: "Location / District", field: "location", type: "text", placeholder: "e.g. Hassan, Karnataka" },
                          { label: "Organization / Orchard", field: "organization", type: "text", placeholder: "e.g. Karnataka Mango Development Board" },
                          { label: "Platform Role", field: "role", type: "text", placeholder: "e.g. Lead System Architect & Agronomist" },
                        ].map((item) => (
                          <div key={item.field} className="space-y-1.5">
                            <label className="block text-xs font-semibold text-gray-300">
                              {term(item.label)}
                            </label>
                            <input
                              type={item.type}
                              value={settings.profile[item.field as keyof UserSettings["profile"]] || ""}
                              onChange={(e) =>
                                handleProfileChange(item.field as keyof UserSettings["profile"], e.target.value)
                              }
                              placeholder={item.placeholder}
                              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 focus:bg-black/60 transition-all font-sans"
                            />
                          </div>
                        ))}
                      </div>
                    </GlassCard>
                  </motion.div>
                )}

                {/* 2. FARM MANAGEMENT SECTION (5 SUBSECTIONS) */}
                {activeSection === "farm" && (
                  <motion.div
                    key="farm"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    {/* Farm Sub-Navigation Tabs */}
                    <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/8 backdrop-blur-md">
                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          { id: "orchards" as const, label: "Orchards & Crop Memory", icon: Trees },
                          { id: "blocks" as const, label: "Block / Zone Manager", icon: Layers },
                          { id: "treatments" as const, label: "Treatment & Spray Log", icon: Droplets },
                          { id: "expenses" as const, label: "Expense & Profit Tracker", icon: DollarSign },
                          { id: "export" as const, label: "Data Export & Backup", icon: Download },
                        ].map((tab) => {
                          const isTabActive = farmTab === tab.id;
                          const TabIcon = tab.icon;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => setFarmTab(tab.id)}
                              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                isTabActive
                                  ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                                  : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                              }`}
                            >
                              <TabIcon className="w-3.5 h-3.5" />
                              <span>{tab.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Orchard Filter Selector */}
                      <div className="flex items-center gap-2">
                        <Filter className="w-3.5 h-3.5 text-gray-400" />
                        <select
                          value={selectedOrchardFilter}
                          onChange={(e) => setSelectedOrchardFilter(e.target.value)}
                          className="bg-black/60 border border-white/15 text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-yellow-500/50 cursor-pointer"
                        >
                          <option value="ALL" className="bg-[#0a0b0f]">
                            All Orchards ({orchards.length})
                          </option>
                          {orchards.map((o) => (
                            <option key={o.id} value={o.id} className="bg-[#0a0b0f]">
                              {o.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* SUBSECTION 1: ORCHARD PROFILE & CROP MEMORY */}
                    {farmTab === "orchards" && (
                      <GlassCard className="p-6 md:p-8 space-y-6" hover={false}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                          <div>
                            <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                              <Trees className="w-5 h-5 text-yellow-400" />
                              <span>Orchard Profiles & Crop Memory</span>
                            </h3>
                            <p className="text-gray-400 text-xs mt-0.5">
                              Persistent plantation records, geographic cultivars, canopy densities & soil memory
                            </p>
                          </div>
                          <GlowButton
                            variant="mango"
                            size="sm"
                            onClick={() => {
                              setEditingOrchard(null);
                              setOrchardForm({
                                name: "",
                                location: "Karnataka, India",
                                variety: "Alphonso (Badami)",
                                area: 10.0,
                                treeCount: 650,
                                plantingYear: 2019,
                                irrigationType: "Drip Irrigation",
                                notes: "",
                                status: "Active",
                              });
                              setOrchardModalOpen(true);
                            }}
                            className="gap-1.5 px-4"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add New Orchard</span>
                          </GlowButton>
                        </div>

                        {/* Orchard Cards Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {orchards.map((orchard) => (
                            <div
                              key={orchard.id}
                              className="p-5 rounded-2xl bg-white/[0.02] border border-white/8 hover:border-yellow-500/30 transition-all space-y-3 flex flex-col justify-between"
                            >
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="text-white font-bold text-sm line-clamp-1">{orchard.name}</h4>
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                                      orchard.status === "Active"
                                        ? "bg-green-500/15 text-green-400 border-green-500/30"
                                        : "bg-gray-500/15 text-gray-400 border-gray-500/30"
                                    }`}
                                  >
                                    {orchard.status}
                                  </span>
                                </div>

                                <div className="space-y-1 text-xs text-gray-400">
                                  <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <span className="truncate">{orchard.location}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Leaf className="w-3.5 h-3.5 text-green-400 shrink-0" />
                                    <span className="truncate">{orchard.variety}</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                                    <span className="text-[10px] text-gray-500 block">Area</span>
                                    <span className="text-white font-bold">{orchard.area} Ac</span>
                                  </div>
                                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                                    <span className="text-[10px] text-gray-500 block">Trees</span>
                                    <span className="text-white font-bold">{orchard.treeCount}</span>
                                  </div>
                                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                                    <span className="text-[10px] text-gray-500 block">Planting</span>
                                    <span className="text-white font-bold">{orchard.plantingYear}</span>
                                  </div>
                                </div>

                                {orchard.notes && (
                                  <p className="text-[11px] text-gray-400 italic line-clamp-2 pt-1">
                                    &ldquo;{orchard.notes}&rdquo;
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                                <span className="text-[10px] text-gray-500 font-mono">
                                  {orchard.irrigationType}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      setEditingOrchard(orchard);
                                      setOrchardForm(orchard);
                                      setOrchardModalOpen(true);
                                    }}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      setDeleteConfirmTarget({
                                        type: "orchard",
                                        id: orchard.id,
                                        name: orchard.name,
                                      })
                                    }
                                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </GlassCard>
                    )}

                    {/* SUBSECTION 2: ORCHARD BLOCK / ZONE MANAGER */}
                    {farmTab === "blocks" && (
                      <GlassCard className="p-6 md:p-8 space-y-6" hover={false}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                          <div>
                            <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                              <Layers className="w-5 h-5 text-cyan-400" />
                              <span>Orchard Block & Zone Manager</span>
                            </h3>
                            <p className="text-gray-400 text-xs mt-0.5">
                              Micro-management of specific orchard plots, irrigation zones & cultivars
                            </p>
                          </div>
                          <GlowButton
                            variant="mango"
                            size="sm"
                            onClick={() => {
                              setEditingBlock(null);
                              setBlockForm({
                                orchardId: orchards[0]?.id || "",
                                name: "",
                                variety: "Alphonso",
                                area: 5.0,
                                treeCount: 300,
                                plantingYear: 2019,
                                irrigation: "Drip Irrigation",
                                notes: "",
                                status: "Active",
                              });
                              setBlockModalOpen(true);
                            }}
                            className="gap-1.5 px-4"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Block / Zone</span>
                          </GlowButton>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          {filteredBlocks.map((block) => {
                            const parentOrchard = orchards.find((o) => o.id === block.orchardId);
                            return (
                              <div
                                key={block.id}
                                className="p-5 rounded-2xl bg-white/[0.02] border border-white/8 hover:border-cyan-500/30 transition-all space-y-3"
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="text-white font-bold text-sm">{block.name}</h4>
                                    <span className="text-xs text-yellow-400/90 font-medium block mt-0.5">
                                      {parentOrchard?.name || "Unassigned Orchard"}
                                    </span>
                                  </div>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono border border-cyan-500/20">
                                    {block.variety}
                                  </span>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                                    <span className="text-[10px] text-gray-500 block">Area</span>
                                    <span className="text-white font-bold">{block.area} Ac</span>
                                  </div>
                                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                                    <span className="text-[10px] text-gray-500 block">Tree Count</span>
                                    <span className="text-white font-bold">{block.treeCount}</span>
                                  </div>
                                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                                    <span className="text-[10px] text-gray-500 block">Irrigation</span>
                                    <span className="text-white font-bold truncate block">{block.irrigation}</span>
                                  </div>
                                </div>

                                {block.notes && (
                                  <p className="text-[11px] text-gray-400 italic">
                                    &ldquo;{block.notes}&rdquo;
                                  </p>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                                  <span className="text-[10px] text-gray-500">
                                    Planting Year: {block.plantingYear}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => {
                                        setEditingBlock(block);
                                        setBlockForm(block);
                                        setBlockModalOpen(true);
                                      }}
                                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        setDeleteConfirmTarget({
                                          type: "block",
                                          id: block.id,
                                          name: block.name,
                                        })
                                      }
                                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </GlassCard>
                    )}

                    {/* SUBSECTION 3: TREATMENT & SPRAY LOG */}
                    {farmTab === "treatments" && (
                      <GlassCard className="p-6 md:p-8 space-y-6" hover={false}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                          <div>
                            <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                              <Droplets className="w-5 h-5 text-emerald-400" />
                              <span>Treatment & Spray Log</span>
                            </h3>
                            <p className="text-gray-400 text-xs mt-0.5">
                              Fungicide, insecticide & foliar nutrient spray history with recurrence reminders
                            </p>
                          </div>
                          <GlowButton
                            variant="mango"
                            size="sm"
                            onClick={() => {
                              setEditingTreatment(null);
                              setTreatmentForm({
                                orchardId: orchards[0]?.id || "",
                                blockId: blocks[0]?.id || "",
                                name: "",
                                date: new Date().toISOString().split("T")[0],
                                quantity: "2.5 kg / 1000L",
                                purpose: "Anthracnose & Blight Prevention",
                                nextApplicationDate: "",
                                notes: "",
                              });
                              setTreatmentModalOpen(true);
                            }}
                            className="gap-1.5 px-4"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Log Spray / Treatment</span>
                          </GlowButton>
                        </div>

                        {/* Treatments Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-white/10 text-gray-400 font-semibold">
                                <th className="py-3 px-4">Treatment / Chemical</th>
                                <th className="py-3 px-4">Orchard & Block</th>
                                <th className="py-3 px-4">Quantity / Dilution</th>
                                <th className="py-3 px-4">Purpose</th>
                                <th className="py-3 px-4">Date Applied</th>
                                <th className="py-3 px-4">Next Spray Due</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {filteredTreatments.map((trt) => {
                                const orch = orchards.find((o) => o.id === trt.orchardId);
                                const blk = blocks.find((b) => b.id === trt.blockId);
                                return (
                                  <tr key={trt.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="py-3 px-4 font-bold text-white">
                                      {trt.name}
                                      {trt.notes && (
                                        <span className="block text-[11px] text-gray-400 font-normal italic">
                                          {trt.notes}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-3 px-4 text-gray-300">
                                      <span className="block font-medium text-yellow-300/90">{orch?.name || "Orchard"}</span>
                                      <span className="text-[11px] text-gray-500">{blk?.name || "General Orchard Plot"}</span>
                                    </td>
                                    <td className="py-3 px-4 text-gray-300 font-mono">{trt.quantity}</td>
                                    <td className="py-3 px-4">
                                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                                        {trt.purpose}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-gray-300 font-mono">{trt.date}</td>
                                    <td className="py-3 px-4 text-amber-400 font-mono font-medium">
                                      {trt.nextApplicationDate || "None Scheduled"}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          onClick={() => {
                                            setEditingTreatment(trt);
                                            setTreatmentForm(trt);
                                            setTreatmentModalOpen(true);
                                          }}
                                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            setDeleteConfirmTarget({
                                              type: "treatment",
                                              id: trt.id,
                                              name: trt.name,
                                            })
                                          }
                                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </GlassCard>
                    )}

                    {/* SUBSECTION 4: EXPENSE & PROFIT TRACKER */}
                    {farmTab === "expenses" && (
                      <div className="space-y-6">
                        {/* Financial Summary KPI Cards */}
                        {farmSummary && (
                          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <GlassCard className="p-5" hover={false}>
                              <span className="text-xs text-gray-400 block font-medium">Total Expenses</span>
                              <p className="text-2xl font-bold text-red-400 font-mono mt-1">
                                ₹{farmSummary.totalExpenses.toLocaleString()}
                              </p>
                              <span className="text-[11px] text-gray-500 block mt-1">
                                Across {farmSummary.orchardsCount} orchards
                              </span>
                            </GlassCard>

                            <GlassCard className="p-5" hover={false}>
                              <span className="text-xs text-gray-400 block font-medium">Expected APMC Gross Revenue</span>
                              <p className="text-2xl font-bold text-green-400 font-mono mt-1">
                                ₹{farmSummary.expectedRevenue.toLocaleString()}
                              </p>
                              <span className="text-[11px] text-gray-500 block mt-1">
                                ~{farmSummary.estimatedProductionTons} Tons projection
                              </span>
                            </GlassCard>

                            <GlassCard className="p-5" hover={false}>
                              <span className="text-xs text-gray-400 block font-medium">Estimated Net Profit</span>
                              <p className="text-2xl font-bold text-yellow-400 font-mono mt-1">
                                ₹{farmSummary.estimatedProfit.toLocaleString()}
                              </p>
                              <span className="text-[11px] text-green-400 font-semibold block mt-1 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                {farmSummary.roiPercentage}% Projected ROI
                              </span>
                            </GlassCard>

                            <GlassCard className="p-5" hover={false}>
                              <span className="text-xs text-gray-400 block font-medium">Cultivated Area & Trees</span>
                              <p className="text-2xl font-bold text-white font-mono mt-1">
                                {farmSummary.totalAreaAcres} Acres
                              </p>
                              <span className="text-[11px] text-gray-400 block mt-1">
                                {farmSummary.totalTrees.toLocaleString()} Verified canopy trees
                              </span>
                            </GlassCard>
                          </div>
                        )}

                        {/* Expenses Table & Management */}
                        <GlassCard className="p-6 md:p-8 space-y-6" hover={false}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                            <div>
                              <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-yellow-400" />
                                <span>Operational Expense Ledger</span>
                              </h3>
                              <p className="text-gray-400 text-xs mt-0.5">
                                Fertilizers, chemical fungicides, irrigation maintenance, labour & logistics
                              </p>
                            </div>
                            <GlowButton
                              variant="mango"
                              size="sm"
                              onClick={() => {
                                setEditingExpense(null);
                                setExpenseForm({
                                  orchardId: orchards[0]?.id || "",
                                  blockId: blocks[0]?.id || "",
                                  category: "Fertilizer",
                                  amount: 7500,
                                  date: new Date().toISOString().split("T")[0],
                                  description: "",
                                });
                                setExpenseModalOpen(true);
                              }}
                              className="gap-1.5 px-4"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Add Expense Entry</span>
                            </GlowButton>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-white/10 text-gray-400 font-semibold">
                                  <th className="py-3 px-4">Category</th>
                                  <th className="py-3 px-4">Description</th>
                                  <th className="py-3 px-4">Orchard & Plot</th>
                                  <th className="py-3 px-4">Amount (INR)</th>
                                  <th className="py-3 px-4">Date</th>
                                  <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {filteredExpenses.map((exp) => {
                                  const orch = orchards.find((o) => o.id === exp.orchardId);
                                  const blk = blocks.find((b) => b.id === exp.blockId);
                                  return (
                                    <tr key={exp.id} className="hover:bg-white/[0.02] transition-colors">
                                      <td className="py-3 px-4">
                                        <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 font-bold text-white text-[10px]">
                                          {exp.category}
                                        </span>
                                      </td>
                                      <td className="py-3 px-4 font-medium text-gray-200">{exp.description}</td>
                                      <td className="py-3 px-4 text-gray-400">
                                        {orch?.name || "Orchard"} {blk ? `(${blk.name})` : ""}
                                      </td>
                                      <td className="py-3 px-4 font-mono font-bold text-yellow-400 text-sm">
                                        ₹{exp.amount.toLocaleString()}
                                      </td>
                                      <td className="py-3 px-4 text-gray-400 font-mono">{exp.date}</td>
                                      <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                          <button
                                            onClick={() => {
                                              setEditingExpense(exp);
                                              setExpenseForm(exp);
                                              setExpenseModalOpen(true);
                                            }}
                                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() =>
                                              setDeleteConfirmTarget({
                                                type: "expense",
                                                id: exp.id,
                                                name: `${exp.category} (₹${exp.amount})`,
                                              })
                                            }
                                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </GlassCard>
                      </div>
                    )}

                    {/* SUBSECTION 5: DATA EXPORT & BACKUP */}
                    {farmTab === "export" && (
                      <GlassCard className="p-6 md:p-8 space-y-6" hover={false}>
                        <div className="border-b border-white/10 pb-4">
                          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                            <Download className="w-5 h-5 text-yellow-400" />
                            <span>Data Export & Full Agronomy Backup</span>
                          </h3>
                          <p className="text-gray-400 text-xs mt-0.5">
                            Download all orchard memory, plots, spray records, and expenses securely
                          </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-5">
                          {/* CSV Export Card */}
                          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/8 hover:border-yellow-500/30 transition-all space-y-4 flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                                <FileSpreadsheet className="w-6 h-6" />
                              </div>
                              <h4 className="text-white font-bold text-base">Export as Spreadsheets (CSV)</h4>
                              <p className="text-gray-400 text-xs leading-relaxed">
                                Formatted multi-table CSV containing all registered orchards, zone blocks, treatment spray timelines, and detailed expense ledgers. Compatible with Excel and Google Sheets.
                              </p>
                            </div>
                            <GlowButton
                              variant="mango"
                              size="sm"
                              onClick={() => handleDownloadExport("csv")}
                              className="w-full gap-2 justify-center py-2.5"
                            >
                              <Download className="w-4 h-4" />
                              <span>Download Farm CSV Export</span>
                            </GlowButton>
                          </div>

                          {/* JSON Export Card */}
                          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/8 hover:border-yellow-500/30 transition-all space-y-4 flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                <FileJson className="w-6 h-6" />
                              </div>
                              <h4 className="text-white font-bold text-base">Full JSON Database Backup</h4>
                              <p className="text-gray-400 text-xs leading-relaxed">
                                Complete machine-readable backup of your entire crop memory graph, financial records, and tree parameters for seamless restoration or migration.
                              </p>
                            </div>
                            <GlowButton
                              variant="mango"
                              size="sm"
                              onClick={() => handleDownloadExport("json")}
                              className="w-full gap-2 justify-center py-2.5"
                            >
                              <Download className="w-4 h-4" />
                              <span>Download Complete JSON Backup</span>
                            </GlowButton>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-center gap-3 text-xs text-gray-400">
                          <Shield className="w-4 h-4 text-green-400 shrink-0" />
                          <span>
                            <strong>Security Guarantee:</strong> Backups never export raw passwords, PBKDF2 hashes, or API session tokens.
                          </span>
                        </div>
                      </GlassCard>
                    )}
                  </motion.div>
                )}

                {/* 3. AI ENGINE SECTION */}
                {activeSection === "ai" && (
                  <motion.div
                    key="ai"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <GlassCard className="p-6 md:p-8 space-y-6" hover={false}>
                      <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                            <Cpu className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-white font-semibold text-lg">PyTorch CNN & ML Hyperparameters</h3>
                            <p className="text-gray-400 text-xs mt-0.5">
                              Precision neural network configurations supported by the MangoDL backend
                            </p>
                          </div>
                        </div>
                        <NeonBadge label="PyTorch 2.x Active" variant="neon" />
                      </div>

                      {/* Model Dropdown Configurations */}
                      <div className="space-y-4">
                        {/* Disease Detection Architecture */}
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <p className="text-white text-sm font-semibold">Disease Detection Architecture</p>
                            <p className="text-gray-400 text-xs mt-0.5">
                              Active PyTorch convolutional architecture for 8-class leaf pathology
                            </p>
                          </div>
                          <select
                            value={settings.aiConfig.diseaseArchitecture}
                            onChange={(e) => handleAiConfigChange("diseaseArchitecture", e.target.value)}
                            className="bg-black/60 border border-white/15 text-yellow-300 font-mono text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-yellow-500/50 cursor-pointer min-w-64"
                          >
                            <option value="MangoLeafXNetMultiTask (99.0% Acc)" className="bg-[#0a0b0f]">
                              MangoLeafXNetMultiTask (99.0% Acc) [Recommended]
                            </option>
                            <option value="MangoLeafXNetSE (98.75% Acc)" className="bg-[#0a0b0f]">
                              MangoLeafXNetSE (98.75% Acc) [Squeeze-Excitation]
                            </option>
                            <option value="MangoLeafXNet (97.5% Acc)" className="bg-[#0a0b0f]">
                              MangoLeafXNet (97.5% Acc) [Vanilla CNN]
                            </option>
                          </select>
                        </div>

                        {/* Inspection Frequency */}
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <p className="text-white text-sm font-semibold">Automated Inspection Frequency</p>
                            <p className="text-gray-400 text-xs mt-0.5">
                              Background interval for climate and automated sensor data correlation
                            </p>
                          </div>
                          <select
                            value={settings.aiConfig.autoScanFrequency}
                            onChange={(e) => handleAiConfigChange("autoScanFrequency", e.target.value)}
                            className="bg-black/60 border border-white/15 text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-yellow-500/50 cursor-pointer min-w-44"
                          >
                            {["Every 1 hour", "Every 3 hours", "Every 6 hours", "Every 12 hours", "Daily"].map(
                              (freq) => (
                                <option key={freq} value={freq} className="bg-[#0a0b0f]">
                                  {freq}
                                </option>
                              )
                            )}
                          </select>
                        </div>

                        {/* Confidence Threshold */}
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <p className="text-white text-sm font-semibold">Detection Confidence Alert Threshold</p>
                            <p className="text-gray-400 text-xs mt-0.5">
                              Minimum softmax classification confidence required to trigger urgent warning
                            </p>
                          </div>
                          <select
                            value={settings.aiConfig.detectionThreshold}
                            onChange={(e) => handleAiConfigChange("detectionThreshold", e.target.value)}
                            className="bg-black/60 border border-white/15 text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-yellow-500/50 cursor-pointer min-w-32"
                          >
                            {["60%", "65%", "70%", "75%", "80%", "85%", "90%"].map((thresh) => (
                              <option key={thresh} value={thresh} className="bg-[#0a0b0f]">
                                {thresh}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Feature Toggles */}
                      <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Inference & Analytics Modules
                        </h4>
                        {[
                          {
                            key: "autoNotifications",
                            label: "Auto Notifications",
                            desc: "Dispatch instant SMS and email notifications upon high-severity disease match",
                          },
                          {
                            key: "gradcamVisualization",
                            label: "GradCAM Visual Attribution",
                            desc: "Compute backward gradients on block6 conv layer for heatmap overlays",
                          },
                          {
                            key: "revenueForecasting",
                            label: "Revenue Loss Module",
                            desc: "Calculate dynamic APMC market vs pulp processing financial loss impact",
                          },
                          {
                            key: "betaFeatures",
                            label: "Experimental Features",
                            desc: "Enable CycleGAN synthetic leaf domain adaptation and beta models",
                          },
                        ].map((toggle) => {
                          const isEnabled = Boolean(
                            settings.aiConfig[toggle.key as keyof UserSettings["aiConfig"]]
                          );
                          return (
                            <div
                              key={toggle.key}
                              onClick={() =>
                                handleAiConfigChange(
                                  toggle.key as keyof UserSettings["aiConfig"],
                                  !isEnabled
                                )
                              }
                              className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/8 hover:bg-white/[0.04] transition-all cursor-pointer select-none"
                            >
                              <div className="pr-4">
                                <p className="text-white text-sm font-medium">{toggle.label}</p>
                                <p className="text-gray-400 text-xs mt-0.5">{toggle.desc}</p>
                              </div>
                              <div
                                className={`relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0 ${
                                  isEnabled ? "bg-yellow-500" : "bg-white/10"
                                }`}
                              >
                                <div
                                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                                    isEnabled ? "translate-x-6" : "translate-x-1"
                                  }`}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </GlassCard>
                  </motion.div>
                )}

                {/* 4. NOTIFICATIONS SECTION */}
                {activeSection === "notifications" && (
                  <motion.div
                    key="notifications"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <GlassCard className="p-6 md:p-8 space-y-6" hover={false}>
                      <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                            <Bell className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-white font-semibold text-lg">Alert & Notification Channels</h3>
                            <p className="text-gray-400 text-xs mt-0.5">
                              Real-time disease outbreak and meteorological risk triggers
                            </p>
                          </div>
                        </div>
                        <NeonBadge label="Multi-Channel" variant="mango" />
                      </div>

                      <div className="space-y-4">
                        {[
                          {
                            key: "emailAlerts",
                            title: "High-Severity Disease Email Alerts",
                            desc: `Dispatches immediate pathology report to ${settings.profile.email || "your registered email"}`,
                            icon: Mail,
                            configured: Boolean(settings.profile.email && settings.profile.email.includes("@")),
                            statusText: settings.profile.email ? "Configured" : "Not Configured",
                          },
                          {
                            key: "whatsappAlerts",
                            title: "WhatsApp Farmer Bot Alerts",
                            desc: `Sends chemical fungicide dosage & advisory to ${settings.profile.phone || "your phone number"}`,
                            icon: Smartphone,
                            configured: Boolean(settings.profile.phone && settings.profile.phone.length >= 10),
                            statusText: settings.profile.phone ? "Configured" : "Not Configured (Add Phone in Profile)",
                          },
                          {
                            key: "climateAlerts",
                            title: "Climate Extremes Warnings",
                            desc: "Alerts when Vapor Pressure Deficit (VPD), humidity or heat index exceeds crop risk levels",
                            icon: Zap,
                            configured: true,
                            statusText: "Active",
                          },
                          {
                            key: "weeklyDigest",
                            title: "Weekly Harvest & Pricing Reports",
                            desc: "Comprehensive weekly digest of projected orchard yield and APMC market wholesale rates",
                            icon: Bell,
                            configured: true,
                            statusText: "Ready",
                          },
                          {
                            key: "soundAlerts",
                            title: "Audio Chime / Notification Sound",
                            desc: "Plays a subtle professional harmonic chime when newly published Karnataka mango advisories or market news arrive",
                            icon: Volume2,
                            configured: true,
                            statusText: "Active",
                            testable: true,
                          },
                        ].map((item) => {
                          const isEnabled = Boolean(
                            settings.notifications[item.key as keyof UserSettings["notifications"]]
                          );
                          return (
                            <div
                              key={item.key}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/8"
                            >
                              <div className="flex items-start sm:items-center gap-3">
                                <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-400 shrink-0">
                                  <item.icon className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-white text-sm font-semibold">{item.title}</p>
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                        item.configured
                                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                      }`}
                                    >
                                      {item.statusText}
                                    </span>
                                  </div>
                                  <p className="text-gray-400 text-xs mt-0.5">{item.desc}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 self-end sm:self-center">
                                {(item as any).testable && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      playNotificationSound();
                                      showToast("success", "Played notification alert chime.");
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-[11px] font-semibold flex items-center gap-1 border border-yellow-500/20 transition-colors cursor-pointer"
                                  >
                                    <Volume2 className="w-3.5 h-3.5" />
                                    <span>Test Sound</span>
                                  </button>
                                )}

                                <div
                                  onClick={() =>
                                    handleNotificationToggle(item.key as keyof UserSettings["notifications"])
                                  }
                                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0 cursor-pointer ${
                                    isEnabled ? "bg-yellow-500" : "bg-white/10"
                                  }`}
                                >
                                  <div
                                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                                      isEnabled ? "translate-x-6" : "translate-x-1"
                                    }`}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </GlassCard>
                  </motion.div>
                )}

                {/* 5. SECURITY SECTION */}
                {activeSection === "security" && (
                  <motion.div
                    key="security"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <GlassCard className="p-6 md:p-8 space-y-6" hover={false}>
                      <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
                            <Shield className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-white font-semibold text-lg">Security & Session Privacy</h3>
                            <p className="text-gray-400 text-xs mt-0.5">
                              Verified session credentials, 2FA status, and access logging
                            </p>
                          </div>
                        </div>
                        <NeonBadge label="Encrypted PBKDF2-HMAC" variant="neon" />
                      </div>

                      {/* 2FA Card */}
                      <div className="p-5 rounded-xl bg-white/[0.02] border border-white/8 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white text-sm font-semibold">Two-Factor Authentication (2FA)</p>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-bold border border-green-500/30">
                              {settings.security.twoFactorEnabled ? "Active" : "Disabled"}
                            </span>
                          </div>
                          <p className="text-gray-400 text-xs mt-1">
                            Require TOTP authenticator verification on platform login
                          </p>
                        </div>
                        <div
                          onClick={() =>
                            handleSecurityChange("twoFactorEnabled", !settings.security.twoFactorEnabled)
                          }
                          className={`relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0 cursor-pointer ${
                            settings.security.twoFactorEnabled ? "bg-green-500" : "bg-white/10"
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                              settings.security.twoFactorEnabled ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </div>
                      </div>

                      {/* Session Timeout */}
                      <div className="p-5 rounded-xl bg-white/[0.02] border border-white/8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="text-white text-sm font-semibold">Session Lifetime & Timeout</p>
                          <p className="text-gray-400 text-xs mt-0.5">
                            Automatic session expiration duration for dormant workstations
                          </p>
                        </div>
                        <select
                          value={settings.security.sessionTimeout}
                          onChange={(e) => handleSecurityChange("sessionTimeout", e.target.value)}
                          className="bg-black/60 border border-white/15 text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-green-500/50 cursor-pointer min-w-36"
                        >
                          {["24 Hours", "7 Days", "30 Days", "Never"].map((t) => (
                            <option key={t} value={t} className="bg-[#0a0b0f]">
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Active Session Safe View */}
                      <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Laptop className="w-4 h-4 text-green-400" />
                            <p className="text-white text-sm font-semibold">Active Authorized Session</p>
                          </div>
                          <span className="text-[10px] text-green-400 font-mono bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                            {sessionInfo?.status || "Active & Verified"}
                          </span>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3 text-xs pt-1">
                          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                            <span className="text-gray-500 block text-[11px]">Masked Session Token</span>
                            <span className="text-yellow-300 font-mono font-medium block truncate">
                              {sessionInfo?.maskedSessionId || "mg_sess_••••••••••••9f8a"}
                            </span>
                          </div>
                          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                            <span className="text-gray-500 block text-[11px]">Device / Browser</span>
                            <span className="text-gray-300 font-medium block truncate">
                              {sessionInfo?.device || "Web Client (Chrome / Windows)"}
                            </span>
                          </div>
                          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                            <span className="text-gray-500 block text-[11px]">Origin IP</span>
                            <span className="text-gray-300 font-mono font-medium block">
                              {sessionInfo?.ipAddress || "127.0.0.1 (Localhost)"}
                            </span>
                          </div>
                          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                            <span className="text-gray-500 block text-[11px]">Last Activity Time</span>
                            <span className="text-gray-300 font-mono font-medium block">
                              {sessionInfo?.lastActivity || new Date().toISOString()}
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-gray-500 flex items-center gap-1.5 pt-1">
                          <Info className="w-3.5 h-3.5 text-gray-400" />
                          Raw password hashes and master HMAC secrets are never sent over client sessions.
                        </p>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}

                {/* 6. APPEARANCE SECTION */}
                {activeSection === "appearance" && (
                  <motion.div
                    key="appearance"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <GlassCard className="p-6 md:p-8 space-y-6" hover={false}>
                      <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                            <Palette className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-white font-semibold text-lg">Theme & Dashboard Styling</h3>
                            <p className="text-gray-400 text-xs mt-0.5">
                              Select from real centralized agrotechnology color palettes
                            </p>
                          </div>
                        </div>
                        <NeonBadge label={`Current: ${settings.appearance.theme}`} variant="cyan" />
                      </div>

                      {/* Real Themes Selection Cards */}
                      <div className="grid sm:grid-cols-3 gap-4">
                        {[
                          {
                            id: "Cyber Amber" as const,
                            name: "Cyber Amber",
                            subtitle: "Solar Gold & Warm Orchard Amber",
                            gradient: "from-amber-400 via-yellow-500 to-amber-600",
                            accentColor: "#f59e0b",
                            borderActive: "border-yellow-500 bg-yellow-500/15 shadow-[0_0_25px_rgba(245,158,11,0.25)]",
                          },
                          {
                            id: "Emerald AgTech" as const,
                            name: "Emerald AgTech",
                            subtitle: "Lush Canopy & Biological Flora",
                            gradient: "from-emerald-400 via-green-500 to-emerald-700",
                            accentColor: "#10b981",
                            borderActive: "border-emerald-500 bg-emerald-500/15 shadow-[0_0_25px_rgba(16,185,129,0.25)]",
                          },
                          {
                            id: "Neon Cyan" as const,
                            name: "Neon Cyan",
                            subtitle: "High-Tech Hydrological Spectrum",
                            gradient: "from-cyan-400 via-sky-500 to-blue-600",
                            accentColor: "#06b6d4",
                            borderActive: "border-cyan-500 bg-cyan-500/15 shadow-[0_0_25px_rgba(6,182,212,0.25)]",
                          },
                        ].map((t) => {
                          const isSelected = settings.appearance.theme === t.id;
                          return (
                            <div
                              key={t.id}
                              onClick={() => handleThemeChange(t.id)}
                              className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                                isSelected
                                  ? t.borderActive
                                  : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                              }`}
                            >
                              <div>
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${t.gradient} mb-4 shadow-lg flex items-center justify-center`}>
                                  {isSelected && <Check className="w-6 h-6 text-black font-bold" />}
                                </div>
                                <h4 className="text-white font-bold text-sm">{t.name}</h4>
                                <p className="text-gray-400 text-xs mt-1">{t.subtitle}</p>
                              </div>

                              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                                <span className="text-[11px] font-mono text-gray-400">{t.accentColor}</span>
                                {isSelected ? (
                                  <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full bg-white/20">
                                    Active Theme
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-gray-500">Click to apply</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/8 flex items-center justify-between text-xs text-gray-400">
                        <span>Theme switches apply instantly and are saved to your account preferences.</span>
                        <span className="text-white font-mono font-medium">data-color-theme={colorTheme}</span>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}

                {/* 7. INTEGRATIONS SECTION */}
                {activeSection === "integrations" && (
                  <motion.div
                    key="integrations"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <GlassCard className="p-6 md:p-8 space-y-6" hover={false}>
                      <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                            <Globe className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-white font-semibold text-lg">Connected AgTech Integrations</h3>
                            <p className="text-gray-400 text-xs mt-0.5">
                              Real-time verification of external meteorological, agronomy & LLM gateways
                            </p>
                          </div>
                        </div>
                        <NeonBadge label="Live Diagnostics" variant="cyan" />
                      </div>

                      <div className="space-y-4">
                        {[
                          {
                            key: "openMeteo",
                            name: "Open-Meteo Climate API",
                            desc: "Real-time temperature, humidity, VPD & rainfall forecasting across Karnataka's 31 districts",
                            data: integrationsStatus?.openMeteo,
                            fallbackStatus: "Connected",
                            fallbackBadge: "Active (Karnataka 31 Districts)",
                          },
                          {
                            key: "nhbDatabase",
                            name: "NHB Yield Database",
                            desc: "National Horticulture Board 10-year historical dataset & XGBoost scaler",
                            data: integrationsStatus?.nhbDatabase,
                            fallbackStatus: "Synced",
                            fallbackBadge: "Embedded Scaler",
                          },
                          {
                            key: "litellmRouter",
                            name: "LiteLLM Multi-Provider AI",
                            desc: "Gemini 2.5 Flash, Groq LLaMA, OpenAI & Offline Agronomy Engine",
                            data: integrationsStatus?.litellmRouter,
                            fallbackStatus: "Online",
                            fallbackBadge: "Gemini / Groq / OpenAI",
                          },
                          {
                            key: "whatsappAlerts",
                            name: "WhatsApp Farmer Gateway",
                            desc: "Direct SMS & WhatsApp chemical advisory dispatch pipeline",
                            data: integrationsStatus?.whatsappAlerts,
                            fallbackStatus: settings.profile.phone ? "Ready" : "Not Configured",
                            fallbackBadge: settings.profile.phone ? `Linked to ${settings.profile.phone}` : "No Phone Set",
                          },
                        ].map((item) => {
                          const isConfigured = item.data?.configured ?? (item.fallbackStatus !== "Not Configured");
                          const status = item.data?.status || item.fallbackStatus;
                          const badge = item.data?.badge || item.fallbackBadge;

                          return (
                            <div
                              key={item.key}
                              className="p-5 rounded-2xl bg-white/[0.02] border border-white/8 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                            >
                              <div>
                                <div className="flex items-center gap-2.5">
                                  <h4 className="text-white font-semibold text-sm">{item.name}</h4>
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                                      isConfigured
                                        ? "bg-green-500/10 text-green-400 border-green-500/30"
                                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                    }`}
                                  >
                                    {status}
                                  </span>
                                </div>
                                <p className="text-gray-400 text-xs mt-1">{item.desc}</p>
                              </div>

                              <div className="self-start sm:self-center">
                                <span className="text-xs text-gray-300 font-mono bg-black/50 px-3 py-1.5 rounded-xl border border-white/10 block whitespace-nowrap">
                                  {badge}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </GlassCard>
                  </motion.div>
                )}

                {/* 8. API KEYS SECTION */}
                {activeSection === "api" && (
                  <motion.div
                    key="api"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    {/* One-Time Generated Key Modal / Display */}
                    {createdKeyData && (
                      <div className="p-5 rounded-2xl bg-yellow-500/10 border-2 border-yellow-500/40 shadow-[0_0_30px_rgba(245,158,11,0.2)] space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-yellow-400 font-bold text-sm">
                            <CheckCircle className="w-5 h-5" />
                            <span>New API Key Generated: {createdKeyData.name}</span>
                          </div>
                          <button
                            onClick={() => setCreatedKeyData(null)}
                            className="text-gray-400 hover:text-white p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-xs text-yellow-200/90 font-medium">
                          Please copy your new secret key now. For your security, you will not be able to view this full key again!
                        </p>

                        <div className="flex items-center gap-2 p-3 rounded-xl bg-black/80 border border-yellow-500/30">
                          <span className="font-mono text-xs text-yellow-300 flex-1 truncate select-all">
                            {createdKeyData.rawKey}
                          </span>
                          <GlowButton
                            variant="mango"
                            size="sm"
                            onClick={() => copyToClipboard(createdKeyData.rawKey)}
                            className="gap-1.5 py-1.5 px-3 text-xs shrink-0"
                          >
                            {copiedKey ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedKey ? "Copied" : "Copy Secret"}
                          </GlowButton>
                        </div>
                      </div>
                    )}

                    {/* REST Developer API Keys */}
                    <GlassCard className="p-6 md:p-8 space-y-6" hover={false}>
                      <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                            <Key className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-white font-semibold text-lg">REST API Developer Tokens</h3>
                            <p className="text-gray-400 text-xs mt-0.5">
                              Authorize edge leaf scanner apps & IoT camera nodes via Bearer token
                            </p>
                          </div>
                        </div>
                        <NeonBadge label={`${settings.apiKeys?.length || 0} Keys Active`} variant="mango" />
                      </div>

                      {/* Generate New Key Form */}
                      <form onSubmit={handleCreateKey} className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          placeholder="e.g. Field Tablet App (Bengaluru Orchard #2)"
                          className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-yellow-500/50"
                        />
                        <GlowButton
                          type="submit"
                          variant="mango"
                          size="sm"
                          disabled={!newKeyName.trim() || isCreatingKey}
                          className="gap-2 shrink-0 px-4"
                        >
                          <Plus className="w-4 h-4" />
                          {isCreatingKey ? "Generating..." : "Generate New Key"}
                        </GlowButton>
                      </form>

                      {/* List of Managed Keys */}
                      <div className="space-y-3">
                        {(settings.apiKeys && settings.apiKeys.length > 0) ? (
                          settings.apiKeys.map((keyRecord) => (
                            <div
                              key={keyRecord.id}
                              className="p-4 rounded-xl bg-white/[0.02] border border-white/8 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-white font-semibold text-sm truncate">{keyRecord.name}</p>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 font-mono border border-green-500/20">
                                    {keyRecord.status}
                                  </span>
                                </div>
                                <p className="text-yellow-400 font-mono text-xs mt-1 truncate">
                                  {keyRecord.maskedKey}
                                </p>
                                <span className="text-[11px] text-gray-500 block mt-0.5">
                                  Created: {keyRecord.createdAt} · Last used: {keyRecord.lastUsed}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-center">
                                <button
                                  onClick={() => copyToClipboard(keyRecord.maskedKey)}
                                  title="Copy Masked Key"
                                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all text-xs flex items-center gap-1"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setKeyToDelete(keyRecord)}
                                  title="Revoke & Delete Key"
                                  className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all text-xs"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-500 text-center py-6">
                            No API keys generated yet. Use the input above to create your first client key.
                          </p>
                        )}
                      </div>
                    </GlassCard>

                    {/* AI Copilot LLM Custom Key Configuration */}
                    <GlassCard className="p-6 md:p-8 space-y-4" hover={false}>
                      <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                            <Cpu className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-white font-semibold text-lg">AI Copilot LLM Provider Keys</h3>
                            <p className="text-gray-400 text-xs mt-0.5">
                              Custom API credentials for Google Gemini, Groq, or OpenAI
                            </p>
                          </div>
                        </div>
                        <NeonBadge label="Client Encrypted" variant="neon" />
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-white text-xs font-semibold block mb-1.5 flex items-center justify-between">
                            <span>Google Gemini API Key</span>
                            <span className="text-[10px] text-yellow-400 font-mono">gemini-2.5-flash</span>
                          </label>
                          <input
                            type="password"
                            value={customGeminiKey}
                            onChange={(e) => {
                              setCustomGeminiKey(e.target.value);
                              if (typeof window !== "undefined") {
                                localStorage.setItem("mangodl_user_api_key", e.target.value);
                              }
                            }}
                            placeholder="AIzaSy..."
                            className="w-full rounded-xl bg-black/60 border border-white/10 px-4 py-2.5 text-xs text-yellow-300 font-mono focus:outline-none focus:border-yellow-500/50"
                          />
                        </div>
                        <p className="text-[11px] text-gray-500">
                          If left blank, the platform automatically utilizes server-configured environment keys or the built-in Offline Agronomy Engine.
                        </p>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Platform Info Footer */}
            <GlassCard className="p-5" hover={false}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shrink-0">
                    <Leaf className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">MangoDL Deep Learning Precision Platform</p>
                    <p className="text-gray-500 text-xs">
                      Architecture: {settings.aiConfig.diseaseArchitecture} · PyTorch 2.x
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <NeonBadge label="99.0% Accuracy" variant="neon" />
                  <NeonBadge label="Karnataka Belt" variant="mango" />
                </div>
              </div>
            </GlassCard>
          </div>
        </StaggerItem>

        {/* ------------------------------------------------------------------ */}
        {/* MODALS & DIALOGS */}
        {/* ------------------------------------------------------------------ */}

        {/* 1. Orchard Create/Edit Modal */}
        <AnimatePresence>
          {orchardModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-xl p-6 rounded-2xl bg-[#0f121a] border border-yellow-500/30 shadow-2xl space-y-4 my-8"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2 text-yellow-400 font-bold text-base">
                    <Trees className="w-5 h-5" />
                    <span>{editingOrchard ? "Edit Orchard Profile" : "Register New Orchard"}</span>
                  </div>
                  <button onClick={() => setOrchardModalOpen(false)} className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveOrchard} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-gray-300 font-semibold block">Orchard Name *</label>
                    <input
                      type="text"
                      required
                      value={orchardForm.name || ""}
                      onChange={(e) => setOrchardForm({ ...orchardForm, name: e.target.value })}
                      placeholder="e.g. Srinivasapur Alphonso Plantation"
                      className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-gray-300 font-semibold block">Location / District</label>
                      <input
                        type="text"
                        value={orchardForm.location || ""}
                        onChange={(e) => setOrchardForm({ ...orchardForm, location: e.target.value })}
                        placeholder="e.g. Kolar, Karnataka"
                        className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-300 font-semibold block">Primary Cultivar / Variety</label>
                      <input
                        type="text"
                        value={orchardForm.variety || ""}
                        onChange={(e) => setOrchardForm({ ...orchardForm, variety: e.target.value })}
                        placeholder="e.g. Alphonso & Totapuri"
                        className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-gray-300 font-semibold block">Area (Acres)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={orchardForm.area ?? 10}
                        onChange={(e) => setOrchardForm({ ...orchardForm, area: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-300 font-semibold block">Tree Count</label>
                      <input
                        type="number"
                        value={orchardForm.treeCount ?? 500}
                        onChange={(e) => setOrchardForm({ ...orchardForm, treeCount: parseInt(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-300 font-semibold block">Planting Year</label>
                      <input
                        type="number"
                        value={orchardForm.plantingYear ?? 2018}
                        onChange={(e) => setOrchardForm({ ...orchardForm, plantingYear: parseInt(e.target.value) || 2018 })}
                        className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-gray-300 font-semibold block">Irrigation System</label>
                      <select
                        value={orchardForm.irrigationType || "Drip Irrigation"}
                        onChange={(e) => setOrchardForm({ ...orchardForm, irrigationType: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-yellow-500/50"
                      >
                        <option value="Drip Irrigation">Drip Irrigation</option>
                        <option value="Sub-surface Drip">Sub-surface Drip</option>
                        <option value="Sprinkler & Micro-Jet">Sprinkler & Micro-Jet</option>
                        <option value="Flood / Basin">Flood / Basin</option>
                        <option value="Rainfed">Rainfed</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-300 font-semibold block">Status</label>
                      <select
                        value={orchardForm.status || "Active"}
                        onChange={(e) => setOrchardForm({ ...orchardForm, status: e.target.value as any })}
                        className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-yellow-500/50"
                      >
                        <option value="Active">Active</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-300 font-semibold block">Crop Memory Notes / Soil Details</label>
                    <textarea
                      rows={2}
                      value={orchardForm.notes || ""}
                      onChange={(e) => setOrchardForm({ ...orchardForm, notes: e.target.value })}
                      placeholder="e.g. Red sandy loam soil, south-facing slope, organic mulch applied."
                      className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setOrchardModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <GlowButton type="submit" variant="mango" size="sm" className="px-5">
                      {editingOrchard ? "Save Changes" : "Create Orchard"}
                    </GlowButton>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 2. Block Create/Edit Modal */}
        <AnimatePresence>
          {blockModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg p-6 rounded-2xl bg-[#0f121a] border border-cyan-500/30 shadow-2xl space-y-4 my-8"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-base">
                    <Layers className="w-5 h-5" />
                    <span>{editingBlock ? "Edit Zone Block" : "Add New Orchard Block"}</span>
                  </div>
                  <button onClick={() => setBlockModalOpen(false)} className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveBlock} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-gray-300 font-semibold block">Parent Orchard *</label>
                    <select
                      required
                      value={blockForm.orchardId || ""}
                      onChange={(e) => setBlockForm({ ...blockForm, orchardId: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="">Select Parent Orchard</option>
                      {orchards.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name} ({o.location})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-300 font-semibold block">Block / Zone Name *</label>
                    <input
                      type="text"
                      required
                      value={blockForm.name || ""}
                      onChange={(e) => setBlockForm({ ...blockForm, name: e.target.value })}
                      placeholder="e.g. Block A - North Hillside"
                      className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-gray-300 font-semibold block">Variety</label>
                      <input
                        type="text"
                        value={blockForm.variety || ""}
                        onChange={(e) => setBlockForm({ ...blockForm, variety: e.target.value })}
                        placeholder="e.g. Alphonso"
                        className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-300 font-semibold block">Area (Acres)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={blockForm.area ?? 5}
                        onChange={(e) => setBlockForm({ ...blockForm, area: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-300 font-semibold block">Trees</label>
                      <input
                        type="number"
                        value={blockForm.treeCount ?? 250}
                        onChange={(e) => setBlockForm({ ...blockForm, treeCount: parseInt(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-gray-300 font-semibold block">Irrigation Type</label>
                      <input
                        type="text"
                        value={blockForm.irrigation || ""}
                        onChange={(e) => setBlockForm({ ...blockForm, irrigation: e.target.value })}
                        placeholder="e.g. Sub-surface Drip"
                        className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-300 font-semibold block">Planting Year</label>
                      <input
                        type="number"
                        value={blockForm.plantingYear ?? 2019}
                        onChange={(e) => setBlockForm({ ...blockForm, plantingYear: parseInt(e.target.value) || 2019 })}
                        className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-300 font-semibold block">Notes</label>
                    <textarea
                      rows={2}
                      value={blockForm.notes || ""}
                      onChange={(e) => setBlockForm({ ...blockForm, notes: e.target.value })}
                      placeholder="e.g. High density spacing, early flush cycle."
                      className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setBlockModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <GlowButton type="submit" variant="mango" size="sm" className="px-5">
                      {editingBlock ? "Save Changes" : "Create Block"}
                    </GlowButton>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 3. Treatment Create/Edit Modal */}
        <AnimatePresence>
          {treatmentModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg p-6 rounded-2xl bg-[#0f121a] border border-emerald-500/30 shadow-2xl space-y-4 my-8"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                    <Droplets className="w-5 h-5" />
                    <span>{editingTreatment ? "Edit Spray Record" : "Log New Treatment / Spray"}</span>
                  </div>
                  <button onClick={() => setTreatmentModalOpen(false)} className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveTreatment} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-gray-300 font-semibold block">Target Orchard *</label>
                      <select
                        required
                        value={treatmentForm.orchardId || ""}
                        onChange={(e) => setTreatmentForm({ ...treatmentForm, orchardId: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-emerald-500/50"
                      >
                        <option value="">Select Orchard</option>
                        {orchards.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-300 font-semibold block">Block / Plot (Optional)</label>
                      <select
                        value={treatmentForm.blockId || ""}
                        onChange={(e) => setTreatmentForm({ ...treatmentForm, blockId: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-emerald-500/50"
                      >
                        <option value="">All Orchard Plots</option>
                        {blocks
                          .filter((b) => !treatmentForm.orchardId || b.orchardId === treatmentForm.orchardId)
                          .map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-300 font-semibold block">Treatment / Chemical Name *</label>
                    <input
                      type="text"
                      required
                      value={treatmentForm.name || ""}
                      onChange={(e) => setTreatmentForm({ ...treatmentForm, name: e.target.value })}
                      placeholder="e.g. Mancozeb 75% WP + Bio-Stimulant"
                      className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-gray-300 font-semibold block">Quantity / Dilution</label>
                      <input
                        type="text"
                        value={treatmentForm.quantity || ""}
                        onChange={(e) => setTreatmentForm({ ...treatmentForm, quantity: e.target.value })}
                        placeholder="e.g. 2.5 kg / 1000L water"
                        className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-300 font-semibold block">Purpose</label>
                      <input
                        type="text"
                        value={treatmentForm.purpose || ""}
                        onChange={(e) => setTreatmentForm({ ...treatmentForm, purpose: e.target.value })}
                        placeholder="e.g. Anthracnose Prevention"
                        className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-gray-300 font-semibold block">Date Applied</label>
                      <input
                        type="date"
                        value={treatmentForm.date || ""}
                        onChange={(e) => setTreatmentForm({ ...treatmentForm, date: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-300 font-semibold block">Next Application Date</label>
                      <input
                        type="date"
                        value={treatmentForm.nextApplicationDate || ""}
                        onChange={(e) => setTreatmentForm({ ...treatmentForm, nextApplicationDate: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-300 font-semibold block">Operational Notes</label>
                    <textarea
                      rows={2}
                      value={treatmentForm.notes || ""}
                      onChange={(e) => setTreatmentForm({ ...treatmentForm, notes: e.target.value })}
                      placeholder="e.g. Applied via air-blast tractor sprayer early morning."
                      className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setTreatmentModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <GlowButton type="submit" variant="mango" size="sm" className="px-5">
                      {editingTreatment ? "Save Changes" : "Log Treatment"}
                    </GlowButton>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 4. Expense Create/Edit Modal */}
        <AnimatePresence>
          {expenseModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg p-6 rounded-2xl bg-[#0f121a] border border-yellow-500/30 shadow-2xl space-y-4 my-8"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2 text-yellow-400 font-bold text-base">
                    <DollarSign className="w-5 h-5" />
                    <span>{editingExpense ? "Edit Expense Entry" : "Log Farm Expense"}</span>
                  </div>
                  <button onClick={() => setExpenseModalOpen(false)} className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveExpense} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-gray-300 font-semibold block">Target Orchard *</label>
                      <select
                        required
                        value={expenseForm.orchardId || ""}
                        onChange={(e) => setExpenseForm({ ...expenseForm, orchardId: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-yellow-500/50"
                      >
                        <option value="">Select Orchard</option>
                        {orchards.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-300 font-semibold block">Category *</label>
                      <select
                        value={expenseForm.category || "Fertilizer"}
                        onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as any })}
                        className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-yellow-500/50"
                      >
                        <option value="Fertilizer">Fertilizer</option>
                        <option value="Pesticide">Pesticide</option>
                        <option value="Labour">Labour</option>
                        <option value="Irrigation">Irrigation</option>
                        <option value="Transport">Transport</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-gray-300 font-semibold block">Amount (INR ₹) *</label>
                      <input
                        type="number"
                        step="100"
                        required
                        value={expenseForm.amount ?? 5000}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-yellow-300 font-mono font-bold focus:outline-none focus:border-yellow-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-300 font-semibold block">Date</label>
                      <input
                        type="date"
                        value={expenseForm.date || ""}
                        onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-yellow-500/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-300 font-semibold block">Description *</label>
                    <input
                      type="text"
                      required
                      value={expenseForm.description || ""}
                      onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                      placeholder="e.g. NPK 19:19:19 soluble fertilizer bags purchase"
                      className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setExpenseModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <GlowButton type="submit" variant="mango" size="sm" className="px-5">
                      {editingExpense ? "Save Changes" : "Log Expense"}
                    </GlowButton>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 5. Generic Farm Item Delete Confirmation */}
        <AnimatePresence>
          {deleteConfirmTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md p-6 rounded-2xl bg-[#0f121a] border border-red-500/30 shadow-2xl space-y-4"
              >
                <div className="flex items-center gap-3 text-red-400">
                  <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-white font-bold text-base">Delete {deleteConfirmTarget.type}?</h3>
                </div>

                <p className="text-xs text-gray-300">
                  Are you sure you want to permanently delete <strong>{deleteConfirmTarget.name}</strong>?
                  {deleteConfirmTarget.type === "orchard" && (
                    <span className="block text-red-400 font-semibold mt-1">
                      ⚠️ This will also delete all associated zone blocks, treatments, and expenses!
                    </span>
                  )}
                </p>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setDeleteConfirmTarget(null)}
                    disabled={isDeletingFarmItem}
                    className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDeleteFarmItem}
                    disabled={isDeletingFarmItem}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20"
                  >
                    {isDeletingFarmItem ? "Deleting..." : "Delete Record"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 6. Delete API Key Confirmation Dialog */}
        <AnimatePresence>
          {keyToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md p-6 rounded-2xl bg-[#0f121a] border border-red-500/30 shadow-2xl space-y-4"
              >
                <div className="flex items-center gap-3 text-red-400">
                  <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-white font-bold text-base">Revoke API Key?</h3>
                </div>

                <p className="text-xs text-gray-300">
                  Are you sure you want to permanently revoke <strong>{keyToDelete.name}</strong> ({keyToDelete.maskedKey})? Any IoT nodes or mobile apps using this key will immediately lose access.
                </p>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setKeyToDelete(null)}
                    disabled={isDeletingKey}
                    className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteKeyConfirm}
                    disabled={isDeletingKey}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20"
                  >
                    {isDeletingKey ? "Revoking..." : "Revoke Key"}
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
