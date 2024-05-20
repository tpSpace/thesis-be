async function getUserById(parent, args, context, info) {
    const { id } = args;
    const user = await context.prisma.user.findUnique({
        where: {
            id: id
        },
        include: {
            role: true
        }
    })

    if (user === null) throw new Error('User does not exists!')

    const returnUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        about: user.about,
        role: {
            id: user.role.id,
            name: user.role.name
        }
    };
    return returnUser;
}

async function allUser(parent, args, context, info) {
    const { filterInput } = args;

    const users = await context.prisma.user.findMany({
        orderBy: {
            username: 'asc'
        },
        include: {
            role: true
        }
    });

    if (users === null) return [];

    let returnUsers = users.map(user => {
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            about: user.about,
            role: {
                id: user.role.id,
                name: user.role.name
            }
        }
    });

    if (!filterInput) {
        return returnUsers;
    }

    if (filterInput.roleId !== null) {
        returnUsers = returnUsers.filter(user => user.role.id == filterInput.roleId);
    }

    return returnUsers;
}

async function getCourseById(parent, args, context, info) {
    const { id } = args;
    const course = await context.prisma.course.findUnique({
        where: {
            id: id
        },
        include: {
            instructor: true,
        }
    });

    if (course === null) throw Error("Course does not exist.");

    const studentCourses = await context.prisma.studentCourse.findMany({
        where: {
            courseId: id
        },
        include: {
            student: true
        }
    });

    const returnStudents = studentCourses === null
        ? []
        : studentCourses.map(studentCourse => {
            return { ...studentCourse.student }
        });

    const groups = await context.prisma.group.findMany({
        where: {
            courseId: id
        },
        select: {
            id: true,
            name: true,
            studentGroup: {
                select: {
                    student: true
                }
            }
        }
    });


    const returnGroups = groups === null
        ? []
        : groups.map(group => {
            const returnStudents = group.studentGroup.map(itemStudentGroup => {
                return {
                    ...itemStudentGroup.student,
                }
            });

            return {
                id: group.id,
                name: group.name,
                students: returnStudents
            }
        });

    return {
        id: course.id,
        name: course.name,
        startDate: course.startDate,
        endDate: course.endDate,
        description: course.description,
        instructor: { ...course.instructor },
        students: returnStudents,
        groups: returnGroups
    }
}

async function allCourse(parent, args, context, info) {
    const { filterInput } = args;

    const courses = await context.prisma.course.findMany({
        orderBy: {
            name: 'asc',
        },
        include: {
            instructor: true,
        }
    });

    if (courses === null) return [];

    let returnCourses = courses.map(course => {
        return {
            id: course.id,
            name: course.name,
            startDate: course.startDate,
            endDate: course.endDate,
            description: course.description,
            instructor: {
                id: course.instructor.id,
                username: course.instructor.username,
                email: course.instructor.email,
                firstName: course.instructor.firstName,
                lastName: course.instructor.lastName,
                phone: course.instructor.phone,
            }
        }
    });

    if (!filterInput) {
        return returnCourses;
    }

    if (filterInput.instructedBy !== null) {
        returnCourses = returnCourses.filter(course => course.instructor.id == filterInput.instructedBy);
    }

    return returnCourses;
}

async function getAssignmentById(parent, args, context, info) {
    const { id } = args;

    const assignment = await context.prisma.assignment.findUnique({
        where: {
            id: id
        },
        include: {
            assignmentAttachment: true,
            course: {
                include: {
                    group: true,
                    instructor: true
                }
            }
        }
    });

    if (assignment === null) throw Error("Assignment does not exist.");

    const studentAssignments = await context.prisma.studentAssignment.findMany({
        where: {
            assignmentId: id
        },
        select: {
            id: true,
            status: true,
            group: {
                select: {
                    id: true,
                    name: true,
                    studentGroup: {
                        select: {
                            student: true
                        }
                    }
                }
            }
        }
    });

    const returnStudentAssignments = studentAssignments === null
        ? []
        : studentAssignments.map(studentAssignment => {
            const returnStudents = studentAssignment.group.studentGroup.map(itemStudentGroup => {
                return {
                    ...itemStudentGroup.student,
                }
            });

            return {
                id: studentAssignment.id,
                status: studentAssignment.status,
                assignedFor: {
                    id: studentAssignment.group.id,
                    name: studentAssignment.group.name,
                    students: returnStudents
                }
            }
        });

    return {
        id: assignment.id,
        name: assignment.name,
        description: assignment.description,
        dueDate: assignment.dueDate,
        attachments: assignment.assignmentAttachment,
        course: {
            id: assignment.course.id,
            name: assignment.course.name,
            startDate: assignment.course.startDate,
            endDate: assignment.course.endDate,
            description: assignment.course.description,
            instructor: {
                id: assignment.course.instructor.id,
                username: assignment.course.instructor.username,
                email: assignment.course.instructor.email,
                firstName: assignment.course.instructor.firstName,
                lastName: assignment.course.instructor.lastName,
                phone: assignment.course.instructor.phone,
            }
        },
        groups: assignment.course.group,
        studentAssignments: returnStudentAssignments
    }
}

