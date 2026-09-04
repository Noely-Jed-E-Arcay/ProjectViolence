function getReports() {
    const reports = localStorage.getItem("safeReportReports");

    if (reports) {
        return JSON.parse(reports);
    }

//default reports for first time users
    return [
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
}

function saveReports(reports) {
    localStorage.setItem(
        "safeReportReports",
        JSON.stringify(reports)
    );
}

function addReport(report) {
    const reports = getReports();

    reports.unshift(report);

    saveReports(reports);
}

function getReportById(id) {
    const reports = getReports();

    return reports.find(function (report) {
        return report.id === id;
    });
}