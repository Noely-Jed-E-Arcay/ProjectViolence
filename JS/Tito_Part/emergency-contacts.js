(function () {
    "use strict";

    const SETTINGS_PREFIX = "safeReportSettings:";

    function getSettingsKey() {
        try {
            const user = JSON.parse(
                localStorage.getItem("currentUser") || "null"
            );
            const email = String(user?.email || "").trim().toLowerCase();

            return email
                ? SETTINGS_PREFIX + encodeURIComponent(email)
                : null;
        } catch (error) {
            console.error("Unable to identify emergency contact settings owner:", error);
            return null;
        }
    }

    function readSettings(key) {
        const raw = localStorage.getItem(key);

        if (raw === null) {
            return {};
        }

        const settings = JSON.parse(raw);

        if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
            throw new Error("Saved account settings are invalid.");
        }

        return settings;
    }

    function renderDashboardContact(settings) {
        const action = document.getElementById("emergencyContactAction");
        const description = document.getElementById("emergencyContactDescription");

        if (!action || !description) {
            return;
        }

        const phone = String(settings.emergencyContactPhone || "").trim();
        const name = String(settings.emergencyContactName || "").trim();

        if (phone) {
            const dialablePhone = phone.replace(/[^\d+]/g, "");
            action.href = `tel:${dialablePhone}`;
            action.setAttribute(
                "aria-label",
                `Call emergency contact${name ? ` ${name}` : ""} at ${phone}`
            );
            description.textContent = name
                ? `Call ${name} · ${phone}`
                : `Call ${phone}`;
            action.removeAttribute("title");
            action.removeAttribute("aria-disabled");
            return;
        }

        action.href = "settings.html#emergencyContacts";
        action.setAttribute("aria-label", "Set up your emergency contact");
        description.textContent = "Add a number to your emergency contacts";
        action.title = "Add a contact in Settings to enable this quick action.";
    }

    function initialize() {
        const key = getSettingsKey();
        const form = document.getElementById("emergencyContactForm");
        const nameInput = document.getElementById("emergencyContactName");
        const phoneInput = document.getElementById("emergencyContactPhone");
        const feedback = document.getElementById("emergencyContactFeedback");

        if (!key) {
            return;
        }

        let settings;

        try {
            settings = readSettings(key);
        } catch (error) {
            console.error("Unable to load emergency contact settings:", error);
            if (feedback) {
                feedback.textContent = "Saved settings could not be loaded.";
            }
            return;
        }

        renderDashboardContact(settings);

        if (!form || !nameInput || !phoneInput) {
            return;
        }

        nameInput.value = String(settings.emergencyContactName || "");
        phoneInput.value = String(settings.emergencyContactPhone || "");

        form.addEventListener("submit", event => {
            event.preventDefault();

            const name = nameInput.value.trim();
            const phone = phoneInput.value.trim();
            const digitCount = phone.replace(/\D/g, "").length;

            if (
                phone &&
                (!/^\+?[\d\s().-]+$/.test(phone) ||
                    digitCount < 7 ||
                    digitCount > 15)
            ) {
                feedback.textContent =
                    "Enter a valid phone number containing 7 to 15 digits.";
                phoneInput.focus();
                return;
            }

            try {
                const currentSettings = readSettings(key);
                const updatedSettings = {
                    ...currentSettings,
                    emergencyContactName: name,
                    emergencyContactPhone: phone,
                    updatedAt: new Date().toISOString()
                };

                localStorage.setItem(key, JSON.stringify(updatedSettings));
                settings = readSettings(key);
                renderDashboardContact(settings);
                feedback.textContent = phone
                    ? "Emergency contact saved."
                    : "Emergency contact removed.";
            } catch (error) {
                console.error("Unable to save emergency contact settings:", error);
                feedback.textContent =
                    "Emergency contact could not be saved. Please try again.";
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize);
    } else {
        initialize();
    }
})();
