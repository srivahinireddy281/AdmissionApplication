document.addEventListener("DOMContentLoaded", loadCourses);

async function loadCourses() {
    try {
        const res = await fetch("/courses");
        const courses = await res.json();
        const select = document.getElementById("course_id");
        courses.forEach(course => {
            const option = document.createElement("option");
            option.value = course.id;
            option.textContent = course.name;
            select.appendChild(option);
        });
    } catch (err) {
        console.log(err);
    }
}

document.getElementById("admissionForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const course_id = document.getElementById("course_id").value;
    const marks = parseInt(document.getElementById("marks").value);

    const messageDiv = document.getElementById("message");

    // Validation
    if (!name || !email || !password || !course_id || isNaN(marks)) {
        messageDiv.innerHTML = "<p style='color: red;'>Please fill in all fields correctly.</p>";
        return;
    }

    if (marks < 0 || marks > 100) {
        messageDiv.innerHTML = "<p style='color: red;'>Marks must be between 0 and 100.</p>";
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
        course_id: course_id,
        marks: marks
    };

    try {
        const res = await fetch("/student/register", {
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
            document.getElementById("admissionForm").reset();
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