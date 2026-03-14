const express = require('express');
const router = express.Router();
const cacheService = require('../services/cacheService');
const db = require('../config/db');

/**
 * @swagger
 * /api/analytics/stats:
 *   get:
 *     summary: Get overall system statistics
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: System statistics retrieved successfully
 */
router.get('/stats', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'faculty') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const [studentStats, facultyStats, courseStats] = await Promise.all([
            cacheService.getStudentStats(),
            cacheService.getFacultyStats(),
            cacheService.getCourseStats()
        ]);

        res.json({
            students: studentStats,
            faculty: facultyStats,
            courses: courseStats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ message: 'Error fetching analytics data' });
    }
});

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get dashboard data for current user
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 */
router.get('/dashboard', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const dashboardData = await cacheService.getDashboardData(
            req.session.user.id,
            req.session.user.role
        );

        res.json(dashboardData);
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ message: 'Error fetching dashboard data' });
    }
});

/**
 * @swagger
 * /api/analytics/applications/timeline:
 *   get:
 *     summary: Get application timeline data
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to look back
 *     responses:
 *       200:
 *         description: Timeline data retrieved successfully
 */
router.get('/applications/timeline', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'faculty') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const days = parseInt(req.query.days) || 30;

        const sql = `
            SELECT
                DATE(created_at) as date,
                COUNT(*) as applications_count
            FROM students
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(created_at)
            ORDER BY date
        `;

        db.query(sql, [days], (err, results) => {
            if (err) {
                console.error('Error fetching timeline data:', err);
                return res.status(500).json({ message: 'Error fetching timeline data' });
            }

            res.json(results);
        });
    } catch (error) {
        console.error('Error in timeline endpoint:', error);
        res.status(500).json({ message: 'Error fetching timeline data' });
    }
});

/**
 * @swagger
 * /api/analytics/departments:
 *   get:
 *     summary: Get department-wise statistics
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Department statistics retrieved successfully
 */
router.get('/departments', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'faculty') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const sql = `
            SELECT
                d.name as department_name,
                COUNT(DISTINCT f.id) as faculty_count,
                COUNT(DISTINCT c.id) as courses_count,
                COUNT(DISTINCT s.id) as students_count
            FROM departments d
            LEFT JOIN faculty f ON d.id = f.department_id
            LEFT JOIN courses c ON d.id = c.department_id
            LEFT JOIN students s ON c.id = s.course_id
            GROUP BY d.id, d.name
            ORDER BY students_count DESC
        `;

        db.query(sql, (err, results) => {
            if (err) {
                console.error('Error fetching department stats:', err);
                return res.status(500).json({ message: 'Error fetching department statistics' });
            }

            res.json(results);
        });
    } catch (error) {
        console.error('Error in departments endpoint:', error);
        res.status(500).json({ message: 'Error fetching department statistics' });
    }
});

/**
 * @swagger
 * /api/analytics/performance:
 *   get:
 *     summary: Get system performance metrics
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Performance metrics retrieved successfully
 */
router.get('/performance', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'faculty') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const sql = `
            SELECT
                AVG(TIMESTAMPDIFF(DAY, created_at, status_updated_at)) as avg_processing_time,
                MIN(TIMESTAMPDIFF(DAY, created_at, status_updated_at)) as min_processing_time,
                MAX(TIMESTAMPDIFF(DAY, created_at, status_updated_at)) as max_processing_time,
                COUNT(CASE WHEN status = 'Approved' THEN 1 END) * 100.0 / COUNT(*) as approval_rate
            FROM students
            WHERE status_updated_at IS NOT NULL
        `;

        db.query(sql, (err, results) => {
            if (err) {
                console.error('Error fetching performance metrics:', err);
                return res.status(500).json({ message: 'Error fetching performance metrics' });
            }

            res.json(results[0]);
        });
    } catch (error) {
        console.error('Error in performance endpoint:', error);
        res.status(500).json({ message: 'Error fetching performance metrics' });
    }
});

module.exports = router;