
document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("reportsTableBody");

    if (!tableBody) return;
    
    function getSubmissionTime(report) {
      const timestamp = Date.parse(report.createdAt || "");

      if (Number.isFinite(timestamp)) {
         return timestamp;
    }

    // Fallback for older records without createdAt.
    const id = Number(report.id);

      if (Number.isFinite(id) && id > 0) {
        return id;
      }

      return 0;
    }

    function sortReportsByNewest(reports) {
      return [...reports].sort(
        (a, b) => getSubmissionTime(b) - getSubmissionTime(a)
      );
    }


    // Use the same storage key as reportForm.js.
    function getStoredReports() {
        try {
            const reports = JSON.parse(
                localStorage.getItem("reports") || "[]"
            );

            return Array.isArray(reports) ? reports : [];
        } catch (error) {
            console.error("Unable to load reports:", error);
            return [];
        }
    }

    function normalizeStatus(status) {
        const value = String(status || "").toLowerCase();

        if (["pending", "under review"].includes(value)) {
            return "under review";
        }

        if (["completed", "resolved"].includes(value)) {
            return "resolved";
        }

        return "under review";
    }

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

    function formatReportId(id, index) {
        const value = String(id || index + 1);

        if (value.startsWith("#SR-")) return value;

        return `#SR-${value.slice(-6).padStart(6, "0")}`;
    }

    function getTypeClass(type) {
        const value = String(type || "").toLowerCase();

        if (value.includes("harass")) return "harassment-dot";
        if (value.includes("bull")) return "bullying-dot";
        if (value.includes("violence")) return "violence-dot";
        if (value.includes("threat")) return "threat-dot";

        return "safety-dot";
    }

    function renderReports(reports) {
        tableBody.replaceChildren();

        reports.forEach((report, index) => {
            const row = document.createElement("tr");
            const status = normalizeStatus(report.status);

            // Used by My Reports search, filters, and sorting.
            row.dataset.status = status;
            row.dataset.date = report.date || "";

            const idCell = document.createElement("td");
            const idLabel = document.createElement("span");

            idLabel.className = "report-id";
            idLabel.textContent = formatReportId(report.id, index);
            idCell.appendChild(idLabel);
            row.appendChild(idCell);

            const typeCell = document.createElement("td");
            const typeLabel = document.createElement("span");
            const typeDot = document.createElement("span");

            typeLabel.className = "incident-type";
            typeDot.className = `type-dot ${getTypeClass(report.type)}`;

            typeLabel.append(typeDot, document.createTextNode(
                report.type || "Safety Concern"
            ));

            typeCell.appendChild(typeLabel);
            row.appendChild(typeCell);

            const dateCell = document.createElement("td");

            dateCell.textContent = formatDate(report.date);
            dateCell.dataset.dateCell = report.date || "";
            row.appendChild(dateCell);

            const locationCell = document.createElement("td");

            locationCell.textContent = report.location || "Not provided";
            row.appendChild(locationCell);

            const statusCell = document.createElement("td");
            const statusLabel = document.createElement("span");
            const statusDot = document.createElement("span");

            statusLabel.className =
                status === "resolved" ? "status resolved" : "status reviewing";

            statusDot.className = "status-dot";
            statusLabel.append(
                statusDot,
                document.createTextNode(
                    status === "resolved" ? "Resolved" : "Under Review"
                )
            );

            statusCell.appendChild(statusLabel);
            row.appendChild(statusCell);

            const actionCell = document.createElement("td");
            const viewButton = document.createElement("button");

            viewButton.type = "button";
            viewButton.className = "view-button";
            viewButton.dataset.viewReport = "";
            viewButton.append(
                document.createTextNode("View "),
                document.createTextNode("→")
            );

            actionCell.appendChild(viewButton);
            row.appendChild(actionCell);

            tableBody.appendChild(row);
        });
    }

    function updateStats(reports) {
        const total = reports.length;
        const reviewing = reports.filter(
            report => normalizeStatus(report.status) === "under review"
        ).length;
        const resolved = reports.filter(
            report => normalizeStatus(report.status) === "resolved"
        ).length;

        const totalCount = document.getElementById("totalCount");
        const reviewCount = document.getElementById("reviewCount");
        const resolvedCount = document.getElementById("resolvedCount");

        if (totalCount) totalCount.textContent = total;
        if (reviewCount) reviewCount.textContent = reviewing;
        if (resolvedCount) resolvedCount.textContent = resolved;
    }

    const reports = sortReportsByNewest(getStoredReports());

    renderReports(reports);
    updateStats(reports);
});
