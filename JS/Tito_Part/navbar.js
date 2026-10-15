
function initializeNavbar() {
    const logoutButtons = document.querySelectorAll(".logout");

    logoutButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            localStorage.removeItem("safeReportLoggedIn");
        });
    });

    initializeThemeButton();
}

// Dark mode toggle button
function initializeThemeButton() {
    const themeButton = document.getElementById("themeToggle");

    if (!themeButton) {
        return;
    }

    // Restore the saved theme when opening the page
    const savedTheme = localStorage.getItem("safeReportTheme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
    }

    themeButton.addEventListener("click", function () {
        document.body.classList.toggle("dark-mode");

        if (document.body.classList.contains("dark-mode")) {
            localStorage.setItem("safeReportTheme", "dark");
            showToast("Dark mode enabled.");
        } else {
            localStorage.setItem("safeReportTheme", "light");
            showToast("Light mode enabled.");
        }
    });
}
