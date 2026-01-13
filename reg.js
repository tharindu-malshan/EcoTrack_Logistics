function showSignup() {
    document.getElementById("signupForm").style.display = "block";
    document.getElementById("signinForm").style.display = "none";

    document.getElementById("signupTab").classList.add("active");
    document.getElementById("signinTab").classList.remove("active");
}

function showSignin() {
    document.getElementById("signupForm").style.display = "none";
    document.getElementById("signinForm").style.display = "block";

    document.getElementById("signinTab").classList.add("active");
    document.getElementById("signupTab").classList.remove("active");
}
