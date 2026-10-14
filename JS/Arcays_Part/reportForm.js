document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".report-form");
    if (!form) return;

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const incidentType =
            form.querySelector("#incident-type")?.value.trim() || "";
        const date =
            form.querySelector("#incident-date")?.value || "";
        const location =
            form.querySelector("#location")?.value.trim() || "";
        const time =
            form.querySelector("#time")?.value || "";
        const description =
            form.querySelector("#description")?.value.trim() || "";
        const people =
            form.querySelector("#people")?.value.trim() || "";
        const confirmed =
            form.querySelector("#confirm")?.checked;

        if (
            !incidentType ||
            incidentType === "Select incident type" ||
            !date ||
            !location ||
            !description ||
            !confirmed
        ) {
            alert("Please complete the required fields and confirm the information.");
            return;
        }

        const report = {
            id: Date.now(),
            type: incidentType,
            date,
            createdAt: new Date().toISOString(),
            location,
            time,
            description,
            people,
            status: "Under Review"
        };

        try {
            if (
                window.SafeReportStorage &&
                typeof window.SafeReportStorage.addReport === "function"
            ) {
                window.SafeReportStorage.addReport(report);
            } else {
                const reports = JSON.parse(
                    localStorage.getItem("reports") || "[]"
                );

                if (!Array.isArray(reports)) {
                    throw new Error("Saved report data is invalid.");
                }

                reports.unshift(report);
                localStorage.setItem("reports", JSON.stringify(reports));
            }

            form.reset();
            alert("Report submitted successfully.");
        } catch (error) {
            console.error("Unable to save report:", error);
            alert("The report could not be saved. Please try again.");
        }
    });
});