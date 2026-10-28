export const lightboxReady = new Promise<typeof GLightbox>((resolve) => {
	const load = () => {
		const script = document.createElement("script");
		script.src = "https://cdn.jsdelivr.net/gh/mcstudios/glightbox/dist/js/glightbox.min.js";
		script.onload = () => {
			initLightbox();
			resolve(GLightbox);
		};
		document.head.appendChild(script);
	};
	if (document.readyState === "complete") load();
	else window.addEventListener("load", load, { once: true });
});

function initLightbox() {
	const lightbox = GLightbox({
		selector: ".mediaglightbox, .fileglightbox, .embedglightbox",
	});

	// Store globally so margin-notes.ts can reload after creating dynamic content
	window.lightboxInstance = lightbox;
}

declare const GLightbox: (options: {
	selector: string | false;
	elements?: { content: HTMLElement; type: "inline"; width: string; height: string }[];
	touchNavigation?: boolean;
	keyboardNavigation?: boolean;
	draggable?: boolean;
	openEffect?: string;
	closeEffect?: string;
	onOpen?: () => void;
	onClose?: () => void;
}) => { reload: () => void; open: () => void; close: () => void; destroy: () => void };
