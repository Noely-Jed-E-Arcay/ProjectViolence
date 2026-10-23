(function () {
    "use strict";

    const transitionPages = new Set([
        "guest.html",
        "login.html",
        "signup.html"
    ]);

    document.addEventListener("click", event => {
        if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
        ) {
            return;
        }

        const link = event.target.closest("a[href]");

        if (
            !link ||
            link.target ||
            link.hasAttribute("download") ||
            link.getAttribute("aria-disabled") === "true"
        ) {
            return;
        }

        const destination = new URL(link.href, window.location.href);

        if (
            destination.origin !== window.location.origin ||
            !transitionPages.has(
                destination.pathname.split("/").pop().toLowerCase()
            ) ||
            destination.href === window.location.href
        ) {
            return;
        }

        event.preventDefault();

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            window.location.assign(destination.href);
            return;
        }

        document.body.classList.add("page-leaving");
        window.setTimeout(() => {
            window.location.assign(destination.href);
        }, 180);
    });
})();
