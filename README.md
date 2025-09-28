# SmartClass - Academic Management System

🏆 **First Place Winner (State and Local Phases) - DGETI 2025 National Prototype Contest** 🏆

---

### 🚀 [View Live Demo](https://smartclass.alphatech-labs.com/)

SmartClass is an **academic management system** designed to simplify and automate administrative tasks for educators. It enables efficient control of grades, **QR-based attendance tracking**, and automatic average calculations, all within an intuitive web platform.

This project was developed as part of the DGETI 2025 National Prototype Contest, where it secured first place at the state and local levels, standing out for its innovation and functionality.

---

## ✨ Core Features

* **👥 Group Creation and Management:**
    * Allows teachers to create and manage multiple student groups or classes.
    * Easy enrollment and management of student rosters, including importing lists from existing groups.
* **📲 QR Code Attendance:**
    * Generates unique, personalized QR codes for each student.
    * Fast scanning system to log attendance efficiently, eliminating manual roll call.
* **📊 Grade Management & Reporting:**
    * Intuitive interface for teachers to record student grades by activity.
    * **Automated Calculation** of grading averages per student and per group.
    * Supports **data export** into multiple standardized formats (CSV).
* **👤 Role-Based Profiles:**
    * Customized user views for Teachers (full control over class management).

---

## 🛠️ Technology Stack

SmartClass is a Full Stack application built with modern technologies:

| Category | Technologies |
| :--- | :--- |
| **Frontend** | `React`, `JavaScript`, `HTML5`, `CSS3`, `Shadcn/ui` (for modern components) |
| **Backend** | `Node.js`, `Express` (for robust API development) |
| **Database** | `MySQL` (for relational data persistence) |
| **Deployment** | `Hostgator`, `Koyeb` |

---

## ⚙️ Installation and Setup

### Prerequisites

You'll need the following installed:

* Node.js (v18+)
* MySQL Server

### Backend Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/tu-usuario/smartclass.git](https://github.com/tu-usuario/smartclass.git)
    cd smartclass/backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure Environment:** Create a `.env` file and set your MySQL connection string and port:
    ```
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=your_password
    DB_NAME=smartclass_db
    PORT=3001
    ```
4.  **Run Server:**
    ```bash
    npm start
    ```

### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd ../frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure API URL:** Ensure the `.env` file points to your backend:
    ```
    VITE_API_URL=http://localhost:3001/api
    ```
4.  **Run Client:**
    ```bash
    npm run dev
