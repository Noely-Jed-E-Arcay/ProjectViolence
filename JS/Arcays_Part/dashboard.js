document.addEventListener("DOMContentLoaded", () => {
  const reports = getReports();
  const statBoxes = document.querySelectorAll(".stats .stat-box");

  statBoxes.forEach((statBox) => {
    const label = statBox.querySelector("p")?.textContent.trim().toLowerCase();
    const value = statBox.querySelector("h2");

    if (!value || !label) return;

    if (label.includes("submitted")) value.textContent = reports.length;
    if (label.includes("under review")) {
      value.textContent = reports.filter((report) => isReviewStatus(report.status)).length;
    }
    if (label.includes("resolved")) {
      value.textContent = reports.filter((report) => isResolvedStatus(report.status)).length;
    }
  });
});

function getReports() {
  try {
    const reports = JSON.parse(localStorage.getItem("reports") || "[]");
    return Array.isArray(reports) ? reports : [];
  } catch {
    return [];
  }
}

function isReviewStatus(status) {
  return ["pending", "under review"].includes(String(status).toLowerCase());
}

function isResolvedStatus(status) {
  return ["completed", "resolved"].includes(String(status).toLowerCase());
}
