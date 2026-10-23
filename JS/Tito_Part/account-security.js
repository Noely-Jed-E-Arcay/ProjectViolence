(function () {
    "use strict";

    const USERS_KEY = "safeReportUsers";
    const CURRENT_USER_KEY = "currentUser";
    const LEGACY_USER_KEY = "safeReportUser";

    function readCurrentUser() {
        try {
            const user = JSON.parse(
                localStorage.getItem(CURRENT_USER_KEY) ||
                localStorage.getItem(LEGACY_USER_KEY) ||
                "null"
            );

            return user && typeof user === "object" ? user : null;
        } catch (error) {
            console.error("Unable to read the current account:", error);
            return null;
        }
    }

    function readUsers() {
        const storedUsers = localStorage.getItem(USERS_KEY);

        if (storedUsers === null) {
            return [];
        }

        const users = JSON.parse(storedUsers);

        if (!Array.isArray(users)) {
            throw new Error("Registered account data is invalid.");
        }

        return users;
    }

    function createDialog() {
        const dialog = document.createElement("dialog");
        dialog.className = "account-security-dialog";
        dialog.setAttribute("aria-labelledby", "changePasswordTitle");
        dialog.innerHTML = `
            <form class="account-security-form" id="changePasswordForm">
                <div class="account-security-heading">
                    <div>
                        <p class="account-security-eyebrow">ACCOUNT SECURITY</p>
                        <h2 id="changePasswordTitle">Change password</h2>
                    </div>
                    <button class="account-security-close" type="button"
                        aria-label="Close password dialog">&times;</button>
                </div>
                <p class="account-security-note">
                    Choose a password with at least 6 characters.
                    This browser-only prototype stores credentials locally.
                </p>
                <label for="currentPassword">Current password</label>
                <div class="password-input-wrap">
                    <input id="currentPassword" name="currentPassword"
                        type="password" autocomplete="current-password" required>
                    <button type="button" data-toggle-password="currentPassword"
                        aria-label="Show current password">Show</button>
                </div>
                <label for="newPassword">New password</label>
                <div class="password-input-wrap">
                    <input id="newPassword" name="newPassword" type="password"
                        autocomplete="new-password" minlength="6" required>
                    <button type="button" data-toggle-password="newPassword"
                        aria-label="Show new password">Show</button>
                </div>
                <label for="confirmPassword">Confirm new password</label>
                <div class="password-input-wrap">
                    <input id="confirmPassword" name="confirmPassword"
                        type="password" autocomplete="new-password"
                        minlength="6" required>
                    <button type="button" data-toggle-password="confirmPassword"
                        aria-label="Show confirmed password">Show</button>
                </div>
                <p class="account-security-feedback" id="passwordFeedback"
                    role="status" aria-live="polite"></p>
                <div class="account-security-actions">
                    <button class="secondary-button" type="button"
                        data-close-password-dialog>Cancel</button>
                    <button class="primary-button blue-button" type="submit">
                        Change Password
                    </button>
                </div>
            </form>
        `;

        document.body.appendChild(dialog);
        return dialog;
    }

    function setupPasswordChange() {
        const trigger = document.getElementById("changePasswordBtn");

        if (!trigger) {
            return;
        }

        const dialog = createDialog();
        const form = dialog.querySelector("#changePasswordForm");
        const feedback = dialog.querySelector("#passwordFeedback");
        const submitButton = form.querySelector('[type="submit"]');
        const passwordFields = [
            form.elements.currentPassword,
            form.elements.newPassword,
            form.elements.confirmPassword
        ];
        let processing = false;

        function clearForm() {
            form.reset();
            feedback.textContent = "";
            feedback.removeAttribute("data-error");
            submitButton.disabled = false;
            processing = false;
            passwordFields.forEach(field => {
                field.type = "password";
            });
            dialog.querySelectorAll("[data-toggle-password]").forEach(button => {
                button.textContent = "Show";
                button.setAttribute(
                    "aria-label",
                    `Show ${button.dataset.togglePassword === "currentPassword"
                        ? "current"
                        : button.dataset.togglePassword === "newPassword"
                            ? "new"
                            : "confirmed"} password`
                );
            });
        }

        function closeDialog() {
            if (dialog.open) {
                dialog.close();
            }
        }

        trigger.addEventListener("click", () => {
            clearForm();
            dialog.showModal();
            passwordFields[0].focus();
        });

        dialog.querySelector(".account-security-close")
            .addEventListener("click", closeDialog);
        dialog.querySelector("[data-close-password-dialog]")
            .addEventListener("click", closeDialog);
        dialog.addEventListener("close", () => {
            clearForm();
            trigger.focus();
        });
        dialog.addEventListener("click", event => {
            if (event.target === dialog) {
                closeDialog();
            }
        });

        dialog.querySelectorAll("[data-toggle-password]").forEach(button => {
            button.addEventListener("click", () => {
                const field = form.elements[button.dataset.togglePassword];
                const showPassword = field.type === "password";

                field.type = showPassword ? "text" : "password";
                button.textContent = showPassword ? "Hide" : "Show";
                button.setAttribute(
                    "aria-label",
                    `${showPassword ? "Hide" : "Show"} ${
                        field.id === "currentPassword"
                            ? "current"
                            : field.id === "newPassword"
                                ? "new"
                                : "confirmed"
                    } password`
                );
            });
        });

        form.addEventListener("submit", event => {
            event.preventDefault();

            if (processing) {
                return;
            }

            const currentPassword = form.elements.currentPassword.value;
            const newPassword = form.elements.newPassword.value;
            const confirmPassword = form.elements.confirmPassword.value;

            feedback.textContent = "";
            feedback.removeAttribute("data-error");

            if (!currentPassword || !newPassword || !confirmPassword) {
                feedback.textContent = "Complete all password fields.";
                feedback.dataset.error = "true";
                return;
            }

            if (newPassword.length < 6) {
                feedback.textContent =
                    "The new password must be at least 6 characters.";
                feedback.dataset.error = "true";
                return;
            }

            if (newPassword !== confirmPassword) {
                feedback.textContent =
                    "The new password and confirmation do not match.";
                feedback.dataset.error = "true";
                return;
            }

            if (newPassword === currentPassword) {
                feedback.textContent =
                    "Choose a new password different from your current one.";
                feedback.dataset.error = "true";
                return;
            }

            processing = true;
            submitButton.disabled = true;
            submitButton.textContent = "Updating...";

            try {
                const currentUser = readCurrentUser();

                if (!currentUser || !currentUser.email) {
                    throw new Error(
                        "Your active account could not be identified. Log in again."
                    );
                }

                const email = String(currentUser.email).trim().toLowerCase();
                const users = readUsers();
                const matchingIndexes = [];

                users.forEach((user, index) => {
                    if (
                        String(user.email || "").trim().toLowerCase() === email
                    ) {
                        matchingIndexes.push(index);
                    }
                });

                let account;
                let userIndex = matchingIndexes[0];

                if (matchingIndexes.length > 1) {
                    throw new Error(
                        "This account is ambiguous in local storage. No changes were made."
                    );
                }

                if (userIndex !== undefined) {
                    account = users[userIndex];
                } else {
                    const legacyAccount = JSON.parse(
                        localStorage.getItem(LEGACY_USER_KEY) || "null"
                    );

                    if (
                        !legacyAccount ||
                        String(legacyAccount.email || "")
                            .trim()
                            .toLowerCase() !== email
                    ) {
                        throw new Error(
                            "Your registered account could not be found. No changes were made."
                        );
                    }

                    account = legacyAccount;
                    userIndex = users.length;
                    users.push(account);
                }

                if (String(account.password || "") !== currentPassword) {
                    throw new Error("The current password is incorrect.");
                }

                const updatedAccount = {
                    ...account,
                    ...currentUser,
                    password: newPassword
                };
                users[userIndex] = updatedAccount;

                const keys = [
                    [USERS_KEY, JSON.stringify(users)],
                    [CURRENT_USER_KEY, JSON.stringify(updatedAccount)],
                    [LEGACY_USER_KEY, JSON.stringify(updatedAccount)]
                ];
                const previousValues = keys.map(([key]) => [
                    key,
                    localStorage.getItem(key)
                ]);

                try {
                    keys.forEach(([key, value]) => {
                        localStorage.setItem(key, value);
                    });
                } catch (error) {
                    previousValues.forEach(([key, value]) => {
                        if (value === null) {
                            localStorage.removeItem(key);
                        } else {
                            localStorage.setItem(key, value);
                        }
                    });
                    throw error;
                }

                feedback.textContent =
                    "Password updated. Use the new password the next time you log in.";
                form.reset();
            } catch (error) {
                console.error("Unable to change account password:", error);
                feedback.textContent =
                    error instanceof Error
                        ? error.message
                        : "Unable to update your password. Please try again.";
                feedback.dataset.error = "true";
            } finally {
                processing = false;
                submitButton.disabled = false;
                submitButton.textContent = "Change Password";
            }
        });
    }

    function initialize() {
        setupPasswordChange();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize, { once: true });
    } else {
        initialize();
    }
})();
