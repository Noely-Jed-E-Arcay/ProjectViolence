(function () {
    "use strict";

    const SETTINGS_PREFIX = "safeReportSettings:";
    const PRIVACY_KEY = "hideIdentityInAdminReports";

    function getSettingsKey() {
        try {
            const user = JSON.parse(
                localStorage.getItem("currentUser") ||
                localStorage.getItem("safeReportUser") ||
                "null"
            );

            const email = String(user?.email || "").trim().toLowerCase();
            return email
                ? SETTINGS_PREFIX + encodeURIComponent(email)
                : null;
        } catch (error) {
            console.error("Unable to identify privacy settings owner:", error);
            return null;
        }
    }

    function readSettings(key) {
        const stored = localStorage.getItem(key);

        if (stored === null) {
            return {};
        }

        const settings = JSON.parse(stored);

        if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
            throw new Error("Saved account settings are invalid.");
        }

        return settings;
    }

    function initializePrivacySettings() {
        const form = document.getElementById("privacySettingsForm");
        const checkbox = document.getElementById("hideIdentityInAdminReports");
        const cancelButton = document.getElementById("cancelPrivacyChanges");

        if (!form || !checkbox) {
            return;
        }

        const settingsKey = getSettingsKey();

        if (!settingsKey) {
            checkbox.disabled = true;
            form.querySelector('[type="submit"]').disabled = true;
            return;
        }

        function restoreSavedValue() {
            try {
                checkbox.checked = readSettings(settingsKey)[PRIVACY_KEY] === true;
            } catch (error) {
                console.error("Unable to load privacy preferences:", error);
                checkbox.checked = false;
                if (typeof window.showToast === "function") {
                    window.showToast(
                        "Privacy preferences could not be loaded.",
                        "error"
                    );
                }
            }
        }

        restoreSavedValue();

        cancelButton?.addEventListener("click", restoreSavedValue);

        form.addEventListener("submit", event => {
            event.preventDefault();

            try {
                const settings = readSettings(settingsKey);
                settings[PRIVACY_KEY] = checkbox.checked;
                settings.updatedAt = new Date().toISOString();

                localStorage.setItem(settingsKey, JSON.stringify(settings));

                const savedSettings = readSettings(settingsKey);

                if (savedSettings[PRIVACY_KEY] !== checkbox.checked) {
                    throw new Error("Privacy preferences could not be verified.");
                }

                if (typeof window.showToast === "function") {
                    window.showToast("Privacy preferences saved.");
                }
            } catch (error) {
                console.error("Unable to save privacy preferences:", error);
                if (typeof window.showToast === "function") {
                    window.showToast(
                        "Unable to save privacy preferences. Please try again.",
                        "error"
                    );
                }
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializePrivacySettings,
            { once: true }
        );
    } else {
        initializePrivacySettings();
    }
})();
