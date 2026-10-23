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
         * If both records have student IDs, require the IDs
         * and email addresses to match.
         *
         * This prevents an email match alone from overriding
         * a conflicting student ID.
         */
        if (currentStudentId && ownerStudentId) {
            return (
                currentStudentId === ownerStudentId &&
                currentEmail !== "" &&
                currentEmail === ownerEmail
            );
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
            value === "reviewing" ||
            value === "in progress" ||
            value === "investigating"
        ) {
            return "review";
        }

        return "pending";
    }

    function getStatusLabel(status) {
        const normalized = normalizeStatus(status);

        if (normalized === "resolved") {
            return "Resolved";
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

        if (normalized === "review") {
            return "review";
        }

        return "pending";
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
        const button = document.createElement("button");

        button.type = "button";
        button.className = "view-button";
        button.textContent = "View";
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

        cell.appendChild(button);

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

            tableBody.appendChild(row);
        });
    }

    /* =========================================
       UPDATE STATISTICS
    ========================================= */

    function updateStats(reports) {
        const total = reports.length;

        const underReview = reports.filter(report => {
            return normalizeStatus(report.status) === "review";
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

    /* =========================================
       INITIAL LOAD
    ========================================= */

    refreshReports();
});