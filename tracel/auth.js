/* =========================================
   SAFEREPORT AUTHENTICATION SYSTEM
========================================= */


/* =========================================
   CREATE ACCOUNT
========================================= */

function createAccount(event) {

    event.preventDefault();

    const fullName =
        document.getElementById("fullname").value.trim();

    const email =
        document.getElementById("email").value.trim().toLowerCase();

    const studentId =
        document.getElementById("studentid").value.trim();

    const password =
        document.getElementById("password").value;

    const confirmPassword =
        document.getElementById("confirm").value;

    const terms =
        document.getElementById("terms").checked;


    /* CHECK REQUIRED FIELDS */

    if (
        fullName === "" ||
        email === "" ||
        studentId === "" ||
        password === "" ||
        confirmPassword === ""
    ) {

        alert("Please complete all fields.");

        return;
    }


    /* CHECK EMAIL */

    if (!email.includes("@")) {

        alert("Please enter a valid email address.");

        return;
    }


    /* CHECK PASSWORD */

    if (password.length < 6) {

        alert("Password must be at least 6 characters.");

        return;
    }


    /* CHECK PASSWORD MATCH */

    if (password !== confirmPassword) {

        alert("Passwords do not match.");

        return;
    }


    /* CHECK TERMS */

    if (!terms) {

        alert("Please agree to the Terms and Conditions.");

        return;
    }


    /* CHECK EXISTING ACCOUNT */

    const existingUser =
        localStorage.getItem("safeReportUser");

    if (existingUser) {

        const user =
            JSON.parse(existingUser);

        if (
            user.email.toLowerCase() === email
        ) {

            alert(
                "An account with this email already exists."
            );

            return;
        }

        if (
            user.studentId === studentId
        ) {

            alert(
                "This Student ID is already registered."
            );

            return;
        }
    }


    /* CREATE USER */

    const newUser = {

        fullName: fullName,

        email: email,

        studentId: studentId,

        password: password,

        role: "Student",

        dateCreated:
            new Date().toLocaleDateString()

    };


    /* SAVE ACCOUNT */

    localStorage.setItem(
        "safeReportUser",
        JSON.stringify(newUser)
    );


    /* REMOVE OLD LOGIN */

    localStorage.removeItem(
        "safeReportLoggedIn"
    );

    localStorage.removeItem(
        "currentUser"
    );


    alert(
        "Account created successfully! You can now login."
    );


    /* GO TO LOGIN */

    window.location.href =
        "login.html";

}


/* =========================================
   LOGIN
========================================= */

function loginUser(event) {

    event.preventDefault();


    const email =
        document
            .getElementById("email")
            .value
            .trim()
            .toLowerCase();


    const password =
        document
            .getElementById("password")
            .value;


    /* GET SAVED ACCOUNT */

    const savedUser =
        localStorage.getItem("safeReportUser");


    if (!savedUser) {

        alert(
            "No account found. Please create an account first."
        );

        return;
    }


    let user;

    try {

        user = JSON.parse(savedUser);

    } catch (error) {

        alert(
            "There is a problem with the saved account. Please create a new account."
        );

        localStorage.removeItem(
            "safeReportUser"
        );

        return;
    }


    /* CHECK LOGIN */

    const savedEmail =
        String(user.email)
            .trim()
            .toLowerCase();


    if (
        email === savedEmail &&
        password === user.password
    ) {

        /* SAVE LOGIN STATUS */

        localStorage.setItem(
            "safeReportLoggedIn",
            "true"
        );


        /* SAVE CURRENT USER */

        localStorage.setItem(
            "currentUser",
            JSON.stringify(user)
        );


        alert(
            "Login successful!"
        );


        /* GO TO DASHBOARD */

        window.location.href =
            "index.html";


    } else {

        alert(
            "Incorrect email or password."
        );

    }

}


/* =========================================
   CHECK LOGIN
========================================= */

function checkLogin() {

    const loggedIn =
        localStorage.getItem(
            "safeReportLoggedIn"
        );


    if (loggedIn !== "true") {

        window.location.href =
            "login.html";

    }

}


/* =========================================
   GET CURRENT USER
========================================= */

function getCurrentUser() {

    const user =
        localStorage.getItem(
            "currentUser"
        );


    if (!user) {

        return null;

    }


    try {

        return JSON.parse(user);

    } catch (error) {

        return null;

    }

}


/* =========================================
   DISPLAY USER INFORMATION
========================================= */

function displayUserInfo() {

    const user =
        getCurrentUser();


    if (!user) {

        return;

    }


    /* NAME */

    const nameElements =
        document.querySelectorAll(
            ".user-name"
        );


    nameElements.forEach(
        function(element) {

            element.textContent =
                user.fullName;

        }
    );


    /* EMAIL */

    const emailElements =
        document.querySelectorAll(
            ".user-email"
        );


    emailElements.forEach(
        function(element) {

            element.textContent =
                user.email;

        }
    );


    /* STUDENT ID */

    const studentElements =
        document.querySelectorAll(
            ".student-id"
        );


    studentElements.forEach(
        function(element) {

            element.textContent =
                user.studentId;

        }
    );


    /* ROLE */

    const roleElements =
        document.querySelectorAll(
            ".user-role"
        );


    roleElements.forEach(
        function(element) {

            element.textContent =
                user.role;

        }
    );

}


/* =========================================
   LOGOUT
========================================= */

function logoutUser() {

    localStorage.removeItem(
        "safeReportLoggedIn"
    );

    localStorage.removeItem(
        "currentUser"
    );


    alert(
        "You have been logged out."
    );


    window.location.href =
        "login.html";

}


/* =========================================
   UPDATE PROFILE
========================================= */

function updateProfile(event) {

    event.preventDefault();


    const user =
        getCurrentUser();


    if (!user) {

        alert(
            "Please login first."
        );

        return;

    }


    const fullNameElement =
        document.getElementById(
            "profileFullName"
        );


    const emailElement =
        document.getElementById(
            "profileEmail"
        );


    if (fullNameElement) {

        user.fullName =
            fullNameElement.value.trim();

    }


    if (emailElement) {

        user.email =
            emailElement.value
                .trim()
                .toLowerCase();

    }


    localStorage.setItem(
        "safeReportUser",
        JSON.stringify(user)
    );


    localStorage.setItem(
        "currentUser",
        JSON.stringify(user)
    );


    alert(
        "Profile updated successfully!"
    );


    displayUserInfo();

}


/* =========================================
   LOAD PROFILE
========================================= */

function loadProfile() {

    const user =
        getCurrentUser();


    if (!user) {

        return;

    }


    const fullNameElement =
        document.getElementById(
            "profileFullName"
        );


    const emailElement =
        document.getElementById(
            "profileEmail"
        );


    const studentIdElement =
        document.getElementById(
            "profileStudentId"
        );


    if (fullNameElement) {

        fullNameElement.value =
            user.fullName;

    }


    if (emailElement) {

        emailElement.value =
            user.email;

    }


    if (studentIdElement) {

        studentIdElement.value =
            user.studentId;

    }

}


/* =========================================
   RUN WHEN PAGE LOADS
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        displayUserInfo();

    }
);