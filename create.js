import { Class, Student, Teacher, Madrich } from './script.js';

function parseNames(nameString) {
    // Handle empty or undefined input
    if (!nameString) return [];

    // Split names, trim whitespace, and filter out empty entries
    return nameString.split(',')
        .map(name => name.trim())
        .filter(name => name !== '')
        .map(name => {
            // Split each name into first and last name
            const parts = name.split(' ');
            return {
                firstName: parts[0] || '',
                lastName: parts.slice(1).join(' ') || ''
            };
        });
}
function sanitizeData(data) {
    // Remove single quotes, semicolons, and parentheses to prevent execution of code like console.log()
    return data.replace(/[';()]/g, "");
}
async function createClass() {
    // Get form inputs
    const nClass = sanitizeData(document.getElementById("newClass").value.trim())
    const nStudentsInput =sanitizeData( document.getElementById("students").value || '')
    const nTeacherInput = sanitizeData(document.getElementById("teacher").value.trim())
    const nMadrichInput = sanitizeData(document.getElementById("madrich").value || '')

    // Validate inputs
    if (!nClass) {
        alert('Please enter a class name');
        return;
    }

    // Parse names
    const parsedStudents = parseNames(nStudentsInput);
    const parsedMadrichim = parseNames(nMadrichInput);

    // Validate teacher input
    if (!nTeacherInput) {
        alert('Please enter a teacher name');
        return;
    }
    const teacherParts = nTeacherInput.split(' ');
    const teacherData = {
        firstName: teacherParts[0] || '',
        lastName: teacherParts.slice(1).join(' ') || ''
    };

    // Create students
    const students = parsedStudents.map(student => 
        new Student(student.firstName, student.lastName, [])
    );

    // Create teacher
    const teacher = new Teacher(teacherData.firstName, teacherData.lastName, []);

    // Create madrichim
    const madrichim = parsedMadrichim.map(madrich => 
        new Madrich(madrich.firstName, madrich.lastName, [])
    );

    // Create new class
    const newClass = new Class(nClass, teacher, students, [], madrichim);

    try {
        // Send class to server
        const response = await fetch('/create-class', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: newClass.name,
                teacher: {
                    firstName: newClass.teacher.fname,
                    lastName: newClass.teacher.lname
                },
                students: newClass.students.map(s => ({
                    firstName: s.fname,
                    lastName: s.lname
                })),
                madrichim: newClass.madrich.map(m => ({
                    firstName: m.fname,
                    lastName: m.lname
                })),
                attendanceHistory: [] // Initialize empty attendance history
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const result = await response.json();
        console.log('Class created:', result);

        // Clear form inputs
        document.getElementById("newClass").value = '';
        document.getElementById("students").value = '';
        document.getElementById("teacher").value = '';
        document.getElementById("madrich").value = '';

        alert('Class created successfully!');
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to create class: ' + error.message);
    }
}

// Attach createClass to the global window object
window.createClass = createClass;