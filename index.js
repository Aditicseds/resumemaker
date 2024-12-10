const express = require("express");
const cors = require("cors");
const pdf = require("html-pdf");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint to create PDF
app.post("/create-pdf", (req, res) => {
  const { formData, template } = req.body;

  // Debugging the received formData
  console.log("Received formData:", formData);

  const templatePath = path.join(__dirname, "pdf", template); // Path to the template
  console.log(`Template Path: ${templatePath}`);

  if (!fs.existsSync(templatePath)) {
    console.error("Template not found:", templatePath);
    return res.status(400).send("Template not found");
  }

  // Reading the template HTML file
  const templateJS = fs.readFileSync(templatePath, "utf8");
  console.log("Template loaded successfully");

  // Regex to extract HTML content from the template JS file
  const regex = /return\s+`([\s\S]*?)`;/; // Captures everything inside backticks of the template literal
  const match = templateJS.match(regex);

  if (match && match[1]) {
    const templateHTML = match[1]; // Extracted HTML from the template
    console.log("Template before replacement:\n", templateHTML);

    // Replace placeholders with formData
    const filledTemplate = templateHTML.replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
      const value = formData[key] ; // Default value if data is missing
      console.log(`Replacing {{${key}}} with: ${value}`); // Debug each replacement
      return value;
    });

    console.log("Filled Template:\n", filledTemplate); // Debugging the filled template

    // Create PDF from the filled template
    pdf.create(filledTemplate, {}).toFile(path.join(__dirname, "Resume.pdf"), (err) => {
      if (err) {
        console.error("PDF creation error:", err);
        return res.status(500).send("Failed to create PDF");
      }
      console.log("PDF created successfully");
      res.send("PDF created successfully");
    });
  } else {
    console.error("Failed to extract HTML template.");
    res.status(400).send("Failed to extract HTML template.");
  }
});

// Endpoint to fetch the generated PDF
app.get("/fetch-pdf", (req, res) => {
  const filePath = path.join(__dirname, "Resume.pdf");
  console.log(`Sending file: ${filePath}`);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("File sending error:", err);
    } else {
      console.log("File sent successfully");
    }
  });
});

// Serve the client build directory (for static assets)
app.use(express.static("../client/build"));

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port=${port}`);
});
