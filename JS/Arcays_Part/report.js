
/* =========================================
   SAFEREPORT - MY REPORTS
   Report Table, Statuses, and Statistics
========================================= */

document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("reportsTableBody");

    if (!tableBody) return;

    const totalCount = document.getElementById("totalCount");
    const reviewCount = document.getElementById("reviewCount");
    const resolvedCount = document.getElementById("resolvedCount");

    // Retrieve reports from shared storage.
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
            console.error("Unable to load reports:", error);
            return [];
        }
    }

    // Normalize statuses for consistent display and filtering.
    function normalizeStatus(status) {
        const value = String(status || "")
            .trim()
            .toLowerCase()
            .replace(/[_-]+/g, " ")
            .replace(/\s+/g, " ");

        if (["resolved", "completed", "closed"].includes(value)) {
            return "resolved";
        }

        if (value === "in progress") {
            return "in progress";
        }

        if (value === "pending") {
            return "pending";
        }

        return "under review";
    }

    // Convert normalized statuses into display labels.
    function getStatusText(status) {
        const labels = {
            "under review": "Under Review",
            "in progress": "In Progress",
            "pending": "Pending",
            "resolved": "Resolved"
        };

        return labels[normalizeStatus(status)];
    }

    // Get the submission timestamp for sorting.
    function getSubmissionTime(report) {
        const submittedAt =
            report.createdAt ||
            report.created_at ||
            report.submittedAt ||
            report.submitted_at ||
            report.timestamp;

        if (submittedAt) {
            const timestamp = Date.parse(submittedAt);

            if (Number.isFinite(timestamp)) {
                return timestamp;
            }
        }

        const id = Number(report.id);

        return Number.isFinite(id) ? id : 0;
    }

    // Format dates for display.
    function formatDate(date) {
        if (!date) return "Not provided";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return String(date);
        }

        return parsedDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    }

    // Prefer the submission date over the incident date.
    function getSubmittedDate(report) {
        return (
            report.createdAt ||
            report.created_at ||
            report.submittedAt ||
            report.submitted_at ||
            report.timestamp ||
            report.submissionDate ||
            report.submission_date ||
            report.date ||
            ""
        );
    }

    // Generate a consistent report ID.
    function formatReportId(id, index) {
        const value = String(id ?? index + 1);

        if (value.startsWith("#SR-")) {
            return value;
        }

        return `#SR-${value.slice(-6).padStart(6, "0")}`;
    }

    // Assign a CSS class based on the incident type.
    function getTypeClass(type) {
        const value = String(type || "").toLowerCase();

        if (value.includes("harass")) return "harassment-dot";
        if (value.includes("bull")) return "bullying-dot";
        if (value.includes("violence")) return "violence-dot";
        if (value.includes("threat")) return "threat-dot";

        return "safety-dot";
    }

    // Create a table cell safely.
    function createCell(content, className = "") {
        const cell = document.createElement("td");

        if (className) {
            cell.className = className;
        }

        cell.textContent = content || "Not provided";

        return cell;
    }

    // Render reports into the table.
    function renderReports(reports) {
        tableBody.replaceChildren();

        reports.forEach((report, index) => {
            const row = document.createElement("tr");
            const status = normalizeStatus(report.status);
            const submittedDate = getSubmittedDate(report);

            row.dataset.status = status;
            row.dataset.date = report.date || "";
            row.dataset.submitted = String(submittedDate || "");
            row.dataset.reportId = String(report.id ?? "");

            // Report ID
            const idCell = document.createElement("td");
            const idLabel = document.createElement("span");

            idLabel.className = "report-id";
            idLabel.textContent = formatReportId(report.id, index);

            idCell.appendChild(idLabel);
            row.appendChild(idCell);

            // Incident type
            const typeCell = document.createElement("td");
            const typeLabel = document.createElement("span");
            const typeDot = document.createElement("span");

            typeLabel.className = "incident-type";
            typeDot.className = `type-dot ${getTypeClass(report.type)}`;

            typeLabel.append(
                typeDot,
                document.createTextNode(
                    report.type || "Safety Concern"
                )
            );

            typeCell.appendChild(typeLabel);
            row.appendChild(typeCell);

            // Date submitted
            const dateCell = createCell(formatDate(submittedDate));

            dateCell.dataset.date = String(submittedDate || "");
            row.appendChild(dateCell);

            // Location
            row.appendChild(createCell(report.location));

            // Status
            const statusCell = document.createElement("td");
            const statusLabel = document.createElement("span");
            const statusDot = document.createElement("span");

            statusLabel.className =
                status === "resolved"
                    ? "status resolved"
                    : "status reviewing";

            statusDot.className = "status-dot";

            statusLabel.append(
                statusDot,
                document.createTextNode(getStatusText(status))
            );

            statusCell.appendChild(statusLabel);
            row.appendChild(statusCell);

            // View details button
            const actionCell = document.createElement("td");
            const viewButton = document.createElement("button");

            viewButton.type = "button";
            viewButton.className = "view-button";
            viewButton.dataset.viewReport = "";

            viewButton.setAttribute(
                "aria-label",
                `View report ${formatReportId(report.id, index)}`
            );

            viewButton.textContent = "View →";

            actionCell.appendChild(viewButton);
            row.appendChild(actionCell);

            tableBody.appendChild(row);
        });
    }

    // Update the summary cards.
    function updateStats(reports) {
        const total = reports.length;

        const resolved = reports.filter(
            report => normalizeStatus(report.status) === "resolved"
        ).length;

        const active = total - resolved;

        if (totalCount) {
            totalCount.textContent = total;
        }

        if (reviewCount) {
            reviewCount.textContent = active;
        }

        if (resolvedCount) {
            resolvedCount.textContent = resolved;
        }
    }

    // Refresh reports and notify the page filters.
    function refreshReports() {
        const reports = getStoredReports().sort(
            (a, b) => getSubmissionTime(b) - getSubmissionTime(a)
        );

        renderReports(reports);
        updateStats(reports);

        window.dispatchEvent(
            new Event("safereport:reports-updated")
        );
    }

    // Listen for changes made in another browser tab.
    window.addEventListener("storage", event => {
        if (event.key === "reports" || event.key === null) {
            refreshReports();
        }
    });

    // Listen for report changes announced by other scripts.
    window.addEventListener(
        "safereport:reports-changed",
        refreshReports
    );

    // Initial table rendering.
    refreshReports();
});
