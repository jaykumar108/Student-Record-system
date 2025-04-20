const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const pdfkit = require("pdfkit");
const fs = require("fs");
const path = require("path");
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const app = express();

// Passport configuration
passport.use(new LocalStrategy(
    {
        usernameField: 'email',
        passwordField: 'password'
    },
    async (email, password, done) => {
        try {
            const user = await User.findOne({ email });
            if (!user) {
                return done(null, false, { message: 'User not found' });
            }
            
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return done(null, false, { message: 'Invalid password' });
            }
            
            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        httpOnly: true,
        sameSite: 'lax'
    },
    name: 'user-session',
    rolling: true
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware to parse JSON bodies
app.use(express.json());

// CORS middleware with credentials support
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve static files
app.use(express.static("public"));

// MongoDB Connection (Using Atlas)
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 30000,  // Increase timeout
    socketTimeoutMS: 45000,
    family: 4,
    retryWrites: true,
    w: 'majority'
    
})
.then(() => {
    console.log("MongoDB Connected");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})
.catch(err => {
    console.error("MongoDB Connection Failed:", err);
    process.exit(1);
});

// Authentication routes

// Signup route
app.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }
        
        const user = new User({
            name,
            email,
            password
        });
        await user.save();
        
        // Login the user immediately
        await req.login(user, (err) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Login failed' });
            }
            
            res.json({ success: true, message: 'Signup successful', user: { name: user.name } });
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(400).json({ success: false, message: 'Signup failed. Please try again.' });
    }
});

// Login route
app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: info.message || 'Invalid credentials' 
            });
        }
        
        req.login(user, (err) => {
            if (err) {
                return next(err);
            }
            
            res.json({ 
                success: true, 
                message: 'Login successful',
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                }
            });
        });
    })(req, res, next);
});

// Serve login page
app.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/');
    } else {
        res.sendFile(path.join(__dirname, "views", "index.html"));
    }
});

// Serve signup page
app.get('/signup', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/');
    } else {
        res.sendFile(path.join(__dirname, "views", "index.html"));
    }
});

// Check authentication status
app.get('/check-auth', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ 
            success: true, 
            user: {
                id: req.user.id,
                email: req.user.email,
                name: req.user.name
            }
        });
    } else {
        res.json({ success: false });
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Logout failed' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Logged out successfully' 
        });
    });
});

// Protected middleware
const protect = (req, res, next) => {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Not authorized' });
    }
};

// Student Schema & Model
const studentSchema = new mongoose.Schema({
    name: String,
    class: String,
    marks: Number,
    mobile: String,
    email: String,
    address: String,
    about: String,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

const Student = mongoose.model("Student", studentSchema);

// Protected routes (require authentication)

// Add Student
app.post("/add", protect, async (req, res) => {
    try {
        const student = new Student({
            ...req.body,
            userId: req.user.id
        });
        await student.save();
        res.json({ success: true, message: "Student Added Successfully!" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get All Students
app.get("/students", protect, async (req, res) => {
    try {
        const students = await Student.find({ userId: req.user.id });
        res.json({ success: true, students });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Update Student
app.put("/update/:id", protect, async (req, res) => {
    try {
        // First check if the student belongs to the user
        const student = await Student.findById(req.params.id);
        if (!student || student.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized to update this student" });
        }
        
        await Student.findByIdAndUpdate(req.params.id, req.body);
        res.json({ success: true, message: "Student Updated Successfully!" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Delete Student
app.delete("/delete/:id", protect, async (req, res) => {
    try {
        // First check if the student belongs to the user
        const student = await Student.findById(req.params.id);
        if (!student || student.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized to delete this student" });
        }
        
        await Student.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Student Deleted Successfully!" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Search Student by Name, Mobile, or Email
app.get("/search", protect, async (req, res) => {
    try {
        const query = req.query.q;
        const students = await Student.find({
            userId: req.user.id,
            $or: [
                { name: new RegExp(query, "i") },
                { email: new RegExp(query, "i") },
                { mobile: new RegExp(query, "i") }
            ]
        });
        res.json({ success: true, students });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Generate Student PDF
app.get("/print/:id", protect, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ success: false, message: "Student Not Found" });

        const doc = new pdfkit();
        const pdfPath = path.join(__dirname, "public", `student_${student._id}.pdf`);
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
        res.status(500).json({ success: false, message: err.message });
    }
});

// Serve main content (protected)
app.get('/', protect, (req, res) => {
    res.sendFile(path.join(__dirname, "views", "index.html"));
});
