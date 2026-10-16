(function () {
    "use strict";

    const LOGIN_FLAG_KEY = "safeReportLoggedIn";
    const CURRENT_USER_KEY = "currentUser";
    const GATE_ID = "guestAccessGate";
    const CONTENT_SELECTOR = ".content";
    const REPORT_LINKS = ['a[href="report.html"]', 'a[href="myreports.html"]', 'a[href="profile.html"]'];

    function isLoggedIn() {
        if (localStorage.getItem(LOGIN_FLAG_KEY) !== "true") {
            return false;
        }

        try {
            return Boolean(JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || "null"));
        } catch (error) {
            return false;
        }
    }

    function applyGuestState() {
        const gate = document.getElementById(GATE_ID);
        const content = document.querySelector(CONTENT_SELECTOR);
        if (!gate || !content) return;

        const guest = !isLoggedIn();
        gate.hidden = !guest;
        content.querySelectorAll(":scope > *:not(#" + GATE_ID + ")").forEach(function (section) {
            section.hidden = guest;
        });

        document.body.classList.toggle("is-guest", guest);

        if (guest) {
            REPORT_LINKS.forEach(function (selector) {
                document.querySelectorAll(selector).forEach(function (link) {
                    link.addEventListener("click", function (event) {
                        if (!isLoggedIn()) {
                            event.preventDefault();
                            window.location.href = "login.html";
                        }
                    });
                });
            });
        }
    }

    document.addEventListener("DOMContentLoaded", applyGuestState);
    window.addEventListener("storage", applyGuestState);
})();