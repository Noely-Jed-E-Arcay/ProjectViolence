
/* =========================================
   SAFEREPORT - SHARED REPORT STORAGE
   Main storage key: "reports"
========================================= */

(function () {
    "use strict";

    const STORAGE_KEY = "reports";
    const LEGACY_KEY = "safeReportReports";
    const DEFAULT_REPORTS = [];

    // Read and validate an array from localStorage.
    function readArray(key) {
        const raw = localStorage.getItem(key);

        if (raw === null) return null;

        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : null;
        } catch (error) {
            console.error(`Invalid report data in "${key}".`, error);
            return null;
        }
    }

    // Initialize storage and migrate legacy data if necessary.
    function initializeStorage() {
        // Preserve existing data, including an empty array.
        if (localStorage.getItem(STORAGE_KEY) !== null) {
            return;
        }

        // Migrate data from the previous storage key.
        if (localStorage.getItem(LEGACY_KEY) !== null) {
            const legacyReports = readArray(LEGACY_KEY);

            if (legacyReports !== null) {
                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(legacyReports)
                );

                localStorage.removeItem(LEGACY_KEY);
                return;
            }

            // Avoid overwriting malformed legacy data with sample records.
            localStorage.setItem(STORAGE_KEY, "[]");
            return;
        }

        // Initialize a fresh installation with an empty array.
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(DEFAULT_REPORTS)
        );
    }

    // Retrieve all reports.
    function getReports() {
        initializeStorage();
        return readArray(STORAGE_KEY) || [];
    }

    // Save reports and notify scripts in the current tab.
    function saveReports(reports) {
        if (!Array.isArray(reports)) {
            throw new TypeError("Reports must be an array.");
        }

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(reports)
        );

        window.dispatchEvent(
            new Event("safereport:reports-updated")
        );
    }

    // Add a new report to the beginning of the list.
    function addReport(report) {
        if (!report || typeof report !== "object") {
            throw new TypeError("A valid report is required.");
        }

        const reports = getReports();

        reports.unshift(report);
        saveReports(reports);

        return report;
    }

    // Find a report using its ID.
    function getReportById(id) {
        const requestedId = String(id ?? "")
            .trim()
            .replace(/^#/, "")
            .toLowerCase();

        return getReports().find(report => {
            const savedId = String(report.id ?? "")
                .trim()
                .replace(/^#/, "")
                .toLowerCase();

            return savedId === requestedId;
        }) || null;
    }

    // Expose the namespaced API for new scripts.
    window.SafeReportStorage = {
        getReports,
        saveReports,
        addReport,
        getReportById
    };

    // Preserve compatibility with existing scripts.
    window.getReports = getReports;
    window.saveReports = saveReports;
    window.addReport = addReport;
    window.getReportById = getReportById;

    // Run storage initialization before other scripts execute.
    try {
        initializeStorage();
    } catch (error) {
        console.error(
            "SafeReport storage initialization failed:",
            error
        );
    }
})();
