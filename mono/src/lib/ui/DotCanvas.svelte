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
  }

  let { gap = 10, radius = 1, glow = 70, interactive = true }: Props = $props();

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const ctx = canvas.getContext('2d')!;
    const mouse = { x: -9999, y: -9999 };
    let raf = 0;

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isDark = document.documentElement.classList.contains('dark');
      // light: indigo brand | dark: emerald brand — matches --brand token.
      const [cr, cg, cb] = isDark ? [52, 211, 153] : [99, 102, 241];

      const cols = Math.ceil(canvas.width / gap) + 1;
      const rows = Math.ceil(canvas.height / gap) + 1;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * gap;
          const y = row * gap;
          const dx = x - mouse.x;
          const dy = y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const t = interactive ? Math.max(0, 1 - dist / glow) : 0;
          const alpha = 0.1 + t * 0.6;
          const r2 = radius + t * 1.2;

          ctx.beginPath();
          ctx.arc(x, y, r2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(draw);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    draw();

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onMouseLeave = () => { mouse.x = -9999; mouse.y = -9999; };

    if (interactive) {
      window.addEventListener('mousemove', onMouseMove);
      canvas.addEventListener('mouseleave', onMouseLeave);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (interactive) {
        window.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('mouseleave', onMouseLeave);
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
