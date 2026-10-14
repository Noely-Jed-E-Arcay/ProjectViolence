document.addEventListener("DOMContentLoaded", () => {
    const reports = getReports();

    updateStatistics(reports);
    renderRecentActivity(reports);
    setupAnnouncementHeading();

    // Update statistics when another browser tab changes saved reports.
    window.addEventListener("storage", event => {
        if (
            event.key === null ||
            event.key === "reports" ||
            event.key === "safeReportReports"
        ) {
            updateStatistics(getReports());
        }
    });

    // Check for updates made in the same browser every 2 seconds.
    window.setInterval(() => {
        updateStatistics(getReports());
    }, 2000);
});

/* =========================================
   REPORT STORAGE
========================================= */

function getReports() {
    try {
        if (
            window.SafeReportStorage &&
            typeof window.SafeReportStorage.getReports === "function"
        ) {
            const reports = window.SafeReportStorage.getReports();
            return Array.isArray(reports) ? reports : [];
        }

        const currentReports = localStorage.getItem("reports");

        if (currentReports !== null) {
            const reports = JSON.parse(currentReports);
            if (Array.isArray(reports)) return reports;
        }

        const legacyReports = JSON.parse(
            localStorage.getItem("safeReportReports") || "[]"
        );

        return Array.isArray(legacyReports) ? legacyReports : [];
    } catch (error) {
        console.error("Unable to load saved reports:", error);
        return [];
    }
}

/* =========================================
   REPORT STATISTICS
========================================= */

function updateStatistics(reports) {
    const statBoxes = document.querySelectorAll(".stats .stat-box");

    const totalReports = reports.length;

    const resolvedReports = reports.filter(report =>
        isResolvedStatus(report.status)
    ).length;

    const resolutionRate = totalReports > 0
        ? Math.round((resolvedReports / totalReports) * 100)
        : 0;

    statBoxes.forEach(statBox => {
        const label = statBox
            .querySelector("p")
            ?.textContent.trim().toLowerCase();

        const value = statBox.querySelector("h2");

        if (!value || !label) return;

        if (label.includes("submitted")) {
            value.textContent = totalReports;
        }

        if (label.includes("under review")) {
            value.textContent = reports.filter(report =>
                isReviewStatus(report.status)
            ).length;
        }

        if (label === "resolved") {
            value.textContent = resolvedReports;
        }

        if (label.includes("resolution rate")) {
            value.textContent = `${resolutionRate}%`;

            const description = statBox.querySelector("small");

            if (description) {
                description.textContent =
                    `${resolvedReports} of ${totalReports} reports resolved`;
            }
        }
    });
}

/* =========================================
   STATUS HELPERS
========================================= */

function isReviewStatus(status) {
    return [
        "pending",
        "under review",
        "reviewing",
        "in review"
    ].includes(String(status || "").trim().toLowerCase());
}

function isResolvedStatus(status) {
    return [
        "completed",
        "resolved",
        "closed"
    ].includes(String(status || "").trim().toLowerCase());
}

function getStatusClass(status) {
    const normalized = String(status || "")
        .trim()
        .toLowerCase();

    if (isResolvedStatus(normalized)) {
        return "resolved";
    }

    if (isReviewStatus(normalized)) {
        return "reviewing";
    }

    return "received";
}

function getStatusLabel(status) {
    const normalized = String(status || "")
        .trim()
        .toLowerCase();

    if (isResolvedStatus(normalized)) return "Resolved";
    if (isReviewStatus(normalized)) return "Under Review";

    return status ? String(status) : "Received";
}

/* =========================================
   RECENT ACTIVITY
========================================= */


function renderRecentActivity(reports) {
    const activityList = document.querySelector(
        "#recentActivity .activity-list"
    );

    if (!activityList) return;

    // Remove stale sample activities when there are no reports.
    if (!reports.length) {
        activityList.replaceChildren();

        const emptyMessage = document.createElement("p");
        emptyMessage.className = "activity-empty";
        emptyMessage.textContent = "No recent report activity yet.";
        emptyMessage.style.padding = "16px";
        emptyMessage.style.textAlign = "center";
        emptyMessage.style.color = "#64748b";

        activityList.appendChild(emptyMessage);
        return;
    }

    // Show the three most recent reports.
    const latestReports = [...reports]
        .sort((a, b) => getReportTimestamp(b) - getReportTimestamp(a))
        .slice(0, 3);

    activityList.replaceChildren();

    latestReports.forEach((report) => {
        const activity = document.createElement("article");
        activity.className = "activity";
        activity.tabIndex = 0;
        activity.setAttribute("role", "button");

        const reportId = getReportId(report);

        activity.setAttribute(
            "aria-label",
            `Open options for report ${reportId}`
        );

        activity.style.cursor = "pointer";

        const icon = document.createElement("div");
        icon.className = "activity-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = isResolvedStatus(report.status) ? "✓" : "◷";

        const details = document.createElement("div");
        details.className = "activity-details";

        const id = document.createElement("strong");

        // Avoid displaying ## when the saved ID already contains #.
        id.textContent = reportId.startsWith("#")
            ? reportId
            : `#${reportId}`;

        const summary = document.createElement("p");
        summary.textContent = getReportSummary(report);

        details.append(id, summary);

        const status = document.createElement("span");
        status.className = `status ${getStatusClass(report.status)}`;
        status.textContent = getStatusLabel(report.status);

        const time = document.createElement("time");
        time.textContent = getRelativeTime(report);
        time.dateTime = getReportDateTime(report);

        activity.append(icon, details, status, time);

        attachActivityEvents(activity, reportId, report);

        activityList.appendChild(activity);
    });
}


