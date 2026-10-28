import type { Zoom } from "pele/core";

const initialized = new WeakSet<HTMLElement>();
const controllers = new Set<Zoom>();
let module: Promise<(typeof import("pele/core"))["enableZoom"]> | undefined;

/** Add interaction to existing SVGs without loading Pele's diagram renderers. */
export async function setupDiagramZoom(root: ParentNode) {
	const containers = Array.from(root.querySelectorAll<HTMLElement>(".diagram-wide")).filter(
		(container) => !initialized.has(container) && container.firstElementChild?.matches("svg.pele"),
	);
	if (!containers.length) return;
	const enableZoom = await (module ??= import("pele/core").then(({ enableZoom }) => enableZoom));
	for (const container of containers) {
		if (initialized.has(container)) continue;
		const viewport = document.createElement("div");
		viewport.className = "diagram-zoom-viewport";
		const svg = container.firstElementChild as SVGSVGElement;
		const labelSize = Number(svg.dataset.diagramLabelSize);
		const readableScale = 10 / labelSize;
		const maxScale = Math.max(3, readableScale);
		viewport.append(svg);
		container.prepend(viewport);
		const controller = enableZoom(viewport, { always: true, controls: false, maxScale });
		controllers.add(controller);
		const controls = document.createElement("div");
		controls.className = "diagram-controls no-rss";
		controls.setAttribute("role", "group");
		controls.setAttribute("aria-label", "Diagram zoom");
		const buttons = [
			{ label: "Zoom in", path: "M5 12h14M12 5v14", action: () => controller.zoomBy(1.25) },
			{ label: "Zoom out", path: "M5 12h14", action: () => controller.zoomBy(1 / 1.25) },
			{
				label: "Reset zoom",
				path: "M3 11a9 9 0 1 1 2.6 7.3M3 4v7h7",
				action: () => controller.reset(),
			},
		].map(({ label, path, action }) => {
			const button = document.createElement("button");
			button.type = "button";
			button.setAttribute("aria-label", label);
			button.title = label;
			button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
			button.addEventListener("click", action);
			controls.append(button);
			return button;
		});
		const host = container.closest<HTMLElement>(".code")!;
		if (container.closest("[data-diagram-lightbox]")) {
			const expand = document.createElement("button");
			expand.type = "button";
			expand.className = "diagram-expand";
			expand.setAttribute("aria-label", "Open diagram in lightbox");
			expand.title = "Open diagram in lightbox";
			expand.innerHTML =
				'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg>';
			expand.addEventListener("click", () => {
				void openDiagramLightbox(host, expand, controller);
			});
			controls.append(expand);
		}
		host.append(controls);
		const updateControls = () => {
			const atBaseline = controller.scale <= controller.fit * 1.001;
			buttons[0]!.disabled = controller.scale >= Math.max(controller.fit, maxScale) * 0.999;
			buttons[1]!.disabled = atBaseline;
			buttons[2]!.hidden = atBaseline;
		};
		new MutationObserver(updateControls).observe(svg, {
			attributes: true,
			attributeFilter: ["viewBox"],
		});
		new ResizeObserver(updateControls).observe(container);
		updateControls();
		let linkPress: { id: number; x: number; y: number } | null = null;
		const pointers = new Set<number>();
		viewport.addEventListener("pointerdown", (event) => {
			if (!(event.target instanceof Element) || event.button !== 0) return;
			pointers.add(event.pointerId);
			if (pointers.size > 1) {
				linkPress = null;
				return;
			}
			// Pele captures a zoomed pointer immediately. Delay that capture on links
			// until a drag starts, so an ordinary tap still reaches the anchor.
			if (event.target.closest("a[href]") && controller.scale > controller.fit + 0.001) {
				linkPress = { id: event.pointerId, x: event.clientX, y: event.clientY };
				if (viewport.hasPointerCapture(event.pointerId))
					viewport.releasePointerCapture(event.pointerId);
			}
		});
		viewport.addEventListener("pointermove", (event) => {
			if (
				linkPress?.id === event.pointerId &&
				Math.abs(event.clientX - linkPress.x) + Math.abs(event.clientY - linkPress.y) > 4
			) {
				viewport.setPointerCapture(event.pointerId);
				linkPress = null;
			}
		});
		const release = (event: PointerEvent) => {
			pointers.delete(event.pointerId);
			if (linkPress?.id === event.pointerId) linkPress = null;
		};
		viewport.addEventListener("pointerup", release);
		viewport.addEventListener("pointercancel", release);
		// Keep keyboard focus visible when Tab reaches a link outside the zoomed view.
		viewport.addEventListener("focusin", (event) => {
			const link = event.target instanceof Element ? event.target.closest("a") : null;
			if (!link?.matches(":focus-visible")) return;
			const bounds = link.getBoundingClientRect();
			const frame = viewport.querySelector("svg")!.getBoundingClientRect();
			if (
				bounds.left < frame.left ||
				bounds.right > frame.right ||
				bounds.top < frame.top ||
				bounds.bottom > frame.bottom
			)
				controller.reset();
			link.scrollIntoView({ block: "nearest", inline: "nearest" });
		});
		initialized.add(container);
		container.dataset.diagramZoom = "true";
	}
}