async function allAssignment(parent, args, context, info) {
    const { filterInput } = args;

    const assignments = await context.prisma.assignment.findMany({
        orderBy: {
            name: 'asc'
        },
        include: {
            course: {
                include: {
                    instructor: true
                }
            }
        }
    });

    if (assignments === null) return [];

    let returnAssignments = assignments.map(assignment => {
        return {
            id: assignment.id,
            name: assignment.name,
            description: assignment.description,
            dueDate: assignment.dueDate,
            course: {
                id: assignment.course.id,
                name: assignment.course.name,
                startDate: assignment.course.startDate,
                endDate: assignment.course.endDate,
                description: assignment.course.description,
                instructor: {
                    id: assignment.course.instructor.id,
                    username: assignment.course.instructor.username,
                    email: assignment.course.instructor.email,
                    firstName: assignment.course.instructor.firstName,
                    lastName: assignment.course.instructor.lastName,
                    phone: assignment.course.instructor.phone,
                }
            }
        }
    });

    if (!filterInput) {
        return returnAssignments;
    }

    if (filterInput.assignmentName !== null) {
        returnAssignments = returnAssignments.filter(assignment => assignment.name.indexOf(filterInput.assignmentName) !== -1);
    }

    if (filterInput.courseName !== null) {
        returnAssignments = returnAssignments.filter(assignment => assignment.course.name.indexOf(filterInput.courseName) !== -1);
    }

    if (filterInput.dueDate !== null) {
        returnAssignments = returnAssignments.filter(assignment => assignment.dueDate >= filterInput.dueDate);
    }

    return returnAssignments;
}

async function getStudentAssignmentById(parent, args, context, info) {
    const { id } = args;

    const studentAssignment = await context.prisma.studentAssignment.findUnique({
        where: {
            id: id,
        },
        include: {
            instructor: true,
            assignment: {
                include: {
                    assignmentAttachment: true,
                    course: {
                        include: {
                            instructor: true
                        }
                    }
                }
            }
        }
    });

    if (studentAssignment === null) throw Error("Assignment does not exist.");

    return {
        id: studentAssignment.id,
        url: studentAssignment.url,
        status: studentAssignment.status,
        submitAt: studentAssignment.submitAt,
        assignedBy: { ...studentAssignment.instructor },
        assignment: {
            id: studentAssignment.assignment.id,
            name: studentAssignment.assignment.name,
            description: studentAssignment.assignment.description,
            dueDate: studentAssignment.assignment.dueDate,
            course: studentAssignment.assignment.course,
            attachments: studentAssignment.assignment.assignmentAttachment
        }
    }
}

async function allStudentAssignment(parent, args, context, info) {
    const { filterInput } = args;

    const studentAssignments = await context.prisma.studentAssignment.findMany({
        orderBy: {
            status: 'asc'
        },
        include: {
            instructor: true,
            assignment: {
                include: {
                    course: true
                }
            }
        }
    }
    );

    if (studentAssignments === null) return [];

    let returnStudentAssignments = studentAssignments.map(item => {
        return {
            id: item.id,
            url: item.url,
            status: item.status,
            submitAt: item.submitAt,
            assignedBy: { ...item.instructor },
            assignment: {
                id: item.assignment.id,
                name: item.assignment.name,
                description: item.assignment.description,
                dueDate: item.assignment.dueDate,
                course: { ...item.assignment.course }
            }
        }
    });

    if (!filterInput) {
        return returnStudentAssignments;
    }

    if (filterInput.assignmentName !== null) {
        returnStudentAssignments = returnStudentAssignments.filter(
            studentAssignment => studentAssignment.assignment.name.indexOf(filterInput.assignmentName) !== -1
        );
    }

    if (filterInput.courseName !== null) {
        returnStudentAssignments = returnStudentAssignments.filter(
            studentAssignment => studentAssignment.assignment.course.name.indexOf(filterInput.courseName) !== -1
        );
    }

    if (filterInput.dueDate !== null) {
        returnStudentAssignments = returnStudentAssignments.filter(
            studentAssignment => studentAssignment.assignment.dueDate >= filterInput.dueDate
        );
    }

    return returnStudentAssignments;
}

async function allAssignmentQuestion(parent, args, context, info) {
    const { id } = args;

    const assignmentQuestions = await context.prisma.assignmentQuestion.findMany({
        where: {
            studentAssignmentId: id
        },
        include: {
            studentAssignment: true,
            questionComment: {
                include: {
                    creator: true
                }
            }
        }
    });

    if (assignmentQuestions === null) return [];

    return assignmentQuestions;
}


async function allAnalyzer(parent, args, context, info) {
    const analyzers = await context.prisma.analyzer.findMany({
        orderBy: {
            name: 'asc'
        },
        include: {
            developer: true
        }
    });


    if (analyzers === null) return [];

    return analyzers;
}

async function getAnalyzerById(parent, args, context, info) {
    const { id } = args;

    const analyzer = await context.prisma.analyzer.findUnique({
        where: {
            id: id
        },
        include: {
            developer: true
        }
    });

    if (analyzer === null) return null;
    return analyzer;
}

async function getAllLocalizationReport(parent, args, context, info){
    const reports = await context.prisma.localizationReport.findMany();
    return reports;
}

async function getLocalizationReportById(parent, args, context, info){
    const {id} = args;
    
    const report = await context.prisma.localizationReport.findUnique({
        where: {
            id: id
        },
    });

    if (report === null) return null;
    return report 
}

async function getAllLocalizationReportsByAssignmentId(parent, args, context, info){
    const {studentAssignmentId} = args;

    const reports = await context.prisma.localizationReport.findMany({
        where:{
            studentAssignmentId: studentAssignmentId
        },
    });
    if (reports === null) return null;
    return reports
}

module.exports = {
    getUserById,
    allUser,
    getCourseById,
    allCourse,
    allAssignment,
    allStudentAssignment,
    getAssignmentById,
    getStudentAssignmentById,
    allAssignmentQuestion,
    allAnalyzer,
    getAnalyzerById,
    getAllLocalizationReport,
    getLocalizationReportById,
    getAllLocalizationReportsByAssignmentId
};