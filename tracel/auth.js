/* =========================================
   SAFEREPORT AUTHENTICATION SYSTEM
   Multi-Account Support
   Login, Registration, Profile, and Logout
========================================= */

(function () {
    "use strict";

    const USERS_KEY = "safeReportUsers";
    const LEGACY_USER_KEY = "safeReportUser";
    const CURRENT_USER_KEY = "currentUser";
    const LOGIN_KEY = "safeReportLoggedIn";

    /* =========================================
       ACCOUNT STORAGE
    ========================================= */

    function getAllUsers() {
        let users = [];

        try {
            const savedUsers = localStorage.getItem(USERS_KEY);

            if (savedUsers) {
                const parsedUsers = JSON.parse(savedUsers);

                if (Array.isArray(parsedUsers)) {
                    users = parsedUsers;
                }
            }
        } catch (error) {
            console.error("Unable to load registered accounts:", error);
        }

        // Migrate the previous single-account format.
        try {
            const legacyUser = localStorage.getItem(LEGACY_USER_KEY);

            if (legacyUser) {
                const parsedUser = JSON.parse(legacyUser);

                if (
                    parsedUser &&
                    typeof parsedUser === "object" &&
                    parsedUser.email
                ) {
                    const alreadyExists = users.some(
                        user =>
                            normalizeEmail(user.email) ===
                            normalizeEmail(parsedUser.email)
                    );

                    if (!alreadyExists) {
                        users.push(parsedUser);
                    }

                    localStorage.setItem(
                        USERS_KEY,
                        JSON.stringify(users)
                    );
                }
            }
        } catch (error) {
            console.error(
                "Unable to migrate the previous account:",
                error
            );
        }

        return users;
    }

    function saveAllUsers(users) {
        if (!Array.isArray(users)) {
            throw new TypeError("Accounts must be stored as an array.");
        }

        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function normalizeEmail(email) {
        return String(email || "").trim().toLowerCase();
    }

    function getCurrentUser() {
        try {
            const savedUser = localStorage.getItem(CURRENT_USER_KEY);

            if (!savedUser) {
                return null;
            }

            const user = JSON.parse(savedUser);

            return user && typeof user === "object"
                ? user
                : null;

        } catch (error) {
            console.error("Unable to read the current account:", error);
            return null;
        }
    }

    function saveCurrentUser(user) {
        localStorage.setItem(
            CURRENT_USER_KEY,
            JSON.stringify(user)
        );

        localStorage.setItem(LOGIN_KEY, "true");

        // Maintain compatibility with older code.
        localStorage.setItem(
            LEGACY_USER_KEY,
            JSON.stringify(user)
        );
    }

    /* =========================================
       REGISTRATION
    ========================================= */

    function createAccount(event) {
        if (event) {
            event.preventDefault();
        }

        const fullName =
            document.getElementById("fullname")?.value.trim() || "";

        const email = normalizeEmail(
            document.getElementById("email")?.value
        );

        const studentId =
            document.getElementById("studentid")?.value.trim() || "";

        const password =
            document.getElementById("password")?.value || "";

        const confirmPassword =
            document.getElementById("confirm")?.value || "";

        const terms =
            document.getElementById("terms")?.checked || false;

        const errorBox = document.getElementById("signupError");
        const successBox = document.getElementById("signupSuccess");

        if (errorBox) errorBox.textContent = "";
        if (successBox) successBox.textContent = "";

        function showError(message) {
            if (errorBox) {
                errorBox.textContent = message;
            } else {
                alert(message);
            }
        }

        if (
            !fullName ||
            !email ||
            !studentId ||
            !password ||
            !confirmPassword
        ) {
            showError("Please complete all required fields.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError("Please enter a valid email address.");
            return;
        }

        if (password.length < 6) {
            showError("Password must be at least 6 characters long.");
            return;
        }

        if (password !== confirmPassword) {
            showError("Passwords do not match.");
            return;
        }

        if (!terms) {
            showError("Please agree to the Terms and Conditions.");
            return;
        }

        const users = getAllUsers();

        const existingEmail = users.some(
            user => normalizeEmail(user.email) === email
        );

        if (existingEmail) {
            showError("An account with this email already exists.");
            return;
        }

        const normalizedStudentId = studentId.toLowerCase();

        const existingStudentId = users.some(
            user =>
                String(user.studentId || "")
                    .trim()
                    .toLowerCase() === normalizedStudentId
        );

        if (existingStudentId) {
            showError("This Student ID is already registered.");
            return;
        }

        const newUser = {
            fullName,
            email,
            studentId,
            password,
            role: "Student",
            dateCreated: new Date().toISOString()
        };

        try {
            users.push(newUser);
            saveAllUsers(users);

            sessionStorage.removeItem("safeReportAdminLoggedIn");
            sessionStorage.removeItem("safeReportAdminEmail");
            saveCurrentUser(newUser);

            if (successBox) {
                successBox.textContent =
                    "Account created successfully. Opening your dashboard...";
            } else {
                alert(
                    "Account created successfully! Opening your dashboard."
                );
            }

            window.setTimeout(() => {
                window.location.href = "index.html";
            }, 500);

        } catch (error) {
            console.error("Account registration failed:", error);
            showError("Unable to create the account. Please try again.");
        }
    }

    /* =========================================
       LOGIN
    ========================================= */

    function loginUser(event) {
        if (event) {
            event.preventDefault();
        }

        const email = normalizeEmail(
            document.getElementById("email")?.value
        );

        const password =
            document.getElementById("password")?.value || "";

        const errorBox = document.getElementById("loginError");
        const successBox = document.getElementById("loginSuccess");

        if (errorBox) errorBox.textContent = "";
        if (successBox) successBox.textContent = "";

        function showError(message) {
            if (errorBox) {
                errorBox.textContent = message;
            } else {
                alert(message);
            }
        }

        if (!email || !password) {
            showError("Please enter your email and password.");
            return;
        }

        const users = getAllUsers();

        const matchedUser = users.find(user =>
            normalizeEmail(user.email) === email &&
            user.password === password
        );

        if (!matchedUser) {
            showError(
                "Incorrect email or password, or no matching account exists."
            );
            return;
        }

        try {
            saveCurrentUser(matchedUser);

            sessionStorage.removeItem("safeReportAdminLoggedIn");
            sessionStorage.removeItem("safeReportAdminEmail");

            if (successBox) {
                successBox.textContent =
                    "Login successful. Opening dashboard...";
            }

            window.setTimeout(() => {
                window.location.href = "index.html";
            }, successBox ? 250 : 0);

        } catch (error) {
            console.error("Login failed:", error);
            showError("Unable to log in. Please try again.");
        }
    }

    /* =========================================
       AUTHENTICATION CHECK
    ========================================= */

    function checkLogin() {
        const loggedIn =
            localStorage.getItem(LOGIN_KEY) === "true";

        const user = getCurrentUser();

        if (!loggedIn || !user) {
            localStorage.removeItem(LOGIN_KEY);
            localStorage.removeItem(CURRENT_USER_KEY);

            window.location.href = "guest.html";
            return false;
        }

        return true;
    }

    /* =========================================
       DISPLAY USER INFORMATION
    ========================================= */

    function displayUserInfo() {
        const user = getCurrentUser();

        if (!user) {
            return;
        }

        document.querySelectorAll(".user-name").forEach(element => {
            element.textContent = user.fullName || "User";
        });

        document.querySelectorAll(".user-email").forEach(element => {
            element.textContent = user.email || "";
        });

        document.querySelectorAll(".student-id").forEach(element => {
            element.textContent = user.studentId || "";
        });

        const roleLabel = String(user.role || "Student")
            .replace(/\s+Account$/i, "")
            .trim() || "Student";

        document.querySelectorAll(".user-role").forEach(element => {
            element.textContent = roleLabel;
        });

        const initials = String(user.fullName || "U")
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part.charAt(0).toUpperCase())
            .join("");

        document.querySelectorAll(
            ".header-avatar, .profile-mini .avatar"
        ).forEach(element => {
            element.textContent = initials || "U";
        });

        document.querySelectorAll(
            ".profile-mini .profile-details strong"
        ).forEach(element => {
            element.textContent = user.fullName || "User";
        });

        document.querySelectorAll(
            ".profile-mini .profile-details small"
        ).forEach(element => {
            element.textContent = roleLabel;
        });
    }

    /* =========================================
       LOGOUT
    ========================================= */

    function logoutUser(event) {
        if (event) {
            event.preventDefault();
        }

        localStorage.removeItem(LOGIN_KEY);
        localStorage.removeItem(CURRENT_USER_KEY);

        sessionStorage.removeItem("safeReportAdminLoggedIn");
        sessionStorage.removeItem("safeReportAdminEmail");

        window.location.href = "guest.html";
    }

    /* =========================================
       UPDATE PROFILE
    ========================================= */

    function updateProfile(event) {
        if (event) {
            event.preventDefault();
        }

        const user = getCurrentUser();

        if (
            !user ||
            localStorage.getItem(LOGIN_KEY) !== "true"
        ) {
            alert("Please log in before updating your profile.");
            window.location.href = "login.html";
            return;
        }

        const firstNameElement =
            document.getElementById("profileFirstName");

        const lastNameElement =
            document.getElementById("profileLastName");

        const fullNameElement =
            document.getElementById("profileFullName");

        const emailElement =
            document.getElementById("profileEmail");

        const studentIdElement =
            document.getElementById("profileStudentId");

        const oldFullName = String(user.fullName || "").trim();
        const oldNameParts = oldFullName.split(/\s+/).filter(Boolean);

        const fallbackFirstName = oldNameParts.length > 1
            ? oldNameParts.slice(0, -1).join(" ")
            : oldFullName;

        const fallbackLastName = oldNameParts.length > 1
            ? oldNameParts[oldNameParts.length - 1]
            : "";

        let newFullName;

        if (firstNameElement || lastNameElement) {
            const firstName = firstNameElement
                ? firstNameElement.value.trim()
                : fallbackFirstName;

            const lastName = lastNameElement
                ? lastNameElement.value.trim()
                : fallbackLastName;

            if (!firstName || !lastName) {
                alert("Please enter both your first name and last name.");
                return;
            }

            newFullName = `${firstName} ${lastName}`.trim();

        } else {
            newFullName = fullNameElement
                ? fullNameElement.value.trim()
                : oldFullName;
        }

        const newEmail = emailElement
            ? normalizeEmail(emailElement.value)
            : normalizeEmail(user.email);

        const newStudentId = studentIdElement
            ? studentIdElement.value.trim()
            : String(user.studentId || "").trim();

        if (!newFullName || !newEmail || !newStudentId) {
            alert("Name, email, and Student ID cannot be empty.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
            alert("Please enter a valid email address.");
            return;
        }

        const users = getAllUsers();

        const previousEmail = normalizeEmail(user.email);

        const previousStudentId = String(user.studentId || "")
            .trim()
            .toLowerCase();

        // Prevent duplicate email addresses.
        const duplicateEmail = users.some(account =>
            normalizeEmail(account.email) === newEmail &&
            normalizeEmail(account.email) !== previousEmail
        );

        if (duplicateEmail) {
            alert("Another account is already using this email.");
            return;
        }

        // Prevent duplicate Student IDs.
        const duplicateStudentId = users.some(account =>
            String(account.studentId || "").trim().toLowerCase() ===
                newStudentId.toLowerCase() &&
            String(account.studentId || "").trim().toLowerCase() !==
                previousStudentId
        );

        if (duplicateStudentId) {
            alert("Another account is already using this Student ID.");
            return;
        }

        // Find the account using its original email and Student ID.
        const userIndex = users.findIndex(account =>
            normalizeEmail(account.email) === previousEmail &&
            String(account.studentId || "").trim().toLowerCase() ===
                previousStudentId
        );

        if (userIndex === -1) {
            alert("Your account could not be found. Please log in again.");
            return;
        }

        // Preserve existing account properties and update profile details.
        const updatedUser = {
            ...users[userIndex],
            ...user,
            fullName: newFullName,
            email: newEmail,
            studentId: newStudentId
        };

        try {
            users[userIndex] = updatedUser;

            // Save updated account information.
            saveAllUsers(users);
            saveCurrentUser(updatedUser);

            // Keep the legacy account record synchronized.
            localStorage.setItem(
                LEGACY_USER_KEY,
                JSON.stringify(updatedUser)
            );

            // Refresh profile fields and account name displays.
            loadProfile();

            alert("Profile updated successfully.");

        } catch (error) {
            console.error("Profile update failed:", error);
            alert("Unable to update your profile. Please try again.");
        }
    }

    /* =========================================
       LOAD PROFILE FORM
    ========================================= */

    function loadProfile() {
        const user = getCurrentUser();

        if (!user) {
            return;
        }

        const firstNameElement =
            document.getElementById("profileFirstName");

        const lastNameElement =
            document.getElementById("profileLastName");

        const fullNameElement =
            document.getElementById("profileFullName");

        const emailElement =
            document.getElementById("profileEmail");

        const studentIdElement =
            document.getElementById("profileStudentId");

        // Split the stored full name into the form's name fields.
        const nameParts = String(user.fullName || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        const firstName = nameParts.length > 1
            ? nameParts.slice(0, -1).join(" ")
            : (nameParts[0] || "");

        const lastName = nameParts.length > 1
            ? nameParts[nameParts.length - 1]
            : "";

        if (firstNameElement) {
            firstNameElement.value = firstName;
        }

        if (lastNameElement) {
            lastNameElement.value = lastName;
        }

        if (fullNameElement) {
            fullNameElement.value = user.fullName || "";
        }

        if (emailElement) {
            emailElement.value = user.email || "";
        }

        if (studentIdElement) {
            studentIdElement.value = user.studentId || "";
        }

        displayUserInfo();
    }

    /* =========================================
       LOGOUT LINK HANDLING
    ========================================= */

    function setupLogoutLinks() {
        document.querySelectorAll(
            'a.logout, #logoutBtn, [data-logout]'
        ).forEach(link => {
            link.addEventListener("click", logoutUser);
        });
    }

    /* =========================================
       INITIALIZATION
    ========================================= */

    document.addEventListener("DOMContentLoaded", () => {
        displayUserInfo();
        loadProfile();
        setupLogoutLinks();
    });

    /* =========================================
       PUBLIC FUNCTIONS
       Used by existing HTML onsubmit handlers
    ========================================= */

    window.createAccount = createAccount;
    window.loginUser = loginUser;
    window.checkLogin = checkLogin;
    window.getCurrentUser = getCurrentUser;
    window.displayUserInfo = displayUserInfo;
    window.logoutUser = logoutUser;
    window.updateProfile = updateProfile;
    window.loadProfile = loadProfile;

})();