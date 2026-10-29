// Docs page scroll spy: highlight the section currently in view in the sidebar
// and the mobile "On this page" dropdown, and close the dropdown after use.
const links = Array.from(
  document.querySelectorAll<HTMLAnchorElement>(
    '.docs-sidebar nav a[href^="#"], .docs-mobile-nav nav a[href^="#"]'
  )
);
const sections = Array.from(new Set(links.map((link) => link.hash.slice(1))))
  .map((id) => document.getElementById(id))
  .filter((section): section is HTMLElement => section !== null);

const setCurrent = (id: string | null) => {
  for (const link of links) {
    if (id !== null && link.hash === `#${id}`) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  }
};

const HEADER_EDGE = 110; // just past the 104px scroll-margin anchor landing point
let scheduled = false;
const update = () => {
  scheduled = false;
  let current: string | null = null;
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= HEADER_EDGE) current = section.id;
  }
  // Pin the last section once the page bottom is reached, where its top
  // may never cross the header edge on short closing sections.
  const bottom = window.innerHeight + window.scrollY;
  if (bottom >= document.documentElement.scrollHeight - 2) {
    current = sections[sections.length - 1]?.id ?? null;
  }
  setCurrent(current);
};
// Coalesce scroll events with a timeout rather than requestAnimationFrame:
// rAF can stall indefinitely in background or occluded tabs, freezing the highlight.
const requestUpdate = () => {
  if (scheduled) return;
  scheduled = true;
  setTimeout(update, 0);
};
document.addEventListener('scroll', requestUpdate, { passive: true });
window.addEventListener('resize', requestUpdate, { passive: true });
update();

const dropdown = document.querySelector<HTMLDetailsElement>('.docs-mobile-nav');
dropdown?.addEventListener('click', (event) => {
  if ((event.target as HTMLElement).closest('a')) dropdown.open = false;
});
