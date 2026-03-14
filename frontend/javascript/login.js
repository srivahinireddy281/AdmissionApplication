document.getElementById("loginForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const role = document.getElementById("role").value;
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const messageDiv = document.getElementById("loginMessage");

    if (!role || !email || !password) {
        messageDiv.innerHTML = "<p style='color: red;'>Please fill in all fields.</p>";
        return;
    }

    try {
        const res = await fetch(`http://localhost:5000/${role}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const result = await res.json();

        if (res.ok) {
            messageDiv.innerHTML = "<p style='color: green;'>" + result.message + "</p>";
            if (role === 'student') {
                window.location.href = 'student-dashboard.html';
            } else if (role === 'faculty') {
                window.location.href = 'dashboard.html';
            }
        } else {
            messageDiv.innerHTML = "<p style='color: red;'>" + (result.message || "Login failed.") + "</p>";
        }
    } catch (err) {
        console.log(err);
        messageDiv.innerHTML = "<p style='color: red;'>Error logging in. Please try again.</p>";
    }
});