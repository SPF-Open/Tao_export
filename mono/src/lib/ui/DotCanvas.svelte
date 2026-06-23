<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    /** Spacing between dots in px. */
    gap?: number;
    /** Base dot radius in px. */
    radius?: number;
    /** Radius of the mouse glow falloff in px. */
    glow?: number;
    /** Whether the grid reacts to the mouse. */
    interactive?: boolean;
    /** Draw faint constellation links between active dots near the cursor. */
    links?: boolean;
    /** Slow ambient shimmer so the grid breathes even without the mouse. */
    ambient?: boolean;
    /** Expanding ripple pulse on click/tap. */
    ripple?: boolean;
  }

  let {
    gap = 10,
    radius = 1,
    glow = 70,
    interactive = true,
    links = true,
    ambient = true,
    ripple = true,
  }: Props = $props();

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const ctx = canvas.getContext('2d')!;
    const mouse = { x: -9999, y: -9999 };
    let raf = 0;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ambientOn = ambient && !reduce;
    const rippleOn = ripple && !reduce;

    // Active click ripples: each expands outward then fades.
    type Ripple = { x: number; y: number; t0: number };
    let ripples: Ripple[] = [];
    const RIPPLE_SPEED = 0.45; // px per ms
    const RIPPLE_LIFE = 900; // ms
    const RIPPLE_BAND = 60; // px — thickness of the bright ring

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    function draw(now: number) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isDark = document.documentElement.classList.contains('dark');
      // light: indigo brand | dark: emerald brand — matches --brand token.
      const [cr, cg, cb] = isDark ? [52, 211, 153] : [99, 102, 241];

      const cols = Math.ceil(canvas.width / gap) + 1;
      const rows = Math.ceil(canvas.height / gap) + 1;

      // Drop expired ripples.
      if (rippleOn && ripples.length) {
        ripples = ripples.filter((rp) => now - rp.t0 < RIPPLE_LIFE);
      }

      // First pass: compute per-dot intensity so links can reuse it.
      // intensity = mouse glow + ambient breathing + ripple rings.
      const intensity = new Float32Array(cols * rows);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * gap;
          const y = row * gap;

          let t = 0;

          if (interactive) {
            const dx = x - mouse.x;
            const dy = y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            t = Math.max(0, 1 - dist / glow);
          }

          if (ambientOn) {
            // Diagonal travelling wave — very low amplitude, just "alive".
            const wave = Math.sin((x + y) * 0.012 - now * 0.0011);
            t = Math.max(t, 0.16 * (0.5 + 0.5 * wave));
          }

          if (rippleOn) {
            for (const rp of ripples) {
              const age = now - rp.t0;
              const ringR = age * RIPPLE_SPEED;
              const dx = x - rp.x;
              const dy = y - rp.y;
              const d = Math.sqrt(dx * dx + dy * dy);
              const band = Math.abs(d - ringR);
              if (band < RIPPLE_BAND) {
                const fade = 1 - age / RIPPLE_LIFE;
                const ring = (1 - band / RIPPLE_BAND) * fade;
                t = Math.max(t, ring);
              }
            }
          }

          intensity[row * cols + col] = t;

          const alpha = 0.1 + t * 0.6;
          const r2 = radius + t * 1.2;

          ctx.beginPath();
          ctx.arc(x, y, r2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
          ctx.fill();
        }
      }

      // Second pass: constellation links between neighbouring lit dots.
      if (links && interactive) {
        ctx.lineWidth = 0.6;
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const i = row * cols + col;
            const ti = intensity[i];
            if (ti < 0.22) continue;
            const x = col * gap;
            const y = row * gap;

            // Link to the right and bottom neighbour if it's also lit.
            if (col + 1 < cols) {
              const tr = intensity[i + 1];
              if (tr > 0.22) {
                const a = Math.min(ti, tr) * 0.5;
                ctx.strokeStyle = `rgba(${cr},${cg},${cb},${a})`;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + gap, y);
                ctx.stroke();
              }
            }
            if (row + 1 < rows) {
              const tb = intensity[i + cols];
              if (tb > 0.22) {
                const a = Math.min(ti, tb) * 0.5;
                ctx.strokeStyle = `rgba(${cr},${cg},${cb},${a})`;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + gap);
                ctx.stroke();
              }
            }
          }
        }
      }

      raf = requestAnimationFrame(draw);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    raf = requestAnimationFrame(draw);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onMouseLeave = () => { mouse.x = -9999; mouse.y = -9999; };
    const onClick = (e: MouseEvent) => {
      if (!rippleOn) return;
      const rect = canvas.getBoundingClientRect();
      ripples.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, t0: performance.now() });
      if (ripples.length > 6) ripples.shift();
    };

    if (interactive) {
      window.addEventListener('mousemove', onMouseMove);
      canvas.addEventListener('mouseleave', onMouseLeave);
    }
    if (rippleOn) {
      window.addEventListener('pointerdown', onClick);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (interactive) {
        window.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('mouseleave', onMouseLeave);
      }
      if (rippleOn) {
        window.removeEventListener('pointerdown', onClick);
      }
    };
  });
</script>

<canvas bind:this={canvas} class="dot-canvas" aria-hidden="true"></canvas>

<style>
  .dot-canvas {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
  }
</style>
