function showToast(message, type = "success") {
    let toast = document.querySelector(".toast");

    if (!toast) {
        toast = document.createElement("div");
        toast.className = "toast";
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.className = "toast " + type;

    toast.style.position = "fixed";
    toast.style.right = "20px";
    toast.style.bottom = "20px";
    toast.style.padding = "12px 18px";
    toast.style.borderRadius = "8px";
    toast.style.color = "white";
    toast.style.zIndex = "9999";
    toast.style.boxShadow = "0 5px 15px rgba(0,0,0,0.15)";

    if (type === "error") {
        toast.style.backgroundColor = "#dc2626";
    } else {
        toast.style.backgroundColor = "#3157d5";
    }

    toast.style.display = "block";

    setTimeout(function () {
        toast.style.display = "none";
    }, 3000);
}