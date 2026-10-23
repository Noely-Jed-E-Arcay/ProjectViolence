/* =========================================
   SAFEREPORT — MY REPORTS
   Student-only report listing
========================================= */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const CURRENT_USER_KEY = "currentUser";
    const LOGIN_KEY = "safeReportLoggedIn";
    const REPORTS_KEY = "reports";

    const tableBody = document.getElementById("reportsTableBody");

    if (!tableBody) {
        return;
    }

    const totalCount = document.getElementById("totalCount");
    const reviewCount = document.getElementById("reviewCount");
    const resolvedCount = document.getElementById("resolvedCount");

    /* =========================================
       AUTHENTICATION
    ========================================= */

    function getCurrentUser() {
        if (localStorage.getItem(LOGIN_KEY) !== "true") {
            return null;
        }

        try {
            const user = JSON.parse(
                localStorage.getItem(CURRENT_USER_KEY)
            );

            if (
                !user ||
                typeof user !== "object" ||
                !user.email
            ) {
                return null;
            }

            return user;
        } catch (error) {
            console.error(
                "Unable to read the current user.",
                error
            );

            return null;
        }
    }

    function normalizeRole(role) {
        return String(role || "")
            .trim()
            .toLowerCase()
            .replace(/[_-]+/g, " ")
            .replace(/\s+/g, " ");
    }

    function isAdministrator(user) {
        if (!user) {
            return false;
        }

        const role = normalizeRole(user.role);

        return [
            "admin",
            "administrator",
            "admin account"
        ].includes(role);
    }

    const currentUser = getCurrentUser();

    /*
     * My Reports is a student-facing page.
     * Administrators must use admin-reports.html.
     */
    if (!currentUser) {
        window.location.replace("login.html");
        return;
    }

    if (isAdministrator(currentUser)) {
        window.location.replace("admin-reports.html");
        return;
    }

    /* =========================================
       REPORT STORAGE
    ========================================= */

    function getStoredReports() {
        try {
            if (
                window.SafeReportStorage &&
                typeof window.SafeReportStorage.getReports === "function"
            ) {
                const reports =
                    window.SafeReportStorage.getReports();

                return Array.isArray(reports) ? reports : [];
            }

            const stored = localStorage.getItem(REPORTS_KEY);

            if (!stored) {
                return [];
            }

            const reports = JSON.parse(stored);

            return Array.isArray(reports) ? reports : [];
        } catch (error) {
            console.error(
                "Unable to retrieve reports.",
                error
            );

            return [];
        }
    }

    /* =========================================
       REPORT OWNERSHIP
    ========================================= */

    function normalizeEmail(email) {
        return String(email || "")
            .trim()
            .toLowerCase();
    }

    function normalizeStudentId(studentId) {
        return String(studentId || "")
            .trim()
            .toLowerCase();
    }

    function getReportOwner(report) {
        if (
            !report ||
            !report.submittedBy ||
            typeof report.submittedBy !== "object"
        ) {
            return null;
        }

        return report.submittedBy;
    }

    function belongsToCurrentUser(report) {
        const owner = getReportOwner(report);

        if (!owner || !currentUser) {
            return false;
        }

        const currentEmail = normalizeEmail(currentUser.email);
        const ownerEmail = normalizeEmail(owner.email);

        const currentStudentId = normalizeStudentId(
            currentUser.studentId ||
            currentUser.schoolId ||
            currentUser.schoolID
        );

        const ownerStudentId = normalizeStudentId(
            owner.studentId ||
            owner.schoolId ||
            owner.schoolID
        );

        /*
         * Student IDs are unique in the account data and remain
         * stable when a student updates their email address.
         */
        if (currentStudentId && ownerStudentId) {
            return currentStudentId === ownerStudentId;
        }

        /*
         * If student ID information is missing from either
         * record, use the email address as the fallback.
         */
        return (
            currentEmail !== "" &&
            ownerEmail !== "" &&
            currentEmail === ownerEmail
        );
    }

    function getVisibleReports() {
        /*
         * Administrators are deliberately not allowed to see
         * all reports through this student-facing page.
         */
        return getStoredReports().filter(
            belongsToCurrentUser
        );
    }

    /* =========================================
       STATUS HELPERS
    ========================================= */

    function normalizeStatus(status) {
        const value = String(status || "")
            .trim()
            .toLowerCase()
            .replace(/[_-]+/g, " ")
            .replace(/\s+/g, " ");

        if (
            value === "resolved" ||
            value === "closed" ||
            value === "completed"
        ) {
            return "resolved";
        }

        if (
            value === "under review" ||
            value === "in review" ||
            value === "reviewing"
        ) {
            return "review";
        }

        if (value === "in progress" || value === "investigating") {
            return "progress";
        }

        return "pending";
    }

    function getStatusLabel(status) {
        const normalized = normalizeStatus(status);

        if (normalized === "resolved") {
            return "Resolved";
        }

        if (normalized === "progress") {
            return "In Progress";
        }

        if (normalized === "review") {
            return "Under Review";
        }

        return "Pending";
    }

    function getStatusClass(status) {
        const normalized = normalizeStatus(status);

        if (normalized === "resolved") {
            return "resolved";
        }

        if (normalized === "review" || normalized === "progress") {
            return "review";
        }

        return "pending";
    }

    function canEditReport(report) {
        return (
            belongsToCurrentUser(report) &&
            normalizeStatus(report.status) === "pending" &&
            !report.reviewedAt
        );
    }

    function getReportIdentifier(report) {
        return String(
            report.reportId ||
            report.id ||
            report.referenceNumber ||
            ""
        );
    }

    function getCurrentStoredReport(id) {
        const requestedId = String(id);

        return getStoredReports().find(report => {
            return getReportIdentifier(report) === requestedId;
        }) || null;
    }

    function createEditDialog() {
        let overlay = document.getElementById("reportEditOverlay");

        if (overlay) {
            return overlay;
        }

        overlay = document.createElement("div");
        overlay.className = "report-edit-overlay";
        overlay.id = "reportEditOverlay";
        overlay.hidden = true;
        overlay.innerHTML = `
            <section class="report-edit-dialog" role="dialog" aria-modal="true"
                aria-labelledby="reportEditTitle">
                <header class="report-edit-header">
                    <div>
                        <span class="details-eyebrow">EDIT REPORT</span>
                        <h2 id="reportEditTitle">Correct your report</h2>
                    </div>
                    <button type="button" class="details-close" data-edit-close
                        aria-label="Close report editor">×</button>
                </header>
                <p class="report-edit-notice">
                    You can edit while the report is pending. It becomes locked
                    as soon as an administrator reviews or updates its status.
                </p>
                <form id="reportEditForm" class="report-edit-form">
                    <label>Incident type
                        <input name="type" maxlength="100" required>
                    </label>
                    <div class="report-edit-row">
                        <label>Incident date
                            <input name="date" type="date" required>
                        </label>
                        <label>Incident time
                            <input name="time" type="time">
                        </label>
                    </div>
                    <label>Location
                        <input name="location" maxlength="200" required>
                    </label>
                    <label>People involved
                        <input name="people" maxlength="500">
                    </label>
                    <label>Description
                        <textarea name="description" rows="5" maxlength="5000" required></textarea>
                    </label>
                    <fieldset class="report-edit-privacy">
                        <legend>Identity preference</legend>
                        <label>
                            <input type="radio" name="anonymous" value="false">
                            Share my identity with administrators
                        </label>
                        <label>
                            <input type="radio" name="anonymous" value="true">
                            Submit anonymously
                        </label>
                    </fieldset>
                    <p class="report-edit-feedback" role="status" aria-live="polite"></p>
                    <footer class="report-edit-actions">
                        <button type="button" class="secondary-button" data-edit-close>Cancel</button>
                        <button type="submit" class="primary-button blue-button">Save changes</button>
                    </footer>
                </form>
            </section>
        `;

        document.body.appendChild(overlay);

        const form = overlay.querySelector("#reportEditForm");
        let activeReportId = "";

        function closeEditor() {
            overlay.hidden = true;
            document.body.style.overflow = "";
        }

        overlay.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                closeEditor();
            }
        });

        overlay.querySelectorAll("[data-edit-close]").forEach(button => {
            button.addEventListener("click", closeEditor);
        });

        overlay.addEventListener("click", event => {
            if (event.target === overlay) {
                closeEditor();
            }
        });

        form.addEventListener("submit", event => {
            event.preventDefault();

            const feedback = form.querySelector(".report-edit-feedback");
            const reports = getStoredReports();
            const latestReport = reports.find(report => {
                return getReportIdentifier(report) === activeReportId;
            });

            if (!latestReport || !canEditReport(latestReport)) {
                feedback.textContent =
                    "This report has been reviewed and can no longer be edited.";
                refreshReports();
                return;
            }

            const values = new FormData(form);
            const date = String(values.get("date") || "");
            const incidentDate = new Date(`${date}T00:00:00`);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            incidentDate.setHours(0, 0, 0, 0);

            if (
                !date ||
                Number.isNaN(incidentDate.getTime()) ||
                incidentDate > today
            ) {
                feedback.textContent =
                    "Enter a valid incident date that is not in the future.";
                form.querySelector('[name="date"]').focus();
                return;
            }

            latestReport.type = String(values.get("type") || "").trim();
            latestReport.date = date;
            latestReport.time = String(values.get("time") || "");
            latestReport.location = String(values.get("location") || "").trim();
            latestReport.people = String(values.get("people") || "").trim();
            latestReport.description = String(values.get("description") || "").trim();
            latestReport.anonymous = values.get("anonymous") === "true";
            latestReport.updatedAt = new Date().toISOString();

            try {
                if (
                    window.SafeReportStorage &&
                    typeof window.SafeReportStorage.saveReports === "function"
                ) {
                    window.SafeReportStorage.saveReports(reports);
                } else {
                    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
                    window.dispatchEvent(new Event("safereport:reports-updated"));
                }
            } catch (error) {
                console.error("Unable to save report edits:", error);
                feedback.textContent =
                    "Your changes could not be saved. Please try again.";
                return;
            }

            closeEditor();
            refreshReports();
            document.dispatchEvent(
                new CustomEvent("safereport:reports-updated")
            );
        });

        overlay.openForReport = report => {
            const latestReport = getCurrentStoredReport(
                getReportIdentifier(report)
            );

            if (!latestReport || !canEditReport(latestReport)) {
                if (typeof window.showToast === "function") {
                    window.showToast(
                        "This report is no longer available for editing.",
                        "error"
                    );
                }
                return false;
            }

            activeReportId = getReportIdentifier(latestReport);
            form.querySelector('[name="type"]').value =
                latestReport.type || latestReport.incidentType || "";
            form.querySelector('[name="date"]').value = latestReport.date || "";
            form.querySelector('[name="time"]').value = latestReport.time || "";
            form.querySelector('[name="location"]').value = latestReport.location || "";
            form.querySelector('[name="people"]').value = latestReport.people || "";
            form.querySelector('[name="description"]').value = latestReport.description || "";
            form.querySelector(
                `input[name="anonymous"][value="${latestReport.anonymous === true}"]`
            ).checked = true;
            form.querySelector(".report-edit-feedback").textContent = "";
            overlay.hidden = false;
            document.body.style.overflow = "hidden";
            form.querySelector('[name="type"]').focus();

            return true;
        };

        return overlay;
    }

    function openReportEditor(report) {
        return createEditDialog().openForReport(report);
    }

    /* =========================================
       DATE HELPERS
    ========================================= */

    function getReportDate(report) {
        return (
            report.submittedAt ||
            report.dateSubmitted ||
            report.createdAt ||
            report.created_at ||
            report.timestamp ||
            report.date ||
            ""
        );
    }

    function formatDate(dateValue) {
        if (!dateValue) {
            return "—";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return String(dateValue);
        }

        return date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }

    function getTimestamp(report) {
        const dateValue = getReportDate(report);
        const date = new Date(dateValue);

        return Number.isNaN(date.getTime())
            ? 0
            : date.getTime();
    }

    /* =========================================
       REPORT FIELD HELPERS
    ========================================= */

    function getReportId(report, index) {
        return (
            report.reportId ||
            report.id ||
            report.referenceNumber ||
            `SR-${String(index + 1).padStart(4, "0")}`
        );
    }

    function getIncidentType(report) {
        return (
            report.incidentType ||
            report.type ||
            report.category ||
            "Unspecified"
        );
    }

    function getLocation(report) {
        return (
            report.location ||
            report.incidentLocation ||
            report.place ||
            "Not provided"
        );
    }

    function createCell(text, className) {
        const cell = document.createElement("td");

        cell.textContent =
            text === null ||
            text === undefined ||
            text === ""
                ? "—"
                : String(text);

        if (className) {
            cell.className = className;
        }

        return cell;
    }

    /* =========================================
       REPORT DETAILS BUTTON
    ========================================= */

    function createActionCell(report) {
        const cell = document.createElement("td");
        const actions = document.createElement("div");
        actions.className = "report-row-actions";
        const button = document.createElement("button");

        button.type = "button";
        button.className = "view-button";
        button.textContent = "View";
        button.dataset.viewReport = "true";
        button.setAttribute(
            "aria-label",
            "View report details"
        );

        button.addEventListener("click", () => {
            /*
             * Check ownership again before opening a report.
             * This prevents a row from being used to open a
             * report that no longer belongs to the user.
             */
            if (!belongsToCurrentUser(report)) {
                console.warn(
                    "Blocked access to a report owned by another user."
                );

                return;
            }

            document.dispatchEvent(
                new CustomEvent("safereport:open-report", {
                    detail: {
                        report: report
                    }
                })
            );

            /*
             * Compatibility event for existing page scripts
             * that use a report ID to display the details.
             */
            document.dispatchEvent(
                new CustomEvent("safereport:view-report", {
                    detail: {
                        report: report,
                        reportId:
                            report.reportId ||
                            report.id ||
                            report.referenceNumber ||
                            ""
                    }
                })
            );
        });

        actions.appendChild(button);

        if (canEditReport(report)) {
            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.className = "view-button edit-report-button";
            editButton.textContent = "Edit";
            editButton.dataset.editReport = "true";
            editButton.setAttribute("aria-label", "Edit pending report");
            editButton.addEventListener("click", () => {
                const latestReport = getCurrentStoredReport(
                    getReportIdentifier(report)
                );

                if (latestReport) {
                    openReportEditor(latestReport);
                }
            });
            actions.appendChild(editButton);
        }

        cell.appendChild(actions);

        return cell;
    }

    /* =========================================
       RENDER REPORT TABLE
    ========================================= */

    function renderReports(reports) {
        tableBody.replaceChildren();

        reports.forEach((report, index) => {
            const row = document.createElement("tr");

            row.appendChild(
                createCell(getReportId(report, index))
            );

            row.appendChild(
                createCell(getIncidentType(report))
            );

            row.appendChild(
                createCell(formatDate(getReportDate(report)))
            );

            row.appendChild(
                createCell(getLocation(report))
            );

            const statusCell = document.createElement("td");
            const statusBadge = document.createElement("span");

            statusBadge.className =
                `status-badge ${getStatusClass(report.status)}`;

            statusBadge.textContent =
                getStatusLabel(report.status);

            statusCell.appendChild(statusBadge);
            row.appendChild(statusCell);

            row.appendChild(createActionCell(report));

            /*
             * Store only the report ID as a data attribute.
             * Do not place report descriptions or personal
             * information directly into HTML strings.
             */
            row.dataset.reportId = String(
                report.reportId ||
                report.id ||
                report.referenceNumber ||
                ""
            );
            row.dataset.status = String(report.status || "");

            tableBody.appendChild(row);
        });
    }

    /* =========================================
       UPDATE STATISTICS
    ========================================= */

    function updateStats(reports) {
        const total = reports.length;

        const underReview = reports.filter(report => {
            const status = normalizeStatus(report.status);
            return status === "review" || status === "progress";
        }).length;

        const resolved = reports.filter(report => {
            return normalizeStatus(report.status) === "resolved";
        }).length;

        if (totalCount) {
            totalCount.textContent = String(total);
        }

        if (reviewCount) {
            reviewCount.textContent = String(underReview);
        }

        if (resolvedCount) {
            resolvedCount.textContent = String(resolved);
        }
    }

    /* =========================================
       REFRESH REPORTS
    ========================================= */

    function refreshReports() {
        /*
         * Recheck the login state when refreshing.
         */
        const user = getCurrentUser();

        if (!user) {
            window.location.replace("login.html");
            return;
        }

        if (isAdministrator(user)) {
            window.location.replace("admin-reports.html");
            return;
        }

        const reports = getVisibleReports().sort(
            (a, b) => getTimestamp(b) - getTimestamp(a)
        );

        renderReports(reports);
        updateStats(reports);

        document.dispatchEvent(
            new CustomEvent(
                "safereport:student-reports-refreshed",
                {
                    detail: {
                        count: reports.length
                    }
                }
            )
        );
    }

    /* =========================================
       LISTEN FOR REPORT CHANGES
    ========================================= */

    window.addEventListener("storage", event => {
        if (
            event.key === REPORTS_KEY ||
            event.key === CURRENT_USER_KEY ||
            event.key === LOGIN_KEY
        ) {
            refreshReports();
        }
    });

    document.addEventListener(
        "safereport:reports-updated",
        refreshReports
    );

    document.addEventListener(
        "safereport:reports-changed",
        refreshReports
    );

    document.addEventListener(
        "reportsUpdated",
        refreshReports
    );

    /*
     * Allow existing application code to request a refresh
     * without accessing the internal rendering functions.
     */
    window.refreshMyReports = refreshReports;
    window.openSafeReportEdit = id => {
        const report = getCurrentStoredReport(id);

        return report ? openReportEditor(report) : false;
    };

    /* =========================================
       INITIAL LOAD
    ========================================= */

    refreshReports();

    const requestedEditId = new URLSearchParams(
        window.location.search
    ).get("edit");

    if (requestedEditId) {
        window.openSafeReportEdit(requestedEditId);
    }
});