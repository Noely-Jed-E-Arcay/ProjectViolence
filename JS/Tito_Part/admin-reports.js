/* =========================================
   SAFEREPORT - ADMIN REPORT MANAGEMENT
   File: JS/Tito_Part/admin-reports.js
========================================= */

document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    // =========================================
    // ADMIN ACCESS CHECK
    // =========================================

    const adminSession =
        sessionStorage.getItem("safeReportAdminLoggedIn") === "true";

    const sessionEmail = (
        sessionStorage.getItem("safeReportAdminEmail") || ""
    ).trim().toLowerCase();

    let currentUser = null;

    try {
        currentUser = JSON.parse(
            localStorage.getItem("currentUser") || "null"
        );

        if (!currentUser) {
            currentUser = JSON.parse(
                localStorage.getItem("safeReportUser") || "null"
            );
        }
    } catch (error) {
        console.error("Unable to verify administrator access:", error);
    }

    const currentEmail = (
        currentUser?.email || ""
    ).trim().toLowerCase();

    const currentRole = String(
        currentUser?.role || currentUser?.accountType || ""
    )
        .trim()
        .toLowerCase()
        .replace(/\s+account$/, "");

    const isAdministrator =
        currentRole === "admin" ||
        currentRole === "administrator";

    if (
        !adminSession ||
        !sessionEmail ||
        !currentEmail ||
        sessionEmail !== currentEmail ||
        !isAdministrator
    ) {
        sessionStorage.removeItem("safeReportAdminLoggedIn");
        sessionStorage.removeItem("safeReportAdminEmail");

        window.location.replace("login.html");
        return;
    }

    // =========================================
    // ELEMENTS
    // =========================================
    const tableBody = document.getElementById(
        "adminReportsTableBody"
    );

    const totalReports = document.getElementById(
        "adminTotalReports"
    );

    const pendingReports = document.getElementById(
        "adminPendingReports"
    );

    const resolvedReports = document.getElementById(
        "adminResolvedReports"
    );

    const visibleCount = document.getElementById(
        "adminVisibleCount"
    );

    const emptyState = document.getElementById(
        "adminEmptyState"
    );

    const searchInputs = [
        document.getElementById("adminReportSearch"),
        document.getElementById("adminSearch")
    ].filter(Boolean);

    const statusFilter = document.getElementById(
        "adminStatusFilter"
    );

    const feedback = document.getElementById(
        "adminReportFeedback"
    );

    const detailsOverlay = document.getElementById(
        "adminReportDetailsOverlay"
    );

    const detailsBody = document.getElementById(
        "adminReportDetailsBody"
    );

    const statusEditorContainer = document.getElementById(
        "adminStatusEditorContainer"
    );

    const detailsFeedback = document.getElementById(
        "adminReportDetailsFeedback"
    );

    const detailsPhoto = document.getElementById(
        "adminReportPhoto"
    );

    const detailsStatus = document.getElementById(
        "adminDetailsStatus"
    );

    const detailsSubtitle = document.getElementById(
        "adminDetailsSubtitle"
    );

    const evidenceSection = document.getElementById(
        "adminEvidenceSection"
    );

    const closeDetailsButton = document.getElementById(
        "closeAdminDetails"
    );

    const doneDetailsButton = document.getElementById(
        "doneAdminDetails"
    );

    const deleteModal = document.getElementById(
        "adminDeleteConfirm"
    );

    const confirmDeleteButton = document.getElementById(
        "confirmAdminDelete"
    );

    const cancelDeleteButton = document.getElementById(
        "cancelAdminDelete"
    );

    // =========================================
    // STATE
    // =========================================

    let reportPendingDeletion = null;
    let selectedReportId = null;
    let lastFocusedElement = null;

    // =========================================
    // STORAGE
    // =========================================

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

            const reports = JSON.parse(
                localStorage.getItem("reports") || "[]"
            );

            return Array.isArray(reports) ? reports : [];

        } catch (error) {
            console.error("Unable to load reports:", error);

            showFeedback(
                "Unable to load reports. Please refresh the page.",
                true
            );

            return [];
        }
    }

    function saveStoredReports(reports) {
        try {
            if (
                window.SafeReportStorage &&
                typeof window.SafeReportStorage.saveReports === "function"
            ) {
                window.SafeReportStorage.saveReports(reports);
            } else {
                localStorage.setItem(
                    "reports",
                    JSON.stringify(reports)
                );

                window.dispatchEvent(
                    new Event("safereport:reports-updated")
                );
            }

            return true;

        } catch (error) {
            console.error("Unable to save reports:", error);

            showFeedback(
                "Unable to save changes. Please try again.",
                true
            );

            return false;
        }
    }

    // =========================================
    // FEEDBACK
    // =========================================

    function showFeedback(message, isError = false) {
        if (!feedback) return;

        feedback.textContent = message;

        feedback.setAttribute(
            "role",
            isError ? "alert" : "status"
        );

        feedback.style.display = "block";
    }

    function showDetailsFeedback(message, isError = false) {
        if (!detailsFeedback) return;

        detailsFeedback.textContent = message;

        detailsFeedback.setAttribute(
            "role",
            isError ? "alert" : "status"
        );
    }

    function clearFeedback() {
        if (feedback) {
            feedback.textContent = "";
            feedback.style.display = "";
            feedback.setAttribute("role", "status");
        }

        if (detailsFeedback) {
            detailsFeedback.textContent = "";
            detailsFeedback.setAttribute("role", "status");
        }
    }

    // =========================================
    // REPORT HELPERS
    // =========================================

    function normalizeStatus(status) {
        const value = String(status || "Pending")
            .trim()
            .toLowerCase()
            .replace(/[_-]+/g, " ")
            .replace(/\s+/g, " ");

        if (
            ["resolved", "completed", "closed"].includes(value)
        ) {
            return "resolved";
        }

        if (value === "pending" || value === "new") {
            return "pending";
        }

        if (value === "in progress") {
            return "in progress";
        }

        return "under review";
    }

    function getStatusLabel(status) {
        const labels = {
            "pending": "Pending",
            "under review": "Under Review",
            "in progress": "In Progress",
            "resolved": "Resolved"
        };

        return labels[normalizeStatus(status)];
    }

    function getReportId(report) {
        if (
            report.id === undefined ||
            report.id === null
        ) {
            return null;
        }

        return String(report.id);
    }

    function formatReportId(report) {
        const id = getReportId(report);

        if (id === null) {
            return "Unknown ID";
        }

        if (id.startsWith("#SR-")) {
            return id;
        }

        return "#SR-" + id.slice(-6).padStart(6, "0");
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

    function getSubmissionTime(report) {
        const date = Date.parse(getSubmittedDate(report));

        if (Number.isFinite(date)) {
            return date;
        }

        const id = Number(report.id);

        return Number.isFinite(id) ? id : 0;
    }

    function formatDate(value) {
        if (!value) {
            return "Not provided";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }

    function createElement(tag, className, text) {
        const element = document.createElement(tag);

        if (className) {
            element.className = className;
        }

        if (text !== undefined && text !== null) {
            element.textContent = String(text);
        }

        return element;
    }

    function createCell(value) {
        return createElement(
            "td",
            "",
            value === undefined ||
            value === null ||
            String(value).trim() === ""
                ? "Not provided"
                : value
        );
    }

    function getTypeClass(type) {
        const value = String(type || "").toLowerCase();

        if (value.includes("harass")) {
            return "harassment-dot";
        }

        if (value.includes("bull")) {
            return "bullying-dot";
        }

        if (value.includes("violence")) {
            return "violence-dot";
        }

        if (value.includes("threat")) {
            return "threat-dot";
        }

        return "safety-dot";
    }

    // =========================================
    // SEARCH AND FILTER
    // =========================================

    function getFilteredReports(reports) {
        const activeInput = searchInputs.find(
            input => input === document.activeElement
        ) || searchInputs[0];

        const searchTerm = activeInput
            ? activeInput.value.trim().toLowerCase()
            : "";

        const selectedStatus = statusFilter
            ? statusFilter.value.toLowerCase()
            : "all";

        return reports.filter(function (report) {
            const searchableText = [
                report.id,
                report.type,
                report.date,
                getSubmittedDate(report),
                report.location,
                report.time,
                report.description,
                report.people,
                report.status
            ]
                .map(value => String(value || ""))
                .join(" ")
                .toLowerCase();

            const matchesSearch =
                !searchTerm ||
                searchableText.includes(searchTerm);

            const matchesStatus =
                selectedStatus === "all" ||
                normalizeStatus(report.status) === selectedStatus;

            return matchesSearch && matchesStatus;
        });
    }

    // =========================================
    // REPORT TABLE
    // =========================================

    function renderReports(reports) {
        if (!tableBody) return;

        tableBody.replaceChildren();

        reports.forEach(function (report) {
            const row = document.createElement("tr");

            row.dataset.reportId = getReportId(report) || "";

            // Report ID
            row.appendChild(
                createCell(formatReportId(report))
            );

            // Incident type
            const typeCell = document.createElement("td");

            const typeLabel = createElement(
                "span",
                "incident-type"
            );

            typeLabel.append(
                createElement(
                    "span",
                    "type-dot " + getTypeClass(report.type)
                ),
                document.createTextNode(
                    report.type || "Safety Concern"
                )
            );

            typeCell.appendChild(typeLabel);
            row.appendChild(typeCell);

            // Submission date
            row.appendChild(
                createCell(formatDate(getSubmittedDate(report)))
            );

            // Location
            row.appendChild(createCell(report.location));

            // Status
            const statusCell = document.createElement("td");

            const statusLabel = createElement(
                "span",
                normalizeStatus(report.status) === "resolved"
                    ? "status resolved"
                    : "status reviewing"
            );

            statusLabel.append(
                createElement("span", "status-dot"),
                document.createTextNode(
                    getStatusLabel(report.status)
                )
            );

            statusCell.appendChild(statusLabel);
            row.appendChild(statusCell);

            // Actions
            const actionCell = document.createElement("td");

            const viewButton = createElement(
                "button",
                "view-button",
                "View →"
            );

            viewButton.type = "button";
            viewButton.dataset.action = "view";
            viewButton.dataset.reportId = getReportId(report) || "";

            actionCell.appendChild(viewButton);

            const deleteButton = createElement(
                "button",
                "view-button",
                "Delete"
            );

            deleteButton.type = "button";
            deleteButton.dataset.action = "delete";
            deleteButton.dataset.reportId = getReportId(report) || "";
            deleteButton.style.marginLeft = "6px";

            actionCell.appendChild(deleteButton);
            row.appendChild(actionCell);

            tableBody.appendChild(row);
        });

        if (emptyState) {
            emptyState.hidden = reports.length > 0;
        }

        if (visibleCount) {
            visibleCount.textContent =
                reports.length +
                (reports.length === 1 ? " report" : " reports");
        }
    }

    // =========================================
    // STATISTICS
    // =========================================

    function updateStatistics(reports) {
        const total = reports.length;

        const resolved = reports.filter(function (report) {
            return normalizeStatus(report.status) === "resolved";
        }).length;

        const pending = total - resolved;

        if (totalReports) {
            totalReports.textContent = total;
        }

        if (pendingReports) {
            pendingReports.textContent = pending;
        }

        if (resolvedReports) {
            resolvedReports.textContent = resolved;
        }
    }

    // =========================================
    // REFRESH REPORTS
    // =========================================

    function refreshReports() {
        const reports = getStoredReports();

        updateStatistics(reports);

        reports.sort(function (a, b) {
            return getSubmissionTime(b) - getSubmissionTime(a);
        });

        renderReports(getFilteredReports(reports));
    }

    // =========================================
    // FIND REPORT
    // =========================================

    function findReportById(id) {
        return getStoredReports().find(function (report) {
            return String(report.id) === String(id);
        }) || null;
    }

    // =========================================
    // STATUS MANAGEMENT
    // =========================================

    function updateReportStatus(id, newStatus) {
        const validStatuses = [
            "Pending",
            "Under Review",
            "In Progress",
            "Resolved"
        ];

        if (!validStatuses.includes(newStatus)) {
            showDetailsFeedback(
                "Please select a valid report status.",
                true
            );

            return;
        }

        const reports = getStoredReports();

        const report = reports.find(function (item) {
            return String(item.id) === String(id);
        });

        if (!report) {
            showDetailsFeedback(
                "The report could not be found.",
                true
            );

            return;
        }

        report.status = newStatus;
        report.reviewedAt = report.reviewedAt || new Date().toISOString();
        report.statusUpdatedAt = new Date().toISOString();

        if (!saveStoredReports(reports)) {
            showDetailsFeedback(
                "The status could not be saved.",
                true
            );

            return;
        }

        showDetailsFeedback(
            "Report status updated to " + newStatus + "."
        );

        if (detailsStatus) {
            detailsStatus.className =
                "admin-status admin-status-" +
                normalizeStatus(newStatus).replace(/\s+/g, "-");
            detailsStatus.replaceChildren();
            const dot = createElement("span", "admin-status-dot");
            dot.setAttribute("aria-hidden", "true");
            detailsStatus.append(dot, document.createTextNode(getStatusLabel(newStatus)));
        }

        refreshReports();
    }

    // =========================================
    // REPORT DETAILS
    // =========================================

    function createDetailSection(title) {
        const section = createElement("section", "admin-detail-section");
        section.appendChild(
            createElement("h3", "admin-detail-section-title", title)
        );
        const grid = createElement("div", "admin-detail-grid");
        section.appendChild(grid);
        detailsBody.appendChild(section);
        return grid;
    }

    function addDetailRow(container, label, value, className = "") {
        if (!container) return;

        const wrapper = createElement(
            "div",
            `admin-report-detail-row${className ? ` ${className}` : ""}`
        );
        wrapper.dataset.detailField = label.toLowerCase().replace(/\s+/g, "-");
        wrapper.append(
            createElement("span", "admin-detail-label", label),
            createElement("p", "admin-detail-value", value || "Not provided")
        );

        container.appendChild(wrapper);
        return wrapper;
    }

    function isReporterIdentityHidden(report) {
        const reporter = report?.submittedBy;

        if (report?.anonymous === true) {
            return true;
        }

        if (!reporter || typeof reporter !== "object") {
            return false;
        }

        // An explicit per-report choice takes precedence over the legacy
        // account-wide masking preference.
        if (report?.anonymous === false) {
            return false;
        }

        const email = String(reporter.email || "").trim().toLowerCase();

        if (email) {
            try {
                const settingsKey =
                    "safeReportSettings:" + encodeURIComponent(email);
                const savedSettings = JSON.parse(
                    localStorage.getItem(settingsKey) || "null"
                );

                if (savedSettings?.hideIdentityInAdminReports === true) {
                    return true;
                }
            } catch (error) {
                console.error(
                    "Unable to read reporter privacy preferences:",
                    error
                );
            }
        }

        return false;
    }

    function getReporterIdentity(report) {
        const reporter = report?.submittedBy;

        if (isReporterIdentityHidden(report)) {
            return report?.anonymous === true
                ? "Anonymous report — identity hidden by reporter"
                : "Identity hidden by reporter preference";
        }

        if (!reporter || typeof reporter !== "object") {
            return "Not provided";
        }

        const email = String(reporter.email || "").trim().toLowerCase();
        return String(reporter.fullName || email || "Not provided");
    }

    function addStatusEditor(report) {
        if (!statusEditorContainer) return;

        const wrapper = createElement("section", "admin-status-editor-panel");

        const label = createElement(
            "div",
            "admin-status-editor-heading"
        );
        label.append(
            createElement("h3", "", "Update report status"),
            createElement(
                "p",
                "",
                "Choose the latest review stage, then save your change."
            )
        );
        const selectLabel = createElement("label", "admin-status-editor-label", "Status");
        selectLabel.htmlFor = "adminStatusEditor";

        const select = document.createElement("select");

        select.id = "adminStatusEditor";

        const statuses = [
            "Pending",
            "Under Review",
            "In Progress",
            "Resolved"
        ];

        statuses.forEach(function (status) {
            const option = document.createElement("option");

            option.value = status;
            option.textContent = status;

            if (
                normalizeStatus(status) ===
                normalizeStatus(report.status)
            ) {
                option.selected = true;
            }

            select.appendChild(option);
        });

        const saveButton = createElement(
            "button",
            "primary-button blue-button",
            "Save Status"
        );

        saveButton.type = "button";
        saveButton.classList.add("admin-status-save");

        saveButton.addEventListener("click", function () {
            updateReportStatus(
                report.id,
                select.value
            );
        });

        const controls = createElement("div", "admin-status-editor-controls");
        controls.append(selectLabel, select, saveButton);
        wrapper.append(label, controls);
        statusEditorContainer.replaceChildren(wrapper);
    }

    function openReportDetails(id, button) {
        const report = findReportById(id);

        if (!report) {
            showFeedback(
                "This report could not be found.",
                true
            );

            refreshReports();
            return;
        }

        selectedReportId = String(report.id);
        lastFocusedElement = button || document.activeElement;

        if (detailsSubtitle) {
            detailsSubtitle.textContent =
                `${formatReportId(report)} · Submitted ${formatDate(getSubmittedDate(report))}`;
        }
        if (detailsStatus) {
            detailsStatus.className =
                "admin-status admin-status-" +
                normalizeStatus(report.status).replace(/\s+/g, "-");
            detailsStatus.replaceChildren();
            const dot = createElement("span", "admin-status-dot");
            dot.setAttribute("aria-hidden", "true");
            detailsStatus.append(dot, document.createTextNode(getStatusLabel(report.status)));
        }

        if (detailsBody) {
            detailsBody.replaceChildren();

            const incident = createDetailSection("Incident overview");
            addDetailRow(incident, "Report ID", formatReportId(report));
            addDetailRow(incident, "Incident Type", report.type);
            addDetailRow(incident, "Incident Date", report.date);
            addDetailRow(incident, "Date Submitted", formatDate(getSubmittedDate(report)));
            addDetailRow(incident, "Time", report.time);
            addDetailRow(incident, "Location", report.location);

            const reporterDetails = createDetailSection("Reporter information");
            addDetailRow(
                reporterDetails,
                "Reporter",
                getReporterIdentity(report),
                "admin-detail-field-full"
            );
            const reporter = report.submittedBy;
            const identityHidden = isReporterIdentityHidden(report);
            addDetailRow(
                reporterDetails,
                "Reporter Email",
                identityHidden
                    ? "Hidden by reporter choice"
                    : String(reporter?.email || "Not provided")
            );
            addDetailRow(
                reporterDetails,
                "Student ID",
                identityHidden
                    ? "Hidden by reporter choice"
                    : String(reporter?.studentId || "Not provided")
            );

            const incidentDetails = createDetailSection("Incident details");
            addDetailRow(
                incidentDetails,
                "People Involved",
                report.people,
                "admin-detail-field-full"
            );
            addDetailRow(
                incidentDetails,
                "Description",
                report.description,
                "admin-detail-field-full admin-detail-description"
            );

            addStatusEditor(report);
        }

        if (detailsPhoto) {
            detailsPhoto.replaceChildren();

            const imageSource =
                report.photo ||
                report.image ||
                report.imageUrl ||
                "";

            if (imageSource) {
                const image = document.createElement("img");

                image.src = imageSource;
                image.alt = "Submitted incident evidence";
                image.style.maxWidth = "100%";
                image.style.height = "auto";

                image.addEventListener("error", function () {
                    detailsPhoto.textContent =
                        "The attached image could not be displayed.";
                });

                detailsPhoto.appendChild(image);
                evidenceSection.hidden = false;
            } else {
                detailsPhoto.appendChild(
                    createElement(
                        "p",
                        "admin-evidence-empty",
                        "No evidence was attached to this report."
                    )
                );
                evidenceSection.hidden = false;
            }
        }

        showDetailsFeedback("");

        if (detailsOverlay) {
            detailsOverlay.hidden = false;
        }

        clearFeedback();

        if (closeDetailsButton) {
            closeDetailsButton.focus();
        }
    }

    function closeReportDetails() {
        if (detailsOverlay) {
            detailsOverlay.hidden = true;
        }

        selectedReportId = null;
        showDetailsFeedback("");

        if (
            lastFocusedElement &&
            document.contains(lastFocusedElement)
        ) {
            lastFocusedElement.focus();
        }
    }

    if (closeDetailsButton) {
        closeDetailsButton.addEventListener(
            "click",
            closeReportDetails
        );
    }

    if (doneDetailsButton) {
        doneDetailsButton.addEventListener(
            "click",
            closeReportDetails
        );
    }

    if (detailsOverlay) {
        detailsOverlay.addEventListener("click", function (event) {
            if (event.target === detailsOverlay) {
                closeReportDetails();
            }
        });
    }

    // =========================================
    // DELETE CONFIRMATION
    // =========================================

    function openDeleteConfirmation(id, button) {
        reportPendingDeletion = String(id);
        lastFocusedElement = button || document.activeElement;

        if (deleteModal) {
            deleteModal.hidden = false;
        }

        if (confirmDeleteButton) {
            confirmDeleteButton.focus();
        }
    }

    function closeDeleteConfirmation() {
        reportPendingDeletion = null;

        if (deleteModal) {
            deleteModal.hidden = true;
        }

        if (
            lastFocusedElement &&
            document.contains(lastFocusedElement)
        ) {
            lastFocusedElement.focus();
        }
    }

    if (cancelDeleteButton) {
        cancelDeleteButton.addEventListener(
            "click",
            closeDeleteConfirmation
        );
    }

    if (deleteModal) {
        deleteModal.addEventListener("click", function (event) {
            if (event.target === deleteModal) {
                closeDeleteConfirmation();
            }
        });
    }

    if (confirmDeleteButton) {
        confirmDeleteButton.addEventListener(
            "click",
            function () {
                if (reportPendingDeletion === null) {
                    closeDeleteConfirmation();
                    return;
                }

                const reports = getStoredReports();

                const updatedReports = reports.filter(
                    function (report) {
                        return (
                            String(report.id) !==
                            reportPendingDeletion
                        );
                    }
                );

                if (updatedReports.length === reports.length) {
                    closeDeleteConfirmation();

                    showFeedback(
                        "The report could not be found.",
                        true
                    );

                    refreshReports();
                    return;
                }

                if (saveStoredReports(updatedReports)) {
                    closeDeleteConfirmation();

                    showFeedback(
                        "Report deleted successfully."
                    );

                    refreshReports();
                }
            }
        );
    }

    // =========================================
    // TABLE ACTIONS
    // =========================================

    if (tableBody) {
        tableBody.addEventListener("click", function (event) {
            const button = event.target.closest(
                "button[data-action]"
            );

            if (!button || !tableBody.contains(button)) {
                return;
            }

            const reportId = button.dataset.reportId;

            if (!reportId) return;

            clearFeedback();

            if (button.dataset.action === "view") {
                openReportDetails(reportId, button);
            }

            if (button.dataset.action === "delete") {
                openDeleteConfirmation(reportId, button);
            }
        });
    }

    // =========================================
    // SEARCH EVENTS
    // =========================================

    searchInputs.forEach(function (input) {
        input.addEventListener("input", function () {
            searchInputs.forEach(function (otherInput) {
                if (otherInput !== input) {
                    otherInput.value = input.value;
                }
            });

            clearFeedback();
            refreshReports();
        });
    });

    if (statusFilter) {
        statusFilter.addEventListener("change", function () {
            clearFeedback();
            refreshReports();
        });
    }

    // =========================================
    // KEYBOARD SUPPORT
    // =========================================

    document.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") return;

        if (detailsOverlay && !detailsOverlay.hidden) {
            closeReportDetails();
        } else if (deleteModal && !deleteModal.hidden) {
            closeDeleteConfirmation();
        }
    });

    // =========================================
    // STORAGE EVENTS
    // =========================================

    window.addEventListener("storage", function (event) {
        if (
            event.key === "reports" ||
            event.key === "safeReportReports" ||
            event.key === null
        ) {
            refreshReports();
        }

        if (
            selectedReportId &&
            event.key &&
            event.key.startsWith("safeReportSettings:")
        ) {
            const report = findReportById(selectedReportId);
            const reporterValue = detailsBody?.querySelector(
                '[data-detail-field="reporter"] .admin-detail-value'
            );

            if (report && reporterValue) {
                reporterValue.textContent = getReporterIdentity(report);
            }
        }
    });

    window.addEventListener(
        "safereport:reports-updated",
        refreshReports
    );

    window.addEventListener(
        "safereport:reports-changed",
        refreshReports
    );

    // =========================================
    // INITIALIZE FROM DASHBOARD LINKS
    // =========================================

    const query = new URLSearchParams(window.location.search);
    const requestedStatus = String(query.get("status") || "")
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ");
    const validStatuses = [
        "all",
        "pending",
        "under review",
        "in progress",
        "resolved"
    ];

    if (statusFilter && validStatuses.includes(requestedStatus)) {
        statusFilter.value = requestedStatus;
    }

    const requestedSearch = query.get("q");
    if (requestedSearch !== null) {
        searchInputs.forEach(input => {
            input.value = requestedSearch;
        });
    }

    refreshReports();

    const requestedReportId = query.get("view");
    if (requestedReportId) {
        const requestedReport = findReportById(requestedReportId);
        if (requestedReport) {
            openReportDetails(requestedReport.id, null);
        } else {
            showFeedback("The requested report could not be found.", true);
        }
    }
});