let diagramOpen = false;

async function openDiagramLightbox(content: HTMLElement, trigger: HTMLElement, zoom: Zoom) {
	if (diagramOpen) return;
	diagramOpen = true;
	const { lightboxReady } = await import("./lightbox");
	const createLightbox = await lightboxReady;
	const preview = content.closest<HTMLElement>(".notion-popover");
	const returnFocus = preview
		? document.querySelector<HTMLElement>(`[data-popover-target="${CSS.escape(preview.id)}"]`)
		: trigger;
	const placeholder = document.createElement("div");
	zoom.reset();
	placeholder.style.height = `${content.getBoundingClientRect().height}px`;
	content.replaceWith(placeholder);
	content.classList.add("diagram-lightbox-content");
	let modal: HTMLElement;
	const closeForPrint = () => lightbox.close();
	const handleKey = (event: KeyboardEvent) => {
		if (event.key === "Escape") {
			event.preventDefault();
			lightbox.close();
		}
		if (event.key !== "Tab") return;
		const targets = Array.from(
			modal.querySelectorAll<HTMLElement | SVGSVGElement>(
				'button:not(:disabled), a[href], [tabindex="0"]',
			),
		).filter(
			(element) =>
				element.getClientRects().length && getComputedStyle(element).visibility !== "hidden",
		);
		const first = targets[0];
		const last = targets[targets.length - 1];
		if (
			(event.shiftKey && document.activeElement === first) ||
			(!event.shiftKey && document.activeElement === last)
		) {
			event.preventDefault();
			(event.shiftKey ? last : first)?.focus();
		}
	};
	const handleLink = (event: MouseEvent) => {
		const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
		if (
			!anchor ||
			event.defaultPrevented ||
			event.button !== 0 ||
			event.ctrlKey ||
			event.metaKey ||
			event.shiftKey ||
			event.altKey
		)
			return;
		const url = new URL(anchor.getAttribute("href")!, window.location.href);
		if (
			url.origin === window.location.origin &&
			url.pathname === window.location.pathname &&
			url.hash
		)
			lightbox.close();
	};
	const lightbox = createLightbox({
		selector: false,
		elements: [{ content, type: "inline", width: "100vw", height: "100vh" }],
		// Diagram gestures and arrow keys belong to Pele, rather than gallery navigation.
		touchNavigation: false,
		keyboardNavigation: false,
		draggable: false,
		openEffect: "none",
		closeEffect: "none",
		onOpen: () => {
			modal = document.querySelector<HTMLElement>(".glightbox-container")!;
			modal.classList.add("diagram-lightbox");
			modal.setAttribute("aria-modal", "true");
			modal.setAttribute("aria-label", "Diagram");
			modal.addEventListener("keydown", handleKey);
			content.addEventListener("click", handleLink);
			window.addEventListener("beforeprint", closeForPrint);
			zoom.refresh();
			content.querySelector<SVGSVGElement>("svg.pele")!.focus({ preventScroll: true });
		},
		onClose: () => {
			zoom.reset();
			content.classList.remove("diagram-lightbox-content");
			placeholder.replaceWith(content);
			modal.removeEventListener("keydown", handleKey);
			content.removeEventListener("click", handleLink);
			window.removeEventListener("beforeprint", closeForPrint);
			zoom.refresh();
			diagramOpen = false;
			returnFocus?.focus({ preventScroll: true });
			lightbox.destroy();
		},
	});
	lightbox.open();
}

window.addEventListener("beforeprint", () => {
	for (const controller of controllers) controller.reset();
});

if (document.readyState === "loading")
	document.addEventListener("DOMContentLoaded", () => void setupDiagramZoom(document), {
		once: true,
	});
else void setupDiagramZoom(document);
