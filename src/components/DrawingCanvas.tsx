import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Eraser, Highlighter, PaintBucket, Pen, Trash2, Undo2 } from 'lucide-react';
import { MARKER_COLORS, type DrawStroke, type DrawTool, type Point, type SupportedLanguage } from '../../shared/gameData';
import { getUIText } from '../i18n/translations';
import { soundEngine } from '../utils/sound';

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 560;
const PAPER_BG = '#FCFBF7';

const BRUSH_SIZES = [
  { label: 'Fine', value: 4 },
  { label: 'Medium', value: 10 },
  { label: 'Bold', value: 20 },
  { label: 'Broad', value: 34 },
];

function hexToRgba(hex: string): [number, number, number, number] {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255, 255];
}

function floodFill(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillHex: string
) {
  const x0 = Math.floor(startX);
  const y0 = Math.floor(startY);
  if (x0 < 0 || y0 < 0 || x0 >= CANVAS_WIDTH || y0 >= CANVAS_HEIGHT) return;

  const img = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  const data = img.data;
  const startIdx = (y0 * CANVAS_WIDTH + x0) * 4;
  const targetR = data[startIdx];
  const targetG = data[startIdx + 1];
  const targetB = data[startIdx + 2];
  const targetA = data[startIdx + 3];

  const [fillR, fillG, fillB, fillA] = hexToRgba(fillHex);
  if (
    Math.abs(targetR - fillR) < 8 &&
    Math.abs(targetG - fillG) < 8 &&
    Math.abs(targetB - fillB) < 8 &&
    Math.abs(targetA - fillA) < 8
  ) {
    return;
  }

  const tolerance = 38;
  const matchesTarget = (idx: number) =>
    Math.abs(data[idx] - targetR) <= tolerance &&
    Math.abs(data[idx + 1] - targetG) <= tolerance &&
    Math.abs(data[idx + 2] - targetB) <= tolerance &&
    Math.abs(data[idx + 3] - targetA) <= tolerance;

  const visited = new Uint8Array(CANVAS_WIDTH * CANVAS_HEIGHT);
  const stack: number[] = [x0, y0];

  while (stack.length > 0) {
    const y = stack.pop()!;
    const x = stack.pop()!;
    let lx = x;

    while (lx >= 0 && !visited[y * CANVAS_WIDTH + lx] && matchesTarget((y * CANVAS_WIDTH + lx) * 4)) {
      lx--;
    }
    lx++;

    let spanAbove = false;
    let spanBelow = false;

    while (lx < CANVAS_WIDTH && !visited[y * CANVAS_WIDTH + lx] && matchesTarget((y * CANVAS_WIDTH + lx) * 4)) {
      const pIdx = y * CANVAS_WIDTH + lx;
      visited[pIdx] = 1;
      const dIdx = pIdx * 4;
      data[dIdx] = fillR;
      data[dIdx + 1] = fillG;
      data[dIdx + 2] = fillB;
      data[dIdx + 3] = fillA;

      if (y > 0) {
        const upIdx = (y - 1) * CANVAS_WIDTH + lx;
        const upMatch = !visited[upIdx] && matchesTarget(upIdx * 4);
        if (!spanAbove && upMatch) {
          stack.push(lx, y - 1);
          spanAbove = true;
        } else if (spanAbove && !upMatch) {
          spanAbove = false;
        }
      }

      if (y < CANVAS_HEIGHT - 1) {
        const downIdx = (y + 1) * CANVAS_WIDTH + lx;
        const downMatch = !visited[downIdx] && matchesTarget(downIdx * 4);
        if (!spanBelow && downMatch) {
          stack.push(lx, y + 1);
          spanBelow = true;
        } else if (spanBelow && !downMatch) {
          spanBelow = false;
        }
      }

      lx++;
    }
  }

  ctx.putImageData(img, 0, 0);
}

