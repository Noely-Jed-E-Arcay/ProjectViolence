
/* =========================================
   SAFEREPORT - SHARED REPORT STORAGE
   Main storage key: "reports"
========================================= */

(function () {
    "use strict";

    const STORAGE_KEY = "reports";
    const LEGACY_KEY = "safeReportReports";

    const DEFAULT_REPORTS = [
        {
            id: "#SR-2024-003",
            type: "Harassment",
            date: "2026-05-22",
            location: "School Building",
            time: "",
            description: "Harassment incident reported.",
            people: "",
            status: "Under Review"
        },
        {
            id: "#SR-2024-002",
            type: "Bullying",
            date: "2026-06-15",
            location: "Lab 101",
            time: "",
            description: "Bullying incident.",
            people: "",
            status: "Resolved"
        },
        {
            id: "#SR-2024-001",
            type: "Safety Concern",
            date: "2026-05-08",
            location: "School Grounds",
            time: "",
            description: "Safety concern submitted.",
            people: "",
            status: "Resolved"
        }
    ];

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

    function initializeStorage() {
        // Keep existing report data, including an intentionally empty array.
        if (localStorage.getItem(STORAGE_KEY) !== null) {
            return;
        }

        // Migrate records from the previous storage key.
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

            // Do not overwrite malformed legacy data with sample records.
            localStorage.setItem(STORAGE_KEY, "[]");
            return;
        }

        // Seed demo records only on a genuinely fresh installation.
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(DEFAULT_REPORTS)
        );
    }

    function getReports() {
        initializeStorage();
        return readArray(STORAGE_KEY) || [];
    }

    function saveReports(reports) {
        if (!Array.isArray(reports)) {
            throw new TypeError("Reports must be an array.");
        }

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(reports)
        );
    }

    function addReport(report) {
        if (!report || typeof report !== "object") {
            throw new TypeError("A valid report is required.");
        }

        const reports = getReports();
        reports.unshift(report);
        saveReports(reports);

        return report;
    }

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

    // Namespaced API for new code.
    window.SafeReportStorage = {
        getReports,
        saveReports,
        addReport,
        getReportById
    };

    // Keep compatibility with existing scripts.
    window.getReports = getReports;
    window.saveReports = saveReports;
    window.addReport = addReport;
    window.getReportById = getReportById;

    // Run migration before other page scripts execute.
    try {
        initializeStorage();
    } catch (error) {
        console.error("SafeReport storage initialization failed:", error);
    }
})();
