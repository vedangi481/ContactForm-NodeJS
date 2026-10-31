function validateForm(data) {

    let errors = [];

    if (!data.name || data.name.trim() === "") {
        errors.push("Name is required");
    }

    // Check email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!data.email || !emailPattern.test(data.email.trim())) {
        errors.push("Enter a valid email");
    }

    if (!data.subject || data.subject.trim() === "") {
        errors.push("Subject is required");
    }

    if (!data.message || data.message.trim().length < 10) {
        errors.push("Message must contain at least 10 characters");
    }

    return errors;
}

module.exports = validateForm;