function renderStroke(ctx: CanvasRenderingContext2D, stroke: DrawStroke) {
  if (stroke.tool === 'fill') {
    const pt = stroke.points[0];
    if (pt) floodFill(ctx, pt.x, pt.y, stroke.color);
    return;
  }

  const pts = stroke.points;
  if (pts.length === 0) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = stroke.size;
  ctx.strokeStyle = stroke.tool === 'eraser' ? PAPER_BG : stroke.color;
  ctx.fillStyle = stroke.tool === 'eraser' ? PAPER_BG : stroke.color;
  ctx.globalAlpha = stroke.tool === 'highlighter' ? 0.34 : 1;

  if (pts.length === 1) {
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, stroke.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i++) {
    const midX = (pts[i].x + pts[i + 1].x) / 2;
    const midY = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
  ctx.restore();
}

interface DrawingCanvasProps {
  strokes: DrawStroke[];
  livePreviewStroke: DrawStroke | null;
  canDraw: boolean;
  language?: SupportedLanguage;
  onCommitStroke: (stroke: DrawStroke) => void;
  onPreviewStroke?: (stroke: DrawStroke) => void;
  onUndo: () => void;
  onClear: () => void;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  strokes,
  livePreviewStroke,
  canDraw,
  language = 'en',
  onCommitStroke,
  onPreviewStroke,
  onUndo,
  onClear,
}) => {
  const t = getUIText(language);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<DrawTool>('marker');
  const [color, setColor] = useState<string>(MARKER_COLORS[0]);
  const [brushSize, setBrushSize] = useState<number>(10);

  const isDrawingRef = useRef(false);
  const activeStrokeRef = useRef<DrawStroke | null>(null);
  const lastEmitRef = useRef(0);

  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.fillStyle = PAPER_BG;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (const s of strokes) {
      renderStroke(ctx, s);
    }
    if (livePreviewStroke) {
      renderStroke(ctx, livePreviewStroke);
    }
    if (activeStrokeRef.current) {
      renderStroke(ctx, activeStrokeRef.current);
    }
  }, [strokes, livePreviewStroke]);

  useEffect(() => {
    redrawAll();
  }, [redrawAll]);

  useEffect(() => {
    if (!canDraw) return;
    const handleKey = (e: KeyboardEvent) => {
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && key === 'z') {
        e.preventDefault();
        soundEngine.playClick();
        onUndo();
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (key === 'u') {
        e.preventDefault();
        soundEngine.playClick();
        onUndo();
      } else if (key === 'b') {
        setTool('marker');
      } else if (key === 'h') {
        setTool('highlighter');
      } else if (key === 'e') {
        setTool('eraser');
      } else if (key === 'g') {
        setTool('fill');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [canDraw, onUndo]);

  const getLogicalPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    return {
      x: Math.max(0, Math.min(CANVAS_WIDTH, Math.round(x * 10) / 10)),
      y: Math.max(0, Math.min(CANVAS_HEIGHT, Math.round(y * 10) / 10)),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canDraw) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = getLogicalPoint(e);

    if (tool === 'fill') {
      const fillStroke: DrawStroke = {
        id: `stk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        tool: 'fill',
        color,
        size: 1,
        points: [pt],
      };
      soundEngine.playClick();
      onCommitStroke(fillStroke);
      return;
    }

    isDrawingRef.current = true;
    activeStrokeRef.current = {
      id: `stk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      tool,
      color,
      size: tool === 'highlighter' ? Math.max(18, brushSize * 1.6) : brushSize,
      points: [pt],
    };
    soundEngine.playPenTouch(tool);
    redrawAll();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canDraw || !isDrawingRef.current || !activeStrokeRef.current) return;
    const pt = getLogicalPoint(e);
    const pts = activeStrokeRef.current.points;
    const prev = pts[pts.length - 1];
    const dist = Math.hypot(pt.x - prev.x, pt.y - prev.y);
    if (dist < 1.8) return;

    pts.push(pt);
    redrawAll();

    if (dist >= 2.2) {
      soundEngine.playDrawScratch(dist / 12, activeStrokeRef.current.tool);
    }

    const now = performance.now();
    if (onPreviewStroke && now - lastEmitRef.current > 45) {
      lastEmitRef.current = now;
      onPreviewStroke({
        ...activeStrokeRef.current,
        points: [...pts],
      });
    }
  };

  const finishStroke = () => {
    if (!isDrawingRef.current || !activeStrokeRef.current) return;
    isDrawingRef.current = false;
    const finished = activeStrokeRef.current;
    activeStrokeRef.current = null;
    onCommitStroke(finished);
    redrawAll();
  };

  return (
    <div className="flex flex-col gap-2.5 w-full">
      <div className="relative w-full aspect-[10/7] rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-[#FCFBF7]">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
          className={`w-full h-full block touch-none ${
            canDraw ? (tool === 'fill' ? 'cursor-cell' : 'cursor-crosshair') : 'cursor-default'
          }`}
        />
      </div>

      {canDraw && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#1D212B] border border-white/8">
          <div className="flex items-center gap-1.5 flex-wrap">
            {MARKER_COLORS.map((swatch) => {
              const active = color === swatch && tool !== 'eraser';
              return (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setColor(swatch);
                    if (tool === 'eraser') setTool('marker');
                  }}
                  aria-label={`Select color ${swatch}`}
                  className={`w-6 h-6 rounded-md transition-transform focus-visible:outline-2 focus-visible:outline-[#FF5A36] ${
                    active ? 'scale-115 ring-2 ring-white ring-offset-2 ring-offset-[#1D212B]' : 'hover:scale-105'
                  }`}
                  style={{
                    backgroundColor: swatch,
                    border: swatch === PAPER_BG ? '1px solid rgba(24,26,32,0.3)' : '1px solid rgba(255,255,255,0.12)',
                  }}
                />
              );
            })}
          </div>

          <div className="flex items-center gap-1 bg-[#14171F] p-1 rounded-lg">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setTool('marker');
              }}
              title={`${t.canvas.pen} (B)`}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                tool === 'marker' ? 'bg-[#FF5A36] text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Pen className="w-3.5 h-3.5" />
              <span>{t.canvas.pen}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setTool('highlighter');
              }}
              title={`${t.canvas.mark} (H)`}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                tool === 'highlighter' ? 'bg-[#FF5A36] text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Highlighter className="w-3.5 h-3.5" />
              <span>{t.canvas.mark}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setTool('fill');
              }}
              title={`${t.canvas.fill} (G)`}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                tool === 'fill' ? 'bg-[#FF5A36] text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              <PaintBucket className="w-3.5 h-3.5" />
              <span>{t.canvas.fill}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setTool('eraser');
              }}
              title={`${t.canvas.erase} (E)`}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                tool === 'eraser' ? 'bg-[#FF5A36] text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>{t.canvas.erase}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-[#14171F] p-1 rounded-lg">
              {BRUSH_SIZES.map((b) => (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setBrushSize(b.value);
                  }}
                  title={`${b.label} ${t.canvas.sizeSuffix}`}
                  className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
                    brushSize === b.value ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span
                    className="rounded-full bg-current block"
                    style={{ width: Math.min(18, Math.max(4, b.value * 0.52)), height: Math.min(18, Math.max(4, b.value * 0.52)) }}
                  />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onUndo();
              }}
              title={`${t.canvas.undo} (U / Ctrl+Z)`}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#14171F] text-slate-300 hover:text-white text-xs font-medium whitespace-nowrap shrink-0 transition-colors"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>{t.canvas.undo}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onClear();
              }}
              title={t.canvas.clear}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#14171F] text-slate-300 hover:text-rose-400 text-xs font-medium whitespace-nowrap shrink-0 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.canvas.clear}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
