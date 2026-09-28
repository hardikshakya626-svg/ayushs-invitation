import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

export interface EnvelopeCanvasRef {
  startOpening: () => void;
  replay: () => void;
}

interface EnvelopeCanvasProps {
  onOpened?: () => void;
  onReady?: () => void;
  onWatermarkPos?: (pos: { x: number; y: number }) => void;
  className?: string;
}

const TOTAL_FRAMES = 300;
const FPS = 30;
const FRAME_PREFIX = '/frames/frame_';
const FRAME_EXT = '.webp';
const LOOP_START = 214; // Lavender floral background start (envelope cut out)
const LOOP_END = 299;   // Lavender floral background end
const CUSHION = 10;     // Turnaround easing frames

function getFrameUrl(index: number): string {
  return `${FRAME_PREFIX}${String(index).padStart(5, '0')}${FRAME_EXT}`;
}

export const EnvelopeCanvas = forwardRef<EnvelopeCanvasRef, EnvelopeCanvasProps>(
  ({ onOpened, onReady, onWatermarkPos, className }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const stateRef = useRef<'ready' | 'opening' | 'looping'>('ready');
    const currentFrameRef = useRef<number>(0);
    const loopFramePosRef = useRef<number>(214);
    const loopDirectionRef = useRef<number>(1);
    const lastFrameTimeRef = useRef<number>(0);
    const rafIdRef = useRef<number | null>(null);

    const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
    const loadedRef = useRef<boolean[]>(new Array(TOTAL_FRAMES).fill(false));
    const loadingRef = useRef<boolean[]>(new Array(TOTAL_FRAMES).fill(false));
    const onOpenedTriggeredRef = useRef<boolean>(false);
    const memoryCleanedRef = useRef<boolean>(false);

    // Render frame to canvas with centered aspect fit
    const renderFrame = (img: HTMLImageElement) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.naturalWidth || 540;
      const ih = img.naturalHeight || 960;

      const idx = currentFrameRef.current;

      // Dark background matching website palette
      ctx.fillStyle = '#0d060e';
      ctx.fillRect(0, 0, cw, ch);

      // Centered aspect cover: edge-to-edge coverage with no gaps
      const scale = Math.max(cw / iw, ch / ih);
      const dw = Math.round(iw * scale);
      const dh = Math.round(ih * scale);
      const dx = Math.round((cw - dw) / 2);
      const dy = Math.round((ch - dh) / 2);

      try {
        ctx.drawImage(img, dx, dy, dw, dh);

        // Seamlessly blend out Gemini watermark directly on canvas buffer
        const starX = dx + Math.round(449.3 * scale);
        const starY = dy + Math.round(868.2 * scale);
        const starRadius = Math.round(20 * scale);
        ctx.save();
        ctx.beginPath();
        ctx.arc(starX, starY, starRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, dx - Math.round(28 * scale), dy, dw, dh);
        ctx.restore();
      } catch {
        // Safe fallback for transient frame states in WebKit
      }
    };

    const renderCurrentFrame = () => {
      const idx = currentFrameRef.current;
      let img = imagesRef.current[idx];

      // Fallback to nearest loaded frame
      if (!img || !img.complete || img.naturalWidth === 0) {
        let nearest = -1;
        let minDiff = Infinity;
        for (let i = 0; i < TOTAL_FRAMES; i++) {
          const cand = imagesRef.current[i];
          if (loadedRef.current[i] && cand && cand.naturalWidth > 0) {
            const diff = Math.abs(i - idx);
            if (diff < minDiff) {
              minDiff = diff;
              nearest = i;
            }
          }
        }
        if (nearest !== -1) {
          img = imagesRef.current[nearest];
        } else {
          return;
        }
      }

      if (img) {
        renderFrame(img);
      }
    };

    // Animation Loop
    const animationLoop = (timestamp: number) => {
      if (stateRef.current !== 'opening' && stateRef.current !== 'looping') return;

      const elapsed = timestamp - lastFrameTimeRef.current;
      const frameInterval = 1000 / FPS;

      if (elapsed >= frameInterval) {
        lastFrameTimeRef.current = timestamp - (elapsed % frameInterval);

        if (stateRef.current === 'opening') {
          const nextFrame = currentFrameRef.current + 1;

          // Smooth pacing: only advance if next frame is loaded to prevent stuttering
          if (loadedRef.current[nextFrame] || nextFrame >= LOOP_START) {
            currentFrameRef.current = nextFrame;
          } else {
            loadSingleFrame(nextFrame);
          }

          // Buffer ahead smoothly
          if (nextFrame + 8 < TOTAL_FRAMES && !loadedRef.current[nextFrame + 8]) {
            loadSingleFrame(nextFrame + 8);
          }

          // Dynamic memory deallocation: keep Safari tab memory under 40MB
          // Once a frame has played during opening, release it from memory (except frame 0)
          if (nextFrame > 15) {
            const purgeIdx = nextFrame - 10;
            if (purgeIdx > 0 && purgeIdx < LOOP_START && imagesRef.current[purgeIdx]) {
              imagesRef.current[purgeIdx] = null;
              loadedRef.current[purgeIdx] = false;
            }
          }

          // Transition complete -> trigger reveal callback ONLY when envelope has fully opened into the hero garden
          if (currentFrameRef.current >= 218 && !onOpenedTriggeredRef.current) {
            onOpenedTriggeredRef.current = true;
            if (onOpened) onOpened();
          }

          if (currentFrameRef.current >= LOOP_END) {
            currentFrameRef.current = LOOP_END;
            loopFramePosRef.current = LOOP_END;
            loopDirectionRef.current = -1; // smoothly reverse
            stateRef.current = 'looping';
          }
        } else if (stateRef.current === 'looping') {
          // Release opening envelope frames to keep Safari/iOS memory footprint minimal
          if (!memoryCleanedRef.current) {
            memoryCleanedRef.current = true;
            for (let i = 1; i < LOOP_START - 1; i++) {
              imagesRef.current[i] = null;
              loadedRef.current[i] = false;
            }
          }

          // Smooth back-and-forth ping-pong with gentle turnaround easing
          const distToTurn =
            loopDirectionRef.current === 1
              ? LOOP_END - loopFramePosRef.current
              : loopFramePosRef.current - LOOP_START;

          let speedFactor = 1.0;
          if (distToTurn < CUSHION) {
            speedFactor = Math.max(0.25, Math.sin((distToTurn / CUSHION) * (Math.PI / 2)));
          }

          loopFramePosRef.current += loopDirectionRef.current * speedFactor;

          if (loopFramePosRef.current >= LOOP_END) {
            loopFramePosRef.current = LOOP_END;
            loopDirectionRef.current = -1; // reverse toward LOOP_START
          } else if (loopFramePosRef.current <= LOOP_START) {
            loopFramePosRef.current = LOOP_START;
            loopDirectionRef.current = 1; // reverse toward LOOP_END (never enters envelope < LOOP_START)
          }

          currentFrameRef.current = Math.round(loopFramePosRef.current);
        }

        renderCurrentFrame();
      }

      rafIdRef.current = requestAnimationFrame(animationLoop);
    };

    const lastWidthRef = useRef<number>(0);
    const lastHeightRef = useRef<number>(0);

    // Resize canvas to match display size & device pixel ratio
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const parent = canvas.parentElement;
      const rect = parent
        ? parent.getBoundingClientRect()
        : { width: window.innerWidth, height: window.innerHeight };

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(rect.width || window.innerWidth);
      const h = Math.round(rect.height || window.innerHeight);

      if (w <= 0 || h <= 0) return;

      // Lock canvas dimensions on scroll:
      // If width hasn't changed (no device rotation) and height change is just address bar collapse (< 160px),
      // keep the canvas completely still and do not resize!
      if (
        lastWidthRef.current !== 0 &&
        Math.abs(w - lastWidthRef.current) < 4 &&
        Math.abs(h - lastHeightRef.current) < 160
      ) {
        return;
      }

      lastWidthRef.current = w;
      lastHeightRef.current = h;

      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);

      // Report exact watermark CSS pixel position to parent
      if (onWatermarkPos) {
        const iw = 540;
        const ih = 960;
        const scale = Math.max(w / iw, h / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        const dx = (w - dw) / 2;
        const dy = (h - dh) / 2;
        const wx = dx + 449.3 * scale;
        const wy = dy + 868.2 * scale;
        // Clamp to safe viewport area so button is always visible inside the screen
        const safeX = Math.max(28, Math.min(w - 28, wx));
        const safeY = Math.max(28, Math.min(h - 28, wy));
        onWatermarkPos({ x: Math.round(safeX), y: Math.round(safeY) });
      }

      const ctx = canvas.getContext('2d', { alpha: false });
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium'; // Far less GPU overhead on mobile than 'high'
      }

      renderCurrentFrame();
    };

    // Preload helper compatible with Safari WebKit with off-thread decode
    const loadSingleFrame = (index: number): Promise<void> => {
      if (index < 0 || index >= TOTAL_FRAMES) return Promise.resolve();
      if ((imagesRef.current[index] && loadedRef.current[index]) || loadingRef.current[index]) {
        return Promise.resolve();
      }
      loadingRef.current[index] = true;
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = async () => {
          if ('decode' in img) {
            try {
              await img.decode();
            } catch {
              // Ignore decode cancellation or fallback
            }
          }
          imagesRef.current[index] = img;
          loadedRef.current[index] = true;
          loadingRef.current[index] = false;
          if (index === 0 && currentFrameRef.current === 0) {
            renderCurrentFrame();
          }
          resolve();
        };
        img.onerror = () => {
          loadingRef.current[index] = false;
          resolve();
        };
        img.src = getFrameUrl(index);
      });
    };

    const preloadOpeningFrames = async () => {
      const queue: number[] = [];
      for (let i = 0; i <= Math.min(40, LOOP_START); i++) {
        if (!loadedRef.current[i]) queue.push(i);
      }
      let qIdx = 0;
      const worker = async () => {
        while (qIdx < queue.length) {
          const idx = queue[qIdx++];
          await loadSingleFrame(idx);
        }
      };
      await Promise.all(Array.from({ length: 15 }, () => worker()));
    };

    // Imperative methods for parent
    useImperativeHandle(ref, () => ({
      startOpening: () => {
        if (stateRef.current === 'ready') {
          stateRef.current = 'opening';
          currentFrameRef.current = 0;
          lastFrameTimeRef.current = performance.now();
          if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = requestAnimationFrame(animationLoop);
        }
      },
      replay: () => {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        stateRef.current = 'ready';
        currentFrameRef.current = 0;
        loopFramePosRef.current = 0;
        loopDirectionRef.current = 1;
        onOpenedTriggeredRef.current = false;
        memoryCleanedRef.current = false;
        renderCurrentFrame();
        preloadOpeningFrames();
      }
    }));

    useEffect(() => {
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      window.addEventListener('orientationchange', resizeCanvas);

      const preloadAll = async () => {
        // Priority 1: Frame 0 (instant first paint of closed envelope)
        await loadSingleFrame(0);
        renderCurrentFrame();
        if (onReady) {
          onReady();
        }

        // Priority 2: Initial buffer of opening frames (1 to 35) with concurrency 3
        const initialBuffer: number[] = [];
        for (let i = 1; i <= Math.min(35, LOOP_START); i++) {
          initialBuffer.push(i);
        }
        let bIdx = 0;
        const bufferWorker = async () => {
          while (bIdx < initialBuffer.length) {
            const idx = initialBuffer[bIdx++];
            await loadSingleFrame(idx);
          }
        };
        await Promise.all(Array.from({ length: 15 }, () => bufferWorker()));

        // Priority 3: Remaining opening frames (36 to 214) buffered in background with concurrency 15
        const remainingOpening: number[] = [];
        for (let i = 36; i <= LOOP_START; i++) {
          remainingOpening.push(i);
        }
        let rIdx = 0;
        const remainingWorker = async () => {
          while (rIdx < remainingOpening.length) {
            const idx = remainingOpening[rIdx++];
            await loadSingleFrame(idx);
          }
        };
        Promise.all(Array.from({ length: 15 }, () => remainingWorker())).then(() => {
          // Priority 4: Garden loop frames (215 to 299)
          const loopFrames: number[] = [];
          for (let i = LOOP_START + 1; i < TOTAL_FRAMES; i++) {
            loopFrames.push(i);
          }
          let lIdx = 0;
          const loopWorker = async () => {
            while (lIdx < loopFrames.length) {
              const idx = loopFrames[lIdx++];
              await loadSingleFrame(idx);
            }
          };
          Promise.all(Array.from({ length: 10 }, () => loopWorker()));
        });
      };

      preloadAll();

      return () => {
        window.removeEventListener('resize', resizeCanvas);
        window.removeEventListener('orientationchange', resizeCanvas);
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full pointer-events-none z-0 ${className || ''}`}
        style={{
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          willChange: 'transform'
        }}
      />
    );
  }
);

EnvelopeCanvas.displayName = 'EnvelopeCanvas';
