"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/* ===================== TYPES & CONSTANTS ===================== */

type PhotoCaptureFieldProps = {
  value: string | null;
  onChange: (val: string | null) => void;
};

const POSES = [
  { id: 1, label: "Pose 1", imageSrc: "/icon/pose1.svg" },
  { id: 2, label: "Pose 2", imageSrc: "/icon/pose2.svg" },
  { id: 3, label: "Pose 3", imageSrc: "/icon/pose3.svg" },
] as const;

type Phase = "poses" | "countdown" | "captured";

type NormalizedLandmark = { x: number; y: number; z?: number };

type HandsResults = {
  multiHandLandmarks?: NormalizedLandmark[][];
  image?: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;
};

type HandsInstance = {
  setOptions: (options: Record<string, unknown>) => void;
  onResults: (callback: (results: HandsResults) => void) => void;
  close: () => void;
  send: (input: {
    image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;
  }) => Promise<void>;
};

type CameraInstance = {
  start: () => void;
  stop: () => void;
};

type CameraConstructor = new (
  videoElement: HTMLVideoElement,
  config: {
    onFrame: () => Promise<void> | void;
    width?: number;
    height?: number;
  }
) => CameraInstance;

type HandsConstructor = new (config: {
  locateFile: (file: string) => string;
}) => HandsInstance;

/* ===================== ROOT FIELD ===================== */

