<script lang="ts">
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import { Bug, ChevronDown } from 'lucide-svelte';
  import DebugPanel from '$lib/general/DebugPanel.svelte';

  let debugOpen = $state(false);

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const ctx = canvas.getContext('2d')!;
    const GAP = 10;
    const RADIUS = 1;
    const GLOW_RADIUS = 70;
    const mouse = { x: -9999, y: -9999 };

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isDark = document.documentElement.classList.contains('dark');
      // light: soft indigo  |  dark: emerald green
      const [cr, cg, cb] = isDark ? [52, 211, 153] : [99, 102, 241];

      const cols = Math.ceil(canvas.width / GAP) + 1;
      const rows = Math.ceil(canvas.height / GAP) + 1;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * GAP;
          const y = row * GAP;
          const dx = x - mouse.x;
          const dy = y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const t = Math.max(0, 1 - dist / GLOW_RADIUS);
          const alpha = 0.12 + t * 0.65;
          const r2 = RADIUS + t * 1.2;

          ctx.beginPath();
          ctx.arc(x, y, r2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
          ctx.fill();
        }
      }
      requestAnimationFrame(draw);
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

    window.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    return () => {
      ro.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  });

  interface Route {
    path: string;
    title: string;
    description: string;
    icon: string;
    available: boolean;
  }

  const routes: Route[] = [
    {
      path: '/export',
      title: 'Export',
      description: 'Load ZIP exam archives, configure settings, preview questions and answers, and export formatted result tables.',
      icon: '📤',
      available: true,
    },
    {
      path: '/import',
      title: 'Import',
      description: 'Import raw exam data from various sources and normalize it for use in the application.',
      icon: '📥',
      available: true,
    },
    {
      path: '/forge',
      title: 'Forge',
      description: 'Create and compose new exam questions from scratch or from existing templates.',
      icon: '🔨',
      available: true,
    },
    {
      path: '/iat',
      title: 'IAT',
      description: 'Interactive Assessment Tool — run and manage interactive exam sessions.',
      icon: '📝',
      available: false,
    },
  ];
</script>

<canvas bind:this={canvas} class="dot-bg" aria-hidden="true"></canvas>

<main>
  <p class="subtitle">Select a module to get started</p>

  <nav class="route-grid">
    {#each routes as route}
      <a
        href={route.available ? route.path : undefined}
        class="route-card"
        class:unavailable={!route.available}
        aria-disabled={!route.available}
        tabindex={route.available ? 0 : -1}
      >
        <span class="route-icon">{route.icon}</span>
        <div class="route-body">
          <h2 class="route-title">{route.title}</h2>
          <p class="route-description">{route.description}</p>
        </div>
        {#if !route.available}
          <span class="badge">Coming soon</span>
        {/if}
      </a>
    {/each}
  </nav>

  <div class="debug-section">
    <button
      class="debug-trigger"
      onclick={() => (debugOpen = !debugOpen)}
      aria-expanded={debugOpen}
    >
      <Bug size={12} />
      <span>Debug</span>
      <ChevronDown size={12} class={debugOpen ? 'flip' : ''} />
    </button>

    {#if debugOpen}
      <div class="debug-body" transition:slide={{ duration: 150 }}>
        <DebugPanel onclose={() => (debugOpen = false)} />
      </div>
    {/if}
  </div>
</main>

<style>
  .dot-bg {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
  }

  main {
    position: relative;
    z-index: 1;
    min-height: calc(100vh - 36px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
  }

  .subtitle {
    color: var(--text-muted);
    font-size: 1rem;
    margin: 0 0 2.5rem;
  }

  .route-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1rem;
    width: 100%;
    max-width: 860px;
  }

  .route-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.5rem;
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-sm);
    text-decoration: none;
    color: var(--text);
    transition: box-shadow 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
  }

  .route-card:not(.unavailable):hover {
    border-color: var(--primary);
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }

  .route-card.unavailable {
    cursor: default;
    pointer-events: none;
  }
  .route-card.unavailable * {
    opacity: 0.6;
  }

  .route-icon {
    font-size: 1.75rem;
    line-height: 1;
  }

  .route-body {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .route-title {
    font-size: 1.05rem;
    font-weight: 600;
    margin: 0;
    color: var(--text);
  }

  .route-description {
    font-size: 0.85rem;
    color: var(--text-muted);
    margin: 0;
    line-height: 1.5;
  }

  .debug-section {
    margin-top: 2rem;
    width: 100%;
    max-width: 860px;
  }

  .debug-trigger {
    
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
  }

  .debug-trigger:hover {
    color: var(--text);
    border-color: var(--border-strong);
  }

  .debug-trigger :global(.flip) {
    transform: rotate(180deg);
  }

  .debug-body {
    margin-top: 8px;
    height: 420px;
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 1px solid var(--border);
  }

  .badge {
    align-self: flex-start;
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.2rem 0.55rem;
    border-radius: 9999px;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text-muted);
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }
</style>
