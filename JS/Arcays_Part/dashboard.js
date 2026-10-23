/* =========================================
   SAFEREPORT - DASHBOARD
   Statistics, Recent Activity, and Reports
========================================= */

/* =========================================
   INITIALIZATION
========================================= */

document.addEventListener("DOMContentLoaded", () => {
    refreshDashboard();
    setupAnnouncementHeading();
    setupDashboardSearch();

    // Refresh when reports change in another browser tab.
    window.addEventListener("storage", event => {
        if (
            event.key === null ||
            event.key === "reports" ||
            event.key === "safeReportReports" ||
            event.key === "currentUser" ||
            event.key === "safeReportLoggedIn"
        ) {
            refreshDashboard();
        }
    });

    // Refresh when reports change in the current tab.
    window.addEventListener(
        "safereport:reports-updated",
        refreshDashboard
    );
});

/* =========================================
   REFRESH DASHBOARD
========================================= */

function refreshDashboard() {
    // Only display reports belonging to the current student.
    const reports = getVisibleReports();

    updateStatistics(reports);
    renderRecentActivity(reports);
}

/* =========================================
   CURRENT USER
========================================= */

function getCurrentUser() {
    try {
        if (localStorage.getItem("safeReportLoggedIn") !== "true") {
            return null;
        }

        const savedUser = localStorage.getItem("currentUser");

        if (!savedUser) {
            return null;
        }

        const user = JSON.parse(savedUser);

        if (
            !user ||
            typeof user !== "object" ||
            Array.isArray(user) ||
            typeof user.email !== "string" ||
            user.email.trim() === ""
        ) {
            return null;
        }

        return user;
    } catch (error) {
        console.error(
            "Unable to identify the current student:",
            error
        );

        return null;
    }
}

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

            if (Array.isArray(reports)) {
                return reports;
            }
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
   REPORT OWNERSHIP
========================================= */

function belongsToCurrentUser(report, user) {
    if (!report || !user || !report.submittedBy) {
        return false;
    }

    const owner = report.submittedBy;

    if (
        typeof owner !== "object" ||
        Array.isArray(owner)
    ) {
        return false;
    }

    const userEmail = String(user.email || "")
        .trim()
        .toLowerCase();

    const ownerEmail = String(owner.email || "")
        .trim()
        .toLowerCase();

    const userStudentId = String(
        user.studentId || user.student_id || user.schoolId || ""
    ).trim().toLowerCase();

    const ownerStudentId = String(
        owner.studentId || owner.student_id || owner.schoolId || ""
    ).trim().toLowerCase();

    /*
     * If both records contain a Student ID, it must match.
     * Do not fall back to email when both IDs exist but differ.
     */
    if (userStudentId && ownerStudentId) {
        return userStudentId === ownerStudentId;
    }

    /*
     * Use email when a Student ID is unavailable
     * on either the user record or the report owner.
     */
    if (userEmail && ownerEmail) {
        return userEmail === ownerEmail;
    }

    // Reports without identifiable ownership are not shown.
    return false;
}

function getVisibleReports() {
    const user = getCurrentUser();

    // Fail closed if there is no valid student session.
    if (!user) {
        return [];
    }

    const allReports = getReports();

    return allReports.filter(report =>
        belongsToCurrentUser(report, user)
    );
}

/* =========================================
   STATUS HELPERS
========================================= */

function normalizeStatus(status) {
    return String(status || "")
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ");
}

function isResolvedStatus(status) {
    return ["completed", "resolved", "closed"].includes(
        normalizeStatus(status)
    );
}

function isReviewStatus(status) {
    return [
        "pending",
        "under review",
        "reviewing",
        "in review"
    ].includes(normalizeStatus(status));
}

function isActiveStatus(status) {
    return (
        isReviewStatus(status) ||
        normalizeStatus(status) === "in progress"
    );
}

function getStatusClass(status) {
    const normalized = normalizeStatus(status);

    if (isResolvedStatus(normalized)) {
        return "resolved";
    }

    if (isReviewStatus(normalized)) {
        return "reviewing";
    }

    if (normalized === "in progress") {
        return "in-progress";
    }

    return "received";
}

