function initializeNavbar() {
    const logoutButton = document.querySelector(".logout");

    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            localStorage.removeItem("safeReportLoggedIn");

            showToast("You have been logged out.");

        });
    }

    const cancelButton = document.querySelector(
        '.form-buttons a[href="index.html"]'
    );

    if (cancelButton) {
        cancelButton.href = "index.html";
    }

    initializeThemeButton();
}

//dark mode toggle button
function initializeThemeButton() {
    const actions = document.querySelectorAll(".header-action");

    if (actions.length < 2) {
        return;
    }

    const themeButton = actions[1];

    themeButton.style.cursor = "pointer";

    themeButton.addEventListener("click", function () {
        document.body.classList.toggle("dark-mode");

        if (document.body.classList.contains("dark-mode")) {
            document.body.style.backgroundColor = "#111827";
            document.body.style.color = "#f8fafc";

            showToast("Dark mode enabled.");
        } else {
            document.body.style.backgroundColor = "#f5f7fb";
            document.body.style.color = "#1e293b";

            showToast("Light mode enabled.");
        }
    });
}