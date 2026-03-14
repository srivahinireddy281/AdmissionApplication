async function loadStatus() {
    try {
        const res = await fetch("/student/status");

        if (res.status === 403) {
            window.location.href = 'index.html';
            return;
        }

        const data = await res.json();

        if (res.ok) {
            document.getElementById("statusContainer").innerHTML = `
                <div class="card">
                    <h3>Application Details</h3>
                    <p><strong>Name:</strong> ${data.name}</p>
                    <p><strong>Email:</strong> ${data.email}</p>
                    <p><strong>Course:</strong> ${data.course}</p>
                    <p><strong>Marks:</strong> ${data.marks}</p>
                    <p><strong>Status:</strong> <span style="color: ${data.status === 'Approved' ? 'green' : data.status === 'Rejected' ? 'red' : 'orange'};">${data.status}</span></p>
                </div>
            `;
        } else {
            document.getElementById("statusContainer").innerHTML = "<p style='color: red;'>" + (data.message || "Error loading status.") + "</p>";
        }
    } catch (err) {
        console.log(err);
        document.getElementById("statusContainer").innerHTML = "<p style='color: red;'>Error loading status. Please try again.</p>";
    }
}

document.getElementById("logoutBtn").addEventListener("click", async function() {
    try {
        await fetch("/logout", { method: "POST" });
        window.location.href = 'index.html';
    } catch (err) {
        console.log(err);
        window.location.href = 'index.html';
    }
});

loadStatus();