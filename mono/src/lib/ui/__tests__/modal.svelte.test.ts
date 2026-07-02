import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Modal from '../Modal.svelte';

const title = createRawSnippet(() => ({ render: () => '<span>Dialog title</span>' }));
const children = createRawSnippet(() => ({
	render: () => '<div><button id="first">First</button><button id="last">Last</button></div>'
}));

function renderOpenModal() {
	return render(Modal, { props: { open: true, title, children } });
}

function pressKey(key: string, shiftKey = false) {
	window.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true }));
}

afterEach(() => cleanup());

describe('Modal accessibility', () => {
	test('renders a labelled dialog and moves focus into it', () => {
		const { baseElement } = renderOpenModal();
		const dialog = baseElement.querySelector<HTMLElement>('[role="dialog"]')!;

		expect(dialog).toBeTruthy();
		expect(dialog.getAttribute('aria-modal')).toBe('true');

		const labelId = dialog.getAttribute('aria-labelledby')!;
		expect(labelId).toBeTruthy();
		expect(baseElement.querySelector(`#${CSS.escape(labelId)}`)?.textContent).toContain(
			'Dialog title'
		);

		expect(document.activeElement).toBe(dialog);
	});

	test('Escape closes the dialog', async () => {
		const { baseElement } = renderOpenModal();
		expect(baseElement.querySelector('[role="dialog"]')).toBeTruthy();

		pressKey('Escape');
		await Promise.resolve();

		expect(baseElement.querySelector('[role="dialog"]')).toBeNull();
	});

	test('Tab cycles focus inside the dialog', () => {
		const { baseElement } = renderOpenModal();
		// The dialog's first focusable element is its close button.
		const close = baseElement.querySelector<HTMLButtonElement>('[aria-label="Close"]')!;
		const last = baseElement.querySelector<HTMLButtonElement>('#last')!;

		// Tab past the last element wraps to the first…
		last.focus();
		pressKey('Tab');
		expect(document.activeElement).toBe(close);

		// …and Shift+Tab from the first wraps back to the last.
		close.focus();
		pressKey('Tab', true);
		expect(document.activeElement).toBe(last);
	});

	test('focus returns to the previously focused element on close', async () => {
		const outside = document.createElement('button');
		outside.id = 'outside';
		document.body.appendChild(outside);
		outside.focus();

		const { rerender, baseElement } = render(Modal, { props: { open: true, title, children } });
		expect(document.activeElement).toBe(baseElement.querySelector('[role="dialog"]'));

		await rerender({ open: false });
		expect(document.activeElement).toBe(outside);

		outside.remove();
	});
});
