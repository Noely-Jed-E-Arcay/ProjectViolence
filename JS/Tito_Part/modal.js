function createModal(contentHTML, maxWidth = "450px") {
    document.querySelector(".modal")?.remove();

    const modal = document.createElement("div");
    modal.className = "modal";

    Object.assign(modal.style, {
        position: "fixed",
        inset: "0",
        zIndex: "9999",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "rgba(15, 23, 42, 0.48)"
    });

    modal.innerHTML = `
        <div class="modal-content" role="dialog" aria-modal="true"
             style="background:white;color:#1e293b;padding:25px;
             border-radius:14px;width:100%;max-width:${maxWidth};
             max-height:90vh;overflow-y:auto;position:relative;
             box-sizing:border-box;font-family:Arial,sans-serif">
            <button class="modal-close" aria-label="Close"
                style="position:absolute;right:12px;top:8px;
                border:0;background:none;font-size:27px;cursor:pointer">
                &times;
            </button>
            ${contentHTML}
        </div>
    `;

    const close = () => modal.remove();

    modal.querySelector(".modal-close").onclick = close;
    modal.onclick = (event) => {
        if (event.target === modal) close();
    };

    document.addEventListener("keydown", function escape(event) {
        if (event.key === "Escape" && document.body.contains(modal)) {
            close();
            document.removeEventListener("keydown", escape);
        }
    });

    document.body.appendChild(modal);
    return modal;
}

/* RECENT ACTIVITY OPTIONS */
function showReportChoices(reportId, report = null) {
    const modal = createModal(`
        <p style="color:#3157d5;font-size:10px;font-weight:bold">
            REPORT OPTIONS
        </p>
        <h2>Recent Activity</h2>
        <p style="color:#64748b;font-size:13px">
            What would you like to do with report ${reportId}?
        </p>
        <div style="display:flex;justify-content:flex-end;gap:10px">
            <button class="view-report"
                style="padding:10px 16px;border:0;border-radius:9px;
                background:#3157d5;color:white;cursor:pointer">
                View Report
            </button>
            <button class="close-choice"
                style="padding:10px 16px;border:1px solid #e5eaf2;
                border-radius:9px;background:white;color:#475569;
                cursor:pointer">
                Close
            </button>
        </div>
    `, "380px");

    modal.querySelector(".close-choice").onclick = () => modal.remove();

    modal.querySelector(".view-report").onclick = () => {
        modal.remove();

        if (report) {
            showReportModal(report);
        } else {
            alert("Report not found. Please check My Reports.");
        }
    };
}

/* REPORT DETAILS */
function showReportModal(report) {
    if (!report || typeof report !== "object") return;

    const fields = [
        ["Report ID", report.id],
        ["Incident Type", report.type],
        ["Date", report.date],
        ["Location", report.location],
        ["Time", report.time],
        ["People Involved", report.people],
        ["Status", report.status]
    ];

    const details = fields.map(([label, value]) => `
        <p style="font-size:13px;line-height:1.7;overflow-wrap:anywhere">
            <strong>${label}:</strong>
            ${escapeHTML(value || "Not provided")}
        </p>
    `).join("");

    createModal(`
        <h2 style="margin:0 35px 20px 0">Report Details</h2>
        ${details}
        <hr style="border:0;border-top:1px solid #e5eaf2;margin:20px 0">
        <h3>Description</h3>
        <p style="font-size:13px;line-height:1.8;white-space:pre-wrap">
            ${escapeHTML(report.description || "No description provided.")}
        </p>
    `, "550px");
}

/* SAFELY DISPLAY USER-SUBMITTED TEXT */
function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}