class Student {
    constructor(fname, lname, classes, history = [], misc = '') {
        this.fname = fname;
        this.lname = lname;
        this.classes = classes;
        this.history = history;
        this.misc = misc;
    }
}

class Teacher {
    constructor(fname, lname, classes, history = []) {
        this.fname = fname;
        this.lname = lname;
        this.classes = classes;
        this.history = history;
    }
}

class Madrich {
    constructor(fname, lname, classes, history = []) {
        this.fname = fname;
        this.lname = lname;
        this.classes = classes;
        this.history = history;
    }
}

class Class {
    constructor(name,teacher, students = [], history = [], madrich = []) {
        this.teacher = teacher;
        this.students = students;
        this.history = history;
        this.madrich = madrich;
        this.name=name;
    }

    takeAttendance(presentStudents, presentMadrichim) {
        const date = new Date();
        const attendanceRecord = {
            date: date.toLocaleDateString(),
            time: date.toLocaleTimeString(),
            presentStudents: presentStudents.map(student => `${student.fname} ${student.lname}`),
            presentMadrichim: presentMadrichim.map(madric => `${madric.fname} ${madric.lname}`)
        };

        this.history.push(attendanceRecord);
        return attendanceRecord;
    }
}

export { Class, Student, Teacher, Madrich };
