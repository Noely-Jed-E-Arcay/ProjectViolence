
function isEmpty(value) {
    return value.trim() === "";
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateReportForm() {
    const type = document.getElementById("incident-type");
    const date = document.getElementById("incident-date");
    const location = document.getElementById("location");
    const description = document.getElementById("description");
    const confirm = document.getElementById("confirm");

    if (!type || !date || !location || !description || !confirm) {
        return false;
    }

    if (type.value === "" || type.value === "Select incident type") {
        showToast("Please select an incident type.", "error");
        type.focus();
        return false;
    }

    if (date.value === "") {
        showToast("Please select the date of the incident.", "error");
        date.focus();
        return false;
    }

    if (isEmpty(location.value)) {
        showToast("Please enter the location.", "error");
        location.focus();
        return false;
    }

    if (isEmpty(description.value)) {
        showToast("Please describe what happened.", "error");
        description.focus();
        return false;
    }

    if (!confirm.checked) {
        showToast("Please confirm that the information is accurate.", "error");
        confirm.focus();
        return false;
    }

    return true;
}
