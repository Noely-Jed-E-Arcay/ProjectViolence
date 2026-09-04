document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".report-form");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const incidentType = form.querySelector("#incident-type")?.value.trim() || "";
    const date = form.querySelector("#incident-date")?.value || "";
    const location = form.querySelector("#location")?.value.trim() || "";
    const time = form.querySelector("#time")?.value || "";
    const description = form.querySelector("#description")?.value.trim() || "";
    const people = form.querySelector("#people")?.value.trim() || "";
    const confirmed = form.querySelector("#confirm")?.checked;

    if (!incidentType || incidentType === "Select incident type" || !date || !location || !description || !confirmed) {
      alert("Please complete the required fields and confirm the information.");
      return;
    }

    let reports = [];
    try {
      reports = JSON.parse(localStorage.getItem("reports") || "[]");
    } catch {
      reports = [];
    }
    if (!Array.isArray(reports)) reports = [];

    reports.push({
      id: Date.now(),
      type: incidentType,
      date,
      location,
      time,
      description,
      people,
      status: "Under Review"
    });

    localStorage.setItem("reports", JSON.stringify(reports));
    form.reset();
    alert("Report submitted successfully.");
  });
});
