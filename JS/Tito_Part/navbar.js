
/* =========================================================
   SAFEREPORT NAVBAR AND DARK MODE
   Dark mode is available only to authenticated users
   and administrators.
========================================================= */

(function () {
    "use strict";

    const THEME_KEY = "safeReportTheme";
    const LOGIN_KEY = "safeReportLoggedIn";
    const CURRENT_USER_KEY = "currentUser";
    const ADMIN_LOGIN_KEY = "safeReportAdminLoggedIn";
    const ADMIN_EMAIL_KEY = "safeReportAdminEmail";

    /* =====================================================
       AUTHENTICATION CHECK
    ===================================================== */

    function isAuthenticated() {
        // Check administrator session.
        const adminLoggedIn =
            sessionStorage.getItem(ADMIN_LOGIN_KEY) === "true";

        if (adminLoggedIn) {
            return true;
        }

        // Check regular user session.
        const userLoggedIn =
            localStorage.getItem(LOGIN_KEY) === "true";

        if (!userLoggedIn) {
            return false;
        }

        try {
            const savedUser =
                localStorage.getItem(CURRENT_USER_KEY);

            if (!savedUser) {
                return false;
            }

            const currentUser = JSON.parse(savedUser);

            return Boolean(
                currentUser &&
                typeof currentUser === "object" &&
                currentUser.email
            );
        } catch (error) {
            console.error(
                "SafeReport: Unable to verify the current user.",
                error
            );

            return false;
        }
    }

    /* =====================================================
       APPLY THEME
    ===================================================== */

    function applyTheme(isDark) {
        // Never apply dark mode to unauthenticated visitors.
        if (!isAuthenticated()) {
            isDark = false;
        }

        const root = document.documentElement;
        const body = document.body;

        root.dataset.theme = isDark ? "dark" : "light";
        root.style.colorScheme = isDark ? "dark" : "light";

        body.classList.toggle("dark-mode", isDark);

        // Synchronize the theme toggle, if present.
        const themeButton =
            document.getElementById("themeToggle");

        if (themeButton) {
            themeButton.hidden = !isAuthenticated();
            themeButton.style.display =
                isAuthenticated() ? "" : "none";

            themeButton.setAttribute(
                "aria-hidden",
                isAuthenticated() ? "false" : "true"
            );

            themeButton.setAttribute(
                "aria-pressed",
                isDark ? "true" : "false"
            );

            themeButton.setAttribute(
                "aria-label",
                isDark
                    ? "Switch to light mode"
                    : "Switch to dark mode"
            );

            themeButton.setAttribute(
                "title",
                isDark
                    ? "Switch to light mode"
                    : "Switch to dark mode"
            );

            const icon = themeButton.querySelector(
                "[data-theme-icon]"
            );

            if (icon) {
                icon.textContent = isDark ? "☀️" : "🌙";
            } else {
                themeButton.textContent = isDark ? "☀️" : "☾";
            }
        }
    }

    /* =====================================================
       THEME TOGGLE
    ===================================================== */

    function initializeThemeButton() {
        const themeButton =
            document.getElementById("themeToggle");

        // Public pages and signed-out visitors always use light mode.
        if (!isAuthenticated()) {
            applyTheme(false);

            if (themeButton) {
                themeButton.hidden = true;
                themeButton.style.display = "none";
            }

            return;
        }

        // Restore the saved preference for authenticated pages.
        const savedTheme = localStorage.getItem(THEME_KEY);

        applyTheme(savedTheme === "dark");

        if (!themeButton) {
            return;
        }

        // Avoid attaching the same click handler more than once.
        if (themeButton.dataset.themeInitialized === "true") {
            return;
        }

        themeButton.dataset.themeInitialized = "true";

        themeButton.addEventListener("click", function () {
            // Recheck the session before changing the theme.
            if (!isAuthenticated()) {
                localStorage.setItem(THEME_KEY, "light");
                applyTheme(false);
                return;
            }

            const enableDarkMode =
                !document.body.classList.contains("dark-mode");

            localStorage.setItem(
                THEME_KEY,
                enableDarkMode ? "dark" : "light"
            );

            applyTheme(enableDarkMode);

            if (typeof window.showToast === "function") {
                window.showToast(
                    enableDarkMode
                        ? "Dark mode enabled."
                        : "Light mode enabled."
                );
            }
        });
    }

    /* =====================================================
       LOGOUT
    ===================================================== */

    function initializeLogoutButtons() {
        const logoutButtons =
            document.querySelectorAll(".logout, #logoutBtn");

        logoutButtons.forEach(function (button) {
            if (button.dataset.logoutInitialized === "true") {
                return;
            }

            button.dataset.logoutInitialized = "true";

            button.addEventListener("click", function () {
                // Clear the active student session.
                localStorage.removeItem(LOGIN_KEY);
                localStorage.removeItem(CURRENT_USER_KEY);

                // Clear the administrator session.
                sessionStorage.removeItem(ADMIN_LOGIN_KEY);
                sessionStorage.removeItem(ADMIN_EMAIL_KEY);

                // Keep the saved theme preference for the next login.
                // Immediately restore the default appearance.
                applyTheme(false);
            });
        });
    }

    /* =====================================================
       PROFILE MENUS
    ===================================================== */

    function initializeProfileMenus() {
        document.querySelectorAll(".profile-menu-wrap").forEach(wrapper => {
            const button = wrapper.querySelector("#profileBtn");
            const dropdown = wrapper.querySelector("#profileDropdown");

            if (
                !button ||
                !dropdown ||
                button.dataset.profileMenuInitialized === "true"
            ) {
                return;
            }

            button.dataset.profileMenuInitialized = "true";

            function closeMenu(restoreFocus = false) {
                dropdown.hidden = true;
                button.setAttribute("aria-expanded", "false");

                if (restoreFocus) {
                    button.focus();
                }
            }

            function openMenu(focusLast = false) {
                dropdown.hidden = false;
                button.setAttribute("aria-expanded", "true");

                if (focusLast) {
                    const items = getMenuItems();
                    items[items.length - 1]?.focus();
                } else if (focusLast === false && document.activeElement === button) {
                    getMenuItems()[0]?.focus();
                }
            }

            function getMenuItems() {
                return Array.from(
                    dropdown.querySelectorAll(
                        'a[href]:not([aria-disabled="true"]), button:not([disabled])'
                    )
                ).filter(item => !item.hidden);
            }

            button.addEventListener("click", () => {
                if (dropdown.hidden) {
                    dropdown.hidden = false;
                    button.setAttribute("aria-expanded", "true");
                } else {
                    closeMenu();
                }
            });

            button.addEventListener("keydown", event => {
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();

                    if (dropdown.hidden) {
                        openMenu(event.key === "ArrowUp");
                    } else {
                        const items = getMenuItems();
                        const item = event.key === "ArrowDown"
                            ? items[0]
                            : items[items.length - 1];

                        item?.focus();
                    }
                }
            });

            dropdown.addEventListener("keydown", event => {
                const items = getMenuItems();
                const currentIndex = items.indexOf(document.activeElement);

                if (event.key === "Escape") {
                    event.preventDefault();
                    closeMenu(true);
                    return;
                }

                if (!items.length) {
                    return;
                }

                let nextIndex;

                if (event.key === "ArrowDown") {
                    nextIndex = (currentIndex + 1) % items.length;
                } else if (event.key === "ArrowUp") {
                    nextIndex = (currentIndex - 1 + items.length) % items.length;
                } else if (event.key === "Home") {
                    nextIndex = 0;
                } else if (event.key === "End") {
                    nextIndex = items.length - 1;
                }

                if (nextIndex !== undefined) {
                    event.preventDefault();
                    items[nextIndex].focus();
                }
            });

            dropdown.addEventListener("click", event => {
                if (event.target.closest("a[href]")) {
                    closeMenu();
                }
            });

            document.addEventListener("click", event => {
                if (!wrapper.contains(event.target)) {
                    closeMenu();
                }
            });

            document.addEventListener("keydown", event => {
                if (event.key === "Escape" && !dropdown.hidden) {
                    closeMenu(true);
                }
            });
        });
    }

    /* =====================================================
       INITIALIZATION
    ===================================================== */

    function initializeNavbar() {
        initializeLogoutButtons();
        initializeThemeButton();
        initializeProfileMenus();
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeNavbar
        );
    } else {
        initializeNavbar();
    }

    /* =====================================================
       PUBLIC THEME API
       Allows other project scripts to refresh theme handling.
    ===================================================== */

    window.SafeReportTheme = {
        apply: applyTheme,
        refresh: initializeThemeButton,
        isAuthenticated: isAuthenticated
    };
})();
