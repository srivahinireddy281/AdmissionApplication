CREATE DATABASE admission_db;

USE admission_db;

CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE faculty (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    course_id INT,
    marks INT,
    status VARCHAR(20) DEFAULT 'Pending',
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- Insert sample data
INSERT INTO departments (name) VALUES ('Computer Science'), ('Engineering'), ('Business');

INSERT INTO courses (name, department_id) VALUES 
('BSc Computer Science', 1), 
('MSc Software Engineering', 1), 
('BEng Mechanical Engineering', 2), 
('MBA Business Administration', 3);

-- Sample faculty data (passwords are hashed using bcrypt)
-- Password for all sample faculty is 'password123' hashed
INSERT INTO faculty (name, email, password, department_id) VALUES 
('Dr. Alice Johnson', 'alice@university.edu', '$2b$10$example.hash.for.password123', 1),
('Prof. Bob Smith', 'bob@university.edu', '$2b$10$example.hash.for.password123', 2),
('Dr. Carol Lee', 'carol@university.edu', '$2b$10$example.hash.for.password123', 3);

-- Sample student data (passwords are hashed using bcrypt)
-- Password for all sample students is 'student123' hashed
INSERT INTO students (name, email, password, course_id, marks, status) VALUES 
('John Doe', 'john.doe@student.edu', '$2b$10$example.hash.for.student123', 1, 85, 'Pending'),
('Jane Smith', 'jane.smith@student.edu', '$2b$10$example.hash.for.student123', 2, 92, 'Approved'),
('Mike Johnson', 'mike.johnson@student.edu', '$2b$10$example.hash.for.student123', 3, 78, 'Pending'),
('Emily Davis', 'emily.davis@student.edu', '$2b$10$example.hash.for.student123', 4, 88, 'Rejected');