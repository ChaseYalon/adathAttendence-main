const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const url = require('url');


// Function to read the database
async function readDatabase() {
    try {
        const data = await fs.readFile('database.json', 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // Initialize the database with an empty classes array
            const initialData = { classes: [] };
            await fs.writeFile('database.json', JSON.stringify(initialData, null, 2));
            return initialData;
        }
        throw error;
    }
}

// Function to write to the database
async function writeDatabase(data) {
    await fs.writeFile('database.json', JSON.stringify(data, null, 2), 'utf8');
}

// Create HTTP server
const server = http.createServer(async (request, response) => {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
        response.writeHead(204);
        response.end();
        return;
    }

    const parsedUrl = url.parse(request.url, true);

    // Serve static files
    if (request.method === 'GET' && !parsedUrl.pathname.startsWith('/get-class')) {
        let filePath = '.' + parsedUrl.pathname;
        if (filePath === './') filePath = './index.html';

        const extname = path.extname(filePath);
        const mimeTypes = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpg',
            '.gif': 'image/gif'
        };

        const contentType = mimeTypes[extname] || 'application/octet-stream';

        try {
            const content = await fs.readFile(filePath);
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        } catch (error) {
            if (error.code === 'ENOENT') {
                response.writeHead(404, { 'Content-Type': 'text/html' });
                response.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                response.writeHead(500);
                response.end(`Server Error: ${error.code}`, 'utf-8');
            }
        }
    }
    // Handle class creation
    else if (request.method === 'POST' && parsedUrl.pathname === '/create-class') {
        let body = '';

        request.on('data', chunk => {
            body += chunk.toString();
        });

        request.on('end', async () => {
            try {
                const newClass = JSON.parse(body);
                if (!newClass.name) throw new Error('Class name is required');

                const database = await readDatabase();
                newClass.id = Date.now().toString();
                
                // Initialize attendanceHistory array and other class properties
                newClass.attendanceHistory = [];
                
                // Ensure all required properties are present
                newClass.teacher = newClass.teacher || { firstName: '', lastName: '' };
                newClass.students = newClass.students || [];
                newClass.madrichim = newClass.madrichim || [];

                // Ensure classes array is initialized
                if (!Array.isArray(database.classes)) {
                    database.classes = [];
                }

                database.classes.push(newClass);
                await writeDatabase(database);

                response.writeHead(201, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ message: 'Class created successfully', class: newClass }));
            } catch (error) {
                console.error('Class Creation Error:', error);
                response.writeHead(500, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ message: 'Error creating class', error: error.message }));
            }
        });
    }
    // Handle attendance update
// Handle attendance update
else if (request.method === 'POST' && parsedUrl.pathname === '/update-attendance') {
    let body = '';

    request.on('data', chunk => {
        body += chunk.toString();
    });

    request.on('end', async () => {
        try {
            const data = JSON.parse(body);
            console.log('Received attendance data:', data); // Debug log

            if (!data.classId) {
                throw new Error('Class ID is required');
            }

            if (!data.attendance || !Array.isArray(data.attendance)) {
                throw new Error('Invalid attendance data format');
            }

            const database = await readDatabase();
            const classIndex = database.classes.findIndex(cls => cls.id === data.classId);

            if (classIndex === -1) {
                throw new Error('Class not found');
            }

            // Ensure attendanceHistory exists
            if (!database.classes[classIndex].attendanceHistory) {
                database.classes[classIndex].attendanceHistory = [];
            }

            // Format attendance record
            const attendanceRecord = {
                date: new Date().toISOString(),
                attendance: data.attendance.map(entry => ({
                    studentName: entry.studentName || 'Unknown',
                    present: entry.present || false
                }))
            };

            // Add attendance record
            database.classes[classIndex].attendanceHistory.push(attendanceRecord);
            await writeDatabase(database);

            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({
                message: 'Attendance updated successfully',
                attendanceRecord: attendanceRecord
            }));

        } catch (error) {
            console.error('Attendance Update Error:', error);
            response.writeHead(500, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ message: 'Error updating attendance', error: error.message }));
        }
    });
}

    // Get attendance history endpoint
    else if (request.method === 'GET' && parsedUrl.pathname === '/get-attendance-history') {
        try {
            const classId = parsedUrl.query.id;
            
            if (!classId) {
                response.writeHead(400, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ error: 'Class ID is required' }));
                return;
            }

            const database = await readDatabase();
            const classData = database.classes.find(cls => cls.id === classId);

            if (!classData) {
                response.writeHead(404, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ error: 'Class not found' }));
                return;
            }

            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({
                attendanceHistory: classData.attendanceHistory || []
            }));
        } catch (error) {
            console.error('Error fetching attendance history:', error);
            response.writeHead(500, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Internal server error' }));
        }
    }
    // Handle all other routes
    else {
        response.writeHead(404, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ message: 'Not Found' }));
    }
});
var ip='192.168.1.162'
const PORT = 2000;

// Start the server
server.listen(PORT,'0.0.0.0',() => {
    console.log(`Server running at http://${ip}:${PORT}`);
});
