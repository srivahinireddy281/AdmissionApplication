const nodemailer = require('nodemailer');
const db = require('../config/db');

class NotificationService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    async sendWelcomeEmail(email, name, role) {
        try {
            const mailOptions = {
                from: process.env.SMTP_USER,
                to: email,
                subject: `Welcome to Smart Student Admission Portal - ${name}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #667eea;">Welcome to Smart Student Admission Portal!</h2>
                        <p>Dear ${name},</p>
                        <p>Thank you for registering as a ${role} with our platform. Your account has been successfully created.</p>
                        <p>You can now:</p>
                        <ul>
                            ${role === 'student' ?
                                '<li>Apply for courses</li><li>Track your application status</li><li>Manage your profile</li>' :
                                '<li>Review student applications</li><li>Update application statuses</li><li>Access comprehensive dashboards</li>'
                            }
                        </ul>
                        <p>Best regards,<br>Smart Student Admission Team</p>
                        <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 5px;">
                            <p style="margin: 0; font-size: 12px; color: #6c757d;">
                                This is an automated message. Please do not reply to this email.
                            </p>
                        </div>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`Welcome email sent to ${email}`);
        } catch (error) {
            console.error('Error sending welcome email:', error);
        }
    }

    async sendApplicationStatusUpdate(email, name, courseName, status) {
        try {
            const statusColors = {
                'Approved': '#28a745',
                'Rejected': '#dc3545',
                'Pending': '#ffc107'
            };

            const mailOptions = {
                from: process.env.SMTP_USER,
                to: email,
                subject: `Application Status Update - ${courseName}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #667eea;">Application Status Update</h2>
                        <p>Dear ${name},</p>
                        <p>Your application for <strong>${courseName}</strong> has been updated.</p>
                        <div style="background: ${statusColors[status] || '#6c757d'}; color: white; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
                            <h3 style="margin: 0;">Status: ${status}</h3>
                        </div>
                        ${status === 'Approved' ?
                            '<p>Congratulations! Your application has been approved. Please check your dashboard for further instructions.</p>' :
                            status === 'Rejected' ?
                            '<p>We regret to inform you that your application was not approved at this time. You may reapply for other courses.</p>' :
                            '<p>Your application is still under review. We will notify you once a decision is made.</p>'
                        }
                        <p>Best regards,<br>Smart Student Admission Team</p>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`Status update email sent to ${email}`);
        } catch (error) {
            console.error('Error sending status update email:', error);
        }
    }

    async sendPendingApplicationReminders() {
        try {
            const sql = `
                SELECT s.name, s.email, c.name as course_name
                FROM students s
                JOIN courses c ON s.course_id = c.id
                WHERE s.status = 'Pending'
                AND s.created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
            `;

            db.query(sql, async (err, results) => {
                if (err) {
                    console.error('Error fetching pending applications:', err);
                    return;
                }

                for (const student of results) {
                    await this.sendReminderEmail(student.email, student.name, student.course_name);
                }
            });
        } catch (error) {
            console.error('Error in pending application reminders:', error);
        }
    }

    async sendReminderEmail(email, name, courseName) {
        try {
            const mailOptions = {
                from: process.env.SMTP_USER,
                to: email,
                subject: `Reminder: Your Application for ${courseName} is Pending Review`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #667eea;">Application Reminder</h2>
                        <p>Dear ${name},</p>
                        <p>This is a friendly reminder that your application for <strong>${courseName}</strong> is still under review.</p>
                        <p>Our faculty team is carefully reviewing all applications. You will receive an update soon.</p>
                        <p>If you have any questions, please don't hesitate to contact our support team.</p>
                        <p>Best regards,<br>Smart Student Admission Team</p>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`Reminder email sent to ${email}`);
        } catch (error) {
            console.error('Error sending reminder email:', error);
        }
    }

    async sendWeeklyAnalyticsReport() {
        try {
            // Get analytics data
            const analytics = await this.getWeeklyAnalytics();

            const mailOptions = {
                from: process.env.SMTP_USER,
                to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
                subject: 'Weekly Analytics Report - Admission Portal',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #667eea;">Weekly Analytics Report</h2>
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                            <h3>This Week's Statistics:</h3>
                            <ul>
                                <li>New Student Registrations: ${analytics.newStudents}</li>
                                <li>New Faculty Registrations: ${analytics.newFaculty}</li>
                                <li>Applications Processed: ${analytics.applicationsProcessed}</li>
                                <li>Applications Approved: ${analytics.applicationsApproved}</li>
                                <li>Applications Rejected: ${analytics.applicationsRejected}</li>
                            </ul>
                        </div>
                        <p>Generated on: ${new Date().toLocaleDateString()}</p>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log('Weekly analytics report sent');
        } catch (error) {
            console.error('Error sending weekly analytics report:', error);
        }
    }

    async getWeeklyAnalytics() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT
                    (SELECT COUNT(*) FROM students WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as new_students,
                    (SELECT COUNT(*) FROM faculty WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as new_faculty,
                    (SELECT COUNT(*) FROM students WHERE status_updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as applications_processed,
                    (SELECT COUNT(*) FROM students WHERE status = 'Approved' AND status_updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as applications_approved,
                    (SELECT COUNT(*) FROM students WHERE status = 'Rejected' AND status_updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as applications_rejected
            `;

            db.query(sql, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        newStudents: results[0].new_students,
                        newFaculty: results[0].new_faculty,
                        applicationsProcessed: results[0].applications_processed,
                        applicationsApproved: results[0].applications_approved,
                        applicationsRejected: results[0].applications_rejected
                    });
                }
            });
        });
    }
}

module.exports = new NotificationService();