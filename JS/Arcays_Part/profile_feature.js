/* =========================================
   SAFEREPORT PROFILE FEATURE
   Shared profile display and profile updates
========================================= */

(function () {
    "use strict";

    const USERS_KEY = "safeReportUsers";
    const CURRENT_USER_KEY = "currentUser";
    const LEGACY_USER_KEY = "safeReportUser";
    const LOGIN_KEY = "safeReportLoggedIn";
    const SETTINGS_PREFIX = "safeReportSettings:";

    /* =========================================
       ACCOUNT STORAGE
    ========================================= */

    function normalizeEmail(email) {
        return String(email || "").trim().toLowerCase();
    }

    function normalizeStudentId(studentId) {
        return String(studentId || "").trim().toLowerCase();
    }

    function getCurrentUser() {
        try {
            const savedUser = localStorage.getItem(CURRENT_USER_KEY);

            if (savedUser) {
                const user = JSON.parse(savedUser);

                if (user && typeof user === "object") {
                    return user;
                }
            }

            // Compatibility with the previous account storage.
            const legacyUser = localStorage.getItem(LEGACY_USER_KEY);

            if (legacyUser) {
                const user = JSON.parse(legacyUser);

                if (user && typeof user === "object") {
                    return user;
                }
            }
        } catch (error) {
            console.error("Unable to load the current user:", error);
        }

        return null;
    }

    function getUsers() {
        try {
            const savedUsers = localStorage.getItem(USERS_KEY);

            if (!savedUsers) {
                return [];
            }

            const users = JSON.parse(savedUsers);

            return Array.isArray(users) ? users : [];
        } catch (error) {
            console.error("Unable to load registered users:", error);
            throw new Error("Registered accounts could not be loaded.");
        }
    }

    function saveUsers(users) {
        if (!Array.isArray(users)) {
            throw new TypeError("Registered accounts must be an array.");
        }

        localStorage.setItem(USERS_KEY, JSON.stringify(users));

        // Verify that the browser accepted the saved account list.
        const savedUsers = JSON.parse(
            localStorage.getItem(USERS_KEY) || "null"
        );

        if (!Array.isArray(savedUsers)) {
            throw new Error("Registered accounts could not be verified.");
        }
    }

    function getUserInitials(name) {
        return String(name || "User")
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part.charAt(0).toUpperCase())
            .join("") || "U";
    }

    function getNameParts(fullName) {
        const parts = String(fullName || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (parts.length <= 1) {
            return {
                firstName: parts[0] || "",
                lastName: ""
            };
        }

        return {
            firstName: parts.slice(0, -1).join(" "),
            lastName: parts[parts.length - 1]
        };
    }

    /* =========================================
       UPDATE USER INFORMATION ACROSS PAGES
    ========================================= */

    function displayUserInfo() {
        const user = getCurrentUser();

        if (!user || typeof user !== "object") {
            return;
        }

        const fullName = String(user.fullName || "User").trim();
        const email = String(user.email || "");
        const studentId = String(user.studentId || "");

        const role = String(user.role || "Student")
            .replace(/\s+Account$/i, "")
            .trim() || "Student";

        const initials = getUserInitials(fullName);

        document.querySelectorAll(".user-name").forEach(element => {
            element.textContent = fullName;
        });

        document.querySelectorAll(".user-email").forEach(element => {
            element.textContent = email;
        });

        document.querySelectorAll(".student-id").forEach(element => {
            element.textContent = studentId;
        });

        document.querySelectorAll(".user-role").forEach(element => {
            element.textContent = role;
        });

        document.querySelectorAll(
            ".profile-mini .profile-details strong"
        ).forEach(element => {
            element.textContent = fullName;
        });

        document.querySelectorAll(
            ".profile-mini .profile-details small"
        ).forEach(element => {
            element.textContent = role;
        });

        document.querySelectorAll(
            ".header-avatar, .profile-mini .avatar"
        ).forEach(element => {
            element.textContent = initials;
        });

        document.querySelectorAll(".profile-card h2").forEach(element => {
            element.textContent = fullName;
        });

        document.querySelectorAll(
            ".profile-card [data-profile-description='true']"
        ).forEach(element => {
            element.textContent = email || role;
        });

        populateProfileForm(user);
    }

    /* =========================================
       POPULATE PROFILE FORM
    ========================================= */

    function populateProfileForm(user) {
        if (!user) {
            return;
        }

        const firstNameInput =
            document.getElementById("profileFirstName");

        const lastNameInput =
            document.getElementById("profileLastName");

        const fullNameInput =
            document.getElementById("profileFullName");

        const emailInput =
            document.getElementById("profileEmail");

        const studentIdInput =
            document.getElementById("profileStudentId");

        const gradeSectionInput =
            document.getElementById("profileGradeSection");

        const nameParts = getNameParts(user.fullName);

        if (
            firstNameInput &&
            document.activeElement !== firstNameInput
        ) {
            firstNameInput.value = nameParts.firstName;
        }

        if (
            lastNameInput &&
            document.activeElement !== lastNameInput
        ) {
            lastNameInput.value = nameParts.lastName;
        }

        if (
            fullNameInput &&
            document.activeElement !== fullNameInput
        ) {
            fullNameInput.value = user.fullName || "";
        }

        if (
            emailInput &&
            document.activeElement !== emailInput
        ) {
            emailInput.value = user.email || "";
        }

        if (studentIdInput) {
            studentIdInput.value = user.studentId || "";
        }

        if (
            gradeSectionInput &&
            document.activeElement !== gradeSectionInput
        ) {
            gradeSectionInput.value = user.gradeSection || "";
        }
    }

    /* =========================================
       PROFILE VALIDATION
    ========================================= */

    function validateProfile(fullName, email, studentId) {
        if (!fullName || !email || !studentId) {
            alert("Name, email, and Student ID cannot be empty.");
            return false;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert("Please enter a valid email address.");
            return false;
        }

        return true;
    }

    /* =========================================
       FIND REGISTERED ACCOUNT
    ========================================= */

    function findRegisteredAccount(users, currentUser) {
        const currentEmail = normalizeEmail(currentUser.email);
        const currentStudentId = normalizeStudentId(
            currentUser.studentId
        );

        // Prefer the original email and Student ID together.
        let index = users.findIndex(account =>
            normalizeEmail(account.email) === currentEmail &&
            normalizeStudentId(account.studentId) === currentStudentId
        );

        if (index !== -1) {
            return index;
        }

        // Some older accounts may not have a Student ID.
        if (currentEmail) {
            const emailMatches = [];

            users.forEach((account, accountIndex) => {
                if (
                    normalizeEmail(account.email) === currentEmail
                ) {
                    emailMatches.push(accountIndex);
                }
            });

            if (emailMatches.length === 1) {
                return emailMatches[0];
            }
        }

        // Fall back to Student ID only if it identifies one account.
        if (currentStudentId) {
            const studentIdMatches = [];

            users.forEach((account, accountIndex) => {
                if (
                    normalizeStudentId(account.studentId) ===
                    currentStudentId
                ) {
                    studentIdMatches.push(accountIndex);
                }
            });

            if (studentIdMatches.length === 1) {
                return studentIdMatches[0];
            }
        }

        return -1;
    }

    /* =========================================
       SAVE PROFILE INFORMATION
    ========================================= */

    function saveProfile(event) {
        if (event) {
            event.preventDefault();
        }

        const currentUser = getCurrentUser();

        if (!currentUser) {
            alert("Unable to find your account. Please log in again.");
            return;
        }

        const firstNameInput =
            document.getElementById("profileFirstName");

        const lastNameInput =
            document.getElementById("profileLastName");

        const fullNameInput =
            document.getElementById("profileFullName");

        const emailInput =
            document.getElementById("profileEmail");

        const studentIdInput =
            document.getElementById("profileStudentId");

        const gradeSectionInput =
            document.getElementById("profileGradeSection");

        const firstName = firstNameInput
            ? firstNameInput.value.trim()
            : "";

        const lastName = lastNameInput
            ? lastNameInput.value.trim()
            : "";

        let fullName = "";

        if (firstNameInput || lastNameInput) {
            if (!firstName || !lastName) {
                alert("Please enter both your first name and last name.");
                return;
            }

            fullName = `${firstName} ${lastName}`.trim();
        } else if (fullNameInput) {
            fullName = fullNameInput.value.trim();
        } else {
            alert("The profile name fields could not be found.");
            return;
        }

        const email = emailInput
            ? normalizeEmail(emailInput.value)
            : normalizeEmail(currentUser.email);

        // Student ID remains associated with the existing account.
        const studentId = studentIdInput
            ? studentIdInput.value.trim()
            : String(currentUser.studentId || "").trim();
        const gradeSection = gradeSectionInput
            ? gradeSectionInput.value.trim()
            : String(currentUser.gradeSection || "").trim();

        if (!validateProfile(fullName, email, studentId)) {
            return;
        }

        try {
            const users = getUsers();

            if (users.length === 0) {
                alert(
                    "No registered accounts were found. " +
                    "Your profile was not changed."
                );
                return;
            }

            const oldEmail = normalizeEmail(currentUser.email);
            const oldStudentId = normalizeStudentId(
                currentUser.studentId
            );

            const newStudentId = normalizeStudentId(studentId);

            // Prevent another registered account from using this email.
            const duplicateEmail = users.some(account =>
                normalizeEmail(account.email) === email &&
                normalizeEmail(account.email) !== oldEmail
            );

            if (duplicateEmail) {
                alert("Another account is already using this email.");
                return;
            }

            // Prevent another registered account from using this ID.
            const duplicateStudentId = users.some(account =>
                normalizeStudentId(account.studentId) === newStudentId &&
                normalizeStudentId(account.studentId) !== oldStudentId
            );

            if (duplicateStudentId) {
                alert("Another account is already using this Student ID.");
                return;
            }

            // Find the actual registered account before saving anything.
            const userIndex = findRegisteredAccount(
                users,
                currentUser
            );

            if (userIndex === -1) {
                alert(
                    "Your registered account could not be identified. " +
                    "No profile changes were saved. Please log in again."
                );
                return;
            }

            // Preserve the original account's password, role,
            // creation date, and any additional properties.
            const updatedUser = {
                ...users[userIndex],
                ...currentUser,
                fullName,
                email,
                studentId,
                gradeSection
            };

            // Preserve the account array and update only the matched user.
            const updatedUsers = [...users];
            updatedUsers[userIndex] = updatedUser;

            if (oldEmail !== email) {
                const oldSettingsKey =
                    SETTINGS_PREFIX + encodeURIComponent(oldEmail);
                const newSettingsKey =
                    SETTINGS_PREFIX + encodeURIComponent(email);
                const savedSettings =
                    localStorage.getItem(oldSettingsKey);

                if (
                    savedSettings !== null &&
                    localStorage.getItem(newSettingsKey) === null
                ) {
                    localStorage.setItem(newSettingsKey, savedSettings);
                }
            }

            // Save the registered account first.
            saveUsers(updatedUsers);

            // Then synchronize the active session and legacy account.
            localStorage.setItem(
                CURRENT_USER_KEY,
                JSON.stringify(updatedUser)
            );

            localStorage.setItem(
                LEGACY_USER_KEY,
                JSON.stringify(updatedUser)
            );

            // Keep compatibility with the existing authentication system.
            localStorage.setItem(LOGIN_KEY, "true");

            // Refresh account information across the current page.
            displayUserInfo();

            // Notify other open pages that the account was updated.
            window.dispatchEvent(
                new CustomEvent("safeReportProfileUpdated", {
                    detail: {
                        fullName: updatedUser.fullName,
                        email: updatedUser.email,
                        studentId: updatedUser.studentId
                    }
                })
            );

            alert("Profile updated successfully.");

        } catch (error) {
            console.error("Unable to save profile:", error);

            alert(
                "Unable to save your profile. Please try again."
            );
        }
    }

    /* =========================================
       LOAD PROFILE
    ========================================= */

    function loadProfile() {
        const user = getCurrentUser();

        if (!user) {
            return;
        }

        populateProfileForm(user);
        displayUserInfo();
    }

    /* =========================================
       LOGOUT LINKS
    ========================================= */

    function setupLogoutLinks() {
        const logoutLinks = document.querySelectorAll(
            "#logoutBtn, #sidebarLogoutBtn"
        );

        logoutLinks.forEach(link => {
            if (link.dataset.profileLogoutBound === "true") {
                return;
            }

            link.dataset.profileLogoutBound = "true";

            link.addEventListener("click", event => {
                event.preventDefault();

                // Let the authentication system handle logout if available.
                if (typeof window.logoutUser === "function") {
                    window.logoutUser();
                    return;
                }

                localStorage.removeItem(CURRENT_USER_KEY);
                localStorage.removeItem(LOGIN_KEY);

                sessionStorage.removeItem("safeReportAdminLoggedIn");
                sessionStorage.removeItem("safeReportAdminEmail");

                window.location.href = "guest.html";
            });
        });
    }

    /* =========================================
       INITIALIZATION
    ========================================= */

    function initializeProfileFeature() {
        displayUserInfo();
        setupLogoutLinks();

        const profileForm = document.getElementById("profileForm");

        if (
            profileForm &&
            profileForm.dataset.profileSaveBound !== "true"
        ) {
            profileForm.dataset.profileSaveBound = "true";

            profileForm.addEventListener("submit", saveProfile);
        }

        // Refresh the displayed information if another script updates it.
        window.addEventListener(
            "safeReportProfileUpdated",
            displayUserInfo
        );

        // Refresh account details when the page becomes active again.
        window.addEventListener("storage", event => {
            if (
                event.key === CURRENT_USER_KEY ||
                event.key === USERS_KEY ||
                event.key === LEGACY_USER_KEY
            ) {
                displayUserInfo();
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeProfileFeature
        );
    } else {
        initializeProfileFeature();
    }

    /* =========================================
       PUBLIC PROFILE API
    ========================================= */

    window.SafeReportProfile = {
        getCurrentUser,
        displayUserInfo,
        populateProfileForm,
        saveProfile,
        loadProfile
    };

})();