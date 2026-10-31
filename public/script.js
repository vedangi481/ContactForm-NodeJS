const form = document.getElementById("contactForm");
const response = document.getElementById("response");

form.addEventListener("submit", async function(event) {

    event.preventDefault();

    const formData = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        subject: document.getElementById("subject").value,
        message: document.getElementById("message").value
    };

    const result = await fetch("/submit", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
    });

    const data = await result.json();

    response.textContent = data.message;

    if (result.ok) {
        response.style.color = "green";
        form.reset();
    } else {
        response.style.color = "red";
    }

});