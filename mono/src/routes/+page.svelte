<script lang="ts">
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
      available: false,
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

<main>
  <header>
    <h1>TAO Export</h1>
    <p>Select a module to get started</p>
  </header>

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
</main>

<style>
  main {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    background-color: var(--bg);
  }

  header {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  header h1 {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 0.5rem;
  }

  header p {
    color: var(--text-muted);
    font-size: 1rem;
    margin: 0;
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
    opacity: 0.55;
    cursor: default;
    pointer-events: none;
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
