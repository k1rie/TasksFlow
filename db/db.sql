-- Base de datos para Smartclass
-- Sistema de gestión de aulas, estudiantes, tareas y asistencias

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS smartclass;
USE smartclass;

-- Tabla de usuarios (profesores)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de aulas/grupos
CREATE TABLE classrooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    especialidad VARCHAR(255) NOT NULL,
    grado VARCHAR(100) NOT NULL,
    grupo VARCHAR(100) NOT NULL,
    alumnos INT DEFAULT 0,
    user VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user) REFERENCES users(email) ON DELETE CASCADE
);

-- Tabla de estudiantes
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    correo VARCHAR(255),
    especialidad VARCHAR(255) NOT NULL,
    grado VARCHAR(100) NOT NULL,
    grupo VARCHAR(100) NOT NULL,
    user VARCHAR(255) NOT NULL,
    groupid INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user) REFERENCES users(email) ON DELETE CASCADE,
    FOREIGN KEY (groupid) REFERENCES classrooms(id) ON DELETE CASCADE
);

-- Tabla de tareas/actividades
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    rate DECIMAL(5,2) NOT NULL,
    grade VARCHAR(100) NOT NULL,
    groupTask VARCHAR(100) NOT NULL,
    area VARCHAR(255) NOT NULL,
    user VARCHAR(255) NOT NULL,
    groupid INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user) REFERENCES users(email) ON DELETE CASCADE,
    FOREIGN KEY (groupid) REFERENCES classrooms(id) ON DELETE CASCADE
);

-- Tabla de calificaciones de estudiantes por tarea
CREATE TABLE tasks_students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    rate DECIMAL(5,2) NOT NULL,
    final_rate DECIMAL(5,2) DEFAULT 0,
    task_for INT NOT NULL,
    user VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (task_for) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (user) REFERENCES users(email) ON DELETE CASCADE
);

-- Tabla de asistencias
CREATE TABLE attendence (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    lastname VARCHAR(255) NOT NULL,
    grade VARCHAR(100) NOT NULL,
    groupStudent VARCHAR(100) NOT NULL,
    area VARCHAR(255) NOT NULL,
    user VARCHAR(255) NOT NULL,
    attendance TINYINT(1) DEFAULT 0,
    ispermission TINYINT(1) DEFAULT 0,
    reason TEXT,
    studentid INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user) REFERENCES users(email) ON DELETE CASCADE,
    FOREIGN KEY (studentid) REFERENCES students(id) ON DELETE CASCADE
);

-- Tabla de permisos (si se necesita separada de attendence)
CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    studentid INT NOT NULL,
    user VARCHAR(255) NOT NULL,
    reason TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studentid) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (user) REFERENCES users(email) ON DELETE CASCADE
);

-- Tabla de datos faciales para reconocimiento
CREATE TABLE facial_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    faiss_index_position INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Índices para optimizar consultas
CREATE INDEX idx_classrooms_user ON classrooms(user);
CREATE INDEX idx_students_user ON students(user);
CREATE INDEX idx_students_groupid ON students(groupid);
CREATE INDEX idx_tasks_user ON tasks(user);
CREATE INDEX idx_tasks_groupid ON tasks(groupid);
CREATE INDEX idx_tasks_students_user ON tasks_students(user);
CREATE INDEX idx_tasks_students_task_for ON tasks_students(task_for);
CREATE INDEX idx_attendence_user ON attendence(user);
CREATE INDEX idx_attendence_studentid ON attendence(studentid);
CREATE INDEX idx_attendence_created_at ON attendence(created_at);
CREATE INDEX idx_permissions_user ON permissions(user);
CREATE INDEX idx_permissions_studentid ON permissions(studentid);
CREATE INDEX idx_facial_data_student_id ON facial_data(student_id);

-- Insertar usuario de ejemplo (opcional)
-- INSERT INTO users (email, password) VALUES ('admin@smartclass.com', 'password123');
