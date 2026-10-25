/** Anchor the decorative wires to the rendered ports, including after reflow. */
export function connectPipelineWires() {
  const pipeline = document.querySelector<HTMLElement>('.home-pipeline');
  if (!pipeline) return;

  const connectors = pipeline.querySelectorAll<HTMLElement>('[data-wire-from][data-wire-to]');
  const draw = () => {
    connectors.forEach((connector) => {
      const from = document.getElementById(connector.dataset.wireFrom || '');
      const to = document.getElementById(connector.dataset.wireTo || '');
      const svg = connector.querySelector('svg');
      if (!from || !to || !svg) return;

      const bounds = connector.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const start = from.getBoundingClientRect();
      const end = to.getBoundingClientRect();
      const x1 = start.left + start.width / 2 - bounds.left;
      const y1 = start.top + start.height / 2 - bounds.top;
      const x2 = end.left + end.width / 2 - bounds.left;
      const y2 = end.top + end.height / 2 - bounds.top;
      const middle = (y1 + y2) / 2;
      const direction = Math.sign(x2 - x1);
      const radius = Math.min(20, Math.abs(x2 - x1) / 2, Math.abs(y2 - y1) / 4);
      let path = Math.abs(x2 - x1) < 1
        ? `M ${x1} ${y1} L ${x2} ${y2}`
        : `M ${x1} ${y1} L ${x1} ${middle - radius} Q ${x1} ${middle} ${x1 + direction * radius} ${middle} L ${x2 - direction * radius} ${middle} Q ${x2} ${middle} ${x2} ${middle + radius} L ${x2} ${y2}`;

      // In the stacked layout, route around the guest explanation above its card.
      const copy = to.closest('.pipe-step')?.querySelector('.pipe-copy')?.getBoundingClientRect();
      const startX = start.left + start.width / 2;
      if (copy && startX > copy.left && startX < copy.right && end.top > copy.bottom) {
        const rail = bounds.width + 12;
        const upperBend = bounds.height / 2;
        const lowerBend = y2 - 12;
        const r = Math.min(12, (lowerBend - upperBend) / 2, (rail - x1) / 2, (rail - x2) / 2);
        path = `M ${x1} ${y1} L ${x1} ${upperBend - r} Q ${x1} ${upperBend} ${x1 + r} ${upperBend} L ${rail - r} ${upperBend} Q ${rail} ${upperBend} ${rail} ${upperBend + r} L ${rail} ${lowerBend - r} Q ${rail} ${lowerBend} ${rail - r} ${lowerBend} L ${x2 + r} ${lowerBend} Q ${x2} ${lowerBend} ${x2} ${lowerBend + r} L ${x2} ${y2}`;
      }

      svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
      svg.querySelectorAll('path').forEach((wire) => wire.setAttribute('d', path));
    });
  };

  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      draw();
    });
  };
  const observer = new ResizeObserver(schedule);
  observer.observe(pipeline);
  pipeline.querySelectorAll('.pipe-step, .pipe-node, .pipe-gate, .pipe-connector')
    .forEach((element) => observer.observe(element));
  window.addEventListener('resize', schedule);
  document.fonts.ready.then(schedule);
  draw();
}
