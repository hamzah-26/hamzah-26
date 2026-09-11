// ============================================
// MANGODL — API CLIENT SERVICE LAYER
// ============================================

import type {
  DiseaseDetectionResult,
  YieldFactor,
  OrchardRecord,
  AIRecommendation,
} from "@/types";

const API_BASE_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "")
    : (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000");

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const customHeaders: Record<string, string> = {};
  if (options?.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((v, k) => {
        customHeaders[k] = v;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([k, v]) => {
        customHeaders[k] = v;
      });
    } else {
      Object.assign(customHeaders, options.headers);
    }
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...customHeaders,
    },
  });

  if (!res.ok) {
    let errorMsg = `API Error (${res.status})`;
    try {
      const errObj = await res.json();
      if (errObj) {
        if (typeof errObj.detail === "string") {
          errorMsg = errObj.detail;
        } else if (Array.isArray(errObj.detail)) {
          errorMsg = errObj.detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ");
        } else if (errObj.detail && typeof errObj.detail === "object") {
          errorMsg = JSON.stringify(errObj.detail);
        } else if (typeof errObj.message === "string") {
          errorMsg = errObj.message;
        }
      }
    } catch {
      try {
        const errorText = await res.text();
        if (errorText) errorMsg = errorText;
      } catch {
        // fallback to default errorMsg
      }
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

// --------------------------------------------
// Authentication
// --------------------------------------------
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  organization: string;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  return fetchJson<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function registerApi(data: {
  fullName: string;
  email: string;
  password: string;
  role?: string;
  organization?: string;
}): Promise<AuthResponse> {
  return fetchJson<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMeApi(token?: string): Promise<{ user: AuthUser }> {
  return fetchJson<{ user: AuthUser }>("/api/auth/me", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function logoutApi(token?: string): Promise<{ success: boolean }> {
  return fetchJson<{ success: boolean }>("/api/auth/logout", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// --------------------------------------------
// Disease Detection
// --------------------------------------------
export interface DiseaseScanResponse {
  is_mango_leaf?: boolean;
  status?: string;
  disease: string;
  confidence: number;
  severity: "None" | "Low" | "Medium" | "High";
  severity_score: number;
  treatment: string;
  description: string;
  heatmap_b64: string;
  message?: string;
}

export interface DiseaseHistoryRecord {
  id: number;
  date: string;
  image: string;
  disease: string;
  confidence: number;
  severity: "None" | "Low" | "Medium" | "High";
}

export async function scanDiseaseImage(file: File): Promise<DiseaseScanResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/predict/disease`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Disease scan failed: ${res.statusText}`);
  }

  return res.json();
}

export async function getDiseaseHistory(limit: number = 50): Promise<DiseaseHistoryRecord[]> {
  return fetchJson<DiseaseHistoryRecord[]>(`/api/disease-detection/history?limit=${limit}`);
}

export async function pruneDiseaseHistory(limit: number = 50): Promise<{ status: string; count: number; history: DiseaseHistoryRecord[] }> {
  return fetchJson<{ status: string; count: number; history: DiseaseHistoryRecord[] }>(`/api/disease-detection/history/prune?limit=${limit}`, {
    method: "POST",
  });
}

export async function deleteDiseaseHistoryRecord(recordId: number): Promise<{ status: string; remaining: number }> {
  return fetchJson<{ status: string; remaining: number }>(`/api/disease-detection/history/${recordId}`, {
    method: "DELETE",
  });
}

// --------------------------------------------
// Yield Prediction
// --------------------------------------------
export interface YieldCalculateRequest {
  rainfall: number;
  temperature: number;
  humidity: number;
  soilQuality: number;
  orchardSize: number;
}

export interface YieldCalculateResponse {
  predictedYield: number;
  confidence: number;
  optimalYield: number;
  lastSeasonYield: number;
  growthRate: number;
  factors: YieldFactor[];
}

export async function calculateYield(inputs: YieldCalculateRequest): Promise<YieldCalculateResponse> {
  return fetchJson<YieldCalculateResponse>("/api/yield-prediction/calculate", {
    method: "POST",
    body: JSON.stringify(inputs),
  });
}

// --------------------------------------------
// Dashboard Overview
// --------------------------------------------
export interface DashboardStatsResponse {
  kpis: {
    orchards: number;
    diseaseRisk: number;
    predictedYield: number;
    estimatedRevenue: number;
    climateHealth: number;
  };
  orchards: OrchardRecord[];
}

export async function getDashboardStats(): Promise<DashboardStatsResponse> {
  return fetchJson<DashboardStatsResponse>("/api/dashboard/stats");
}

// --------------------------------------------
// Revenue Analytics
// --------------------------------------------
export interface RevenueAnalyticsResponse {
  expectedRevenue: number;
  profitMargin: number;
  costOfProduction: number;
  marketPrice: number;
  revenueGrowth: number;
  riskScore: number;
  seasonalComparison: { season: string; revenue: number; yield: number }[];
  riskAnalysis: { label: string; value: number; color: string }[];
  lossPrevention: { label: string; value: string; change: string; positive: boolean }[];
}

export async function getRevenueAnalytics(): Promise<RevenueAnalyticsResponse> {
  return fetchJson<RevenueAnalyticsResponse>("/api/revenue-analytics");
}

// --------------------------------------------
// Climate Monitoring
// --------------------------------------------
export interface KarnatakaDistrictInfo {
  name: string;
  region: string;
  mangoZone: string;
  lat: number;
  lon: number;
}

export interface ClimateMonitorResponse {
  currentWeather: {
    temp: number;
    humidity: number;
    rainfall: number;
    windSpeed: number;
    uvIndex: number;
    visibility: number;
    condition: string;
    location: string;
    region?: string;
    latitude?: number;
    longitude?: number;
    mangoZone?: string;
  };
  forecast: {
    day: string;
    temp: number;
    condition: string;
    rainfall: number;
  }[];
  dailyData: {
    day: string;
    temp: number;
    rainfall: number;
    humidity: number;
    wind: number;
  }[];
  allDistricts?: KarnatakaDistrictInfo[];
}

export async function getClimateMonitorData(district?: string): Promise<ClimateMonitorResponse> {
  const query = district ? `?district=${encodeURIComponent(district)}` : "";
  return fetchJson<ClimateMonitorResponse>(`/api/climate-monitor${query}`);
}

export async function getKarnatakaDistricts(): Promise<KarnatakaDistrictInfo[]> {
  return fetchJson<KarnatakaDistrictInfo[]>("/api/climate/districts");
}

// --------------------------------------------
// AI Recommendations
// --------------------------------------------
export interface RecommendationsResponse {
  recommendations: AIRecommendation[];
  stats: {
    processedToday: number;
    alertsGenerated: number;
    actionsTaken: number;
  };
}

export async function getRecommendations(): Promise<RecommendationsResponse> {
  return fetchJson<RecommendationsResponse>("/api/recommendations");
}

export async function markRecommendationActioned(id: number): Promise<{ success: boolean }> {
  return fetchJson<{ success: boolean }>(`/api/recommendations/${id}/action`, {
    method: "POST",
  });
}

// --------------------------------------------
// Dataflow Stats
// --------------------------------------------
export interface DataflowStatsResponse {
  imagesProcessed: number;
  inferencesMade: number;
  avgLatency: string;
  modelAccuracy: string;
}

export async function getDataflowStats(): Promise<DataflowStatsResponse> {
  return fetchJson<DataflowStatsResponse>("/api/dataflow/stats");
}

// --------------------------------------------
// Settings
// --------------------------------------------
export interface ApiKeyRecord {
  id: string;
  name: string;
  maskedKey: string;
  createdAt: string;
  lastUsed: string;
  status: string;
  rawKey?: string;
}

export interface SessionInfo {
  status: string;
  email: string;
  maskedSessionId: string;
  device: string;
  ipAddress: string;
  lastActivity: string;
  twoFactorStatus: string;
}

export interface IntegrationItem {
  name: string;
  status: string;
  badge: string;
  configured: boolean;
}

export interface IntegrationsStatus {
  openMeteo: IntegrationItem;
  nhbDatabase: IntegrationItem;
  litellmRouter: IntegrationItem;
  whatsappAlerts: IntegrationItem;
}

export interface UserSettings {
  profile: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    organization: string;
    role: string;
  };
  aiConfig: {
    diseaseArchitecture: string;
    autoScanFrequency: string;
    detectionThreshold: string;
    yieldModelVersion: string;
    autoNotifications: boolean;
    gradcamVisualization: boolean;
    revenueForecasting: boolean;
    betaFeatures: boolean;
  };
  notifications: {
    emailAlerts: boolean;
    whatsappAlerts: boolean;
    climateAlerts: boolean;
    weeklyDigest: boolean;
    soundAlerts?: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: string;
    loginNotifications: boolean;
  };
  appearance: {
    theme: "Cyber Amber" | "Emerald AgTech" | "Neon Cyan";
    compactMode: boolean;
    highContrast: boolean;
  };
  integrations: {
    openMeteo: { name: string; enabled: boolean };
    nhbDatabase: { name: string; enabled: boolean };
    litellmRouter: { name: string; enabled: boolean };
    whatsappWebhook: { name: string; enabled: boolean };
  };
  apiKeys: ApiKeyRecord[];
}

export async function getSettings(token?: string): Promise<UserSettings> {
  return fetchJson<UserSettings>("/api/settings", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function saveSettings(settings: Partial<UserSettings>, token?: string): Promise<{ success: boolean; settings?: UserSettings }> {
  return fetchJson<{ success: boolean; settings?: UserSettings }>("/api/settings", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(settings),
  });
}

export async function getSessionInfo(token?: string): Promise<SessionInfo> {
  return fetchJson<SessionInfo>("/api/settings/session", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function getApiKeys(token?: string): Promise<{ keys: ApiKeyRecord[] }> {
  return fetchJson<{ keys: ApiKeyRecord[] }>("/api/settings/api-keys", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function createApiKey(name: string, token?: string): Promise<ApiKeyRecord> {
  return fetchJson<ApiKeyRecord>("/api/settings/api-keys", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify({ name }),
  });
}

export async function deleteApiKey(keyId: string, token?: string): Promise<{ success: boolean; deletedKeyId: string }> {
  return fetchJson<{ success: boolean; deletedKeyId: string }>(`/api/settings/api-keys/${keyId}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function getIntegrationsStatus(): Promise<IntegrationsStatus> {
  return fetchJson<IntegrationsStatus>("/api/settings/integrations/status");
}

// --------------------------------------------
// Farm Management & Crop Memory
// --------------------------------------------
export interface Orchard {
  id: string;
  userEmail?: string;
  name: string;
  location: string;
  variety: string;
  area: number;
  treeCount: number;
  plantingYear: number;
  irrigationType: string;
  notes?: string;
  status: "Active" | "Archived";
  createdAt?: string;
  updatedAt?: string;
}

export interface OrchardBlock {
  id: string;
  orchardId: string;
  userEmail?: string;
  name: string;
  variety: string;
  area: number;
  treeCount: number;
  plantingYear: number;
  irrigation: string;
  notes?: string;
  status: "Active" | "Archived";
  createdAt?: string;
}

export interface TreatmentRecord {
  id: string;
  orchardId: string;
  blockId?: string;
  userEmail?: string;
  name: string;
  date: string;
  quantity: string;
  purpose: string;
  nextApplicationDate?: string;
  notes?: string;
  createdAt?: string;
}

export interface ExpenseRecord {
  id: string;
  orchardId: string;
  blockId?: string;
  userEmail?: string;
  category: "Fertilizer" | "Pesticide" | "Labour" | "Irrigation" | "Transport" | "Other";
  amount: number;
  date: string;
  description: string;
  createdAt?: string;
}

export interface FarmSummaryData {
  orchardsCount: number;
  totalAreaAcres: number;
  totalTrees: number;
  totalExpenses: number;
  expectedRevenue: number;
  estimatedProfit: number;
  estimatedProductionTons: number;
  roiPercentage: number;
  categoryBreakdown: Record<string, number>;
}

export async function getOrchardsApi(token?: string): Promise<{ orchards: Orchard[] }> {
  return fetchJson<{ orchards: Orchard[] }>("/api/farm/orchards", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function createOrchardApi(payload: Partial<Orchard>, token?: string): Promise<{ success: boolean; orchard: Orchard }> {
  return fetchJson<{ success: boolean; orchard: Orchard }>("/api/farm/orchards", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(payload),
  });
}

export async function updateOrchardApi(id: string, payload: Partial<Orchard>, token?: string): Promise<{ success: boolean; orchard: Orchard }> {
  return fetchJson<{ success: boolean; orchard: Orchard }>(`/api/farm/orchards/${id}`, {
    method: "PUT",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(payload),
  });
}

export async function deleteOrchardApi(id: string, token?: string): Promise<{ success: boolean }> {
  return fetchJson<{ success: boolean }>(`/api/farm/orchards/${id}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function getBlocksApi(orchardId?: string, token?: string): Promise<{ blocks: OrchardBlock[] }> {
  const query = orchardId ? `?orchard_id=${encodeURIComponent(orchardId)}` : "";
  return fetchJson<{ blocks: OrchardBlock[] }>(`/api/farm/blocks${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function createBlockApi(payload: Partial<OrchardBlock>, token?: string): Promise<{ success: boolean; block: OrchardBlock }> {
  return fetchJson<{ success: boolean; block: OrchardBlock }>("/api/farm/blocks", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(payload),
  });
}

export async function updateBlockApi(id: string, payload: Partial<OrchardBlock>, token?: string): Promise<{ success: boolean; block: OrchardBlock }> {
  return fetchJson<{ success: boolean; block: OrchardBlock }>(`/api/farm/blocks/${id}`, {
    method: "PUT",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(payload),
  });
}

export async function deleteBlockApi(id: string, token?: string): Promise<{ success: boolean }> {
  return fetchJson<{ success: boolean }>(`/api/farm/blocks/${id}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function getTreatmentsApi(orchardId?: string, blockId?: string, token?: string): Promise<{ treatments: TreatmentRecord[] }> {
  const params = new URLSearchParams();
  if (orchardId) params.append("orchard_id", orchardId);
  if (blockId) params.append("block_id", blockId);
  const q = params.toString() ? `?${params.toString()}` : "";
  return fetchJson<{ treatments: TreatmentRecord[] }>(`/api/farm/treatments${q}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function createTreatmentApi(payload: Partial<TreatmentRecord>, token?: string): Promise<{ success: boolean; treatment: TreatmentRecord }> {
  return fetchJson<{ success: boolean; treatment: TreatmentRecord }>("/api/farm/treatments", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(payload),
  });
}

export async function updateTreatmentApi(id: string, payload: Partial<TreatmentRecord>, token?: string): Promise<{ success: boolean; treatment: TreatmentRecord }> {
  return fetchJson<{ success: boolean; treatment: TreatmentRecord }>(`/api/farm/treatments/${id}`, {
    method: "PUT",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(payload),
  });
}

export async function deleteTreatmentApi(id: string, token?: string): Promise<{ success: boolean }> {
  return fetchJson<{ success: boolean }>(`/api/farm/treatments/${id}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function getExpensesApi(orchardId?: string, blockId?: string, token?: string): Promise<{ expenses: ExpenseRecord[] }> {
  const params = new URLSearchParams();
  if (orchardId) params.append("orchard_id", orchardId);
  if (blockId) params.append("block_id", blockId);
  const q = params.toString() ? `?${params.toString()}` : "";
  return fetchJson<{ expenses: ExpenseRecord[] }>(`/api/farm/expenses${q}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function createExpenseApi(payload: Partial<ExpenseRecord>, token?: string): Promise<{ success: boolean; expense: ExpenseRecord }> {
  return fetchJson<{ success: boolean; expense: ExpenseRecord }>("/api/farm/expenses", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(payload),
  });
}

export async function updateExpenseApi(id: string, payload: Partial<ExpenseRecord>, token?: string): Promise<{ success: boolean; expense: ExpenseRecord }> {
  return fetchJson<{ success: boolean; expense: ExpenseRecord }>(`/api/farm/expenses/${id}`, {
    method: "PUT",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(payload),
  });
}

export async function deleteExpenseApi(id: string, token?: string): Promise<{ success: boolean }> {
  return fetchJson<{ success: boolean }>(`/api/farm/expenses/${id}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function getFarmSummaryApi(orchardId?: string, token?: string): Promise<FarmSummaryData> {
  const query = orchardId ? `?orchard_id=${encodeURIComponent(orchardId)}` : "";
  return fetchJson<FarmSummaryData>(`/api/farm/summary${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// --------------------------------------------
// Real Karnataka Mango Market Prices (AGMARKNET)
// --------------------------------------------
export interface MarketPriceRecord {
  id: string;
  variety: string;
  district: string;
  market: string;
  state: string;
  minPrice: number;
  avgPrice: number;
  maxPrice: number;
  pricePerKgMin: number;
  pricePerKgAvg: number;
  pricePerKgMax: number;
  previousAvgPrice: number;
  priceChange: number;
  direction: "up" | "down" | "flat";
  arrivalQuantityTonnes: number;
  grade?: string;
  lastUpdated: string;
  hasData?: boolean;
}

export interface MarketSummary {
  stateAveragePricePerKg: number;
  stateAveragePricePerQuintal: number;
  totalArrivalsTodayTonnes: number;
  topGainer?: {
    variety: string;
    market: string;
    change: number;
    pricePerKg: number;
  } | null;
  topDecline?: {
    variety: string;
    market: string;
    change: number;
    pricePerKg: number;
  } | null;
  highestPrice?: {
    variety: string;
    market: string;
    pricePerKg: number;
    district: string;
  } | null;
  lowestPrice?: {
    variety: string;
    market: string;
    pricePerKg: number;
    district: string;
  } | null;
}

export interface MarketPricesResponse {
  source: string;
  sourceUrl: string;
  state: string;
  lastSynced: string;
  totalRecords: number;
  totalTrackedMandis: number;
  availableVarieties: string[];
  availableDistricts: string[];
  availableMandis: string[];
  summary: MarketSummary;
  records: MarketPriceRecord[];
}

export interface MarketTrendPoint {
  date: string;
  avgPrice: number;
  pricePerKg: number;
  minPrice: number;
  maxPrice: number;
  arrivals?: number;
}

export interface MarketTrendData {
  variety: string;
  days: number;
  requestedDays: number;
  points: MarketTrendPoint[];
  startPricePerKg: number;
  currentPricePerKg: number;
  startPriceQuintal: number;
  currentPriceQuintal: number;
  percentageChange: number;
  trendDirection: "up" | "down" | "flat";
  minPricePerKg: number;
  maxPricePerKg: number;
  averagePricePerKg: number;
  source: string;
  lastUpdated: string;
}

export async function getKarnatakaMarketPrices(params?: {
  variety?: string;
  district?: string;
  market?: string;
  sort_by?: string;
}): Promise<MarketPricesResponse> {
  const q = new URLSearchParams();
  if (params?.variety) q.append("variety", params.variety);
  if (params?.district) q.append("district", params.district);
  if (params?.market) q.append("market", params.market);
  if (params?.sort_by) q.append("sort_by", params.sort_by);
  const queryStr = q.toString() ? `?${q.toString()}` : "";
  return fetchJson<MarketPricesResponse>(`/api/market/karnataka${queryStr}`);
}

export async function getMarketTrends(
  variety: string = "Badami (Alphonso)",
  market?: string,
  days: number = 30
): Promise<MarketTrendData> {
  const q = new URLSearchParams();
  q.append("variety", variety);
  if (market) q.append("market", market);
  q.append("days", days.toString());
  return fetchJson<MarketTrendData>(`/api/market/karnataka/trends?${q.toString()}`);
}

export async function refreshMarketPrices(): Promise<{
  success: boolean;
  message: string;
  lastSynced: string;
  totalRecords: number;
}> {
  return fetchJson<{
    success: boolean;
    message: string;
    lastSynced: string;
    totalRecords: number;
  }>("/api/market/karnataka/refresh", {
    method: "POST",
  });
}

// --------------------------------------------
// Real Karnataka Mango & Agriculture News Feed
// --------------------------------------------
export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  category: string;
  url: string;
  read: boolean;
  severity?: "high" | "medium" | "info";
}

export interface NewsFeedResponse {
  lastUpdated: string;
  source: string;
  totalArticles: number;
  unreadCount: number;
  categories: string[];
  articles: NewsArticle[];
}

export async function getNewsFeed(params?: {
  category?: string;
  unread_only?: boolean;
}): Promise<NewsFeedResponse> {
  const q = new URLSearchParams();
  if (params?.category && params.category !== "ALL") q.append("category", params.category);
  if (params?.unread_only) q.append("unread_only", "true");
  const queryStr = q.toString() ? `?${q.toString()}` : "";
  return fetchJson<NewsFeedResponse>(`/api/news${queryStr}`);
}

export async function markNewsAsRead(articleId: string): Promise<{ success: boolean; articleId: string }> {
  return fetchJson<{ success: boolean; articleId: string }>(`/api/news/read/${encodeURIComponent(articleId)}`, {
    method: "POST",
  });
}

export async function markAllNewsAsRead(): Promise<{ success: boolean; message: string }> {
  return fetchJson<{ success: boolean; message: string }>("/api/news/read-all", {
    method: "POST",
  });
}

export async function refreshNewsFeed(): Promise<{
  success: boolean;
  message: string;
  lastUpdated: string;
  totalArticles: number;
}> {
  return fetchJson<{
    success: boolean;
    message: string;
    lastUpdated: string;
    totalArticles: number;
  }>("/api/news/refresh", {
    method: "POST",
  });
}

// --------------------------------------------
// AI Agronomist Agent
// --------------------------------------------
export interface AgentActionCard {
  type: "prescription" | "irrigation" | "economics" | "disease_scan";
  title: string;
  data: Record<string, any>;
}

export interface AgentChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
  action?: AgentActionCard;
  modelUsed?: string;
  latencyMs?: number;
  source?: string;
  suggestedQuestions?: string[];
}

export interface AgentChatResponse {
  response: string;
  action?: AgentActionCard;
  source: string;
  modelUsed: string;
  latencyMs: number;
  context: {
    temp: number;
    humidity: number;
    activeAlerts: number;
  };
  suggestedQuestions?: string[];
}

export interface AgentModelInfo {
  id: string;
  name: string;
  provider: string;
}

export interface AgentModelsResponse {
  models: AgentModelInfo[];
  defaultModel: string;
  hasGeminiKey: boolean;
  hasGroqKey: boolean;
  hasOpenAIKey: boolean;
  hasAnthropicKey: boolean;
}

export interface AgentPreset {
  id: string;
  title: string;
  prompt: string;
  category: string;
  icon: string;
}

export interface AgentStatusResponse {
  status: string;
  agentName: string;
  version: string;
  activeModel: string;
  liveContext: {
    location: string;
    ambient_temp: number;
    ambient_humidity: number;
    wind_speed: number;
    weather_condition: string;
    uv_index: number;
    rainfall_forecast: string;
    total_orchards: number;
    recent_scans: string;
    active_disease_alerts: number;
    avg_yield_forecast: string;
    current_market_price: string;
    pulp_factory_price: string;
    recommended_cultivars: string[];
  };
  supportedProviders: string[];
}

export async function sendAgentMessage(params: {
  message: string;
  history?: { role: string; content: string }[];
  model?: string;
  apiKey?: string;
  temperature?: number;
  topic?: string;
}): Promise<AgentChatResponse> {
  return fetchJson<AgentChatResponse>("/api/agent/chat", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function streamAgentMessage(
  params: {
    message: string;
    history?: { role: string; content: string }[];
    model?: string;
    apiKey?: string;
    temperature?: number;
    topic?: string;
  },
  onToken: (token: string) => void,
  onMeta?: (meta: { action?: any; suggestedQuestions?: string[]; modelUsed?: string }) => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/agent/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    signal,
  });

  if (!res.ok) {
    throw new Error(`Agent connection notice: Server returned ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data: ")) {
        try {
          const payload = JSON.parse(trimmed.slice(6));
          if (payload.type === "token" && payload.content) {
            onToken(payload.content);
          } else if (payload.type === "meta" && onMeta) {
            onMeta({
              action: payload.action,
              suggestedQuestions: payload.suggestedQuestions,
              modelUsed: payload.modelUsed,
            });
          }
        } catch (e) {
          // ignore stream parse errors
        }
      }
    }
  }
}

export async function getAgentModels(): Promise<AgentModelsResponse> {
  return fetchJson<AgentModelsResponse>("/api/agent/models");
}

export async function getAgentPresets(): Promise<{ presets: AgentPreset[] }> {
  return fetchJson<{ presets: AgentPreset[] }>("/api/agent/presets");
}

export async function getAgentStatus(): Promise<AgentStatusResponse> {
  return fetchJson<AgentStatusResponse>("/api/agent/status");
}

// --------------------------------------------
// Help Center & Farmer Direct Support
// --------------------------------------------
export interface HelpTicketReply {
  id: string;
  author: string;
  role: string;
  isAdmin: boolean;
  timestamp: string;
  message: string;
}

export interface HelpTicket {
  id: string;
  farmerName: string;
  phone?: string;
  email?: string;
  district: string;
  mangoVariety: string;
  category: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: "Open" | "In Progress" | "Answered" | "Resolved";
  subject: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  replies: HelpTicketReply[];
}

export interface HelpCenterStats {
  totalInquiries: number;
  openInquiries: number;
  inProgress: number;
  answered: number;
  resolved: number;
  resolutionRate: string;
  avgResponseTime: string;
  adminLead: string;
}

export interface CreateTicketParams {
  farmerName: string;
  phone?: string;
  email?: string;
  district: string;
  mangoVariety?: string;
  category: string;
  priority?: string;
  subject: string;
  message: string;
}

export async function getHelpTickets(filters?: {
  status?: string;
  category?: string;
  district?: string;
  search?: string;
}): Promise<HelpTicket[]> {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== "All") params.append("status", filters.status);
  if (filters?.category && filters.category !== "All") params.append("category", filters.category);
  if (filters?.district && filters.district !== "All") params.append("district", filters.district);
  if (filters?.search) params.append("search", filters.search);

  const qs = params.toString() ? `?${params.toString()}` : "";
  return fetchJson<HelpTicket[]>(`/api/help-center/tickets${qs}`);
}

export async function createHelpTicket(params: CreateTicketParams): Promise<HelpTicket> {
  return fetchJson<HelpTicket>("/api/help-center/tickets", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function replyToHelpTicket(ticketId: string, message: string, author?: string): Promise<HelpTicket> {
  return fetchJson<HelpTicket>(`/api/help-center/tickets/${ticketId}/reply`, {
    method: "POST",
    body: JSON.stringify({
      message,
      author: author || "Manas (Admin / KSIT)",
      role: "Lead Administrator",
      isAdmin: true,
    }),
  });
}

export async function updateTicketStatus(
  ticketId: string,
  status: "Open" | "In Progress" | "Answered" | "Resolved",
  priority?: string
): Promise<HelpTicket> {
  return fetchJson<HelpTicket>(`/api/help-center/tickets/${ticketId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, priority }),
  });
}

export async function deleteHelpTicket(ticketId: string): Promise<{ success: boolean }> {
  return fetchJson<{ success: boolean }>(`/api/help-center/tickets/${ticketId}`, {
    method: "DELETE",
  });
}

export async function getHelpCenterStats(): Promise<HelpCenterStats> {
  return fetchJson<HelpCenterStats>("/api/help-center/stats");
}