function makeExistingActivitiesClickable(activityList, reports) {
    const activities = activityList.querySelectorAll(".activity");

    activities.forEach((activity) => {
        const idElement = activity.querySelector(
            ".activity-details strong"
        );

        if (!idElement) return;

        const reportId = idElement.textContent
            .trim()
            .replace(/^#/, "");

        const report = findReportById(reports, reportId);

        activity.tabIndex = 0;
        activity.setAttribute("role", "button");
        activity.setAttribute(
            "aria-label",
            `Open options for report ${reportId}`
        );

        activity.style.cursor = "pointer";

        attachActivityEvents(activity, reportId, report);
    });
}

function attachActivityEvents(activity, reportId, report) {
    if (activity.dataset.activityEventsAttached === "true") {
        return;
    }

    activity.dataset.activityEventsAttached = "true";

    activity.addEventListener("click", () => {
        if (typeof showReportChoices === "function") {
            showReportChoices(reportId, report);
        } else {
            console.error(
                "showReportChoices() was not found. Check modal.js."
            );
        }
    });

    activity.addEventListener("keydown", (event) => {
        if (event.target !== activity) return;

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            activity.click();
        }
    });

    activity.addEventListener("mouseenter", () => {
        activity.style.backgroundColor = "#f8faff";
    });

    activity.addEventListener("mouseleave", () => {
        activity.style.backgroundColor = "";
    });

    activity.addEventListener("focus", () => {
        activity.style.outline = "2px solid rgba(49, 87, 213, 0.35)";
        activity.style.outlineOffset = "3px";
    });

    activity.addEventListener("blur", () => {
        activity.style.outline = "";
        activity.style.outlineOffset = "";
    });
}

/* =========================================
   REPORT LOOKUP
========================================= */

function getReportId(report) {
    return String(
        report?.id ??
        report?.reportId ??
        report?.report_id ??
        "Unknown"
    );
}

function findReportById(reports, reportId) {
    const requestedId = normalizeReportId(reportId);

    return reports.find((report) => {
        const savedId = normalizeReportId(getReportId(report));

        return savedId === requestedId;
    }) || null;
}

function normalizeReportId(id) {
    return String(id || "")
        .trim()
        .replace(/^#/, "")
        .toLowerCase();
}

function getReportSummary(report) {
    const type = String(
        report.type || report.incidentType || "Safety concern"
    ).trim();

    const status = String(report.status || "")
        .trim()
        .toLowerCase();

    if (isResolvedStatus(status)) {
        return `${type} incident resolved`;
    }

    if (isReviewStatus(status)) {
        return `${type} incident under review`;
    }

    return `${type} incident submitted`;
}

/* =========================================
   DATE AND TIME HELPERS
========================================= */

function getReportTimestamp(report) {
    const possibleDates = [
        report.createdAt,
        report.created_at,
        report.submittedAt,
        report.submitted_at,
        report.timestamp,
        report.date
    ];

    for (const value of possibleDates) {
        if (!value) continue;

        const timestamp = new Date(value).getTime();

        if (Number.isFinite(timestamp)) {
            return timestamp;
        }
    }

    return 0;
}

function getReportDateTime(report) {
    const value =
        report.createdAt ||
        report.created_at ||
        report.submittedAt ||
        report.submitted_at ||
        report.date ||
        "";

    const date = new Date(value);

    return Number.isFinite(date.getTime())
        ? date.toISOString()
        : "";
}

function getRelativeTime(report) {
    const timestamp = getReportTimestamp(report);

    if (!timestamp) {
        return report.date ? String(report.date) : "Date unavailable";
    }

    const difference = Math.max(0, Date.now() - timestamp);
    const minutes = Math.floor(difference / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);

    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);

    if (days === 1) return "1d ago";
    if (days < 7) return `${days}d ago`;

    return new Date(timestamp).toLocaleDateString();
}

/* =========================================
   STAY INFORMED HEADING
========================================= */

function setupAnnouncementHeading() {
    const announcementPanel = document.querySelector(
        "#announcements .panel-heading"
    );

    if (!announcementPanel) return;

    const headingContent = announcementPanel.querySelector(
        ":scope > div"
    );

    if (!headingContent) return;

    /*
     * These are labels, not buttons.
     * Keep the default cursor and prevent text selection.
     * The separate "View All" link remains functional.
     */
    const headingElements = headingContent.querySelectorAll(
        ".small-title, h2"
    );

    headingElements.forEach((element) => {
        element.style.cursor = "default";
        element.style.userSelect = "none";
        element.style.webkitUserSelect = "none";
    });
}