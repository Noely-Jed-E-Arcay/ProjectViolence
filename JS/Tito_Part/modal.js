function showReportModal(report) {
    let modal = document.querySelector(".modal");

//it will remove old modal if it exists before creating a new one
    if (modal) {
        modal.remove();
    }

    modal = document.createElement("div");
    modal.className = "modal";

    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close">&times;</button>

            <h2>Report Details</h2>

            <p><strong>Report ID:</strong> ${report.id}</p>
            <p><strong>Incident Type:</strong> ${report.type}</p>
            <p><strong>Date:</strong> ${report.date}</p>
            <p><strong>Location:</strong> ${report.location}</p>
            <p><strong>Time:</strong> ${report.time || "Not provided"}</p>
            <p><strong>People Involved:</strong> ${report.people || "Not provided"}</p>
            <p><strong>Status:</strong> ${report.status}</p>

            <hr>

            <p><strong>Description:</strong></p>
            <p>${report.description || "No description provided."}</p>
        </div>
    `;

    document.body.appendChild(modal);

//modal styles
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.backgroundColor = "rgba(0,0,0,0.45)";
    modal.style.display = "flex";
    modal.style.alignItems = "center";
    modal.style.justifyContent = "center";
    modal.style.padding = "20px";
    modal.style.zIndex = "9999";

    const content = modal.querySelector(".modal-content");

    content.style.backgroundColor = "white";
    content.style.padding = "25px";
    content.style.borderRadius = "12px";
    content.style.width = "100%";
    content.style.maxWidth = "550px";
    content.style.maxHeight = "90vh";
    content.style.overflowY = "auto";
    content.style.position = "relative";

    const closeButton = modal.querySelector(".modal-close");

    closeButton.style.position = "absolute";
    closeButton.style.right = "15px";
    closeButton.style.top = "10px";
    closeButton.style.border = "none";
    closeButton.style.background = "none";
    closeButton.style.fontSize = "28px";
    closeButton.style.cursor = "pointer";

    closeButton.addEventListener("click", function () {
        modal.remove();
    });
//outside click will close modal
    modal.addEventListener("click", function (event) {
        if (event.target === modal) {
            modal.remove();
        }
    });
}