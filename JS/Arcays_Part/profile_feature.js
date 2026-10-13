const profileBtn = document.getElementById("profileBtn");
const profileDropdown = document.getElementById("profileDropdown");
const profileMenu = document.getElementById("profileMenu");
const settingsMenu = document.getElementById("settingsMenu");
const openSettingsBtn = document.getElementById("openSettingsBtn");
const backToProfileBtn = document.getElementById("backToProfileBtn");

if (
    profileBtn &&
    profileDropdown &&
    profileMenu &&
    settingsMenu &&
    openSettingsBtn &&
    backToProfileBtn
) {
    function showProfileMenu() {
        profileMenu.hidden = false;
        settingsMenu.hidden = true;
    }

    function closeDropdown() {
        profileDropdown.hidden = true;
        profileBtn.setAttribute("aria-expanded", "false");
        showProfileMenu();
    }

    profileBtn.addEventListener("click", (event) => {
        event.stopPropagation();

        if (profileDropdown.hidden) {
            profileDropdown.hidden = false;
            profileBtn.setAttribute("aria-expanded", "true");
        } else {
            closeDropdown();
        }
    });

    openSettingsBtn.addEventListener("click", () => {
        profileMenu.hidden = true;
        settingsMenu.hidden = false;
    });

    backToProfileBtn.addEventListener("click", showProfileMenu);

    profileDropdown.addEventListener("click", (event) => {
        event.stopPropagation();
    });

    document.addEventListener("click", (event) => {
        if (!profileDropdown.contains(event.target) &&
            !profileBtn.contains(event.target)) {
            closeDropdown();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !profileDropdown.hidden) {
            closeDropdown();
            profileBtn.focus();
        }
    });

    // Placeholder actions until the settings features are implemented.
    document.querySelectorAll("[data-setting]").forEach((button) => {
        button.addEventListener("click", () => {
            const setting = button.dataset.setting;

            console.log(`Selected setting: ${setting}`);
        });
    });
}