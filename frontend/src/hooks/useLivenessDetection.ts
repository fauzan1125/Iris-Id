"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export type LivenessStep = "INITIAL" | "FACE_ALIGNED" | "BLINK_OR_SMILE" | "VERIFIED";

export function useLivenessDetection(videoRef: React.RefObject<HTMLVideoElement>) {
  const [step, setStep] = useState<LivenessStep>("INITIAL");
  const [instruction, setInstruction] = useState<string>("Posisikan wajah Anda di dalam lingkaran panduan.");
  const [progress, setProgress] = useState<number>(15);
  const [isLive, setIsLive] = useState<boolean>(false);

  const prevFrameData = useRef<ImageData | null>(null);
  const diffAccumulator = useRef<number>(0);
  const animationFrameId = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const checkLivenessFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState !== 4) {
      animationFrameId.current = requestAnimationFrame(checkLivenessFrame);
      return;
    }

    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
      canvasRef.current.width = 160;
      canvasRef.current.height = 120;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (prevFrameData.current) {
      const prev = prevFrameData.current.data;
      const curr = currentFrame.data;
      let frameDiff = 0;
      let skinPixels = 0;

      // Sample pixels to measure micro-movement and presence
      for (let i = 0; i < curr.length; i += 16) {
        const r = curr[i];
        const g = curr[i + 1];
        const b = curr[i + 2];
        const rDiff = Math.abs(r - prev[i]);
        const gDiff = Math.abs(g - prev[i + 1]);
        const bDiff = Math.abs(b - prev[i + 2]);
        frameDiff += (rDiff + gDiff + bDiff);

        // Simple skin tone approximation (YCbCr / RGB check)
        if (r > 60 && g > 40 && b > 20 && r > g && r > b) {
          skinPixels++;
        }
      }

      const hasFacePresence = skinPixels > 200;

      if (!hasFacePresence) {
        setStep("INITIAL");
        setInstruction("Wajah tidak terdeteksi. Posisikan wajah di dalam frame.");
        setProgress(20);
        setIsLive(false);
      } else {
        // Face is detected
        if (step === "INITIAL") {
          setStep("FACE_ALIGNED");
          setInstruction("Wajah terdeteksi. Silakan kedipkan mata atau gerakkan kepala sedikit.");
          setProgress(50);
        } else if (step === "FACE_ALIGNED" || step === "BLINK_OR_SMILE") {
          // Accumulate natural micro-motion (blinks, natural head sway)
          if (frameDiff > 3000 && frameDiff < 40000) {
            diffAccumulator.current += 1;
            setProgress((prev) => Math.min(95, prev + 5));

            if (diffAccumulator.current > 6) {
              setStep("VERIFIED");
              setInstruction("✅ Liveness Terverifikasi!");
              setProgress(100);
              setIsLive(true);
            }
          }
        }
      }
    }

    prevFrameData.current = currentFrame;

    if (!isLive) {
      animationFrameId.current = requestAnimationFrame(checkLivenessFrame);
    }
  }, [videoRef, step, isLive]);

  const resetLiveness = useCallback(() => {
    diffAccumulator.current = 0;
    prevFrameData.current = null;
    setIsLive(false);
    setStep("INITIAL");
    setInstruction("Posisikan wajah Anda di dalam lingkaran panduan.");
    setProgress(15);
  }, []);

  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(checkLivenessFrame);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [checkLivenessFrame]);

  return {
    step,
    instruction,
    progress,
    isLive,
    resetLiveness,
  };
}
