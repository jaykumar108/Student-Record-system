require("dotenv").config(); // Load environment variables
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const pdfkit = require("pdfkit");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public")); // Serve static files

// ✅ MongoDB Connection (Using Atlas)
const mongoURI = process.env.MONGO_URI; // Get from .env

mongoose.connect(mongoURI)
    .then(() => console.log("✅ MongoDB Connected Successfully!"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Student Schema & Model
const studentSchema = new mongoose.Schema({
    name: String,
    class: String,
    marks: Number,
    mobile: String,
    email: String,
    address: String,
    about: String,
});

const Student = mongoose.model("Student", studentSchema);

// ✅ Add Student
app.post("/add", async (req, res) => {
    try {
        const student = new Student(req.body);
        await student.save();
        res.json({ message: "✅ Student Added Successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ Get All Students
app.get("/students", async (req, res) => {
    const students = await Student.find();
    res.json(students);
});

// ✅ Update Student
app.put("/update/:id", async (req, res) => {
    try {
        await Student.findByIdAndUpdate(req.params.id, req.body);
        res.json({ message: "✅ Student Updated Successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ Delete Student
app.delete("/delete/:id", async (req, res) => {
    try {
        await Student.findByIdAndDelete(req.params.id);
        res.json({ message: "✅ Student Deleted Successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ Search Student by Name, Mobile, or Email
app.get("/search", async (req, res) => {
    const query = req.query.q;
    const students = await Student.find({
        $or: [
            { name: new RegExp(query, "i") },
            { email: new RegExp(query, "i") },
            { mobile: new RegExp(query, "i") }
        ]
    });
    res.json(students);
});

// ✅ Generate Student PDF
app.get("/print/:id", async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).send("❌ Student Not Found");

        // Ensure "public" directory exists
        const publicDir = path.join(__dirname, "public");
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir);
        }

        const doc = new pdfkit();
        const pdfPath = path.join(publicDir, `student_${student._id}.pdf`);
        const stream = fs.createWriteStream(pdfPath);

        doc.pipe(stream);
        doc.fontSize(20).text("Student Details", { align: "center" });
        doc.moveDown();
        doc.fontSize(14).text(`Name: ${student.name}`);
        doc.text(`Class: ${student.class}`);
        doc.text(`Marks: ${student.marks}`);
        doc.text(`Mobile: ${student.mobile}`);
        doc.text(`Email: ${student.email}`);
        doc.text(`Address: ${student.address}`);
        doc.text(`About: ${student.about}`);
        doc.end();

        stream.on("finish", () => {
            res.download(pdfPath);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ Serve index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

// ✅ Set Dynamic Port for Render Deployment
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
        