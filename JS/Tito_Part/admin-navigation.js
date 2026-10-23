(function () {
    "use strict";

    function initializeAdminNavigation() {
        const sidebar = document.getElementById("adminSidebar");
        const toggle = document.getElementById("adminMenuToggle");
        const backdrop = document.getElementById("adminSidebarBackdrop");
        const links = document.querySelectorAll("[data-admin-nav]");

        function setNavigationOpen(isOpen) {
            if (!sidebar || !toggle) {
                return;
            }

            sidebar.classList.toggle("is-open", isOpen);
            document.body.classList.toggle("admin-navigation-open", isOpen);
            toggle.setAttribute("aria-expanded", String(isOpen));
            toggle.setAttribute(
                "aria-label",
                isOpen ? "Close navigation" : "Open navigation"
            );

            if (backdrop) {
                backdrop.hidden = !isOpen;
            }
        }

        function setActiveLink() {
            const page = window.location.pathname
                .split("/")
                .pop()
                .toLowerCase();
            const requestedStatus = new URLSearchParams(
                window.location.search
            ).get("status");
            const hash = window.location.hash;
            let activeItem = "dashboard";

            if (page === "admin-reports.html") {
                const normalizedStatus = String(requestedStatus || "all")
                    .trim()
                    .toLowerCase()
                    .replace(/[_-]+/g, " ")
                    .replace(/\s+/g, " ");
                activeItem = normalizedStatus === "pending"
                    ? "pending"
                    : normalizedStatus === "under review"
                        ? "under-review"
                        : normalizedStatus === "resolved"
                            ? "resolved"
                            : "all";
            } else if (page === "admin-profile.html") {
                activeItem = hash === "#admin-security" ? "settings" : "profile";
            }

            links.forEach(link => {
                const isActive = link.dataset.adminNav === activeItem;
                link.classList.toggle("active", isActive);
                if (isActive) {
                    link.setAttribute("aria-current", "page");
                } else {
                    link.removeAttribute("aria-current");
                }
            });
        }

        setActiveLink();

        if (toggle && sidebar) {
            toggle.addEventListener("click", () => {
                setNavigationOpen(!sidebar.classList.contains("is-open"));
            });
        }

        if (backdrop) {
            backdrop.addEventListener("click", () => {
                setNavigationOpen(false);
            });
        }

        links.forEach(link => {
            link.addEventListener("click", () => {
                setNavigationOpen(false);
            });
        });

        document.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                setNavigationOpen(false);
            }
        });

        window.addEventListener("resize", () => {
            if (window.innerWidth > 760) {
                setNavigationOpen(false);
            }
        });

        try {
            const user = JSON.parse(
                localStorage.getItem("currentUser") || "null"
            );
            const name = String(
                user?.fullName || user?.name || "Administrator"
            ).trim();
            const initials = name
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map(part => part.charAt(0).toUpperCase())
                .join("") || "A";

            document.querySelectorAll("[data-admin-name]").forEach(element => {
                element.textContent = name;
            });
            document.querySelectorAll("[data-admin-initials]").forEach(element => {
                element.textContent = initials;
            });
            document.querySelectorAll("[data-admin-logout]").forEach(link => {
                link.addEventListener("click", () => {
                    sessionStorage.removeItem("safeReportAdminLoggedIn");
                    sessionStorage.removeItem("safeReportAdminEmail");
                    localStorage.removeItem("safeReportAdminRemembered");
                    localStorage.removeItem("safeReportLoggedIn");
                    localStorage.removeItem("currentUser");
                });
            });
        } catch (error) {
            console.error("Unable to display administrator navigation profile:", error);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeAdminNavigation, {
            once: true
        });
    } else {
        initializeAdminNavigation();
    }
})();
