/* =========================================
   SAFEREPORT - SHARED APPLICATION FUNCTIONS
   Authentication Guard and Settings Persistence
========================================= */

(function () {
    "use strict";

    /* =========================================
       STORAGE KEYS
    ========================================= */

    const LOGIN_KEY = "safeReportLoggedIn";
    const CURRENT_USER_KEY = "currentUser";

    const ADMIN_LOGIN_KEY = "safeReportAdminLoggedIn";
    const ADMIN_EMAIL_KEY = "safeReportAdminEmail";

    const SETTINGS_PREFIX = "safeReportSettings:";

    /* =========================================
       STUDENT AUTHENTICATION
    ========================================= */

    function getCurrentStudent() {
        if (localStorage.getItem(LOGIN_KEY) !== "true") {
            return null;
        }

        try {
            const savedUser = localStorage.getItem(CURRENT_USER_KEY);

            if (!savedUser) {
                return null;
            }

            const user = JSON.parse(savedUser);

            if (
                !user ||
                typeof user !== "object" ||
                Array.isArray(user) ||
                typeof user.email !== "string" ||
                user.email.trim() === ""
            ) {
                return null;
            }

            const role = String(
                user.role || user.accountType || "student"
            )
                .trim()
                .toLowerCase()
                .replace(/[_-]+/g, " ")
                .replace(/\s+account$/, "");

            if (role === "admin" || role === "administrator") {
                return null;
            }

            return user;
        } catch (error) {
            console.error(
                "Unable to validate the saved student session:",
                error
            );

            return null;
        }
    }

    /* =========================================
       ADMIN AUTHENTICATION
    ========================================= */

    function isAdminAuthenticated() {
        if (sessionStorage.getItem(ADMIN_LOGIN_KEY) !== "true") {
            return false;
        }

        const sessionEmail = String(
            sessionStorage.getItem(ADMIN_EMAIL_KEY) || ""
        )
            .trim()
            .toLowerCase();

        if (!sessionEmail) {
            return false;
        }

        try {
            const user = JSON.parse(
                localStorage.getItem(CURRENT_USER_KEY) || "null"
            );

            const role = String(
                user?.role || user?.accountType || ""
            )
                .trim()
                .toLowerCase()
                .replace(/[_-]+/g, " ")
                .replace(/\s+account$/, "");

            return Boolean(
                user &&
                typeof user === "object" &&
                !Array.isArray(user) &&
                (role === "admin" || role === "administrator") &&
                String(user.email || "").trim().toLowerCase() === sessionEmail
            );
        } catch (error) {
            console.error(
                "Unable to validate the administrator session:",
                error
            );

            return false;
        }
    }

    /* =========================================
       AUTHENTICATION GUARD
    ========================================= */

    function enforceAuthentication() {
        const student = getCurrentStudent();
        const adminAuthenticated = isAdminAuthenticated();

        if (adminAuthenticated) {
            const currentPage = window.location.pathname
                .split("/")
                .pop()
                .toLowerCase() || "index.html";

            if (
                [
                    "index.html",
                    "report.html",
                    "myreports.html",
                    "profile.html",
                    "settings.html"
                ].includes(currentPage)
            ) {
                window.location.replace("admin-dashboard.html");
            }

            return;
        }

        if (student) {
            sessionStorage.removeItem(ADMIN_LOGIN_KEY);
            sessionStorage.removeItem(ADMIN_EMAIL_KEY);
            return;
        }

        // Remove invalid student session information.
        localStorage.removeItem(LOGIN_KEY);
        localStorage.removeItem(CURRENT_USER_KEY);

        // Remove invalid administrator session information.
        sessionStorage.removeItem(ADMIN_LOGIN_KEY);
        sessionStorage.removeItem(ADMIN_EMAIL_KEY);

        const currentPage = window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();

        window.location.replace(
            currentPage === "index.html" || currentPage === ""
                ? "guest.html"
                : "login.html"
        );
    }

    /* =========================================
       GET SETTINGS OWNER
    ========================================= */

    function getSettingsOwner() {
        const student = getCurrentStudent();

        if (student && student.email) {
            return String(student.email)
                .trim()
                .toLowerCase();
        }

        if (isAdminAuthenticated()) {
            return String(
                sessionStorage.getItem(ADMIN_EMAIL_KEY) || ""
            )
                .trim()
                .toLowerCase();
        }

        return "";
    }

    function getSettingsStorageKey() {
        const owner = getSettingsOwner();

        if (!owner) {
            return null;
        }

        return SETTINGS_PREFIX + encodeURIComponent(owner);
    }

    /* =========================================
       LOAD NOTIFICATION PREFERENCES
    ========================================= */

    function initializeNotificationSettings() {
        const reportNotifications = document.getElementById(
            "reportNotifications"
        );

        const securityNotifications = document.getElementById(
            "securityNotifications"
        );

        // This page does not contain notification settings.
        if (!reportNotifications && !securityNotifications) {
            return;
        }

        const storageKey = getSettingsStorageKey();

        if (!storageKey) {
            return;
        }

        try {
            const savedSettings = localStorage.getItem(storageKey);

            // Keep the page's existing defaults for first-time users.
            if (savedSettings === null) {
                const saved = saveNotificationPreferences(
                    storageKey,
                    reportNotifications,
                    securityNotifications
                );

                if (
                    !saved &&
                    typeof window.showToast === "function"
                ) {
                    window.showToast(
                        "Notification preferences could not be initialized.",
                        "error"
                    );
                }
            } else {
                const settings = JSON.parse(savedSettings);

                if (
                    !settings ||
                    typeof settings !== "object" ||
                    Array.isArray(settings)
                ) {
                    throw new Error(
                        "Saved notification preferences are invalid."
                    );
                }

                if (
                    reportNotifications &&
                    typeof settings.reportNotifications === "boolean"
                ) {
                    reportNotifications.checked =
                        settings.reportNotifications;
                }

                if (
                    securityNotifications &&
                    typeof settings.securityNotifications === "boolean"
                ) {
                    securityNotifications.checked =
                        settings.securityNotifications;
                }
            }
        } catch (error) {
            console.error(
                "Unable to load notification preferences:",
                error
            );
        }

        // Save immediately whenever a preference changes.
        [reportNotifications, securityNotifications].forEach(
            checkbox => {
                if (!checkbox) {
                    return;
                }

                checkbox.addEventListener("change", () => {
                    const saved = saveNotificationPreferences(
                        storageKey,
                        reportNotifications,
                        securityNotifications
                    );

                    if (
                        !saved &&
                        typeof window.showToast === "function"
                    ) {
                        window.showToast(
                            "Unable to save notification preferences.",
                            "error"
                        );
                    }
                });
            }
        );
    }

    /* =========================================
       SAVE NOTIFICATION PREFERENCES
    ========================================= */

    function saveNotificationPreferences(
        storageKey,
        reportNotifications,
        securityNotifications
    ) {
        if (!storageKey) {
            return false;
        }

        let existingSettings = {};

        try {
            const existingValue = localStorage.getItem(storageKey);

            if (existingValue !== null) {
                const parsedSettings = JSON.parse(existingValue);

                if (
                    !parsedSettings ||
                    typeof parsedSettings !== "object" ||
                    Array.isArray(parsedSettings)
                ) {
                    throw new Error(
                        "Saved account preferences are invalid."
                    );
                }

                existingSettings = parsedSettings;
            }
        } catch (error) {
            console.error(
                "Unable to preserve existing account preferences:",
                error
            );

            return false;
        }

        const settings = {
            ...existingSettings,
            reportNotifications: reportNotifications
                ? reportNotifications.checked
                : true,

            securityNotifications: securityNotifications
                ? securityNotifications.checked
                : true,

            updatedAt: new Date().toISOString()
        };

        try {
            localStorage.setItem(
                storageKey,
                JSON.stringify(settings)
            );

            // Confirm that the browser stored the preferences.
            const savedSettings = JSON.parse(
                localStorage.getItem(storageKey) || "null"
            );

            return Boolean(
                savedSettings &&
                savedSettings.reportNotifications ===
                    settings.reportNotifications &&
                savedSettings.securityNotifications ===
                    settings.securityNotifications
            );
        } catch (error) {
            console.error(
                "Unable to save notification preferences:",
                error
            );

            return false;
        }
    }

    /* =========================================
       INITIALIZATION
    ========================================= */

    function initializeApp() {
        enforceAuthentication();

        /*
         * Do not initialize account-specific settings if the
         * current visitor does not have a valid session.
         */
        if (
            !getCurrentStudent() &&
            !isAdminAuthenticated()
        ) {
            return;
        }

        initializeNotificationSettings();
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeApp
        );
    } else {
        initializeApp();
    }
})();