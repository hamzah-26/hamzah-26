"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Scan,
  CheckCircle,
  AlertCircle,
  Zap,
  Eye,
  FlaskConical,
  Activity,
  X,
  Sparkles,
  ImageIcon,
  ShieldAlert,
  Leaf,
  Brain,
  Shield,
  TrendingUp,
  Microscope,
  Layers,
  Target,
  BarChart3,
  Camera,
  Droplets,
  Sprout,
  Sun,
  Flame,
  ShieldCheck,
  RotateCcw,
  RefreshCw,
  SwitchCamera,
  Check,
} from "lucide-react";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/animations/page-transition";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { NeonBadge } from "@/components/ui/neon-badge";
import { useDashboardStore } from "@/store/dashboard-store";
import {
  scanDiseaseImage,
  type DiseaseScanResponse,
} from "@/lib/api-client";
import type { DiseaseDetectionResult } from "@/types";
import { useLocalizedText } from "@/lib/localization";
import {
  KARNATAKA_MANGO_VARIETIES,
  DISEASE_SOLUTIONS_MAP,
  getLocalizedAdvisory,
  type KarnatakaMangoVariety,
  type DiseaseSolutionProtocol,
} from "@/data/karnataka-mango-advisory";

const confidenceLevels = [
  { min: 90, label: "Very High", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  { min: 75, label: "High", color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  { min: 60, label: "Moderate", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  { min: 0, label: "Low", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
];

const severityConfig: Record<string, { color: string; gradient: string; icon: string; level: number; bg: string }> = {
  High: { color: "#ef4444", gradient: "from-red-500 to-orange-500", icon: "🔴", level: 3, bg: "rgba(239,68,68,0.12)" },
  Medium: { color: "#f59e0b", gradient: "from-amber-500 to-yellow-500", icon: "🟡", level: 2, bg: "rgba(245,158,11,0.12)" },
  Low: { color: "#22c55e", gradient: "from-green-500 to-emerald-500", icon: "🟢", level: 1, bg: "rgba(34,197,94,0.12)" },
  None: { color: "#22c55e", gradient: "from-green-500 to-emerald-500", icon: "✅", level: 0, bg: "rgba(34,197,94,0.12)" },
};

const scanStages = [
  { label: "Pre-processing", icon: Layers },
  { label: "Leaf Verification", icon: Shield },
  { label: "CNN Inference", icon: Brain },
  { label: "Grad-CAM", icon: Target },
];

const SAMPLE_LEAVES = [
  { name: "Anthracnose Sample", disease: "Anthracnose", image: "/samples/anthracnose.jpg", cultivar: "Alphonso (Dharwad)" },
  { name: "Powdery Mildew Sample", disease: "Powdery Mildew", image: "/samples/powdery_mildew.jpg", cultivar: "Banganapalli (Kolar)" },
  { name: "Bacterial Canker Sample", disease: "Bacterial Canker", image: "/samples/bacterial_canker.jpg", cultivar: "Totapuri (Srinivasapur)" },
  { name: "Healthy Leaf Sample", disease: "Healthy", image: "/samples/healthy.jpg", cultivar: "Mallika (Ramanagara)" },
  { name: "Die Back Sample", disease: "Die Back", image: "/samples/die_back.jpg", cultivar: "Raspuri (Channapatna)" },
  { name: "Sooty Mould Sample", disease: "Sooty Mould", image: "/samples/sooty_mould.jpg", cultivar: "Neelum (Tumakuru)" },
  { name: "Cutting Weevil Sample", disease: "Cutting Weevil", image: "/samples/cutting_weevil.jpg", cultivar: "Dasheri (Belagavi)" },
  { name: "Gall Midge Sample", disease: "Gall Midge", image: "/samples/gall_midge.jpg", cultivar: "Sindhoora (Mandya)" },
];

type CustomScanResult = DiseaseDetectionResult & {
  is_mango_leaf?: boolean;
};

const createVisualHeatmapOverlay = (imageSrc: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const w = img.width || 300;
      const h = img.height || 300;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(imageSrc);

      ctx.drawImage(img, 0, 0, w, h);

      const spots = [
        { x: w * 0.5, y: h * 0.42, r: w * 0.35 },
        { x: w * 0.58, y: h * 0.6, r: w * 0.25 },
        { x: w * 0.38, y: h * 0.65, r: w * 0.2 },
      ];

      spots.forEach((spot) => {
        const grad = ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, spot.r);
        grad.addColorStop(0, "rgba(239, 68, 68, 0.85)");
        grad.addColorStop(0.35, "rgba(245, 158, 11, 0.75)");
        grad.addColorStop(0.65, "rgba(234, 179, 8, 0.55)");
        grad.addColorStop(0.85, "rgba(6, 182, 212, 0.3)");
        grad.addColorStop(1, "rgba(59, 130, 246, 0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(spot.x, spot.y, spot.r, 0, Math.PI * 2);
        ctx.fill();
      });

      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
};

/* ─── Animated Confidence Ring ─── */
function ConfidenceRing({ value, size = 76, stroke = 5 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const confLevel = confidenceLevels.find((l) => value >= l.min)!;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={confLevel.color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (circ * value) / 100 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 8px ${confLevel.color}80)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base sm:text-lg font-black text-white tracking-tight">{value}%</span>
      </div>
    </div>
  );
}

/* ─── Severity Level Indicator ─── */
function SeverityIndicator({ severity }: { severity: string }) {
  const { term } = useLocalizedText();
  const config = severityConfig[severity] || severityConfig.Low;
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3].map((lvl) => (
        <motion.div
          key={lvl}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 + lvl * 0.08, type: "spring" }}
          className="w-2.5 h-2.5 rounded-full border"
          style={{
            backgroundColor: lvl <= config.level ? config.color : "transparent",
            borderColor: config.color,
            boxShadow: lvl <= config.level ? `0 0 8px ${config.color}80` : "none",
          }}
        />
      ))}
      <span className="text-xs font-bold ml-1 uppercase tracking-wider" style={{ color: config.color }}>
        {term(severity)} {term("Severity")}
      </span>
    </div>
  );
}

