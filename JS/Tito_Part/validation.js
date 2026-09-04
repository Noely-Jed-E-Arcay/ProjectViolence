function isEmpty(value) {
    return value.trim() === "";
}

function validateEmail(email) {
    return email.includes("@") && email.includes(".");
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

    if (type.value === "Select incident type") {
        showToast("Please select an incident type.", "error");
        return false;
    }

    if (date.value === "") {
        showToast("Please select the date of the incident.", "error");
        return false;
    }

    if (isEmpty(location.value)) {
        showToast("Please enter the location.", "error");
        return false;
    }

    if (isEmpty(description.value)) {
        showToast("Please describe what happened.", "error");
        return false;
    }

    if (!confirm.checked) {
        showToast("Please confirm that the information is accurate.", "error");
        return false;
    }

    return true;
}