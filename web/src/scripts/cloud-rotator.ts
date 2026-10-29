export interface Integration {
  name: string;
  slug: string;
  icon: string;
}

export function initCloudRotator() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const container = document.querySelector('.home-integrations');
  if (!container) return;

  const dataScript = document.getElementById('integrations-pool');
  if (!dataScript?.textContent) return;

  let allIntegrations: Integration[] = [];
  try {
    allIntegrations = JSON.parse(dataScript.textContent);
  } catch {
    return;
  }

  const slots = Array.from(container.querySelectorAll<HTMLAnchorElement>('.home-integration'));
  if (slots.length === 0 || allIntegrations.length <= slots.length) return;

  // Map currently visible slots to their integrations
  const activeSlugs = new Set<string>();
  const activeList: Integration[] = [];

  for (const slot of slots) {
    const slug = slot.getAttribute('href')?.replace(/^\/teleport\/|\/$/g, '') || '';
    const match = allIntegrations.find((item) => item.slug === slug);
    if (match) {
      activeList.push(match);
      activeSlugs.add(match.slug);
    } else {
      const name = slot.getAttribute('data-tooltip') || slug;
      const fallback: Integration = { name, slug, icon: slug };
      activeList.push(fallback);
      activeSlugs.add(slug);
    }
  }

  // Reserve pool contains integrations not currently in any visible slot
  const pool: Integration[] = allIntegrations.filter((item) => !activeSlugs.has(item.slug));
  if (pool.length === 0) return;

  // Track recent slots to distribute the random rotation across the grid
  const recentSlots: number[] = [];
  const maxRecent = Math.min(6, Math.floor(slots.length / 3));

  let timerId: number | null = null;

  const performSwapAnimation = (slot: HTMLAnchorElement, next: Integration) => {
    const img = slot.querySelector<HTMLImageElement>('img');
    if (!img) return;

    slot.classList.add('is-swapping');

    // Wait for the icon to fade out (350ms)
    setTimeout(() => {
      slot.href = `/teleport/${next.slug}/`;
      slot.setAttribute('aria-label', `${next.name} server guide`);
      slot.dataset.tooltip = next.name;

      const newSrc = `/icons/${next.icon}.svg`;
      let completed = false;

      const finishFadeIn = () => {
        if (completed) return;
        completed = true;
        img.src = newSrc;
        requestAnimationFrame(() => {
          slot.classList.remove('is-swapping');
        });
      };

      const preload = new Image();
      preload.onload = finishFadeIn;
      preload.onerror = finishFadeIn;
      preload.src = newSrc;
      if (preload.complete) {
        finishFadeIn();
      }

      // Safety fallback in case loading stalls
      setTimeout(finishFadeIn, 400);
    }, 350);
  };

  const swapRandomSlot = () => {
    if (document.hidden) return;

    // Pick a candidate slot that isn't currently swapping or hovered/focused
    const candidateIndices: number[] = [];
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (slot.classList.contains('is-swapping')) continue;
      if (slot.matches(':hover, :focus-visible')) continue;
      if (recentSlots.includes(i)) continue;
      candidateIndices.push(i);
    }

    const eligible = candidateIndices.length > 0
      ? candidateIndices
      : slots.map((_, i) => i).filter((i) => !slots[i].classList.contains('is-swapping') && !slots[i].matches(':hover, :focus-visible'));

    if (eligible.length > 0 && pool.length > 0) {
      const slotIdx = eligible[Math.floor(Math.random() * eligible.length)];
      const poolIdx = Math.floor(Math.random() * pool.length);

      const targetSlot = slots[slotIdx];
      const incoming = pool[poolIdx];
      const outgoing = activeList[slotIdx];

      activeList[slotIdx] = incoming;
      pool[poolIdx] = outgoing;

      recentSlots.push(slotIdx);
      if (recentSlots.length > maxRecent) {
        recentSlots.shift();
      }

      performSwapAnimation(targetSlot, incoming);
    }

    scheduleNext();
  };

  const scheduleNext = () => {
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    // Random interval between 1.4s and 2.6s for an organic, living feel
    const delay = 1400 + Math.random() * 1200;
    timerId = window.setTimeout(swapRandomSlot, delay);
  };

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
    } else {
      scheduleNext();
    }
  });

  // Initial delay before rotation starts
  timerId = window.setTimeout(swapRandomSlot, 1600);
}
