import { Class, Student, Teacher, Madrich } from './script.js';

// Function to fetch all classes data
async function fetchClassesData() {
    try {
        const response = await fetch('/application/database.json');
        const data = await response.json();
        return data.classes;
    } catch (error) {
        console.error('Error fetching classes:', error);
        return [];
    }
}

// Calculate absence statistics for a class
function calculateAbsenceStats(attendanceHistory) {
    const totalSessions = attendanceHistory.length;
    const absenceCount = {};
    
    // Get current session (today's) absences
    const today = new Date().toLocaleDateString();
    const currentSessionAbsences = attendanceHistory.length > 0 ? 
        attendanceHistory[attendanceHistory.length - 1].attendance.filter(record => !record.present).length : 0;
    
    attendanceHistory.forEach(session => {
        session.attendance.forEach(record => {
            if (!record.present) {
                absenceCount[record.studentName] = (absenceCount[record.studentName] || 0) + 1;
            }
        });
    });
    
    const totalAbsences = Object.values(absenceCount).reduce((sum, count) => sum + count, 0);
    
    return {
        totalSessions,
        totalAbsences,
        absenceCount,
        currentSessionAbsences
    };
}

// Create and populate the classes summary table
async function displayClassesSummary() {
    const classes = await fetchClassesData();
    const tableContainer = document.getElementById('classesTable');
    
    const table = document.createElement('table');
    table.className = 'admin-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Class Name</th>
                <th>Teacher</th>
                <th>Total Students</th>
                <th>Total Sessions</th>
                <th>Total Absences</th>
                <th>Absences This Session</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;
    
    classes.forEach(classData => {
        const stats = calculateAbsenceStats(classData.attendanceHistory);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${classData.name}</td>
            <td>${classData.teacher.firstName} ${classData.teacher.lastName}</td>
            <td>${classData.students.length}</td>
            <td>${stats.totalSessions}</td>
            <td>${stats.totalAbsences}</td>
            <td>${stats.currentSessionAbsences}</td>
        `;
        table.querySelector('tbody').appendChild(row);
    });
    
    tableContainer.appendChild(table);
    
    // Populate class select dropdown
    const classSelect = document.getElementById('classSelect');
    classSelect.innerHTML = '<option value="">Select a class</option>';
    classes.forEach(classData => {
        const option = document.createElement('option');
        option.value = classData.id;
        option.textContent = classData.name;
        classSelect.appendChild(option);
    });
}

// Generate detailed absence report for a specific class
window.generateAbsenceReport = async function() {
    const classId = document.getElementById('classSelect').value;
    if (!classId) {
        alert('Please select a class');
        return;
    }
    
    const classes = await fetchClassesData();
    const selectedClass = classes.find(c => c.id === classId);
    
    if (!selectedClass) {
        alert('Class not found');
        return;
    }
    
    const stats = calculateAbsenceStats(selectedClass.attendanceHistory);
    const reportContainer = document.getElementById('absenceReport');
    
    let reportHTML = `
        <h3>Absence Report for ${selectedClass.name}</h3>
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Student Name</th>
                    <th>Total Absences</th>
                    <th>Absence Rate</th>
                    <th>Dates Absent</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    selectedClass.students.forEach(student => {
        const studentName = `${student.firstName} ${student.lastName}`;
        const absences = stats.absenceCount[studentName] || 0;
        const absenceRate = ((absences / stats.totalSessions) * 100).toFixed(1);
        
        // Get dates of absences
        const absentDates = selectedClass.attendanceHistory
            .filter(session => {
                const studentRecord = session.attendance.find(record => record.studentName === studentName);
                return studentRecord && !studentRecord.present;
            })
            .map(session => new Date(session.date).toLocaleDateString())
            .join(', ');
        
        reportHTML += `
            <tr>
                <td>${studentName}</td>
                <td>${absences}</td>
                <td>${absenceRate}%</td>
                <td>${absentDates}</td>
            </tr>
        `;
    });
    
    reportHTML += `
            </tbody>
        </table>
    `;
    
    reportContainer.innerHTML = reportHTML;
};

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    displayClassesSummary();
});