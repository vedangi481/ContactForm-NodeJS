// Import Node.js modules
const http = require("http");
const fs = require("fs");
const path = require("path");
const EventEmitter = require("events");

// Import custom validation module
const validateForm = require("./modules/validator");

// File path
const dataFile = path.join(__dirname, "submissions.json");

// Create event
const event = new EventEmitter();

event.on("submitted", function(name) {
    console.log("New form submitted by " + name);
});

// Save submissions one at a time
let saving = Promise.resolve();

function saveSubmission(data) {
    saving = saving.then(async function() {

        let submissions = [];

        try {
            const fileData = await fs.promises.readFile(dataFile, "utf8");
            submissions = JSON.parse(fileData || "[]");

            if (!Array.isArray(submissions)) {
                throw new Error("Invalid file format");
            }

        } catch (error) {
            if (error.code !== "ENOENT") {
                throw error;
            }
        }

        submissions.push(data);

        await fs.promises.writeFile(
            dataFile,
            JSON.stringify(submissions, null, 4)
        );
    });

    return saving;
}

// Create HTTP server
const server = http.createServer(function(req, res) {

    // Handle GET request
    if (req.method === "GET") {

        let fileName = "index.html";

        if (req.url === "/style.css") {
            fileName = "style.css";
        }

        if (req.url === "/script.js") {
            fileName = "script.js";
        }

        if (req.url !== "/" &&
            req.url !== "/index.html" &&
            req.url !== "/style.css" &&
            req.url !== "/script.js") {

            res.writeHead(404);
            res.end("Page Not Found");
            return;
        }

        const filePath = path.join(__dirname, "public", fileName);

        const contentTypes = {
            "index.html": "text/html",
            "style.css": "text/css",
            "script.js": "application/javascript"
        };

        const stream = fs.createReadStream(filePath);

        res.writeHead(200, {
            "Content-Type": contentTypes[fileName]
        });

        stream.pipe(res);

        stream.on("error", function() {
            if (!res.headersSent) {
                res.writeHead(500);
                res.end("Server Error");
            } else {
                res.destroy();
            }
        });

        return;
    }

    // Handle POST request
    if (req.method === "POST" && req.url === "/submit") {

        let body = "";
        let tooLarge = false;

        req.on("data", function(chunk) {

            body += chunk;

            if (body.length > 100000) {
                tooLarge = true;
                res.writeHead(413);
                res.end("Request Too Large");
                req.destroy();
            }
        });

        req.on("end", async function() {

            if (tooLarge) return;

            let data;

            try {
                data = JSON.parse(body);
            } catch (error) {
                res.writeHead(400, {
                    "Content-Type": "application/json"
                });
                res.end(JSON.stringify({
                    message: "Invalid request data"
                }));
                return;
            }

            // Check form data
            const errors = validateForm(data);

            if (errors.length > 0) {
                res.writeHead(400, {
                    "Content-Type": "application/json"
                });
                res.end(JSON.stringify({
                    message: errors.join(", ")
                }));
                return;
            }

            // Prepare submission
            const submission = {
                name: data.name.trim(),
                email: data.email.trim(),
                subject: data.subject.trim(),
                message: data.message.trim(),
                date: new Date().toLocaleString()
            };

            try {

                // Save data in JSON file
                await saveSubmission(submission);

                // Generate event
                event.emit("submitted", submission.name);

                res.writeHead(200, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify({
                    message: "Form submitted successfully!"
                }));

            } catch (error) {

                console.log(error);

                res.writeHead(500, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify({
                    message: "Unable to save submission"
                }));
            }
        });

        return;
    }

    // Handle unsupported requests
    res.writeHead(404);
    res.end("Page Not Found");

});

// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", function() {
    console.log("Server running at http://localhost:" + PORT);
});
