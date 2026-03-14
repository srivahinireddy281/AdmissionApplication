const express = require("express")
const bcrypt = require("bcrypt")
const { body, validationResult } = require('express-validator')
const router = express.Router()

const db = require("../config/db")
const notificationService = require("../services/notificationService")
const cacheService = require("../services/cacheService")

// Student register
router.post("/student/register", [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('course_id').isInt({ min: 1 }).withMessage('Valid course selection is required'),
    body('marks').isInt({ min: 0, max: 100 }).withMessage('Marks must be between 0-100')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: "Validation failed",
            errors: errors.array()
        });
    }

    const { name, email, password, course_id, marks } = req.body

    try {
        const hashedPassword = await bcrypt.hash(password, 10)

        // Check if email already exists
        const checkEmailSql = "SELECT id FROM students WHERE email = ?";
        db.query(checkEmailSql, [email], async (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).json({ message: "Database Error" })
            }

            if (result.length > 0) {
                return res.status(400).json({ message: "Email already exists" })
            }

            // Insert new student
            const sql = "INSERT INTO students (name, email, password, course_id, marks, created_at) VALUES (?, ?, ?, ?, ?, NOW())"
            db.query(sql, [name, email, hashedPassword, course_id, marks], async (err, result) => {
                if (err) {
                    console.log(err)
                    return res.status(500).json({ message: "Database Error" })
                }

                // Send welcome email
                await notificationService.sendWelcomeEmail(email, name, 'student');

                // Invalidate cache
                await cacheService.invalidateStats();

                // Real-time notification to faculty (will be handled by frontend polling for now)
                // io.to('faculty-room').emit('new-application', {
                //     id: result.insertId,
                //     name,
                //     email,
                //     course_id,
                //     marks,
                //     status: 'Pending'
                // });

                res.status(201).json({
                    message: "Student registered successfully",
                    studentId: result.insertId
                });
            });
        });
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Error registering student" })
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
router.post("/faculty/register", [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('department_id').isInt({ min: 1 }).withMessage('Valid department selection is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: "Validation failed",
            errors: errors.array()
        });
    }

    const { name, email, password, department_id } = req.body

    try {
        const hashedPassword = await bcrypt.hash(password, 10)

        // Check if email already exists
        const checkEmailSql = "SELECT id FROM faculty WHERE email = ?";
        db.query(checkEmailSql, [email], async (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).json({ message: "Database Error" })
            }

            if (result.length > 0) {
                return res.status(400).json({ message: "Email already exists" })
            }

            const sql = "INSERT INTO faculty (name, email, password, department_id, created_at) VALUES (?, ?, ?, ?, NOW())"
            db.query(sql, [name, email, hashedPassword, department_id], async (err, result) => {
                if (err) {
                    console.log(err)
                    return res.status(500).json({ message: "Database Error" })
                }

                // Send welcome email
                await notificationService.sendWelcomeEmail(email, name, 'faculty');

                // Invalidate cache
                await cacheService.invalidateStats();

                res.status(201).json({
                    message: "Faculty registered successfully",
                    facultyId: result.insertId
                });
            });
        });
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Error registering faculty" })
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
        req.session.user = { id: faculty.id, email: faculty.email, name: faculty.name, role: 'faculty' }
        res.json({ message: "Login successful", role: 'faculty', name: faculty.name })
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

// Get faculty profile (for dashboard)
router.get("/faculty/profile", (req, res) => {
    if (!req.session.user || req.session.user.role !== 'faculty') {
        return res.status(403).json({ message: "Access denied" });
    }

    const sql = "SELECT name, email FROM faculty WHERE id = ?";
    db.query(sql, [req.session.user.id], (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }
        if (result.length === 0) {
            return res.status(404).json({ message: "Faculty not found" });
        }
        res.json(result[0]);
    });
});

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
router.put("/students/:id", [
    body('status').isIn(['Approved', 'Rejected', 'Pending']).withMessage('Invalid status')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: "Validation failed",
            errors: errors.array()
        });
    }

    if (!req.session.user || req.session.user.role !== 'faculty') {
        return res.status(403).json({ message: "Access denied" })
    }

    const { id } = req.params
    const { status } = req.body

    // Get student details before update
    const getStudentSql = `
        SELECT s.email, s.name, c.name as course_name
        FROM students s
        JOIN courses c ON s.course_id = c.id
        WHERE s.id = ?
    `;

    db.query(getStudentSql, [id], (err, studentResult) => {
        if (err) {
            console.log(err)
            return res.status(500).json({ message: "Database Error" })
        }

        if (studentResult.length === 0) {
            return res.status(404).json({ message: "Student not found" })
        }

        const student = studentResult[0];

        const sql = "UPDATE students SET status = ?, status_updated_at = NOW() WHERE id = ?"
        db.query(sql, [status, id], async (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).json({ message: "Database Error" })
            }

            // Send email notification
            await notificationService.sendApplicationStatusUpdate(
                student.email,
                student.name,
                student.course_name,
                status
            );

            // Invalidate cache
            await cacheService.invalidateStats();

            // Real-time notification to student (will be handled by frontend polling for now)
            // io.to(`dashboard-${id}`).emit('status-updated', {
            //     studentId: id,
            //     status,
            //     updatedAt: new Date()
            // });

            res.json({
                message: "Status updated successfully",
                updatedBy: req.session.user.email
            });
        });
    });
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