const redis = require('redis');
const db = require('../config/db');

class CacheService {
    constructor() {
        this.client = null;
        this.isConnected = false;

        // Try to connect to Redis, fallback to in-memory cache if not available
        this.initRedis();
    }

    async initRedis() {
        try {
            this.client = redis.createClient({
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD || undefined
            });

            this.client.on('error', (err) => {
                console.log('Redis connection failed, using in-memory cache:', err.message);
                this.client = null;
                this.memoryCache = new Map();
            });

            this.client.on('connect', () => {
                console.log('Connected to Redis');
                this.isConnected = true;
            });

            await this.client.connect();
        } catch (error) {
            console.log('Redis not available, using in-memory cache');
            this.memoryCache = new Map();
        }
    }

    async get(key) {
        try {
            if (this.client && this.isConnected) {
                const value = await this.client.get(key);
                return value ? JSON.parse(value) : null;
            } else if (this.memoryCache) {
                return this.memoryCache.get(key) || null;
            }
        } catch (error) {
            console.error('Cache get error:', error);
        }
        return null;
    }

    async set(key, value, ttl = 3600) {
        try {
            const serializedValue = JSON.stringify(value);

            if (this.client && this.isConnected) {
                await this.client.setEx(key, ttl, serializedValue);
            } else if (this.memoryCache) {
                this.memoryCache.set(key, value);
                // Simple TTL for memory cache
                setTimeout(() => {
                    this.memoryCache.delete(key);
                }, ttl * 1000);
            }
        } catch (error) {
            console.error('Cache set error:', error);
        }
    }

    async del(key) {
        try {
            if (this.client && this.isConnected) {
                await this.client.del(key);
            } else if (this.memoryCache) {
                this.memoryCache.delete(key);
            }
        } catch (error) {
            console.error('Cache delete error:', error);
        }
    }

    async getOrSet(key, fetchFunction, ttl = 3600) {
        let cached = await this.get(key);
        if (cached) {
            return cached;
        }

        const data = await fetchFunction();
        await this.set(key, data, ttl);
        return data;
    }

    // Cache keys
    getCacheKey(type, ...params) {
        return `${type}:${params.join(':')}`;
    }

    // Specific cache methods
    async getStudentStats() {
        return this.getOrSet('stats:students', async () => {
            return new Promise((resolve, reject) => {
                const sql = `
                    SELECT
                        COUNT(*) as total_students,
                        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved_students,
                        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected_students,
                        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_students,
                        AVG(marks) as average_marks
                    FROM students
                `;

                db.query(sql, (err, results) => {
                    if (err) reject(err);
                    else resolve(results[0]);
                });
            });
        }, 300); // 5 minutes TTL
    }

    async getFacultyStats() {
        return this.getOrSet('stats:faculty', async () => {
            return new Promise((resolve, reject) => {
                const sql = `
                    SELECT
                        COUNT(*) as total_faculty,
                        COUNT(DISTINCT department_id) as departments_count
                    FROM faculty
                `;

                db.query(sql, (err, results) => {
                    if (err) reject(err);
                    else resolve(results[0]);
                });
            });
        }, 300);
    }

    async getCourseStats() {
        return this.getOrSet('stats:courses', async () => {
            return new Promise((resolve, reject) => {
                const sql = `
                    SELECT
                        c.name,
                        COUNT(s.id) as applications_count,
                        AVG(s.marks) as average_marks
                    FROM courses c
                    LEFT JOIN students s ON c.id = s.course_id
                    GROUP BY c.id, c.name
                    ORDER BY applications_count DESC
                `;

                db.query(sql, (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });
        }, 300);
    }

    async invalidateStats() {
        await Promise.all([
            this.del('stats:students'),
            this.del('stats:faculty'),
            this.del('stats:courses')
        ]);
    }

    async getDashboardData(userId, role) {
        const cacheKey = this.getCacheKey('dashboard', userId, role);
        return this.getOrSet(cacheKey, async () => {
            if (role === 'faculty') {
                return new Promise((resolve, reject) => {
                    const sql = `
                        SELECT
                            (SELECT COUNT(*) FROM students) as total_applications,
                            (SELECT COUNT(*) FROM students WHERE status = 'Pending') as pending_applications,
                            (SELECT COUNT(*) FROM students WHERE status = 'Approved') as approved_applications,
                            (SELECT COUNT(*) FROM students WHERE status_updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as recent_updates
                    `;

                    db.query(sql, (err, results) => {
                        if (err) reject(err);
                        else resolve(results[0]);
                    });
                });
            } else {
                return new Promise((resolve, reject) => {
                    const sql = `
                        SELECT s.*, c.name as course_name, d.name as department_name
                        FROM students s
                        JOIN courses c ON s.course_id = c.id
                        JOIN departments d ON c.department_id = d.id
                        WHERE s.id = ?
                    `;

                    db.query(sql, [userId], (err, results) => {
                        if (err) reject(err);
                        else resolve(results[0] || null);
                    });
                });
            }
        }, 60); // 1 minute TTL for dashboard data
    }
}

module.exports = new CacheService();