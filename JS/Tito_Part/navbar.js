
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
       INITIALIZATION
    ===================================================== */

    function initializeNavbar() {
        initializeLogoutButtons();
        initializeThemeButton();
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
