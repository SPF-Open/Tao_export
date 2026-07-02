/**
 * Cursor-reactive card action: a brand spotlight follows the pointer
 * (`--mx`/`--my`) and the card tilts toward it (`--rx`/`--ry`). The tilt is
 * disabled under `prefers-reduced-motion`; the spotlight is kept.
 */
export function tilt(node: HTMLElement, maxTilt = 7) {
	const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

	function onMove(e: PointerEvent) {
		const r = node.getBoundingClientRect();
		const px = e.clientX - r.left;
		const py = e.clientY - r.top;
		node.style.setProperty('--mx', `${px}px`);
		node.style.setProperty('--my', `${py}px`);
		if (mq.matches) return;
		const nx = px / r.width - 0.5;
		const ny = py / r.height - 0.5;
		node.style.setProperty('--ry', `${nx * maxTilt * 2}deg`);
		node.style.setProperty('--rx', `${-ny * maxTilt * 2}deg`);
	}

	function onLeave() {
		node.style.setProperty('--rx', '0deg');
		node.style.setProperty('--ry', '0deg');
	}

	node.addEventListener('pointermove', onMove);
	node.addEventListener('pointerleave', onLeave);
	return {
		destroy() {
			node.removeEventListener('pointermove', onMove);
			node.removeEventListener('pointerleave', onLeave);
		}
	};
}