function getStatusLabel(status) {
    const normalized = normalizeStatus(status);

    if (isResolvedStatus(normalized)) {
        return "Resolved";
    }

    if (normalized === "in progress") {
        return "In Progress";
    }

    if (isReviewStatus(normalized)) {
        return "Under Review";
    }

    return status ? String(status) : "Received";
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

    const activeReports = reports.filter(report =>
        isActiveStatus(report.status)
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
        } else if (label.includes("under review")) {
            value.textContent = activeReports;
        } else if (label === "resolved") {
            value.textContent = resolvedReports;
        } else if (label.includes("resolution rate")) {
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
   RECENT ACTIVITY
========================================= */

function renderRecentActivity(reports) {
    const activityList = document.querySelector(
        "#recentActivity .activity-list"
    );

    if (!activityList) return;

    activityList.replaceChildren();

    if (reports.length === 0) {
        const emptyMessage = document.createElement("p");

        emptyMessage.className = "activity-empty";
        emptyMessage.textContent = "No recent report activity yet.";

        emptyMessage.style.padding = "16px";
        emptyMessage.style.textAlign = "center";
        emptyMessage.style.color = "#64748b";

        activityList.appendChild(emptyMessage);
        return;
    }

    // Display the three most recent reports belonging to this student.
    const latestReports = [...reports]
        .sort((a, b) => getReportTimestamp(b) - getReportTimestamp(a))
        .slice(0, 3);

    latestReports.forEach(report => {
        const activity = document.createElement("article");
        const reportId = getReportId(report);

        activity.className = "activity";
        activity.tabIndex = 0;
        activity.setAttribute("role", "button");
        activity.setAttribute(
            "aria-label",
            `Open options for report ${reportId}`
        );

        // Activity icon.
        const icon = document.createElement("div");

        icon.className = "activity-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = isResolvedStatus(report.status) ? "✓" : "◷";

        // Activity details.
        const details = document.createElement("div");
        const id = document.createElement("strong");
        const summary = document.createElement("p");

        details.className = "activity-details";

        id.textContent = reportId.startsWith("#")
            ? reportId
            : `#${reportId}`;

        summary.textContent = getReportSummary(report);

        details.append(id, summary);

        // Current status.
        const status = document.createElement("span");

        status.className = `status ${getStatusClass(report.status)}`;
        status.textContent = getStatusLabel(report.status);

        // Relative submission time.
        const time = document.createElement("time");

        time.textContent = getRelativeTime(report);

        const dateTime = getReportDateTime(report);

        if (dateTime) {
            time.dateTime = dateTime;
        }

        activity.append(icon, details, status, time);

        attachActivityEvents(activity, reportId, report);

        activityList.appendChild(activity);
    });
}

/* =========================================
   ACTIVITY INTERACTIONS
========================================= */

function attachActivityEvents(activity, reportId, report) {
    if (activity.dataset.activityEventsAttached === "true") {
        return;
    }

    activity.dataset.activityEventsAttached = "true";
    activity.style.cursor = "pointer";

    activity.addEventListener("click", () => {
        if (typeof showReportChoices === "function") {
            showReportChoices(reportId, report);
        } else {
            console.error(
                "showReportChoices() was not found. Check modal.js."
            );
        }
    });

    activity.addEventListener("keydown", event => {
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

function normalizeReportId(id) {
    return String(id || "")
        .trim()
        .replace(/^#/, "")
        .toLowerCase();
}

function findReportById(reports, reportId) {
    const requestedId = normalizeReportId(reportId);

    return reports.find(report =>
        normalizeReportId(getReportId(report)) === requestedId
    ) || null;
}

function getReportSummary(report) {
    const type = String(
        report.type ||
        report.incidentType ||
        "Safety concern"
    ).trim();

    if (isResolvedStatus(report.status)) {
        return `${type} incident resolved`;
    }

    if (isActiveStatus(report.status)) {
        return `${type} incident in progress`;
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

    if (!value) return "";

    const date = new Date(value);

    return Number.isFinite(date.getTime())
        ? date.toISOString()
        : "";
}

function getRelativeTime(report) {
    const timestamp = getReportTimestamp(report);

    if (!timestamp) {
        return report.date
            ? String(report.date)
            : "Date unavailable";
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
   ANNOUNCEMENT HEADING
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

    // Keep heading labels visually static, not clickable.
    const headingElements = headingContent.querySelectorAll(
        ".small-title, h2"
    );

    headingElements.forEach(element => {
        element.style.cursor = "default";
        element.style.userSelect = "none";
        element.style.webkitUserSelect = "none";
    });
}

/* =========================================
   DASHBOARD SEARCH
========================================= */

function setupDashboardSearch() {
    const searchInput = document.getElementById("dashboardSearch");
    const searchStatus = document.getElementById("dashboardSearchStatus");

    if (!searchInput) return;

    const searchableSections = [
        {
            section: document.getElementById("announcements"),
            selector: ".announcement"
        },
        {
            section: document.getElementById("safetyResources"),
            selector: ".resource-card"
        }
    ].filter(group => group.section);

    function applySearch() {
        const query = searchInput.value.trim().toLocaleLowerCase();
        let matches = 0;

        searchableSections.forEach(({ section, selector }) => {
            const items = section.querySelectorAll(selector);
            let sectionMatches = 0;

            items.forEach(item => {
                const matchesQuery =
                    !query ||
                    item.textContent.toLocaleLowerCase().includes(query);

                item.hidden = !matchesQuery;

                if (matchesQuery) {
                    matches++;
                    sectionMatches++;
                }
            });

            section.hidden = Boolean(query) && sectionMatches === 0;
        });

        if (!searchStatus) return;

        searchStatus.hidden = !query;

        if (!query) {
            searchStatus.textContent = "";
        } else if (matches === 0) {
            searchStatus.textContent =
                "No announcements or safety resources match your search.";
        } else {
            searchStatus.textContent =
                `${matches} matching ${matches === 1 ? "item" : "items"} found.`;
        }
    }

    searchInput.addEventListener("input", applySearch);
}