export default function PhotoCaptureField({
  value,
  onChange,
}: PhotoCaptureFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="h-32 w-32 rounded-full overflow-hidden border-2 border-gray-200 bg-cyan-100">
        {value ? (
          <Image
            src={value}
            alt="Profile photo"
            width={128}
            height={128}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-xs text-gray-500">
            No photo
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-1 text-sm hover:bg-gray-50 text-[#1D1F20]"
      >
        <Image src="/icon/leading.svg" alt="Leading" width={16} height={16} />
        Take a Picture
      </button>

      {open && (
        <PhotoCaptureModal
          onClose={() => setOpen(false)}
          onSubmit={(photo) => {
            onChange(photo);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

/* ===================== MODAL ===================== */

type PhotoCaptureModalProps = {
  onClose: () => void;
  onSubmit: (photo: string) => void;
};

function PhotoCaptureModal({ onClose, onSubmit }: PhotoCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [phase, setPhase] = useState<Phase>("poses");
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [poseStatus, setPoseStatus] = useState<"idle" | "ok" | "undetected">(
    "idle"
  );
  const [countdown, setCountdown] = useState(3);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const poseTimeoutRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // refs untuk menghindari stale closure di callback Mediapipe
  const phaseRef = useRef<Phase>("poses");
  const poseIndexRef = useRef(0);
  const errorRef = useRef<string | null>(null);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    poseIndexRef.current = currentPoseIndex;
  }, [currentPoseIndex]);

  useEffect(() => {
    errorRef.current = error;
  }, [error]);

  /* ==== INIT CAMERA + MEDIAPIPE HANDS ==== */
  useEffect(() => {
    let hands: HandsInstance | null = null;
    let cameraInstance: CameraInstance | null = null;
    let active = true;

    async function start() {
      try {
        const [handsModule, cameraUtils] = await Promise.all([
          import("@mediapipe/hands"),
          import("@mediapipe/camera_utils"),
        ]);

        const HandsCtor = handsModule.Hands as unknown as HandsConstructor;
        const CameraCtor = cameraUtils.Camera as unknown as CameraConstructor;

        hands = new HandsCtor({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          selfieMode: false,
          maxNumHands: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.6,
          modelComplexity: 1,
        });

        hands.onResults((results: HandsResults) => {
          if (!active) return;
          handleResults(results);
        });

        const video = videoRef.current;
        if (!video) return;

        if (!navigator.mediaDevices?.getUserMedia) {
          setError(
            "Browser kamu tidak mendukung akses kamera. Coba gunakan Chrome/Edge terbaru."
          );
          setPoseStatus("undetected");
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });

        mediaStreamRef.current = stream;
        video.srcObject = stream;

        try {
          await video.play();
        } catch {
          // AbortError dsb → bisa diabaikan, kamera tetap jalan
        }

        setError(null);

        cameraInstance = new CameraCtor(video, {
          onFrame: async () => {
            if (!active) return;
            await hands?.send({ image: video });
          },
          width: 960,
          height: 720,
        });

        cameraInstance.start();
      } catch (err: unknown) {
        console.warn("Camera / hands error", err);
        let msg = "Kamera tidak bisa diakses.";

        const e = err as { name?: string };
        if (e.name === "NotAllowedError") {
          msg =
            "Akses kamera ditolak. Izinkan kamera di browser lalu buka ulang modal ini.";
        } else if (e.name === "NotFoundError") {
          msg =
            "Tidak ada kamera yang ditemukan. Pastikan perangkat kameranya tersedia.";
        }

        setError(msg);
        setPoseStatus("undetected");
      }
    }

    start();

    return () => {
      active = false;
      if (poseTimeoutRef.current !== null) {
        window.clearTimeout(poseTimeoutRef.current);
        poseTimeoutRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      try {
        cameraInstance?.stop();
        hands?.close();
      } catch {
        // ignore
      }
    };
  }, []);

  /* ==== HANDLE HAND LANDMARKS ==== */
  function handleResults(results: HandsResults) {
    const overlay = overlayCanvasRef.current;
    const video = videoRef.current;

    let isValidPose = false;

    // 👉 const, dan nggak usah pakai hasLandmarks
    const landmarks = results.multiHandLandmarks?.[0];

    const currentPhase = phaseRef.current;
    const currentError = errorRef.current;
    const poseIndex = poseIndexRef.current;

    if (landmarks && currentPhase !== "captured" && !currentError) {
      const poseNumber = classifyPoseHeuristic(landmarks);
      const expectedPoseId = POSES[poseIndex].id;

      if (process.env.NODE_ENV === "development") {
        console.log("runtime pose", {
          expected: expectedPoseId,
          poseNumber,
        });
      }

      if (currentPhase === "poses" && poseNumber === expectedPoseId) {
        isValidPose = true;
        setPoseStatus("ok");

        if (poseTimeoutRef.current === null) {
          poseTimeoutRef.current = window.setTimeout(() => {
            setCurrentPoseIndex((idx) => {
              const isLast = idx >= POSES.length - 1;
              if (isLast) {
                setPhase("countdown");
                setCountdown(3);
                return idx;
              }
              return idx + 1;
            });

            if (poseTimeoutRef.current !== null) {
              window.clearTimeout(poseTimeoutRef.current);
              poseTimeoutRef.current = null;
            }
          }, 800);
        }
      } else {
        setPoseStatus("undetected");
        if (poseTimeoutRef.current !== null) {
          window.clearTimeout(poseTimeoutRef.current);
          poseTimeoutRef.current = null;
        }
      }
    } else {
      setPoseStatus("undetected");
      if (poseTimeoutRef.current !== null) {
        window.clearTimeout(poseTimeoutRef.current);
        poseTimeoutRef.current = null;
      }
    }

    if (overlay && video) {
      const ctx = overlay.getContext("2d");
      if (!ctx) return;

      const w = video.videoWidth || overlay.width;
      const h = video.videoHeight || overlay.height;

      if (w && h && (overlay.width !== w || overlay.height !== h)) {
        overlay.width = w;
        overlay.height = h;
      }

      ctx.clearRect(0, 0, overlay.width, overlay.height);

      if (landmarks) {
        drawHandBoundingBox(ctx, landmarks, overlay.width, overlay.height, {
          valid: isValidPose,
        });
      }
    }
  }

  useEffect(() => {
    if (phase !== "countdown") return;

    const interval = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          window.clearInterval(interval);
          captureFrame();
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [phase]);

  function captureFrame() {
    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedPhoto(dataUrl);
    setPhase("captured");

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  }

  function handleRetake() {
    window.location.reload();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <div className="relative w-full max-w-[641px] rounded-2xl bg-white shadow-xl">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-[#1D1F20]">
              Raise Your Hand to Capture
            </h2>
            <p className="text-xs text-gray-500">
              We&apos;ll take the photo once your hand pose is detected.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full text-lg p-1 text-[#1D1F20] hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="px-6 pb-5 pt-4">
          <div className="relative mb-4 overflow-hidden rounded-xl bg-black">
            {/* video / captured image */}
            {phase === "captured" && capturedPhoto ? (
              <Image
                src={capturedPhoto}
                alt="Captured"
                width={960}
                height={720}
                className="w-full object-cover"
              />
            ) : (
              <video
                ref={videoRef}
                className="w-full object-cover"
                autoPlay
                playsInline
                muted
              />
            )}

            {/* overlay canvas untuk kotak tracking */}
            {phase !== "captured" && (
              <canvas
                ref={overlayCanvasRef}
                className="pointer-events-none absolute inset-0 w-full h-full"
              />
            )}

            {/* label pose / status */}
            {phase !== "captured" && !error && (
              <>
                <div className="absolute left-4 top-4 rounded-md bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-white">
                  {POSES[currentPoseIndex].label}
                </div>
                <div className="absolute right-4 top-4 rounded-md bg-black/60 px-3 py-1 text-xs text-white">
                  {phase === "countdown"
                    ? `Capturing photo in ${countdown}…`
                    : poseStatus === "ok"
                    ? "Pose detected"
                    : poseStatus === "undetected"
                    ? "Hand pose not detected"
                    : "Raise your hand"}
                </div>
              </>
            )}

            {/* ERROR MESSAGE */}
            {error && (
              <div className="absolute inset-x-4 top-4 rounded-md bg-red-600/90 px-3 py-2 text-xs font-semibold text-white">
                {error}
              </div>
            )}

            {/* COUNTDOWN BIG NUMBER */}
            {phase === "countdown" && !error && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-7xl font-bold text-white/90 drop-shadow-lg">
                {countdown}
              </div>
            )}
          </div>

          {/* INSTRUCTION */}
          <p className="mb-3 text-xs text-[#1D1F20] font-normal">
            To take a picture, follow the hand poses in the order shown below.
            The system will automatically capture the image once the final pose
            is detected.
          </p>

          {/* STEP POSES (bawah) */}
          <div className="flex items-center justify-center gap-3">
            {POSES.map((p, idx) => {
              const active = idx === currentPoseIndex && phase !== "captured";
              const done = idx < currentPoseIndex || phase === "captured";
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-md border-2 text-xs ${
                      done
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : active
                        ? "border-[#01959F] bg-[#F1FAFB] text-[#01959F]"
                        : "border-gray-200 bg-gray-50 text-gray-400"
                    }`}
                  >
                    <Image
                      src={p.imageSrc}
                      alt={p.label}
                      width={56}
                      height={56}
                      className="h-14 w-14 object-contain"
                    />
                    {/* teks kecil untuk aksesibilitas / debugging */}
                    <span className="sr-only">{p.label}</span>
                  </div>
                  {idx < POSES.length - 1 && (
                    <span className="-rotate-90 text-gray-900">
                      <svg
                        width="25"
                        height="25"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 8 10 12 14 8" />
                      </svg>
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* FOOTER BUTTONS */}
          <div className="mt-5 flex items-center justify-end gap-2">
            {phase === "captured" && capturedPhoto && (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Retake photo
                </button>
                <button
                  type="button"
                  onClick={() => onSubmit(capturedPhoto)}
                  className="rounded-lg bg-[#01959F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#017A83]"
                >
                  Submit photo
                </button>
              </>
            )}
          </div>
        </div>

        {/* canvas hidden khusus capture final */}
        <canvas ref={captureCanvasRef} className="hidden" />
      </div>
    </div>
  );
}

/* ===================== HEURISTIC TANPA LABEL ===================== */

function isFingerExtended(
  landmarks: NormalizedLandmark[],
  tipIndex: number,
  pipIndex: number,
  mcpIndex: number
): boolean {
  const tip = landmarks[tipIndex];
  const pip = landmarks[pipIndex];
  const mcp = landmarks[mcpIndex];

  const DELTA = 0.06; 

  const tipAbovePip = tip.y < pip.y - DELTA;
  const tipAboveMcp = tip.y < mcp.y - DELTA;

  return tipAbovePip && tipAboveMcp;
}

function getFingerStates(landmarks: NormalizedLandmark[]) {
  const indexExtended = isFingerExtended(landmarks, 8, 6, 5); // index
  const middleExtended = isFingerExtended(landmarks, 12, 10, 9); // middle
  const ringExtended = isFingerExtended(landmarks, 16, 14, 13); // ring
  const pinkyExtended = isFingerExtended(landmarks, 20, 18, 17); // pinky

  return { indexExtended, middleExtended, ringExtended, pinkyExtended };
}

function classifyPoseHeuristic(landmarks: NormalizedLandmark[]): number | null {
  const { indexExtended, middleExtended, ringExtended, pinkyExtended } =
    getFingerStates(landmarks);

  if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    return 1;
  }

  if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
    return 2;
  }

  if (indexExtended && middleExtended && ringExtended && !pinkyExtended) {
    return 3;
  }

  return null;
}

/* ===================== DRAW BOUNDING BOX ===================== */

type CanvasCtxWithRoundRect = CanvasRenderingContext2D & {
  roundRect?: (
    x: number,
    y: number,
    width: number,
    height: number,
    radius?: number | number[]
  ) => void;
};

function drawHandBoundingBox(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number,
  opts: { valid: boolean }
) {
  const xs = landmarks.map((p) => p.x * width);
  const ys = landmarks.map((p) => p.y * height);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const padding = 20;

  const x = Math.max(0, minX - padding);
  const y = Math.max(0, minY - padding);
  const w = Math.min(width - x, maxX - minX + padding * 2);
  const h = Math.min(height - y, maxY - minY + padding * 2);

  const ctxRR = ctx as CanvasCtxWithRoundRect;

  ctx.save();
  ctx.lineWidth = 4;
  ctx.strokeStyle = opts.valid ? "#22c55e" : "#ef4444";

  ctx.beginPath();
  if (ctxRR.roundRect) {
    ctxRR.roundRect(x, y, w, h, 12);
  } else {
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
  }
  ctx.stroke();
  ctx.restore();
}
