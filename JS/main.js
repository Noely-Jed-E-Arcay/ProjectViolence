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
        return (
            sessionStorage.getItem(ADMIN_LOGIN_KEY) === "true" &&
            Boolean(
                sessionStorage.getItem(ADMIN_EMAIL_KEY)?.trim()
            )
        );
    }

    /* =========================================
       AUTHENTICATION GUARD
    ========================================= */

    function enforceAuthentication() {
        const student = getCurrentStudent();
        const adminAuthenticated = isAdminAuthenticated();

        if (student || adminAuthenticated) {
            return;
        }

        // Remove invalid student session information.
        localStorage.removeItem(LOGIN_KEY);
        localStorage.removeItem(CURRENT_USER_KEY);

        // Remove invalid administrator session information.
        sessionStorage.removeItem(ADMIN_LOGIN_KEY);
        sessionStorage.removeItem(ADMIN_EMAIL_KEY);

        window.location.replace("login.html");
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
                saveNotificationPreferences(
                    storageKey,
                    reportNotifications,
                    securityNotifications
                );
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
                    saveNotificationPreferences(
                        storageKey,
                        reportNotifications,
                        securityNotifications
                    );
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

        const settings = {
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