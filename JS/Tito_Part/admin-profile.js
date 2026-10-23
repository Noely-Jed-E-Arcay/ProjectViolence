(function () {
    "use strict";

    const USERS_KEY = "safeReportUsers";
    const CURRENT_USER_KEY = "currentUser";
    const LEGACY_USER_KEY = "safeReportUser";
    const ADMIN_PROFILE_KEY = "safeReportAdminProfile";
    const ADMIN_EMAIL_KEY = "safeReportAdminEmail";
    const SETTINGS_PREFIX = "safeReportSettings:";

    function normalizeEmail(email) {
        return String(email || "").trim().toLowerCase();
    }

    function readCurrentUser() {
        const user = JSON.parse(
            localStorage.getItem(CURRENT_USER_KEY) ||
            localStorage.getItem(LEGACY_USER_KEY) ||
            "null"
        );

        if (!user || typeof user !== "object" || Array.isArray(user)) {
            throw new Error("The signed-in administrator could not be read.");
        }

        const role = String(user.role || user.accountType || "")
            .trim()
            .toLowerCase()
            .replace(/[_-]+/g, " ")
            .replace(/\s+account$/, "");

        if (!["admin", "administrator"].includes(role)) {
            throw new Error("Only an administrator can update this profile.");
        }

        return user;
    }

    function renderProfile(fullName) {
        const displayName = fullName || "Administrator";
        const initials = displayName
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part[0].toUpperCase())
            .join("") || "A";

        document.querySelectorAll(
            ".profile-card h2, .profile-mini .profile-details strong"
        ).forEach(element => {
            element.textContent = displayName;
        });

        document.querySelectorAll(
            ".profile-big-avatar, .profile-mini .avatar, #profileBtn"
        ).forEach(element => {
            element.textContent = initials;
        });
    }

    function initializeAdminProfile() {
        const form = document.getElementById("adminProfileForm");

        if (!form) {
            return;
        }

        const firstName = document.getElementById("adminFirstName");
        const lastName = document.getElementById("adminLastName");
        const department = document.getElementById("adminDepartment");
        const email = document.getElementById("adminEmail");
        const feedback = document.getElementById("adminProfileFeedback");

        function showFeedback(message, isError = false) {
            feedback.textContent = message;
            feedback.setAttribute("role", isError ? "alert" : "status");
            feedback.dataset.error = String(isError);
        }

        try {
            const user = readCurrentUser();
            let savedProfile = {};

            try {
                savedProfile = JSON.parse(
                    localStorage.getItem(ADMIN_PROFILE_KEY) || "{}"
                ) || {};
            } catch (error) {
                console.error("Unable to load saved admin profile details:", error);
            }

            const nameParts = String(user.fullName || "")
                .trim()
                .split(/\s+/)
                .filter(Boolean);

            firstName.value = nameParts.slice(0, -1).join(" ") ||
                nameParts[0] || "";
            lastName.value = nameParts.length > 1
                ? nameParts[nameParts.length - 1]
                : "";
            department.value = user.department || savedProfile.department || "";
            email.value = user.email || "";
            renderProfile(user.fullName || "Administrator");
        } catch (error) {
            console.error("Unable to initialize admin profile:", error);
            showFeedback(
                "Account details could not be loaded. Log in again before editing.",
                true
            );
            form.querySelectorAll("input, button").forEach(control => {
                control.disabled = true;
            });
            return;
        }

        form.addEventListener("submit", event => {
            event.preventDefault();
            showFeedback("");

            if (!form.reportValidity()) {
                return;
            }

            const first = firstName.value.trim();
            const last = lastName.value.trim();
            const newEmail = normalizeEmail(email.value);
            const departmentName = department.value.trim();

            if (!first || !last) {
                showFeedback("Enter both a first and last name.", true);
                return;
            }

            try {
                const currentUser = readCurrentUser();
                const oldEmail = normalizeEmail(currentUser.email);
                const usersRaw = localStorage.getItem(USERS_KEY);
                const users = usersRaw === null
                    ? []
                    : JSON.parse(usersRaw);

                if (!Array.isArray(users)) {
                    throw new Error("Registered account data is invalid.");
                }

                const matches = [];
                users.forEach((account, index) => {
                    if (normalizeEmail(account.email) === oldEmail) {
                        matches.push(index);
                    }
                });

                if (matches.length > 1) {
                    throw new Error(
                        "The administrator account is ambiguous. No changes were saved."
                    );
                }

                let accountIndex = matches[0];
                let account = accountIndex === undefined
                    ? JSON.parse(
                        localStorage.getItem(LEGACY_USER_KEY) || "null"
                    )
                    : users[accountIndex];

                if (
                    !account ||
                    normalizeEmail(account.email) !== oldEmail
                ) {
                    throw new Error(
                        "The registered administrator account could not be found."
                    );
                }

                if (
                    users.some((registeredAccount, index) =>
                        index !== accountIndex &&
                        normalizeEmail(registeredAccount.email) === newEmail
                    )
                ) {
                    throw new Error("Another account is already using this email.");
                }

                const updatedUser = {
                    ...account,
                    ...currentUser,
                    fullName: `${first} ${last}`,
                    email: newEmail,
                    department: departmentName
                };

                if (accountIndex === undefined) {
                    accountIndex = users.length;
                    users.push(updatedUser);
                } else {
                    users[accountIndex] = updatedUser;
                }

                const profile = {
                    firstName: first,
                    lastName: last,
                    department: departmentName,
                    email: newEmail
                };
                const localChanges = [
                    [USERS_KEY, JSON.stringify(users)],
                    [CURRENT_USER_KEY, JSON.stringify(updatedUser)],
                    [LEGACY_USER_KEY, JSON.stringify(updatedUser)],
                    [ADMIN_PROFILE_KEY, JSON.stringify(profile)]
                ];

                if (oldEmail !== newEmail) {
                    const previousSettings =
                        localStorage.getItem(
                            SETTINGS_PREFIX + encodeURIComponent(oldEmail)
                        );
                    const newSettingsKey =
                        SETTINGS_PREFIX + encodeURIComponent(newEmail);

                    if (
                        previousSettings !== null &&
                        localStorage.getItem(newSettingsKey) === null
                    ) {
                        localChanges.push([newSettingsKey, previousSettings]);
                    }
                }

                const previousLocal = localChanges.map(([key]) => [
                    key,
                    localStorage.getItem(key)
                ]);
                const previousAdminEmail =
                    sessionStorage.getItem(ADMIN_EMAIL_KEY);

                try {
                    localChanges.forEach(([key, value]) => {
                        localStorage.setItem(key, value);
                    });
                    sessionStorage.setItem(ADMIN_EMAIL_KEY, newEmail);
                } catch (error) {
                    previousLocal.forEach(([key, value]) => {
                        if (value === null) {
                            localStorage.removeItem(key);
                        } else {
                            localStorage.setItem(key, value);
                        }
                    });

                    if (previousAdminEmail === null) {
                        sessionStorage.removeItem(ADMIN_EMAIL_KEY);
                    } else {
                        sessionStorage.setItem(
                            ADMIN_EMAIL_KEY,
                            previousAdminEmail
                        );
                    }

                    throw error;
                }

                renderProfile(updatedUser.fullName);
                showFeedback("Administrator profile saved.");
            } catch (error) {
                console.error("Unable to save administrator profile:", error);
                showFeedback(
                    error instanceof Error
                        ? error.message
                        : "Unable to save the administrator profile.",
                    true
                );
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeAdminProfile,
            { once: true }
        );
    } else {
        initializeAdminProfile();
    }
})();
