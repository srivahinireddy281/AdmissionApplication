document.addEventListener("DOMContentLoaded", loadDepartments);

async function loadDepartments() {
    try {
        const res = await fetch("/departments");
        const departments = await res.json();
        const select = document.getElementById("department_id");
        departments.forEach(dept => {
            const option = document.createElement("option");
            option.value = dept.id;
            option.textContent = dept.name;
            select.appendChild(option);
        });
    } catch (err) {
        console.log(err);
    }
}

document.getElementById("facultyForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const department_id = document.getElementById("department_id").value;

    const messageDiv = document.getElementById("message");

    // Validation
    if (!name || !email || !password || !department_id) {
        messageDiv.innerHTML = "<p style='color: red;'>Please fill in all fields.</p>";
        return;
    }

    if (password.length < 6) {
        messageDiv.innerHTML = "<p style='color: red;'>Password must be at least 6 characters long.</p>";
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        messageDiv.innerHTML = "<p style='color: red;'>Please enter a valid email address.</p>";
        return;
    }

    const data = {
        name: name,
        email: email,
        password: password,
        department_id: department_id
    };

    try {
        const res = await fetch("/faculty/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (res.ok) {
            messageDiv.innerHTML = "<p style='color: green;'>" + result.message + "</p>";
            // Clear the form
            document.getElementById("facultyForm").reset();
            // Redirect to login after a delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            messageDiv.innerHTML = "<p style='color: red;'>" + (result.message || "Error registering.") + "</p>";
        }
    } catch (err) {
        console.log(err);
        messageDiv.innerHTML = "<p style='color: red;'>Error submitting form. Please try again.</p>";
    }
});