/* =========================================
   SAFEREPORT — MY REPORTS
   Renders saved reports for myreports.html
========================================= */

document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("reportsTableBody");

    if (!tableBody) return;

    renderReports();

    /*
     * Render again when another part of the page
     * requests a refresh after adding a report.
     */
    window.renderSafeReportTable = renderReports;

    function getStoredReports() {
        try {
            if (
                window.SafeReportStorage &&
                typeof window.SafeReportStorage.getReports === "function"
            ) {
                const reports = window.SafeReportStorage.getReports();
                return Array.isArray(reports) ? reports : [];
            }

            const reports = JSON.parse(
                localStorage.getItem("reports") || "[]"
            );

            return Array.isArray(reports) ? reports : [];
        } catch (error) {
            console.error("Unable to load SafeReport records:", error);
            return [];
        }
    }

    function normalizeStatus(status) {
        const value = String(status || "")
            .trim()
            .toLowerCase()
            .replace(/[_-]+/g, " ")
            .replace(/\s+/g, " ");

        if (["pending", "in progress", "under review"].includes(value)) {
            return "under review";
        }

        if (["completed", "closed"].includes(value)) {
            return "resolved";
        }

        return value || "under review";
    }

    function formatDate(value) {
        if (!value) return "Not provided";

        /*
         * Preserve date-only values so they don't shift
         * to the previous day because of timezone conversion.
         */
        const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(
            String(value).trim()
        );

        let date;

        if (dateOnly) {
            date = new Date(
                Number(dateOnly[1]),
                Number(dateOnly[2]) - 1,
                Number(dateOnly[3])
            );
        } else {
            date = new Date(value);
        }

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    }

    function getReportId(report, index) {
        const rawId = String(
            report.id ??
            report.reportId ??
            report.report_id ??
            index + 1
        ).trim();

        /*
         * Keep IDs already formatted as SR-...
         * Numeric IDs receive the last six digits.
         */
        if (/^#?SR-/i.test(rawId)) {
            return rawId.startsWith("#") ? rawId : `#${rawId}`;
        }

        const digits = rawId.replace(/\D/g, "");

        if (digits) {
            return `#SR-${digits.slice(-6).padStart(6, "0")}`;
        }

        return `#SR-${String(index + 1).padStart(6, "0")}`;
    }

    function getSubmissionTimestamp(report) {
        const value =
            report.createdAt ||
            report.created_at ||
            report.submittedAt ||
            report.submitted_at ||
            "";

        const timestamp = Date.parse(value);

        if (Number.isFinite(timestamp)) {
            return new Date(timestamp).toISOString();
        }

        /*
         * Older reports may not have a submission timestamp.
         * A date-only fallback is approximate, not an exact
         * record of when the report was submitted.
         */
        return "";
    }

    function getIncidentTypeClass(type) {
        const value = String(type || "").toLowerCase();

        if (value.includes("bully")) return "bullying-dot";
        if (value.includes("harass")) return "harassment-dot";
        if (value.includes("threat")) return "safety-dot";
        if (value.includes("violence")) return "safety-dot";

        return "safety-dot";
    }

    function createCell(text) {
        const cell = document.createElement("td");
        cell.textContent = text;
        return cell;
    }

    function renderReports() {
        const reports = getStoredReports();
        tableBody.replaceChildren();

        reports.forEach((report, index) => {
            const row = document.createElement("tr");

            const reportId = getReportId(report, index);
            const status = normalizeStatus(report.status);
            const submittedAt = getSubmissionTimestamp(report);

            /*
             * These attributes are used by the filter and
             * sorting code in myreports.html.
             */
            row.dataset.reportId = reportId;
            row.dataset.status = status;
            row.dataset.date = report.date || "";
            row.dataset.submitted = submittedAt;

            // Report ID
            const idCell = document.createElement("td");
            const idLabel = document.createElement("span");

            idLabel.className = "report-id";
            idLabel.textContent = reportId;

            idCell.appendChild(idLabel);
            row.appendChild(idCell);

            // Incident type
            const typeCell = document.createElement("td");
            const typeLabel = document.createElement("span");
            const typeDot = document.createElement("span");

            typeLabel.className = "incident-type";
            typeDot.className =
                `type-dot ${getIncidentTypeClass(report.type)}`;

            typeLabel.appendChild(typeDot);
            typeLabel.appendChild(
                document.createTextNode(report.type || "Safety Concern")
            );

            typeCell.appendChild(typeLabel);
            row.appendChild(typeCell);

            // Date submitted
            const dateCell = createCell(
                submittedAt
                    ? formatDate(submittedAt)
                    : formatDate(report.date)
            );

            dateCell.dataset.date = report.date || "";
            dateCell.dataset.dateCell = submittedAt || report.date || "";

            row.appendChild(dateCell);

            // Location
            row.appendChild(
                createCell(report.location || "Not provided")
            );

            // Status
            const statusCell = document.createElement("td");
            const statusLabel = document.createElement("span");
            const statusDot = document.createElement("span");

            statusLabel.className = status === "resolved"
                ? "status resolved"
                : "status reviewing";

            statusDot.className = "status-dot";
            statusLabel.appendChild(statusDot);

            const statusText = status === "resolved"
                ? "Resolved"
                : status === "under review"
                    ? "Under Review"
                    : status.replace(/\b\w/g, letter =>
                        letter.toUpperCase()
                    );

            statusLabel.appendChild(
                document.createTextNode(statusText)
            );

            statusCell.appendChild(statusLabel);
            row.appendChild(statusCell);

            // View button — used by the details dialog
            const actionCell = document.createElement("td");
            const viewButton = document.createElement("button");

            viewButton.type = "button";
            viewButton.className = "view-button";
            viewButton.dataset.viewReport = "";
            viewButton.appendChild(
                document.createTextNode("View ")
            );

            const arrow = document.createElement("span");
            arrow.textContent = "→";
            viewButton.appendChild(arrow);

            actionCell.appendChild(viewButton);
            row.appendChild(actionCell);

            tableBody.appendChild(row);
        });

        /*
         * Reapply the current search, status and sort selections
         * after the table has been rendered.
         */
        if (typeof window.applySafeReportFilters === "function") {
            window.applySafeReportFilters();
        }
    }
});