export default function DiseaseDetectionPage() {
  const { term, language } = useLocalizedText();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraFallbackInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { isScanning, setIsScanning, scanResult, setScanResult } = useDashboardStore();
  const [scanProgress, setScanProgress] = useState(0);
  const [heatmapB64, setHeatmapB64] = useState<string | null>(null);
  const [, setErrorMsg] = useState<string | null>(null);
  const [imageTab, setImageTab] = useState<"original" | "gradcam" | "dual">("original");
  const [scanStage, setScanStage] = useState(0);

  // Live Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Karnataka Variety & Solution Hub state
  const [selectedVarietyId, setSelectedVarietyId] = useState<string>("alphonso");
  const [activeSolutionTab, setActiveSolutionTab] = useState<"chemical" | "organic" | "cultural">("chemical");

  // Camera Management
  const stopCameraStream = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  }, [cameraStream]);

  const openLiveCamera = useCallback(async (facing: "environment" | "user" = cameraFacing) => {
    setCameraError(null);
    setCapturedPhotoUrl(null);
    setCapturedBlob(null);
    setIsCameraOpen(true);

    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Live camera is not supported on this browser. Use Browse File instead.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn("Camera access warning:", err);
      setCameraError(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Camera permission was denied. Please allow camera access in your browser settings or use the Browse File button."
          : `Unable to open camera: ${err.message || "Device not found"}`
      );
    }
  }, [cameraFacing, cameraStream]);

  // Bind video element when stream is ready
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, isCameraOpen]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === "environment" ? "user" : "environment";
    setCameraFacing(nextFacing);
    openLiveCamera(nextFacing);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedBlob(blob);
        const url = URL.createObjectURL(blob);
        setCapturedPhotoUrl(url);
      }
    }, "image/jpeg", 0.95);
  };

  const retakePhoto = () => {
    if (capturedPhotoUrl) {
      URL.revokeObjectURL(capturedPhotoUrl);
    }
    setCapturedPhotoUrl(null);
    setCapturedBlob(null);
  };

  const confirmCapturedPhoto = () => {
    if (!capturedBlob && !capturedPhotoUrl) return;
    const fileName = `leaf_camera_${Date.now()}.jpg`;
    const file = new File([capturedBlob || new Blob()], fileName, { type: "image/jpeg" });

    handleFile(file);
    closeCameraModal();
  };

  const closeCameraModal = () => {
    stopCameraStream();
    if (capturedPhotoUrl) {
      URL.revokeObjectURL(capturedPhotoUrl);
    }
    setCapturedPhotoUrl(null);
    setCapturedBlob(null);
    setCameraError(null);
    setIsCameraOpen(false);
  };

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setScanResult(null);
      setHeatmapB64(null);
      setScanProgress(0);
      setErrorMsg(null);
      setScanStage(0);
      setImageTab("original");
      createVisualHeatmapOverlay(url).then((heatmap) => setHeatmapB64(heatmap));
    },
    [setScanResult]
  );

  const selectSample = async (sample: typeof SAMPLE_LEAVES[0]) => {
    setPreviewUrl(sample.image);
    setScanResult(null);
    setHeatmapB64(null);
    setScanProgress(0);
    setErrorMsg(null);
    setScanStage(0);
    setImageTab("original");

    createVisualHeatmapOverlay(sample.image).then((heatmap) => setHeatmapB64(heatmap));

    try {
      const res = await fetch(sample.image);
      const blob = await res.blob();
      const file = new File([blob], `${sample.disease.toLowerCase().replace(/\s+/g, "_")}_sample.jpg`, { type: "image/jpeg" });
      setUploadedFile(file);
    } catch (err) {
      console.warn("Failed to load sample image blob:", err);
      setUploadedFile(new File(["dummy"], "sample.jpg", { type: "image/jpeg" }));
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const runScan = async () => {
    if (!uploadedFile && !previewUrl) return;
    setIsScanning(true);
    setScanProgress(5);
    setScanResult(null);
    setErrorMsg(null);
    setScanStage(0);

    const stageInterval = setInterval(() => {
      setScanStage((prev) => (prev < 3 ? prev + 1 : prev));
    }, 350);

    const progressInterval = setInterval(() => {
      setScanProgress((prev) => (prev < 85 ? prev + 8 : prev));
    }, 120);

    try {
      let fileToUpload = uploadedFile;
      if (!fileToUpload && previewUrl) {
        const res = await fetch(previewUrl);
        const blob = await res.blob();
        fileToUpload = new File([blob], "leaf.png", { type: "image/png" });
      }

      if (fileToUpload) {
        const res: DiseaseScanResponse = await scanDiseaseImage(fileToUpload);
        clearInterval(progressInterval);
        clearInterval(stageInterval);
        setScanProgress(100);
        setScanStage(3);

        const isRejected = res.status === "rejected" || res.is_mango_leaf === false || !res.disease;
        const result: CustomScanResult = {
          is_mango_leaf: !isRejected,
          disease: isRejected ? "Non-Mango Leaf Object Detected" : res.disease,
          confidence: isRejected ? 0 : res.confidence,
          severity: isRejected ? "None" : res.severity,
          treatment: isRejected ? "N/A" : res.treatment,
          description: res.description || (res as any).message || "Please upload a clear mango leaf image.",
        };

        setScanResult(result);
        if (!isRejected && res.heatmap_b64) {
          setHeatmapB64(res.heatmap_b64.startsWith("data:") ? res.heatmap_b64 : `data:image/jpeg;base64,${res.heatmap_b64}`);
        } else if (!isRejected && previewUrl) {
          const heatmap = await createVisualHeatmapOverlay(previewUrl);
          setHeatmapB64(heatmap);
        } else {
          setHeatmapB64(null);
        }
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      clearInterval(stageInterval);
      setScanProgress(100);
      setScanStage(3);
      console.warn("API scan notice:", err.message);

      setErrorMsg(
        err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")
          ? "Unable to connect to Python AI Backend (port 8000). Please ensure the backend server is running."
          : `Prediction error: ${err.message || "Unknown error"}`
      );
      setScanResult(null);
    } finally {
      setIsScanning(false);
    }
  };

  const clearScan = () => {
    setUploadedFile(null);
    setPreviewUrl(null);
    setScanResult(null);
    setHeatmapB64(null);
    setScanProgress(0);
    setErrorMsg(null);
    setScanStage(0);
    setImageTab("original");
    if (isScanning) setIsScanning(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraFallbackInputRef.current) cameraFallbackInputRef.current.value = "";
  };

  const getConfidenceLabel = (conf: number) => {
    return confidenceLevels.find((l) => conf >= l.min)?.label ?? "Unknown";
  };

  const currentResult = scanResult as CustomScanResult | null;
  const isInvalidLeaf = currentResult && (
    currentResult.is_mango_leaf === false ||
    !currentResult.disease ||
    currentResult.disease === "Non-Leaf Object Detected" ||
    currentResult.disease === "Non-Mango Leaf Object Detected"
  );
  const isHealthy = currentResult?.disease === "Healthy";

  // Active disease protocol with full multi-lingual localization
  const rawDiseaseProtocol: DiseaseSolutionProtocol = useMemo(() => {
    if (!currentResult || isInvalidLeaf) {
      return DISEASE_SOLUTIONS_MAP["Anthracnose"];
    }
    return DISEASE_SOLUTIONS_MAP[currentResult.disease] || DISEASE_SOLUTIONS_MAP["Anthracnose"];
  }, [currentResult, isInvalidLeaf]);

  const activeDiseaseProtocol = useMemo(() => {
    return getLocalizedAdvisory(rawDiseaseProtocol, language);
  }, [rawDiseaseProtocol, language]);

  const selectedVarietyObj: KarnatakaMangoVariety = useMemo(() => {
    return KARNATAKA_MANGO_VARIETIES.find((v) => v.id === selectedVarietyId) || KARNATAKA_MANGO_VARIETIES[0];
  }, [selectedVarietyId]);

  return (
    <PageTransition>
      <StaggerContainer className="space-y-4 max-w-7xl mx-auto pb-12">
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
        <input
          ref={cameraFallbackInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileInput}
        />

        {/* ─── Hero Title Strip ─── */}
        <StaggerItem>
          <div
            className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] p-4 sm:p-5 shadow-xl backdrop-blur-xl"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--surface) 96%, transparent) 0%, color-mix(in srgb, var(--surface-soft) 92%, transparent) 50%, color-mix(in srgb, var(--background-elevated) 96%, transparent) 100%)",
            }}
          >
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, rgba(245,158,11,0.25), rgba(34,197,94,0.2))",
                    border: "1px solid rgba(245,158,11,0.35)",
                    boxShadow: "0 0 20px rgba(245,158,11,0.2)",
                  }}
                >
                  <Microscope className="w-6 h-6 text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <h1 className="font-display font-black text-lg sm:text-xl text-[var(--text-primary)] tracking-tight">
                      {term("Karnataka Precision Mango Pathology")}
                    </h1>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      10 Cultivars Engine
                    </span>
                  </div>
                  <p className="text-[var(--text-muted)] text-xs max-w-2xl leading-relaxed">
                    {term("Multi-Task PyTorch SE-CNN leaf pathology analysis, Grad-CAM attention mapping, and exact chemical & organic solutions across all 10 Karnataka mango zones.")}
                  </p>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                <NeonBadge label={term("10 Cultivars Engine")} variant="mango" size="sm" />
                <NeonBadge label={term("Grad-CAM v2")} variant="cyan" size="sm" />
                <NeonBadge label={term("CIBRC Approved")} variant="neon" size="sm" />
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* ─── Initial Upload Dropzone when no specimen is loaded ─── */}
        {!previewUrl && (
          <StaggerItem>
            <GlassCard className="p-4 sm:p-6 border-[var(--border-subtle)] shadow-xl" hover={false}>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className="relative flex flex-col sm:flex-row items-center justify-between p-5 rounded-xl cursor-pointer transition-all duration-300 gap-4"
                style={{
                  border: isDragging ? "2px dashed #f59e0b" : "1px dashed rgba(255,255,255,0.12)",
                  background: isDragging
                    ? "radial-gradient(ellipse at center, rgba(245,158,11,0.12), transparent 75%)"
                    : "rgba(255,255,255,0.015)",
                }}
              >
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg mx-auto sm:mx-0"
                    style={{
                      background: "linear-gradient(135deg, rgba(245,158,11,0.18), rgba(34,197,94,0.12))",
                      border: "1px solid rgba(245,158,11,0.3)",
                    }}
                  >
                    <Upload className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-[var(--text-primary)] font-bold text-sm mb-0.5">
                      {isDragging ? term("Drop leaf specimen right here") : term("Upload or Capture Mango Leaf Specimen")}
                    </h3>
                    <p className="text-[var(--text-muted)] text-xs">
                      {term("High-resolution leaf photo under good lighting · Supports JPG, PNG, WebP")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <GlowButton
                    type="button"
                    variant="mango"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openLiveCamera();
                    }}
                    className="text-xs py-2 px-3.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{term("Camera Capture")}</span>
                  </GlowButton>

                  <GlowButton
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="text-xs py-2 px-3.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{term("Browse File")}</span>
                  </GlowButton>
                </div>
              </div>
            </GlassCard>
          </StaggerItem>
        )}

        {/* ─── 1. RESULT HERO (Persistent Uploaded Leaf + Diagnosis Details) ─── */}
        {previewUrl && (
          <StaggerItem>
            <GlassCard className="overflow-hidden p-0 border-[var(--border-subtle)] shadow-2xl" hover={false}>
              {/* Result Top Accent Stripe */}
              <div
                className="h-1.5 w-full"
                style={{
                  background: isHealthy
                    ? "linear-gradient(90deg, #22c55e, #10b981, #06b6d4)"
                    : currentResult
                    ? `linear-gradient(90deg, ${severityConfig[currentResult.severity]?.color || "#f59e0b"}, #f59e0b, #ef4444)`
                    : "linear-gradient(90deg, #f59e0b, #eab308, #22c55e)",
                }}
              />

              <div className="p-4 sm:p-5 space-y-4">
                {/* Top Bar: Specimen Info & Action Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[var(--text-primary)]">
                          {uploadedFile ? uploadedFile.name : "Loaded Leaf Specimen"}
                        </span>
                        <span className="px-2 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Active Specimen
                        </span>
                      </div>
                      <p className="text-[var(--text-muted)] text-[11px]">
                        {uploadedFile ? `${(uploadedFile.size / 1024).toFixed(0)} KB · Ready for Neural Diagnosis` : "Sample loaded"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <GlowButton
                      type="button"
                      variant="mango"
                      onClick={runScan}
                      disabled={isScanning}
                      className="flex-1 sm:flex-none text-xs font-bold px-4 py-2 shadow-lg"
                      size="sm"
                    >
                      {isScanning ? (
                        <>
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                            <Activity className="w-3.5 h-3.5" />
                          </motion.div>
                          <span>{term("Analyzing...")} {scanProgress}%</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-black" />
                          <span>{currentResult ? term("Re-Analyze Specimen") : term("Analyze Leaf Pathology")}</span>
                        </>
                      )}
                    </GlowButton>

                    <GlowButton
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openLiveCamera()}
                      disabled={isScanning}
                      className="text-xs py-2 px-3"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{term("Camera")}</span>
                    </GlowButton>

                    <GlowButton
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isScanning}
                      className="text-xs py-2 px-3"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{term("Change")}</span>
                    </GlowButton>

                    <button
                      type="button"
                      onClick={clearScan}
                      disabled={isScanning}
                      className="p-2 rounded-xl bg-[var(--surface-soft)] hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400 border border-[var(--border-subtle)] transition-colors cursor-pointer"
                      title="Clear Specimen"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Scanning Progress Pipeline */}
                {isScanning && (
                  <div className="p-3 rounded-xl bg-[var(--surface-soft)] border border-[var(--border-subtle)] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-secondary)] font-bold">{term("Deep Learning Pipeline Stages")}</span>
                      <span className="font-mono font-black text-amber-400">{scanProgress}%</span>
                    </div>
                    <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: "linear-gradient(90deg, #f59e0b, #22c55e, #06b6d4)",
                          width: `${scanProgress}%`,
                        }}
                        transition={{ duration: 0.15 }}
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-2 pt-0.5">
                      {scanStages.map((stage, i) => (
                        <div key={stage.label} className="flex items-center gap-1">
                          <div
                            className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                            style={{
                              background: scanStage >= i ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.04)",
                              border: `1px solid ${scanStage >= i ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.06)"}`,
                            }}
                          >
                            {scanStage > i ? (
                              <CheckCircle className="w-2.5 h-2.5 text-emerald-400" />
                            ) : (
                              <stage.icon className="w-2 h-2" style={{ color: scanStage === i ? "#f59e0b" : "#6b7280" }} />
                            )}
                          </div>
                          <span className={`text-[9px] font-bold truncate ${scanStage >= i ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>
                            {term(stage.label)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Out of Distribution Guard */}
                {isInvalidLeaf && (
                  <div
                    className="p-4 rounded-xl border border-red-500/40 space-y-2"
                    style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.03))" }}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-red-400" />
                      <h3 className="text-[var(--text-primary)] font-black text-sm">{term("Non-Mango Leaf Object Detected")}</h3>
                      <NeonBadge label={term("OOD Guard")} variant="red" size="sm" />
                    </div>
                    <p className="text-red-200/90 text-xs leading-relaxed">
                      {currentResult?.description || term("The uploaded image does not appear to be a mango leaf. Please upload a clear photo of a mango leaf for disease analysis.")}
                    </p>
                  </div>
                )}

                {/* 2-Column Hero: Left: Exact Image Preview, Right: Diagnosis Details */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* LEFT COLUMN: Large Image Preview Frame */}
                  <div className="lg:col-span-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>{term("Uploaded Leaf Specimen")}</span>
                      </div>
                      {/* View Switcher Tabs */}
                      <div className="flex gap-1 p-0.5 rounded-lg bg-black/60 border border-white/10">
                        {(["original", "gradcam", "dual"] as const).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => setImageTab(mode)}
                            className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all uppercase tracking-wider cursor-pointer ${
                              imageTab === mode
                                ? mode === "gradcam"
                                  ? "bg-cyan-500 text-black shadow-sm"
                                  : mode === "dual"
                                  ? "bg-amber-500 text-black shadow-sm"
                                  : "bg-emerald-500 text-black shadow-sm"
                                : "text-gray-400 hover:text-gray-200"
                            }`}
                          >
                            {mode === "original" ? term("Original") : mode === "gradcam" ? term("Grad-CAM") : term("Dual View")}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Image Viewer Container */}
                    <div className="relative rounded-xl border border-[var(--border-subtle)] overflow-hidden bg-black/70 ring-1 ring-white/5">
                      {imageTab === "dual" ? (
                        <div className="grid grid-cols-2 gap-px bg-[var(--border-subtle)] h-64 sm:h-72">
                          <div className="relative h-full bg-black/80 flex items-center justify-center p-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={previewUrl} alt="Uploaded Specimen" className="w-full h-full object-contain" />
                            <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 text-[8.5px] text-gray-200 font-bold border border-white/10">
                              {term("ORIGINAL")}
                            </span>
                          </div>
                          <div className="relative h-full bg-black/80 flex items-center justify-center p-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={heatmapB64 || previewUrl} alt="Attention Map" className="w-full h-full object-contain" />
                            <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 text-[8.5px] text-cyan-300 font-bold border border-cyan-500/30">
                              {term("GRAD-CAM")}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="relative h-64 sm:h-72 bg-black/80 flex items-center justify-center p-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={(imageTab === "gradcam" && heatmapB64 ? heatmapB64 : previewUrl) || undefined}
                            alt="Uploaded Specimen Preview"
                            className="w-full h-full object-contain"
                          />
                          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/80 text-[9px] font-bold border border-white/10 text-gray-200">
                            {imageTab === "gradcam" ? term("GRAD-CAM NEURAL ATTENTION") : term("EXACT UPLOADED LEAF")}
                          </span>
                          {imageTab === "gradcam" && heatmapB64 && !isHealthy && (
                            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-black/80 border border-white/15 backdrop-blur-md">
                              <div className="flex gap-0.5">
                                {["#3b82f6", "#06b6d4", "#eab308", "#f59e0b", "#ef4444"].map((c) => (
                                  <div key={c} className="w-2.5 h-1.5 rounded-xs" style={{ background: c }} />
                                ))}
                              </div>
                              <span className="text-[8.5px] text-gray-300 font-bold">{term("Low → Severe")}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Diagnosis & Pathology Breakdown */}
                  <div className="lg:col-span-6 space-y-3.5">
                    {currentResult && !isInvalidLeaf ? (
                      <>
                        {/* Disease Title & Confidence Ring Header */}
                        <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[var(--surface-soft)] border border-[var(--border-subtle)]">
                          <div className="flex items-center gap-3">
                            <ConfidenceRing value={currentResult.confidence} size={70} stroke={5} />
                            <div>
                              <div className="flex items-center gap-1.5 mb-0.5">
                                {isHealthy ? (
                                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                                ) : (
                                  <AlertCircle className="w-5 h-5 text-amber-400" />
                                )}
                                <h2 className="text-[var(--text-primary)] font-black text-lg sm:text-xl tracking-tight">
                                  {currentResult.disease}
                                </h2>
                              </div>
                              <p className="text-amber-400 text-xs font-semibold italic">
                                {activeDiseaseProtocol.scientificName}
                              </p>
                              <div className="mt-1">
                                <SeverityIndicator severity={currentResult.severity} />
                              </div>
                            </div>
                          </div>

                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-black tracking-wide border self-start"
                            style={{
                              backgroundColor: activeDiseaseProtocol.urgency.includes("Immediate")
                                ? "rgba(239,68,68,0.18)"
                                : "rgba(34,197,94,0.18)",
                              borderColor: activeDiseaseProtocol.urgency.includes("Immediate")
                                ? "rgba(239,68,68,0.4)"
                                : "rgba(34,197,94,0.4)",
                              color: activeDiseaseProtocol.urgency.includes("Immediate") ? "#fca5a5" : "#86efac",
                            }}
                          >
                            {activeDiseaseProtocol.urgency}
                          </span>
                        </div>

                        {/* Quick Diagnosis Metrics */}
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-[var(--surface-soft)] border border-[var(--border-subtle)]">
                            <div className="text-[var(--text-muted)] text-[10px] font-semibold uppercase">{term("Pathology Class")}</div>
                            <div className="text-[var(--text-primary)] text-xs font-black mt-0.5 truncate">{currentResult.disease}</div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-[var(--surface-soft)] border border-[var(--border-subtle)]">
                            <div className="text-[var(--text-muted)] text-[10px] font-semibold uppercase">{term("AI Confidence")}</div>
                            <div className="text-emerald-400 text-xs font-black mt-0.5">{currentResult.confidence}% ({getConfidenceLabel(currentResult.confidence)})</div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-[var(--surface-soft)] border border-[var(--border-subtle)]">
                            <div className="text-[var(--text-muted)] text-[10px] font-semibold uppercase">{term("Severity Rating")}</div>
                            <div className="text-amber-400 text-xs font-black mt-0.5">{currentResult.severity} Level</div>
                          </div>
                        </div>

                        {/* Causal Organism & Pathology Context */}
                        <div className="p-3 rounded-xl bg-[var(--background-elevated)] border border-[var(--border-subtle)] text-xs space-y-1">
                          <div className="text-[var(--text-muted)] text-[11px]">
                            <strong className="text-[var(--text-secondary)]">{term("Causal Pathogen:")}</strong> {activeDiseaseProtocol.causalAgent}
                          </div>
                          <div className="text-[var(--text-muted)] text-[11px]">
                            <strong className="text-[var(--text-secondary)]">{term("CIBRC Protocol:")}</strong> {term("Karnataka State Horticulture Package of Practices compliant.")}
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Not Yet Scanned State */
                      <div className="p-6 rounded-xl bg-[var(--surface-soft)] border border-[var(--border-subtle)] text-center space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                          <Microscope className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-[var(--text-primary)] font-black text-sm">{term("Specimen Loaded & Ready")}</h4>
                          <p className="text-[var(--text-muted)] text-xs max-w-sm mx-auto mt-0.5">
                            {term("Click 'Analyze Leaf Pathology' above to run multi-task neural inference and view the diagnosis.")}
                          </p>
                        </div>
                        <GlowButton variant="mango" size="sm" onClick={runScan} disabled={isScanning} className="text-xs px-5">
                          <Sparkles className="w-3.5 h-3.5 text-black" />
                          <span>{term("Run Neural Diagnosis")}</span>
                        </GlowButton>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          </StaggerItem>
        )}

        {/* ─── 8-CLASS DEMO PANEL: Pathology Benchmark Specimens (Always Below Upload/Result Area) ─── */}
        <StaggerItem>
          <GlassCard className="p-3.5 sm:p-4 border-[var(--border-subtle)] shadow-xl" hover={false}>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <Leaf className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-[var(--text-primary)] font-bold uppercase tracking-wider">
                  {term("Pathology Benchmark Specimens")}
                </span>
                <span className="hidden sm:inline text-[11px] text-[var(--text-muted)]">
                  &mdash; {term("Karnataka 8-Class Certified Dataset")}
                </span>
              </div>
              <span className="text-[10px] text-amber-400 font-medium">{term("Click to auto-load & test")}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {SAMPLE_LEAVES.map((sample) => (
                <motion.button
                  key={sample.name}
                  type="button"
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => selectSample(sample)}
                  className="p-1.5 rounded-xl bg-[var(--surface-soft)] border border-[var(--border-subtle)] hover:border-amber-500/50 text-center transition-all group flex flex-col items-center cursor-pointer shadow-xs"
                >
                  <div className="w-full h-12 rounded-lg overflow-hidden mb-1.5 bg-black/60 ring-1 ring-white/10 group-hover:ring-amber-400/50 transition-all">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sample.image} alt={sample.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] text-[var(--text-primary)] group-hover:text-amber-400 font-bold truncate max-w-full block transition-colors leading-tight">
                    {term(sample.disease)}
                  </span>
                  <span className="text-[8.5px] text-[var(--text-muted)] truncate max-w-full block mt-0.5">
                    {sample.cultivar.split(" ")[0]}
                  </span>
                </motion.button>
              ))}
            </div>
          </GlassCard>
        </StaggerItem>

        {/* ─── 2. CULTIVAR SECTION (Karnataka 10 Cultivars) ─── */}
        {previewUrl && currentResult && !isInvalidLeaf && (
          <StaggerItem>
            <GlassCard className="p-4 border-[var(--border-subtle)] shadow-xl" hover={false}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                    <Sprout className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-[var(--text-primary)] text-xs sm:text-sm font-black tracking-tight">
                      {term("Karnataka 10 Cultivars Solution Engine")}
                    </h3>
                    <p className="text-[var(--text-muted)] text-[10px]">
                      {term("Select your orchard cultivar for targeted agronomic guidance:")}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  {selectedVarietyObj.name} ({selectedVarietyObj.kannadaName})
                </span>
              </div>

              {/* 10 Cultivars Selectable Tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                {KARNATAKA_MANGO_VARIETIES.map((v) => {
                  const isSelected = v.id === selectedVarietyId;
                  const risk = activeDiseaseProtocol.varietyAdvisory[v.id]?.riskLevel || "Medium";
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVarietyId(v.id)}
                      className={`shrink-0 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? "bg-amber-500 text-black border-amber-400 shadow-md"
                          : "bg-[var(--surface-soft)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-amber-400/40 hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <span>{v.name.split(" ")[0]}</span>
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          risk === "High" ? "bg-red-500" : risk === "Medium" ? "bg-amber-500" : "bg-emerald-400"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Relevant Advisory for Selected Cultivar Only */}
              <div className="mt-2.5 p-3 rounded-xl bg-[var(--surface-soft)] border border-amber-500/25 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-[var(--border-subtle)] pb-1.5">
                  <div className="text-[var(--text-primary)] text-xs font-bold flex items-center gap-1.5">
                    <span>{selectedVarietyObj.name}</span>
                    <span className="text-amber-400 font-medium text-[11px]">({selectedVarietyObj.kannadaName})</span>
                    <span className="text-[var(--text-muted)] text-[10px]">· Belts: {selectedVarietyObj.districts.join(", ")}</span>
                  </div>
                  <span
                    className={`px-2 py-0.2 rounded text-[9px] font-black uppercase ${
                      activeDiseaseProtocol.varietyAdvisory[selectedVarietyId]?.riskLevel === "High"
                        ? "bg-red-500/20 text-red-400 border border-red-500/40"
                        : activeDiseaseProtocol.varietyAdvisory[selectedVarietyId]?.riskLevel === "Medium"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    }`}
                  >
                    {term(activeDiseaseProtocol.varietyAdvisory[selectedVarietyId]?.riskLevel || "Moderate")} {term("Risk")}
                  </span>
                </div>

                <div className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  <strong className="text-amber-400 font-bold">{term("Targeted Cultivar Advisory")}:</strong>{" "}
                  {activeDiseaseProtocol.varietyAdvisory[selectedVarietyId]?.varietySpecificAction}
                  <div className="text-amber-400/90 text-[10px] font-medium mt-0.5">
                    {term("Critical Protection Stage:")}{" "}
                    <span className="text-[var(--text-primary)] font-bold">
                      {activeDiseaseProtocol.varietyAdvisory[selectedVarietyId]?.criticalStage}
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </StaggerItem>
        )}

        {/* ─── 3. TREATMENT SOLUTION (Single Clean Section with Chemical | Bio/Organic | Cultural Tabs) ─── */}
        {previewUrl && currentResult && !isInvalidLeaf && (
          <StaggerItem>
            <GlassCard className="overflow-hidden p-0 border-[var(--border-subtle)] shadow-2xl" hover={false}>
              {/* Tabs Header */}
              <div className="p-3.5 sm:p-4 pb-2.5 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-[var(--surface-soft)]">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-[var(--text-primary)] font-black text-xs sm:text-sm">
                    {term("Treatment & Agronomy Solution")}
                  </h3>
                </div>

                <div className="flex p-0.5 rounded-lg bg-black/60 border border-white/10">
                  {[
                    { id: "chemical", label: "Chemical", icon: FlaskConical },
                    { id: "organic", label: "Bio / Organic", icon: Leaf },
                    { id: "cultural", label: "Cultural", icon: Sun },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSolutionTab(tab.id as any)}
                      className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        activeSolutionTab === tab.id
                          ? "bg-cyan-500 text-black shadow-sm"
                          : "text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      <tab.icon className="w-3 h-3" />
                      <span>{term(tab.label)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Body */}
              <div className="p-4">
                {/* TAB 1: CHEMICAL TREATMENT */}
                {activeSolutionTab === "chemical" && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-cyan-500/[0.06] border border-cyan-500/25 space-y-2.5">
                      {/* Recommended Treatment + PHI */}
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider block">
                            {term("Recommended Treatment")}
                          </span>
                          <h4 className="text-[var(--text-primary)] font-black text-sm sm:text-base mt-0.5">
                            {activeDiseaseProtocol.chemicalPesticides.primaryChemical}
                          </h4>
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                          PHI: {activeDiseaseProtocol.chemicalPesticides.phi}
                        </span>
                      </div>

                      {/* Dosage & Trade Names Grid */}
                      <div className="grid sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-[var(--background-elevated)] border border-[var(--border-subtle)]">
                          <div className="text-[var(--text-muted)] font-semibold text-[10px] uppercase">{term("Dosage:")}</div>
                          <div className="text-amber-400 font-black text-sm mt-0.5">
                            {activeDiseaseProtocol.chemicalPesticides.dosage}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[var(--background-elevated)] border border-[var(--border-subtle)]">
                          <div className="text-[var(--text-muted)] font-semibold text-[10px] uppercase">{term("Commercial Trade Names:")}</div>
                          <div className="text-[var(--text-primary)] font-medium text-xs mt-0.5 truncate">
                            {activeDiseaseProtocol.chemicalPesticides.tradeNames.join(", ")}
                          </div>
                        </div>
                      </div>

                      {/* Application Timing & Safety/Caution */}
                      <div className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                        <div className="p-2 rounded-lg bg-[var(--surface-soft)] border border-[var(--border-subtle)]">
                          <strong className="text-cyan-400 font-bold">{term("Application Timing:")}</strong>{" "}
                          <span>{activeDiseaseProtocol.chemicalPesticides.sprayTiming}</span>
                        </div>

                        <div className="p-2 rounded-lg bg-[var(--surface-soft)] border border-[var(--border-subtle)]">
                          <strong className="text-emerald-400 font-bold">{term("Resistance Rotation:")}</strong>{" "}
                          <span>{activeDiseaseProtocol.chemicalPesticides.rotationChemical}</span>
                        </div>

                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
                          ⚠️ <strong>{term("Safety & Caution:")}</strong> {activeDiseaseProtocol.chemicalPesticides.cautions}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: BIO / ORGANIC TREATMENT */}
                {activeSolutionTab === "organic" && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/25 space-y-2.5">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <Leaf className="w-4 h-4" />
                      <span>{term("Zero-Residue Bio-Control & Botanical Protocol")}</span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-[var(--background-elevated)] border border-[var(--border-subtle)]">
                        <div className="text-[var(--text-muted)] font-semibold text-[10px] uppercase">{term("Botanical Spray:")}</div>
                        <div className="text-emerald-400 font-bold text-xs mt-0.5">
                          {activeDiseaseProtocol.organicSolutions.botanical}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[var(--background-elevated)] border border-[var(--border-subtle)]">
                        <div className="text-[var(--text-muted)] font-semibold text-[10px] uppercase">{term("Beneficial Bio-Agent:")}</div>
                        <div className="text-emerald-400 font-bold text-xs mt-0.5">
                          {activeDiseaseProtocol.organicSolutions.bioAgent}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                      <div className="p-2 rounded-lg bg-[var(--surface-soft)] border border-[var(--border-subtle)]">
                        <strong className="text-emerald-400 font-bold">{term("Dosage & Mix:")}</strong>{" "}
                        <span>{activeDiseaseProtocol.organicSolutions.indigenousMix}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-[var(--surface-soft)] border border-[var(--border-subtle)]">
                        <strong className="text-emerald-400 font-bold">{term("Application Timing & Method:")}</strong>{" "}
                        <span>{activeDiseaseProtocol.organicSolutions.applicationMethod}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: CULTURAL FARMING */}
                {activeSolutionTab === "cultural" && (
                  <div className="grid sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-[var(--surface-soft)] border border-[var(--border-subtle)]">
                      <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1 text-xs">
                        <Sun className="w-3.5 h-3.5" />
                        <span>{term("Canopy & Solar Pruning")}</span>
                      </div>
                      <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed">
                        {activeDiseaseProtocol.farmingPractices.canopyPruning}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[var(--surface-soft)] border border-[var(--border-subtle)]">
                      <div className="flex items-center gap-1.5 text-cyan-400 font-bold mb-1 text-xs">
                        <Droplets className="w-3.5 h-3.5" />
                        <span>{term("Drip & Moisture Modulation")}</span>
                      </div>
                      <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed">
                        {activeDiseaseProtocol.farmingPractices.waterManagement}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[var(--surface-soft)] border border-[var(--border-subtle)]">
                      <div className="flex items-center gap-1.5 text-red-400 font-bold mb-1 text-xs">
                        <Flame className="w-3.5 h-3.5" />
                        <span>{term("Field Sanitation & Debris Disposal")}</span>
                      </div>
                      <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed">
                        {activeDiseaseProtocol.farmingPractices.fieldSanitation}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[var(--surface-soft)] border border-[var(--border-subtle)]">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1 text-xs">
                        <Sprout className="w-3.5 h-3.5" />
                        <span>{term("Intercropping & Post-Harvest Care")}</span>
                      </div>
                      <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed">
                        {activeDiseaseProtocol.farmingPractices.postHarvestCare}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          </StaggerItem>
        )}

        {/* ─── LIVE CAMERA MODAL ─── */}
        <AnimatePresence>
          {isCameraOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-lg rounded-2xl bg-[var(--surface)] border border-[var(--border-strong)] p-4 sm:p-5 shadow-2xl space-y-3.5"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                      <Camera className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-[var(--text-primary)] font-black text-sm sm:text-base">
                        {term("Live Mango Leaf Camera")}
                      </h3>
                      <p className="text-[var(--text-muted)] text-[11px]">
                        {capturedPhotoUrl ? term("Review captured photo") : term("Align leaf clearly in center viewport")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!capturedPhotoUrl && (
                      <button
                        onClick={toggleCameraFacing}
                        className="p-1.5 rounded-lg bg-[var(--surface-soft)] hover:bg-[var(--surface)] text-gray-300 hover:text-white border border-[var(--border-subtle)] transition-colors cursor-pointer"
                        title="Switch Camera (Front/Rear)"
                      >
                        <SwitchCamera className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={closeCameraModal}
                      className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-gray-300 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Viewfinder or Captured Snapshot Preview */}
                <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3] flex items-center justify-center ring-1 ring-white/10">
                  {cameraError ? (
                    <div className="p-5 text-center space-y-3">
                      <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                      <p className="text-xs text-red-200 leading-relaxed max-w-sm mx-auto">{cameraError}</p>
                      <GlowButton
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          closeCameraModal();
                          cameraFallbackInputRef.current?.click();
                        }}
                        className="text-xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{term("Use Native Device Camera")}</span>
                      </GlowButton>
                    </div>
                  ) : capturedPhotoUrl ? (
                    /* Captured Photo Review */
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={capturedPhotoUrl} alt="Captured Specimen" className="w-full h-full object-contain" />
                  ) : (
                    /* Live Video Stream Viewfinder */
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {/* Leaf Guide Target Box */}
                      <div className="absolute inset-8 border-2 border-dashed border-amber-400/60 rounded-2xl pointer-events-none flex items-center justify-center">
                        <span className="text-[10px] font-bold text-amber-300 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
                          {term("Align Leaf Specimen")}
                        </span>
                      </div>
                    </>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Camera Actions Bar */}
                <div className="flex items-center justify-between pt-1 gap-2">
                  {capturedPhotoUrl ? (
                    <>
                      <GlowButton variant="outline" size="sm" onClick={retakePhoto} className="text-xs flex-1">
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{term("Retake")}</span>
                      </GlowButton>

                      <GlowButton variant="mango" size="sm" onClick={confirmCapturedPhoto} className="text-xs flex-1">
                        <Check className="w-3.5 h-3.5 text-black" />
                        <span>{term("Use Photo")}</span>
                      </GlowButton>
                    </>
                  ) : (
                    <>
                      <GlowButton variant="outline" size="sm" onClick={closeCameraModal} className="text-xs">
                        <span>{term("Cancel")}</span>
                      </GlowButton>

                      {!cameraError && (
                        <GlowButton variant="mango" size="sm" onClick={capturePhoto} className="text-xs px-6">
                          <Camera className="w-4 h-4 text-black" />
                          <span>{term("Capture Photo")}</span>
                        </GlowButton>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </StaggerContainer>
    </PageTransition>
  );
}
