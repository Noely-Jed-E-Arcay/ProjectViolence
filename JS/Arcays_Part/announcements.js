
document.addEventListener("DOMContentLoaded", () => {
  const heading = [...document.querySelectorAll(".panel-heading h2")].find(
    (element) => element.textContent.trim() === "Latest Announcements"
  );
  const panel = heading?.closest(".panel");
  const announcementList = panel?.querySelector(".panel-body");

  if (!announcementList) return;

  let announcements;
  try {
    announcements = JSON.parse(localStorage.getItem("announcements") || "[]");
  } catch {
    announcements = [];
  }

  if (!Array.isArray(announcements) || announcements.length === 0) return;

  announcementList.replaceChildren();
  announcements.forEach((announcement) => {
    const item = document.createElement("article");
    item.className = "announcement";

    const icon = document.createElement("div");
    icon.className = "announcement-icon";
    icon.textContent = "⌂";

    const content = document.createElement("div");
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = announcement.category || "ANNOUNCEMENT";

    const title = document.createElement("h3");
    title.textContent = announcement.title || "Announcement";

    const message = document.createElement("p");
    message.textContent = announcement.message || announcement.description || "";

    content.append(tag, title, message);
    item.append(icon, content);
    announcementList.appendChild(item);
  });
});
