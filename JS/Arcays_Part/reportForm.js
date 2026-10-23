/* =========================================
   SAFEREPORT - REPORT SUBMISSION
   Validates and Saves Student-Owned Reports
========================================= */

document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".report-form");

    if (!form) return;

    const submitButton = form.querySelector(
        'button[type="submit"], input[type="submit"]'
    );

    const feedback = document.getElementById("reportFeedback");
    const photoInput = form.querySelector("#incident-photo");
    const photoPreview = document.getElementById("photoPreview");
    const MAX_PHOTO_SIZE = 1024 * 1024;

    let isSubmitting = false;
    let photoPreviewUrl = "";

    /* =========================================
       FEEDBACK
    ========================================= */

    function showFeedback(message, type = "error") {
        if (feedback) {
            feedback.textContent = message;
            feedback.dataset.type = type;
        }

        // Preserve the existing feedback behavior.
        if (typeof window.showToast === "function") {
            window.showToast(message, type);
        } else {
            alert(message);
        }
    }

    /* =========================================
       CURRENT USER
    ========================================= */

    function getCurrentUser() {
        if (
            localStorage.getItem("safeReportLoggedIn") !== "true"
        ) {
            return null;
        }

        try {
            const savedUser = localStorage.getItem("currentUser");

            if (!savedUser) return null;

            const user = JSON.parse(savedUser);

            if (
                !user ||
                typeof user !== "object" ||
                Array.isArray(user)
            ) {
                return null;
            }

            const email = String(user.email || "")
                .trim()
                .toLowerCase();

            if (!isValidEmail(email)) {
                return null;
            }

            return {
                ...user,
                email
            };
        } catch (error) {
            console.error(
                "Unable to read the current user:",
                error
            );

            return null;
        }
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    /* =========================================
       FORM VALUES
    ========================================= */

    function getFormValues() {
        return {
            incidentType:
                form.querySelector("#incident-type")?.value.trim() || "",

            date:
                form.querySelector("#incident-date")?.value || "",

            location:
                form.querySelector("#location")?.value.trim() || "",

            time:
                form.querySelector("#time")?.value || "",

            description:
                form.querySelector("#description")?.value.trim() || "",

            people:
                form.querySelector("#people")?.value.trim() || "",

            anonymous:
                form.querySelector('input[name="reportIdentity"]:checked')
                    ?.value === "anonymous",

            confirmed:
                form.querySelector("#confirm")?.checked || false
        };
    }

    function getPhotoValidationMessage(file) {
        if (!file) return "";

        if (!/^image\/(?:jpeg|png|gif|webp|bmp|avif)$/i.test(file.type)) {
            return "Please select a JPEG, PNG, GIF, WebP, BMP, or AVIF image.";
        }

        if (file.size > MAX_PHOTO_SIZE) {
            return "The photo must be 1 MB or smaller.";
        }

        return "";
    }

    function readPhoto(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.addEventListener("load", () => {
                if (typeof reader.result !== "string") {
                    reject(new Error("The selected photo could not be read."));
                    return;
                }

                resolve(reader.result);
            });

            reader.addEventListener("error", () => {
                reject(new Error("The selected photo could not be read."));
            });

            reader.readAsDataURL(file);
        });
    }

    if (photoInput && photoPreview) {
        photoInput.addEventListener("change", () => {
            if (photoPreviewUrl) {
                URL.revokeObjectURL(photoPreviewUrl);
                photoPreviewUrl = "";
            }

            photoPreview.replaceChildren();

            const file = photoInput.files?.[0];

            if (!file) return;

            const validationMessage = getPhotoValidationMessage(file);

            if (validationMessage) {
                photoInput.value = "";
                showFeedback(validationMessage);
                return;
            }

            const image = document.createElement("img");
            image.alt = "Preview of the selected incident photo";
            photoPreviewUrl = URL.createObjectURL(file);
            image.src = photoPreviewUrl;
            photoPreview.appendChild(image);
        });

        form.addEventListener("reset", () => {
            if (photoPreviewUrl) {
                URL.revokeObjectURL(photoPreviewUrl);
                photoPreviewUrl = "";
            }

            photoPreview.replaceChildren();
        });
    }

    /* =========================================
       DATE VALIDATION
    ========================================= */

    function isValidIncidentDate(dateValue) {
        if (!dateValue) return false;

        // Date input values should use YYYY-MM-DD.
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);

        if (!match) return false;

        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);

        const incidentDate = new Date(year, month - 1, day);

        // Reject impossible dates such as February 30.
        if (
            incidentDate.getFullYear() !== year ||
            incidentDate.getMonth() !== month - 1 ||
            incidentDate.getDate() !== day
        ) {
            return false;
        }

        // Compare calendar dates in local time.
        const today = new Date();

        today.setHours(0, 0, 0, 0);
        incidentDate.setHours(0, 0, 0, 0);

        // An incident cannot have a future date.
        return incidentDate.getTime() <= today.getTime();
    }

    /* =========================================
       INPUT VALIDATION
    ========================================= */

    function validateForm(values) {
        const incidentTypeField =
            form.querySelector("#incident-type");

        const incidentDateField =
            form.querySelector("#incident-date");

        const locationField =
            form.querySelector("#location");

        const descriptionField =
            form.querySelector("#description");

        const confirmationField =
            form.querySelector("#confirm");

        if (
            !incidentTypeField ||
            !incidentDateField ||
            !locationField ||
            !descriptionField ||
            !confirmationField
        ) {
            showFeedback(
                "The report form is incomplete. Please refresh the page and try again."
            );

            return false;
        }

        if (
            !values.incidentType ||
            values.incidentType === "Select incident type"
        ) {
            showFeedback("Please select an incident type.");
            incidentTypeField.focus();
            return false;
        }

        if (!values.date) {
            showFeedback("Please select the date of the incident.");
            incidentDateField.focus();
            return false;
        }

        if (!isValidIncidentDate(values.date)) {
            showFeedback(
                "Please enter a valid incident date that is not in the future."
            );

            incidentDateField.focus();
            return false;
        }

        if (!values.location) {
            showFeedback("Please enter the incident location.");
            locationField.focus();
            return false;
        }

        if (values.location.length > 200) {
            showFeedback(
                "The incident location cannot exceed 200 characters."
            );

            locationField.focus();
            return false;
        }

        if (!values.description) {
            showFeedback("Please describe what happened.");
            descriptionField.focus();
            return false;
        }

        if (values.description.length > 5000) {
            showFeedback(
                "The incident description cannot exceed 5,000 characters."
            );

            descriptionField.focus();
            return false;
        }

        if (values.people.length > 500) {
            showFeedback(
                "The people-involved field cannot exceed 500 characters."
            );

            form.querySelector("#people")?.focus();
            return false;
        }

        if (!values.confirmed) {
            showFeedback(
                "Please confirm that the information provided is accurate."
            );

            confirmationField.focus();
            return false;
        }

        return true;
    }

    /* =========================================
       REPORT ID
    ========================================= */

    function createReportId() {
        // Keep the ID numeric for compatibility with existing pages.
        // Add a small random component to reduce same-millisecond collisions.
        return (
            Date.now() * 1000 +
            Math.floor(Math.random() * 1000)
        );
    }

    /* =========================================
       REPORT CREATION
    ========================================= */

    function createReport(values, user, photo) {
        return {
            id: createReportId(),

            type: values.incidentType,
            date: values.date,
            createdAt: new Date().toISOString(),

            location: values.location,
            time: values.time,
            description: values.description,
            people: values.people,

            status: "Pending",
            anonymous: values.anonymous,

            submittedBy: {
                fullName: String(user.fullName || "").trim(),
                email: user.email,
                studentId: String(
                    user.studentId ||
                    user.student_id ||
                    user.schoolId ||
                    ""
                ).trim()
            },

            ...(photo ? { photo } : {})
        };
    }

    /* =========================================
       REPORT STORAGE
    ========================================= */

    function saveReport(report) {
        if (
            window.SafeReportStorage &&
            typeof window.SafeReportStorage.addReport === "function"
        ) {
            const savedReport =
                window.SafeReportStorage.addReport(report);

            if (!savedReport) {
                throw new Error(
                    "The storage system did not confirm the saved report."
                );
            }

            return savedReport;
        }

        // Compatibility fallback for installations without storage.js.
        const rawReports = localStorage.getItem("reports");
        let storedReports = [];

        if (rawReports !== null) {
            storedReports = JSON.parse(rawReports);

            if (!Array.isArray(storedReports)) {
                throw new Error("Saved report data is invalid.");
            }
        }

        storedReports.unshift(report);

        localStorage.setItem(
            "reports",
            JSON.stringify(storedReports)
        );

        // Notify other features on the current page.
        window.dispatchEvent(
            new Event("safereport:reports-updated")
        );

        return report;
    }

    /* =========================================
       SUBMIT BUTTON
    ========================================= */

    function setSubmittingState(isSaving) {
        if (!submitButton) return;

        submitButton.disabled = isSaving;

        if (isSaving) {
            submitButton.dataset.originalText =
                submitButton.textContent;

            if (submitButton.tagName === "BUTTON") {
                submitButton.textContent = "Submitting...";
            } else {
                submitButton.value = "Submitting...";
            }

            return;
        }

        if (submitButton.tagName === "BUTTON") {
            if (submitButton.dataset.originalText) {
                submitButton.textContent =
                    submitButton.dataset.originalText;
            }
        } else if (submitButton.dataset.originalText) {
            submitButton.value =
                submitButton.dataset.originalText;
        }
    }

    /* =========================================
       FORM SUBMISSION
    ========================================= */

    form.addEventListener("submit", async event => {
        event.preventDefault();

        // Prevent repeated submissions while saving.
        if (isSubmitting) return;

        /* AUTHENTICATION */

        const user = getCurrentUser();

        if (!user) {
            showFeedback(
                "Your session is missing or invalid. Please log in again."
            );

            window.location.replace("login.html");
            return;
        }

        /* FORM VALIDATION */

        const values = getFormValues();

        if (!validateForm(values)) {
            return;
        }

        const selectedPhoto = photoInput?.files?.[0] || null;
        const photoValidationMessage =
            getPhotoValidationMessage(selectedPhoto);

        if (photoValidationMessage) {
            showFeedback(photoValidationMessage);
            photoInput?.focus();
            return;
        }

        /* SAVE REPORT */

        isSubmitting = true;
        setSubmittingState(true);

        try {
            const photo = selectedPhoto
                ? await readPhoto(selectedPhoto)
                : "";

            const report = createReport(values, user, photo);

            saveReport(report);

            // Clear fields only after storage succeeds.
            form.reset();

            if (feedback) {
                feedback.textContent = "";
                delete feedback.dataset.type;
            }

            showFeedback(
                "Report submitted successfully.",
                "success"
            );

            window.location.replace(
                `myreports.html?edit=${encodeURIComponent(report.id)}`
            );
        } catch (error) {
            console.error(
                "Unable to save the report:",
                error
            );

            showFeedback(
                "The report could not be saved. Your information has not been cleared. Please try again."
            );
        } finally {
            isSubmitting = false;
            setSubmittingState(false);
        }
    });
});