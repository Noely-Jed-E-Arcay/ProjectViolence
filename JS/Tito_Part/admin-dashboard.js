(function () {
    "use strict";

    const LOGIN_KEY = "safeReportLoggedIn";
    const CURRENT_USER_KEY = "currentUser";
    const REPORTS_KEY = "reports";
    const STATUS_NAMES = ["pending", "under review", "in progress", "resolved"];
    const SVG_NS = "http://www.w3.org/2000/svg";

    function normalizeStatus(value) {
        const status = String(value || "Pending")
            .trim()
            .toLowerCase()
            .replace(/[_-]+/g, " ")
            .replace(/\s+/g, " ");

        if (["resolved", "completed", "closed"].includes(status)) {
            return "resolved";
        }

        if (status === "pending" || status === "new") {
            return "pending";
        }

        if (status === "in progress" || status === "investigating") {
            return "in progress";
        }

        return "under review";
    }

    function getStatusLabel(value) {
        const status = normalizeStatus(value);
        return status.replace(/\b\w/g, character => character.toUpperCase());
    }

    function getReportId(report) {
        const rawId = report.reportId || report.id || report.referenceNumber;
        if (rawId === undefined || rawId === null || String(rawId).trim() === "") {
            return "Unknown ID";
        }

        const id = String(rawId);
        return id.startsWith("#SR-") ? id : `#SR-${id.slice(-6).padStart(6, "0")}`;
    }

    function getRawReportId(report) {
        return String(report.id || report.reportId || report.referenceNumber || "");
    }

    function getSubmittedDate(report) {
        return (
            report.createdAt ||
            report.created_at ||
            report.submittedAt ||
            report.submitted_at ||
            report.submission_date ||
            report.submittedDate ||
            report.date ||
            ""
        );
    }

    function getSubmittedTime(report) {
        const time = Date.parse(getSubmittedDate(report));
        if (Number.isFinite(time)) {
            return time;
        }

        const numericId = Number(report.id);
        return Number.isFinite(numericId) ? numericId : 0;
    }

    function getSubmittedTimestamp(report) {
        const timestamp = Date.parse(getSubmittedDate(report));
        return Number.isFinite(timestamp) ? timestamp : null;
    }

    function formatDate(value) {
        const date = new Date(value);
        if (!value || !Number.isFinite(date.getTime())) {
            return "Not provided";
        }

        return date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    }

    function readCurrentAdmin() {
        try {
            const user = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || "null");
            const role = String(user?.role || user?.accountType || "")
                .trim()
                .toLowerCase()
                .replace(/[_-]+/g, " ")
                .replace(/\s+account$/, "");
            const sessionEmail = String(
                sessionStorage.getItem("safeReportAdminEmail") || ""
            ).trim().toLowerCase();

            if (
                localStorage.getItem(LOGIN_KEY) !== "true" ||
                sessionStorage.getItem("safeReportAdminLoggedIn") !== "true" ||
                !user ||
                !["admin", "administrator"].includes(role) ||
                String(user.email || "").trim().toLowerCase() !== sessionEmail
            ) {
                return null;
            }

            return user;
        } catch (error) {
            console.error("Unable to verify administrator dashboard access:", error);
            return null;
        }
    }

    function readReports() {
        try {
            if (
                window.SafeReportStorage &&
                typeof window.SafeReportStorage.getReports === "function"
            ) {
                return window.SafeReportStorage.getReports();
            }

            const reports = JSON.parse(localStorage.getItem(REPORTS_KEY) || "[]");
            if (!Array.isArray(reports)) {
                throw new Error("Saved report data is not a list.");
            }
            return reports;
        } catch (error) {
            console.error("Unable to load reports for the admin dashboard:", error);
            return null;
        }
    }

    function makeElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) {
            element.className = className;
        }
        if (text !== undefined) {
            element.textContent = String(text);
        }
        return element;
    }

    function makeLink(href, className, text) {
        const link = makeElement("a", className, text);
        link.href = href;
        return link;
    }

    function makeReportLink(report, className, label) {
        return makeLink(
            `admin-reports.html?view=${encodeURIComponent(getRawReportId(report))}`,
            className,
            label
        );
    }

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = String(value);
        }
    }

    function renderAdminIdentity(user) {
        const name = String(user.fullName || user.name || "Administrator").trim();
        const initials = name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part.charAt(0).toUpperCase())
            .join("") || "A";

        document.querySelectorAll("[data-admin-name]").forEach(element => {
            element.textContent = name;
        });
        document.querySelectorAll("[data-admin-initials]").forEach(element => {
            element.textContent = initials;
        });

        const heading = document.getElementById("adminWelcomeTitle");
        if (heading) {
            const hour = new Date().getHours();
            const greeting = hour < 12
                ? "Good morning"
                : hour < 18
                    ? "Good afternoon"
                    : "Good evening";
            heading.textContent = `${greeting}, ${name}`;
        }
    }

    function createStatusBadge(status) {
        const normalized = normalizeStatus(status);
        const badge = makeElement(
            "span",
            `admin-status admin-status-${normalized.replace(/\s+/g, "-")}`
        );
        const dot = makeElement("span", "admin-status-dot");
        dot.setAttribute("aria-hidden", "true");
        badge.append(dot, document.createTextNode(getStatusLabel(status)));
        return badge;
    }

    function renderRecentReports(reports) {
        const body = document.getElementById("recentReportsBody");
        const empty = document.getElementById("reportsEmpty");
        if (!body) {
            return;
        }

        body.replaceChildren();
        const recent = reports.slice(0, 5);

        recent.forEach(report => {
            const row = document.createElement("tr");
            const fields = [
                ["report-id-cell", getReportId(report)],
                ["", report.type || report.incidentType || "Safety Concern"],
                ["", report.location || "Not provided"],
                ["", formatDate(getSubmittedDate(report))]
            ];

            fields.forEach(([className, value]) => {
                const cell = makeElement("td", className, value);
                row.appendChild(cell);
            });

            const statusCell = document.createElement("td");
            statusCell.appendChild(createStatusBadge(report.status));
            row.appendChild(statusCell);

            const actionCell = makeElement("td", "admin-action-cell");
            actionCell.appendChild(makeReportLink(report, "admin-view-link", "View"));
            row.appendChild(actionCell);

            body.appendChild(row);
        });

        if (empty) {
            empty.hidden = recent.length > 0;
        }
    }

    function renderAttention(reports) {
        const list = document.getElementById("attentionList");
        const empty = document.getElementById("attentionEmpty");
        const description = document.getElementById("attentionDescription");
        if (!list) {
            return;
        }

        const pending = reports
            .filter(report => normalizeStatus(report.status) === "pending")
            .slice(0, 3);

        list.replaceChildren();
        pending.forEach(report => {
            const row = makeElement("div", "attention-row");
            const details = makeElement("div", "attention-report");
            details.append(
                makeElement("strong", "", getReportId(report)),
                makeElement(
                    "span",
                    "",
                    report.type || report.incidentType || "Safety Concern"
                )
            );
            row.append(
                details,
                createStatusBadge(report.status),
                makeReportLink(report, "admin-view-link", "View")
            );
            list.appendChild(row);
        });

        const totalPending = reports.filter(
            report => normalizeStatus(report.status) === "pending"
        ).length;
        if (description) {
            description.textContent = totalPending
                ? `${totalPending} pending ${totalPending === 1 ? "report needs" : "reports need"} your review.`
                : "Pending reports that may need your review.";
        }
        if (empty) {
            empty.hidden = pending.length > 0;
        }
    }

    function renderActivityChart(reports) {
        const container = document.getElementById("activityChart");
        if (!container) {
            return;
        }

        container.replaceChildren();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const days = [];

        for (let offset = 6; offset >= 0; offset -= 1) {
            const date = new Date(today);
            date.setDate(today.getDate() - offset);
            const nextDay = new Date(date);
            nextDay.setDate(date.getDate() + 1);
            const count = reports.filter(report => {
                const submittedAt = getSubmittedTimestamp(report);
                return submittedAt !== null &&
                    submittedAt >= date.getTime() &&
                    submittedAt < nextDay.getTime();
            }).length;
            days.push({ date, count });
        }

        const maxCount = Math.max(1, ...days.map(day => day.count));
        const svg = document.createElementNS(SVG_NS, "svg");
        svg.setAttribute("viewBox", "0 0 560 190");
        svg.setAttribute("role", "img");
        svg.setAttribute(
            "aria-label",
            `Report activity over the last seven days: ${days.map(day =>
                `${day.date.toLocaleDateString(undefined, { weekday: "short" })}, ${day.count}`
            ).join("; ")}`
        );
        svg.classList.add("activity-chart");

        [0, 0.5, 1].forEach(fraction => {
            const y = 142 - (fraction * 112);
            const line = document.createElementNS(SVG_NS, "line");
            line.setAttribute("x1", "40");
            line.setAttribute("x2", "548");
            line.setAttribute("y1", String(y));
            line.setAttribute("y2", String(y));
            line.setAttribute("class", "chart-gridline");
            svg.appendChild(line);

            const label = document.createElementNS(SVG_NS, "text");
            label.setAttribute("x", "29");
            label.setAttribute("y", String(y + 4));
            label.setAttribute("text-anchor", "end");
            label.setAttribute("class", "chart-axis-label");
            label.textContent = String(Math.round(maxCount * fraction));
            svg.appendChild(label);
        });

        const barWidth = 38;
        const gap = (508 - (barWidth * days.length)) / (days.length - 1);
        days.forEach((day, index) => {
            const x = 40 + index * (barWidth + gap);
            const height = day.count === 0 ? 2 : Math.max(6, (day.count / maxCount) * 105);
            const bar = document.createElementNS(SVG_NS, "rect");
            bar.setAttribute("x", x.toFixed(1));
            bar.setAttribute("y", String(142 - height));
            bar.setAttribute("width", String(barWidth));
            bar.setAttribute("height", String(height));
            bar.setAttribute("rx", "5");
            bar.setAttribute("class", day.count ? "chart-bar" : "chart-bar chart-bar-empty");
            bar.setAttribute("aria-label", `${formatDate(day.date)}: ${day.count} reports`);
            svg.appendChild(bar);

            const value = document.createElementNS(SVG_NS, "text");
            value.setAttribute("x", String(x + barWidth / 2));
            value.setAttribute("y", String(Math.max(21, 132 - height)));
            value.setAttribute("text-anchor", "middle");
            value.setAttribute("class", "chart-value");
            value.textContent = String(day.count);
            svg.appendChild(value);

            const dateLabel = document.createElementNS(SVG_NS, "text");
            dateLabel.setAttribute("x", String(x + barWidth / 2));
            dateLabel.setAttribute("y", "166");
            dateLabel.setAttribute("text-anchor", "middle");
            dateLabel.setAttribute("class", "chart-axis-label");
            dateLabel.textContent = day.date.toLocaleDateString(undefined, {
                weekday: "short"
            });
            svg.appendChild(dateLabel);
        });

        container.appendChild(svg);
    }

    function renderIncidentTypes(reports) {
        const container = document.getElementById("incidentTypeList");
        if (!container) {
            return;
        }

        const categoryNames = [
            "Harassment",
            "Bullying",
            "Violence",
            "Threat",
            "Safety Concern",
            "Other"
        ];
        const counts = new Map(categoryNames.map(name => [name, 0]));
        reports.forEach(report => {
            const type = String(report.type || report.incidentType || "").toLowerCase();
            const category = type.includes("harass")
                ? "Harassment"
                : type.includes("bull")
                    ? "Bullying"
                    : type.includes("violence")
                        ? "Violence"
                        : type.includes("threat")
                            ? "Threat"
                            : type.includes("safety")
                                ? "Safety Concern"
                        : "Other";
            counts.set(category, counts.get(category) + 1);
        });

        const maxCount = Math.max(1, ...counts.values());
        container.replaceChildren();
        categoryNames.forEach(category => {
            const count = counts.get(category);
            const row = makeElement("div", "incident-type-row");
            const heading = makeElement("div", "incident-type-heading");
            heading.append(
                makeElement("span", "", category),
                makeElement("strong", "", count)
            );
            const track = makeElement("div", "incident-type-track");
            const categoryClass = category.toLowerCase().replace(/\s+/g, "-");
            const bar = makeElement("span", `incident-type-bar incident-type-${categoryClass}`);
            bar.style.width = `${count ? Math.max(4, (count / maxCount) * 100) : 0}%`;
            track.appendChild(bar);
            row.append(heading, track);
            container.appendChild(row);
        });
    }

    function renderRecentActivity(reports) {
        const list = document.getElementById("recentActivityList");
        const empty = document.getElementById("activityEmpty");
        if (!list) {
            return;
        }

        const entries = [];
        reports.forEach(report => {
            const reportId = getReportId(report);
            const submittedTime = getSubmittedTimestamp(report);
            if (submittedTime !== null) {
                entries.push({
                    time: submittedTime,
                    report,
                    message: "New report submitted",
                    detail: `${reportId} · ${report.type || report.incidentType || "Safety Concern"}`
                });
            }

            const statusTime = Date.parse(
                report.statusUpdatedAt || ""
            );
            if (Number.isFinite(statusTime) && statusTime > 0) {
                const status = normalizeStatus(report.status);
                entries.push({
                    time: statusTime,
                    report,
                    message: status === "resolved"
                        ? "Report resolved"
                        : `Report moved to ${getStatusLabel(report.status)}`,
                    detail: `${reportId} · ${report.type || report.incidentType || "Safety Concern"}`
                });
            }
        });

        entries.sort((left, right) => right.time - left.time);
        const recent = entries.slice(0, 4);
        list.replaceChildren();
        recent.forEach(entry => {
            const item = document.createElement("li");
            const marker = makeElement("span", "activity-marker", "•");
            marker.setAttribute("aria-hidden", "true");
            const content = makeElement("span", "recent-activity-copy");
            content.append(
                makeElement("strong", "", entry.message),
                makeElement("small", "", entry.detail)
            );
            const date = makeElement("time", "recent-activity-time", formatActivityTime(entry.time));
            date.dateTime = new Date(entry.time).toISOString();
            item.append(marker, content, date);
            list.appendChild(item);
        });

        if (empty) {
            empty.hidden = recent.length > 0;
        }
    }

    function formatActivityTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        });
    }

    function renderDashboard(reports) {
        const sorted = [...reports].sort(
            (left, right) => getSubmittedTime(right) - getSubmittedTime(left)
        );
        const countStatus = status => sorted.filter(
            report => normalizeStatus(report.status) === status
        ).length;

        setText("totalReportsValue", sorted.length);
        setText("pendingReportsValue", countStatus("pending"));
        setText("underReviewReportsValue", countStatus("under review"));
        setText("resolvedReportsValue", countStatus("resolved"));
        setText("sidebarPendingCount", countStatus("pending"));

        renderRecentReports(sorted);
        renderAttention(sorted);
        renderActivityChart(sorted);
        renderIncidentTypes(sorted);
        renderRecentActivity(sorted);
    }

    function initialize() {
        const user = readCurrentAdmin();
        if (!user) {
            sessionStorage.removeItem("safeReportAdminLoggedIn");
            sessionStorage.removeItem("safeReportAdminEmail");
            window.location.replace("login.html");
            return;
        }

        renderAdminIdentity(user);
        document.querySelectorAll("[data-admin-logout]").forEach(link => {
            link.addEventListener("click", () => {
                sessionStorage.removeItem("safeReportAdminLoggedIn");
                sessionStorage.removeItem("safeReportAdminEmail");
                localStorage.removeItem("safeReportAdminRemembered");
                localStorage.removeItem(LOGIN_KEY);
                localStorage.removeItem(CURRENT_USER_KEY);
            });
        });

        const reports = readReports();
        if (reports === null) {
            document.getElementById("reportsEmpty").textContent =
                "Reports could not be loaded. Refresh the page to try again.";
            document.getElementById("reportsEmpty").hidden = false;
            return;
        }

        renderDashboard(reports);

        const searchForm = document.getElementById("dashboardSearchForm");
        const searchInput = document.getElementById("dashboardSearch");
        searchForm.addEventListener("submit", event => {
            event.preventDefault();
            const query = searchInput.value.trim();
            const params = new URLSearchParams();
            if (query) {
                params.set("q", query);
            }
            const queryString = params.toString();
            window.location.href =
                `admin-reports.html${queryString ? `?${queryString}` : ""}`;
        });

        const sidebar = document.getElementById("adminSidebar");
        const menuToggle = document.getElementById("adminMenuToggle");
        menuToggle.addEventListener("click", () => {
            const isOpen = sidebar.classList.toggle("is-open");
            menuToggle.setAttribute("aria-expanded", String(isOpen));
            menuToggle.setAttribute(
                "aria-label",
                isOpen ? "Close navigation" : "Open navigation"
            );
        });

        window.addEventListener("storage", event => {
            if (
                event.key === REPORTS_KEY ||
                event.key === "safeReportReports" ||
                event.key === null
            ) {
                const updatedReports = readReports();
                if (updatedReports !== null) {
                    renderDashboard(updatedReports);
                }
            }
        });

        window.addEventListener("safereport:reports-updated", () => {
            const updatedReports = readReports();
            if (updatedReports !== null) {
                renderDashboard(updatedReports);
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize, { once: true });
    } else {
        initialize();
    }
})();
