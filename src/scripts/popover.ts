interface FloatingUIDOMApi {
	computePosition: (
		reference: Element,
		floating: HTMLElement,
		options: { middleware: unknown[] },
	) => Promise<{ x: number; y: number }>;
	offset: (value: number) => unknown;
	shift: (options: { padding: number }) => unknown;
	flip: (options: { padding: number }) => unknown;
	autoUpdate: (reference: Element, floating: HTMLElement, update: () => void) => () => void;
}

declare global {
	interface Window {
		FloatingUIDOM: FloatingUIDOMApi;
	}
}

window.addEventListener("load", function () {
	// Load floating-ui core first, then dom
	const coreScript = document.createElement("script");
	coreScript.src = "https://cdn.jsdelivr.net/npm/@floating-ui/core@1.7.3";
	coreScript.onload = function () {
		// Load dom after core is loaded
		const domScript = document.createElement("script");
		domScript.src = "https://cdn.jsdelivr.net/npm/@floating-ui/dom@1.7.4";
		domScript.onload = initPopovers;
		document.head.appendChild(domScript);
	};
	document.head.appendChild(coreScript);
});

function initPopovers() {
	const { computePosition, offset, shift, flip, autoUpdate } = window.FloatingUIDOM;

	// State variables for popovers
	const smBreakpointQuery = window.matchMedia("(max-width: 639px)");
	const lgBreakpointQuery = window.matchMedia("(min-width: 1024px)");
	// Interaction mode is decided by input capability, not viewport width: touch
	// devices (phones AND tablets) must not hover-preview or navigate on the
	// first tap — otherwise a tap flashes the popover and immediately follows the
	// link. Only genuine mouse/trackpad pointers get hover + click-to-navigate.
	const canHoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

	// Create the selector based on the device type
	function getPopoverSelector() {
		if (lgBreakpointQuery.matches) {
			// Large screens: margin notes replace popovers, except in collection streams
			// and inside wide blocks (whose displaced notes keep the inline popover live).
			return "[data-popover-target]:not([data-margin-note]), .post-preview-full-container [data-margin-note][data-popover-target], .webtrotion-wide-breakout [data-margin-note][data-popover-target]";
		}

		if (smBreakpointQuery.matches) {
			// Disable popovers for link mentions on small screens
			return '[data-popover-target]:not([data-popover-type-lm="true"])';
		}

		return "[data-popover-target]";
	}

	let openPopovers: HTMLElement[] = [];
	let cleanupAutoUpdate = new Map<HTMLElement, () => void>();
	let hoverTimeouts = new Map<HTMLElement, ReturnType<typeof setTimeout>>();
	// Popovers pending their final display:none after an exit fade. Tracked so a
	// re-show (or re-hide) during the fade can cancel the deferred teardown.
	let pendingHide = new Map<HTMLElement, ReturnType<typeof setTimeout>>();

	// A popover that currently hosts another OPEN popover must not clip its
	// overflow — otherwise the nested (absolutely-positioned) child is cropped to
	// the parent's box and forces a scrollbar. Mark every ancestor of each open
	// popover so the height cap is lifted only while a child is open, then
	// restored once it closes.
	const refreshPopoverClipping = () => {
		document
			.querySelectorAll(".notion-popover.popover-has-nested")
			.forEach((el) => el.classList.remove("popover-has-nested"));
		openPopovers.forEach((child) => {
			let ancestor = child.parentElement ? child.parentElement.closest(".notion-popover") : null;
			while (ancestor) {
				ancestor.classList.add("popover-has-nested");
				ancestor = ancestor.parentElement
					? ancestor.parentElement.closest(".notion-popover")
					: null;
			}
		});
	};

	const getPopoverLevel = (el: Element | null) => {
		let level = 0;
		while (el && el.closest("[data-popover-target]")) {
			level++;
			el = el.parentElement;
		}
		return level - 1;
	};

	const hideAllPopovers = (level = 0) => {
		openPopovers.forEach((popoverEl) => {
			if (getPopoverLevel(popoverEl) >= level) {
				hidePopover(popoverEl);
			}
		});
	};

	const hidePopover = (popoverEl: HTMLElement) => {
		if (!popoverEl) return;

		// Cancel any teardown already scheduled for this popover so we don't
		// finalize twice (and so a fresh hide restarts the fade cleanly).
		const alreadyPending = pendingHide.get(popoverEl);
		if (alreadyPending) {
			clearTimeout(alreadyPending);
			pendingHide.delete(popoverEl);
		}

		// Treat it as closed immediately for open/close bookkeeping and stop the
		// position autoupdate — the popover stays put while it fades out.
		const openPopoverIndex = openPopovers.indexOf(popoverEl);
		if (openPopoverIndex !== -1) {
			openPopovers.splice(openPopoverIndex, 1);
		}
		const cleanup = cleanupAutoUpdate.get(popoverEl);
		if (cleanup) {
			cleanup();
			cleanupAutoUpdate.delete(popoverEl);
		}

		// Play the exit: reverse of the enter (fade out + settle back up/in). The
		// display:none teardown is deferred so this transition can actually run;
		// under reduced motion the global policy keeps opacity-only and clamps it.
		popoverEl.style.opacity = "0";
		popoverEl.style.transform = "translateY(-4px) scale(0.98)";

		const finalize = () => {
			pendingHide.delete(popoverEl);
			popoverEl.style.visibility = "hidden";
			popoverEl.classList.add("hidden");
			popoverEl.style.transform = "";
			// Re-clip any ancestor that no longer hosts an open child popover.
			refreshPopoverClipping();
		};
		// Slightly longer than the 200ms enter/exit transition (150ms under
		// reduced motion) so the fade completes before we remove it from flow.
		const timeoutId = setTimeout(finalize, 240);
		pendingHide.set(popoverEl, timeoutId);
	};

	const addLeaveListeners = (triggerEl: HTMLElement, popoverEl: HTMLElement) => {
		triggerEl.addEventListener("mouseleave", () => {
			const timeoutId = setTimeout(() => {
				hidePopover(popoverEl);
			}, 100);
			hoverTimeouts.set(popoverEl, timeoutId);
		});

		popoverEl.addEventListener("mouseenter", () => {
			const timeoutId = hoverTimeouts.get(popoverEl);
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		});

		popoverEl.addEventListener("mouseleave", () => {
			hidePopover(popoverEl);
		});

		triggerEl.addEventListener("blur", () => {
			hidePopover(popoverEl);
		});
	};

	const createPopover = (triggerEl: HTMLElement): HTMLElement | null => {
		const popoverID = triggerEl.dataset.popoverTarget;
		const template = document.getElementById(`template-${popoverID}`) as HTMLTemplateElement | null;
		if (!template) return null;
		const firstElement = template.content.firstElementChild;
		if (!firstElement) return null;
		const popoverEl = firstElement.cloneNode(true) as HTMLElement;
		scopeDiagramIds(popoverEl);
		if (popoverEl.querySelector(".mermaid svg.pele"))
			void import("./diagrams").then(({ setupDiagramZoom }) => setupDiagramZoom(popoverEl));

		// Remove data-margin-note from footnotes inside popovers so they use popover behavior instead
		popoverEl.querySelectorAll<HTMLElement>("[data-margin-note]").forEach((footnote) => {
			footnote.removeAttribute("data-margin-note");
		});

		triggerEl.parentNode?.insertBefore(popoverEl, triggerEl.nextSibling);
		addLeaveListeners(triggerEl, popoverEl);
		return popoverEl;
	};

	const showPopover = (triggerEl: HTMLElement) => {
		const level = getPopoverLevel(triggerEl);
		hideAllPopovers(level);

		const popoverId = triggerEl.dataset.popoverTarget;
		let popoverEl = popoverId ? (document.getElementById(popoverId) as HTMLElement | null) : null;

		if (!popoverEl) {
			popoverEl = createPopover(triggerEl);
		}
		if (!popoverEl) return;

		// If this popover is mid-exit-fade, cancel the deferred teardown so we
		// reverse straight back into view instead of snapping to display:none.
		const pending = pendingHide.get(popoverEl);
		if (pending) {
			clearTimeout(pending);
			pendingHide.delete(popoverEl);
		}

		const update = () => {
			computePosition(triggerEl, popoverEl, {
				middleware: [offset(6), shift({ padding: 3 }), flip({ padding: 3 })],
			}).then(({ x, y }) => {
				Object.assign(popoverEl.style, {
					left: `${x}px`,
					top: `${y}px`,
					position: "absolute",
				});
			});
		};

		update();
		popoverEl.classList.remove("hidden");
		requestAnimationFrame(() => {
			popoverEl.style.visibility = "visible";
			popoverEl.style.opacity = "1";
			popoverEl.style.transform = "translateY(0) scale(1)";
		});

		openPopovers.push(popoverEl);
		cleanupAutoUpdate.set(popoverEl, autoUpdate(triggerEl, popoverEl, update));
		// Lift the height cap on any ancestor now hosting this nested popover.
		refreshPopoverClipping();
	};

	const handleHover = (event: MouseEvent | FocusEvent) => {
		if (!canHoverQuery.matches) return; // Hover previews only for mouse/trackpad pointers

		const selector = getPopoverSelector();
		const triggerEl =
			event.target instanceof HTMLElement ? event.target.closest<HTMLElement>(selector) : null;
		if (triggerEl) {
			showPopover(triggerEl);
		}
	};

	document.addEventListener("mouseover", handleHover);
	document.addEventListener("focusin", handleHover);

	document.addEventListener("click", (event: MouseEvent) => {
		if (!(event.target instanceof HTMLElement)) return;
		const selector = getPopoverSelector();
		const triggerEl = event.target.closest<HTMLElement>(selector);

		if (triggerEl) {
			const href = triggerEl.dataset.href;

			if (canHoverQuery.matches) {
				// Mouse/trackpad: the preview already showed on hover, so a click is
				// a deliberate request to follow the link to its source.
				if (href) {
					window.location.href = href;
					return;
				}
			} else {
				// Touch / no-hover: the first tap opens the preview instead of
				// navigating. Navigation happens by tapping the preview card or its
				// "Read more" link. This prevents the tap-flash-then-leave bug on
				// tablets and touch laptops (any non-small touch screen).
				event.preventDefault();
				showPopover(triggerEl);
				return;
			}
		}

		const popoverLink = event.target.closest<HTMLElement>("[data-popover-link]");
		if (popoverLink) {
			hideAllPopovers(-1);
			return;
		}

		const popoverCardLink = event.target.closest<HTMLElement>("[data-popover-card-link]");
		if (popoverCardLink && !event.target.closest("a, button, input, select, textarea")) {
			const href = popoverCardLink.dataset.href;
			if (href) {
				window.location.href = href;
				return;
			}
		} else if (!triggerEl) {
			hideAllPopovers(-1);
		}
	});

	document.addEventListener("keydown", (event: KeyboardEvent) => {
		if (!(event.target instanceof HTMLElement)) return;
		if (event.key === "Escape") {
			hideAllPopovers(-1);
			return;
		}

		if (event.key === "Enter" || event.key === " ") {
			const popoverCardLink = event.target.closest<HTMLElement>("[data-popover-card-link]");
			if (popoverCardLink && event.target === popoverCardLink) {
				event.preventDefault();
				const href = popoverCardLink.dataset.href;
				if (href) {
					window.location.href = href;
				}
			}
		}
	});
}

