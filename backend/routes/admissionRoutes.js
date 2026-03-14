const express = require("express")
const bcrypt = require("bcrypt")
const router = express.Router()

const db = require("../config/db")

// Student register
router.post("/student/register", async (req, res) => {
    const { name, email, password, course_id, marks } = req.body

    if (!name || !email || !password || !course_id || marks === undefined) {
        return res.status(400).json({ message: "All fields are required" })
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10)
        const sql = "INSERT INTO students (name, email, password, course_id, marks) VALUES (?, ?, ?, ?, ?)"
        db.query(sql, [name, email, hashedPassword, course_id, marks], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ message: "Email already exists" })
                }
                console.log(err)
                return res.status(500).json({ message: "Database Error" })
            }
            res.json({ message: "Student registered successfully" })
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Error hashing password" })
    }
})

// Student login
router.post("/student/login", async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" })
    }

    const sql = "SELECT * FROM students WHERE email = ?"
    db.query(sql, [email], async (err, result) => {
        if (err) {
            console.log(err)
            return res.status(500).json({ message: "Database Error" })
        }
        if (result.length === 0) {
            return res.status(400).json({ message: "Invalid email or password" })
        }
        const student = result[0]
        const isMatch = await bcrypt.compare(password, student.password)
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" })
        }
        req.session.user = { id: student.id, email: student.email, role: 'student' }
        res.json({ message: "Login successful", role: 'student' })
    })
})

// Faculty register
router.post("/faculty/register", async (req, res) => {
    const { name, email, password, department_id } = req.body

    if (!name || !email || !password || !department_id) {
        return res.status(400).json({ message: "All fields are required" })
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10)
        const sql = "INSERT INTO faculty (name, email, password, department_id) VALUES (?, ?, ?, ?)"
        db.query(sql, [name, email, hashedPassword, department_id], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ message: "Email already exists" })
                }
                console.log(err)
                return res.status(500).json({ message: "Database Error" })
            }
            res.json({ message: "Faculty registered successfully" })
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Error hashing password" })
    }
})

// Faculty login
router.post("/faculty/login", async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" })
    }

    const sql = "SELECT * FROM faculty WHERE email = ?"
    db.query(sql, [email], async (err, result) => {
        if (err) {
            console.log(err)
            return res.status(500).json({ message: "Database Error" })
        }
        if (result.length === 0) {
            return res.status(400).json({ message: "Invalid email or password" })
        }
        const faculty = result[0]
        const isMatch = await bcrypt.compare(password, faculty.password)
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" })
        }
        req.session.user = { id: faculty.id, email: faculty.email, role: 'faculty' }
        res.json({ message: "Login successful", role: 'faculty' })
    })
})

// Logout
router.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: "Logout failed" })
        }
        res.json({ message: "Logout successful" })
    })
})

// Get all students (protected for faculty)
router.get("/students", (req, res) => {
    if (!req.session.user || req.session.user.role !== 'faculty') {
        return res.status(403).json({ message: "Access denied" })
    }

    const sql = `
        SELECT s.id, s.name, s.email, c.name AS course, s.marks, s.status
        FROM students s
        JOIN courses c ON s.course_id = c.id
    `;
    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json(err)
        }
        res.json(result)
    })
})

// Update student status (protected for faculty)
router.put("/students/:id", (req, res) => {
    if (!req.session.user || req.session.user.role !== 'faculty') {
        return res.status(403).json({ message: "Access denied" })
    }

    const { id } = req.params
    const { status } = req.body

    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" })
    }

    const sql = "UPDATE students SET status = ? WHERE id = ?"
    db.query(sql, [status, id], (err, result) => {
        if (err) {
            console.log(err)
            return res.status(500).json({ message: "Database Error" })
        }
        res.json({ message: "Status updated successfully" })
    })
})

// Get student status (for student dashboard)
router.get("/student/status", (req, res) => {
    if (!req.session.user || req.session.user.role !== 'student') {
        return res.status(403).json({ message: "Access denied" })
    }

    const sql = `
        SELECT s.name, s.email, c.name AS course, s.marks, s.status
        FROM students s
        JOIN courses c ON s.course_id = c.id
        WHERE s.id = ?
    `;
    db.query(sql, [req.session.user.id], (err, result) => {
        if (err) {
            return res.status(500).json(err)
        }
        if (result.length === 0) {
            return res.status(404).json({ message: "Student not found" })
        }
        res.json(result[0])
    })
})

// Get all courses
router.get("/courses", (req, res) => {
    const sql = "SELECT id, name FROM courses";
    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json(err)
        }
        res.json(result)
    })
})

// Get all departments
router.get("/departments", (req, res) => {
    const sql = "SELECT id, name FROM departments";
    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json(err)
        }
        res.json(result)
    })
})

module.exports = router