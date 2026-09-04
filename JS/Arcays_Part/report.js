document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.querySelector(".table-wrap tbody");
  if (!tableBody) return;

  const filterInput = document.querySelector(".filters input[type='search']");
  const statusFilter = document.querySelector(".filters select");
  const sortFilter = document.querySelectorAll(".filters select")[1];
  const reports = getStoredReports();

  if (reports.length > 0) renderReports(tableBody, reports);
  updateStats(reports);

  [filterInput, statusFilter, sortFilter].forEach((control) => {
    control?.addEventListener("input", applyFilters);
    control?.addEventListener("change", applyFilters);
  });

  function applyFilters() {
    let visibleReports = [...reports];
    const search = filterInput?.value.trim().toLowerCase() || "";
    const status = statusFilter?.value || "All Statuses";

    if (search) {
      visibleReports = visibleReports.filter((report) =>
        [report.type, report.location, report.description].some((value) =>
          String(value || "").toLowerCase().includes(search)
        )
      );
    }
    if (status !== "All Statuses") {
      visibleReports = visibleReports.filter((report) => normalizeStatus(report.status) === normalizeStatus(status));
    }
    visibleReports.sort((first, second) => {
      const firstDate = new Date(first.date).getTime() || 0;
      const secondDate = new Date(second.date).getTime() || 0;
      return sortFilter?.value === "Oldest First" ? firstDate - secondDate : secondDate - firstDate;
    });
    renderReports(tableBody, visibleReports);
  }
});

function getStoredReports() {
  try {
    const reports = JSON.parse(localStorage.getItem("reports") || "[]");
    return Array.isArray(reports) ? reports : [];
  } catch {
    return [];
  }
}

function renderReports(tableBody, reports) {
  tableBody.replaceChildren();
  if (reports.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.textContent = "No reports found.";
    row.appendChild(cell);
    tableBody.appendChild(row);
    return;
  }

  reports.forEach((report, index) => {
    const row = document.createElement("tr");
    const values = [
      `#SR-${String(report.id || index + 1).slice(-6)}`,
      report.type || "Safety Concern",
      formatDate(report.date),
      report.location || "Not provided"
    ];
    values.forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });

    const statusCell = document.createElement("td");
    const status = document.createElement("span");
    status.className = normalizeStatus(report.status) === "resolved" ? "status resolved" : "status reviewing";
    status.textContent = report.status || "Under Review";
    statusCell.appendChild(status);
    row.appendChild(statusCell);

    const actionCell = document.createElement("td");
    const action = document.createElement("a");
    action.href = "#";
    action.textContent = "View";
    actionCell.appendChild(action);
    row.appendChild(actionCell);
    tableBody.appendChild(row);
  });
}

function updateStats(reports) {
  document.querySelectorAll(".stats .stat-box").forEach((statBox) => {
    const label = statBox.querySelector("p")?.textContent.toLowerCase() || "";
    const value = statBox.querySelector("h2");
    if (!value) return;
    if (label.includes("total")) value.textContent = reports.length;
    if (label.includes("under review")) value.textContent = reports.filter((report) => normalizeStatus(report.status) === "under review").length;
    if (label.includes("resolved")) value.textContent = reports.filter((report) => normalizeStatus(report.status) === "resolved").length;
  });
}

function normalizeStatus(status) {
  const value = String(status || "").toLowerCase();
  return ["pending", "under review"].includes(value) ? "under review" : value === "completed" ? "resolved" : value;
}

function formatDate(date) {
  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime()) ? String(date || "Not provided") : parsedDate.toLocaleDateString();
}