/** Cached previews can contain an SVG that is already present in the page. */
export function scopeDiagramIds(root: ParentNode) {
	root.querySelectorAll<SVGSVGElement>(".mermaid svg.pele").forEach((svg) => {
		const prefix = `preview-${crypto.randomUUID()}`;
		const ids = new Map<string, string>();
		svg.querySelectorAll<SVGElement>("[id]").forEach((element) => {
			ids.set(element.id, `${prefix}-${element.id}`);
		});
		svg.querySelectorAll<SVGElement>("*").forEach((element) => {
			for (const attribute of element.getAttributeNames()) {
				const value = element.getAttribute(attribute)!;
				if (attribute === "id") {
					element.id = ids.get(value)!;
				} else if (attribute === "aria-labelledby" || attribute === "aria-describedby") {
					element.setAttribute(
						attribute,
						value
							.split(/\s+/)
							.map((id) => ids.get(id) || id)
							.join(" "),
					);
				} else {
					let updated = value;
					if (value.startsWith("#")) {
						const replacement = ids.get(value.slice(1));
						if (replacement) updated = `#${replacement}`;
					} else {
						// SVG fills, masks and inline styles can reference local resources as
						// url(#id). Capture the ID up to ')' and leave external URLs intact.
						updated = value.replace(/url\(#([^)]+)\)/g, (reference, resourceId) => {
							const replacement = ids.get(resourceId);
							return replacement ? `url(#${replacement})` : reference;
						});
					}
					if (updated !== value) element.setAttribute(attribute, updated);
				}
			}
		});
		for (const attribute of ["aria-labelledby", "aria-describedby"]) {
			const value = svg.getAttribute(attribute);
			if (value)
				svg.setAttribute(
					attribute,
					value
						.split(/\s+/)
						.map((id) => ids.get(id) || id)
						.join(" "),
				);
		}
	});
}
