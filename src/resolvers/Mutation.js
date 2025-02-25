const bcrypt = require("bcryptjs");
const path = require("path");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const { v4: uuid } = require("uuid");
const {
  REFRESH_TOKEN_EXPIRY,
  JWT_EXPIRY,
  verifyUser,
  verifyRole,
} = require("../utils/auth");
const { APP_SECRET } = require("../utils/jwt");

async function signUp(parent, args, context, info) {
  let userName = await context.prisma.user.findUnique({
    where: {
      username: args.userInput.username,
    },
  });

  if (userName) throw new Error("Username already exists.");

  let userEmail = await context.prisma.user.findUnique({
    where: {
      email: args.userInput.email,
    },
  });

  if (userEmail) throw new Error("Email already registered.");

  const userPassword = await bcrypt.hash(args.userInput.password, 10);

  let user = await context.prisma.user.create({
    data: {
      username: args.userInput.username,
      password: userPassword,
      email: args.userInput.email,
      phone: args.userInput.phone,
      firstName: args.userInput.firstName,
      lastName: args.userInput.lastName,
      createOn: new Date(),
      roleId: 3,
    },
    include: {
      role: true,
    },
  });
  console.log(user);

  const returnUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    about: user.about,
    role: user.role,
  };

  let refreshJWTToken = uuid();

  await context.prisma.user.update({
    data: {
      refreshToken: refreshJWTToken,
    },
    where: {
      id: user.id,
    },
  });

  context.res.cookie("refresh_jwt_token", refreshJWTToken, {
    httpOnly: true,
    maxAge: REFRESH_TOKEN_EXPIRY * 60 * 1000,
    secure: true,
    sameSite: "None",
  });

  const returnToken = jwt.sign(
    {
      id: user.id,
      roleId: user.roleId,
    },
    APP_SECRET,
    {
      expiresIn: JWT_EXPIRY * 60 * 1000,
    }
  );

  return {
    token: returnToken,
    user: returnUser,
  };
}

async function logIn(parent, args, context, info) {
  const user = await context.prisma.user.findUnique({
    where: {
      username: args.userInput.username,
    },
    include: {
      role: true,
    },
  });

  if (user === null) throw new Error("User is not exist.");

  const validPassword = await bcrypt.compare(
    args.userInput.password,
    user.password
  );
  if (!validPassword) throw new Error("Invalid password.");

  const returnUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    about: user.about,
    role: user.role,
  };

  let refreshJWTToken = uuid();

  await context.prisma.user.update({
    data: {
      refreshToken: refreshJWTToken,
      lastLogin: new Date(),
    },
    where: {
      id: user.id,
    },
  });

  context.res.cookie("refresh_jwt_token", refreshJWTToken, {
    httpOnly: true,
    maxAge: REFRESH_TOKEN_EXPIRY * 60 * 1000,
    secure: true,
    sameSite: "None",
  });

  const returnToken = jwt.sign(
    {
      id: user.id,
      roleId: user.roleId,
    },
    APP_SECRET,
    {
      expiresIn: JWT_EXPIRY * 60 * 1000,
    }
  );

  return {
    token: returnToken,
    user: returnUser,
  };
}

async function logOut(parent, args, context, info) {
  if (context.userId === null) throw new Error("Not currently logged in!");

  const user = await context.prisma.user.update({
    data: {
      refreshToken: null,
    },
    where: {
      id: context.userId,
    },
  });

  if (user) {
    context.res.cookie("refresh_jwt_token", "", {
      httpOnly: true,
      maxAge: 0,
      secure: true,
      sameSite: "None",
    });
    return true;
  }

  return false;
}

async function refreshJWT(parent, args, context, info) {
  cookies = context.req.cookies;
  if (!cookies) throw new Error("Cookies not found! Please login!");

  refreshJWTToken = context.req.cookies["refresh_jwt_token"];
  if (!refreshJWTToken)
    throw new Error("No refresh token found! Please login!");

  const user = await context.prisma.user.findFirst({
    where: {
      refreshToken: refreshJWTToken,
    },
    include: {
      role: true,
    },
  });

  if (user === null)
    throw new Error("Refresh token expired or does not exists! Please login!");

  refreshJWTToken = uuid();

  await context.prisma.user.update({
    data: {
      refreshToken: refreshJWTToken,
    },
    where: {
      id: user.id,
    },
  });
  context.res.cookie("refresh_jwt_token", refreshJWTToken, {
    httpOnly: true,
    maxAge: REFRESH_TOKEN_EXPIRY * 60 * 1000,
    secure: true,
    sameSite: "None",
  });

  const jwtToken = jwt.sign(
    {
      id: user.id,
      roleId: user.role.id,
    },
    APP_SECRET,
    {
      expiresIn: JWT_EXPIRY * 60 * 1000,
    }
  );

  const returnUser = {
    id: user.id,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    about: user.about,
    role: user.role,
  };

  return {
    token: jwtToken,
    user: returnUser,
  };
}

async function changePassword(parent, args, context, info) {
  const userPassword = await context.prisma.user.findUnique({
    where: {
      id: parseInt(context.userId),
    },
  });

  const validPassword = await bcrypt.compare(
    args.oldPassword,
    userPassword.password
  );
  if (!validPassword) throw new Error("Invalid password.");

  const newPassword = await bcrypt.hash(args.newPassword, 10);
  const updatedUser = await context.prisma.user.update({
    data: {
      password: newPassword,
    },
    where: {
      id: context.userId,
    },
  });

  if (updatedUser) return true;
  return false;
}

async function upsertUser(parent, args, context, info) {
  const { id, username, firstName, lastName, email, phone, about, roleId } =
    args.userInput;

  if (id == 0) {
    if (!verifyRole(context.roleId, process.env.ROLE_ADMIN_CODE)) {
      throw new Error("User does not have permission.");
    }

    let userName = await context.prisma.user.findUnique({
      where: {
        username: args.userInput.username,
      },
    });

    if (userName) throw new Error("Username already exists.");

    let userEmail = await context.prisma.user.findUnique({
      where: {
        email: args.userInput.email,
      },
    });

    if (userEmail) throw new Error("Email already registered.");
  } else {
    if (
      !verifyUser(context.userId, id) &&
      !verifyRole(context.roleId, process.env.ROLE_ADMIN_CODE)
    ) {
      throw Error("User does not have permission.");
    }
  }

  const userPassword = await bcrypt.hash(username, 10);

  const user = await context.prisma.user.upsert({
    where: {
      id: id,
    },
    update: {
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: phone,
      about: about,
      roleId: roleId,
    },
    create: {
      username: username,
      password: userPassword,
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: phone,
      about: about,
      createOn: new Date(),
      roleId: roleId,
    },
  });

  return { ...user };
}

async function upsertCourse(parent, args, context, info) {
  const { id, name, description, startDate, endDate, instructedBy } =
    args.courseInput;

  if (!verifyRole(context.roleId, process.env.ROLE_ADMIN_CODE)) {
    throw Error("User does not have permission.");
  }

  const instructorRole = await context.prisma.user.findUnique({
    include: {
      role: true,
    },
    where: {
      id: args.courseInput.instructedBy,
    },
  });

  if (!verifyRole(instructorRole.role.id, process.env.ROLE_TEACHER_CODE)) {
    throw Error("User is not a teacher!");
  }

  if (id === 0) {
    const courseName = await context.prisma.course.findUnique({
      select: {
        name: true,
      },
      where: {
        name: args.courseInput.name,
      },
    });

    if (courseName) {
      throw Error("Course name exists.");
    }
  }

  const course = await context.prisma.course.upsert({
    where: {
      id: id,
    },
    update: {
      name: name,
      description: description,
      startDate: startDate,
      endDate: endDate,
      instructedBy: instructedBy,
    },
    create: {
      name: name,
      description: description,
      startDate: startDate,
      endDate: endDate,
      instructedBy: instructedBy,
    },
  });

  return { ...course };
}

async function registerCourse(parent, args, context, info) {
  const { studentId, courseId } = args;

  const student = await context.prisma.user.findMany({
    where: {
      id: {
        in: studentId,
      },
      roleId: 3,
    },
    select: {
      id: true,
    },
  });

  if (student.length !== studentId.length)
    throw Error("Some students are not found.");

  const course = await context.prisma.course.findUnique({
    where: {
      id: courseId,
    },
  });

  if (course === null) throw Error("Course does not exist.");

  const item = studentId.map((item) => {
    return {
      studentId: item,
      courseId: courseId,
    };
  });

  const studentCourse = await context.prisma.studentCourse.createMany({
    data: item,
  });

  return !!studentCourse;
}

async function unregisterCourse(parent, args, context, info) {
  const { studentId, courseId } = args;

  const student = await context.prisma.user.findUnique({
    where: {
      id: studentId,
    },
  });

  if (student === null) throw Error("Student does not exist.");

  const course = await context.prisma.course.findUnique({
    where: {
      id: courseId,
    },
  });

  if (course === null) throw Error("Course does not exist.");

  const group = await context.prisma.studentGroup.findUnique({
    where: {
      studentId: studentId,
    },
    select: {
      group: {
        where: {
          courseId: courseId,
        },
        select: {
          id: true,
        },
      },
    },
  });

  console.log(group);

  const studentCourse = context.prisma.studentCourse.delete({
    where: {
      studentId: studentId,
      courseId: courseId,
    },
  });

  return true;
}

async function registerGroup(parent, args, context, info) {
  const { name, studentId, courseId } = args;

  const groupName = await context.prisma.group.findUnique({
    where: {
      name: name,
    },
  });

  if (groupName !== null) throw Error("Group name exists.");

  const student = await context.prisma.user.findMany({
    where: {
      id: {
        in: studentId,
      },
      roleId: 3,
    },
    select: {
      id: true,
    },
  });

  if (student.length !== studentId.length)
    throw Error("Some students are not found.");

  const course = await context.prisma.course.findUnique({
    where: {
      id: courseId,
    },
  });

  if (course === null) throw Error("Course does not exist.");

  const groups = await context.prisma.group.findMany({
    where: {
      courseId: courseId,
    },
    select: {
      id: true,
      name: true,
      studentGroup: {
        select: {
          student: true,
        },
      },
    },
  });

  if (groups !== null) {
    groups.forEach((group) => {
      group.studentGroup.forEach((itemStudentGroup) => {
        if (studentId.includes(itemStudentGroup.student.id)) {
          throw Error(
            `${itemStudentGroup.student.firstName} ${itemStudentGroup.student.lastName} registered for other group.`
          );
        }
      });
    });
  }

  const group = await context.prisma.group.create({
    data: {
      name: name,
      courseId: courseId,
    },
  });

  const item = studentId.map((item) => {
    return {
      studentId: item,
      groupId: group.id,
    };
  });

  const studentGroup = await context.prisma.studentGroup.createMany({
    data: item,
  });

  return !!studentGroup;
}

async function assignAssignment(parent, args, context, info) {
  const { assignmentId, groupId } = args;
  const userId = context.userId;

  const assignment = await context.prisma.assignment.findUnique({
    where: {
      id: assignmentId,
    },
  });

  if (assignment === null) throw Error("Assignment does not exists.");

  const studentAssignments = await context.prisma.studentAssignment.findMany({
    where: {
      assignmentId: assignmentId,
      assignedFor: {
        in: groupId,
      },
    },
  });

  if (studentAssignments.length !== 0) throw Error("Some group is assigned.");

  const item = groupId.map((item) => {
    return {
      assignedFor: item,
      assignedBy: userId,
      assignmentId: assignmentId,
    };
  });

  const assignedAssignment = await context.prisma.studentAssignment.createMany({
    data: item,
  });

  return !!assignedAssignment;
}

async function upsertAssignment(parent, args, context, info) {
  const { id, name, description, courseId, dueDate, attachments } =
    args.assignmentInput;

  const courseInstructor = await context.prisma.course.findUnique({
    select: {
      instructor: {
        select: {
          id: true,
        },
      },
    },
    where: {
      id: courseId,
    },
  });

  if (courseInstructor === null) throw Error("Course does not exist.");

  if (
    !verifyUser(context.userId, courseInstructor.instructor.id) &&
    !verifyRole(context.roleId, process.env.ROLE_ADMIN_CODE)
  )
    throw Error("User does not have permission.");

  const assignment = await context.prisma.assignment.upsert({
    where: {
      id: id,
    },
    update: {
      name: name,
      description: description,
      dueDate: dueDate,
    },
    create: {
      name: name,
      description: description,
      dueDate: dueDate,
      courseId: courseId,
    },
  });

  if (assignment === null) {
    throw Error("Assignment does not exist.");
  }

  await context.prisma.assignmentAttachment.deleteMany({
    where: {
      assignmentId: assignment.id,
    },
  });

  const item = attachments.map((item) => {
    return {
      name: item.name,
      extension: item.extension,
      size: item.size,
      attachmentBase64: item.attachmentBase64,
      assignmentId: assignment.id,
    };
  });

  const assignmentAttachments =
    await context.prisma.assignmentAttachment.createMany({
      data: item,
    });

  return assignmentAttachments !== null;
}

async function submitAssignment(parent, args, context, info) {
  const { assignmentId, url } = args;
  const { userId } = context;

  const assignmentUser = await context.prisma.studentAssignment.findMany({
    where: {
      id: assignmentId,
    },
    select: {
      group: {
        select: {
          studentGroup: {
            select: {
              studentId: true,
            },
            where: {
              studentId: userId,
            },
          },
        },
      },
    },
  });

  const assignmentSubmit = await context.prisma.studentAssignment.update({
    data: {
      url: url,
      submitAt: new Date(),
      status: "SUBMITTED",
    },
    where: {
      id: assignmentId,
    },
  });

  return assignmentSubmit !== null;
}

async function assignQuestion(parent, args, context, info) {
  const { questionId, overwriteText } = args;
  const { userId } = context;

  const questionAssigned = await context.prisma.assignmentQuestion.update({
    data: {
      overwriteText: overwriteText,
      isAssigned: true,
      modifiedBy: userId,
      modifiedOn: new Date(),
    },
    where: {
      id: questionId,
    },
  });

  return questionAssigned !== null;
}

async function postComment(parent, args, context, info) {
  const { questionId, text } = args;
  const { userId } = context;

  const assignmentComment = await context.prisma.questionComment.create({
    data: {
      text: text,
      createdOn: new Date(),
      createdBy: userId,
      assignmentQuestionId: questionId,
    },
  });

  return assignmentComment !== null;
}

async function upsertAnalyzer(parent, args, context, info) {
  const {
    id,
    name,
    description,
    analyzerBase64,
    analyzerFileName,
    analyzerFileExtension,
    analyzerFileSize,
  } = args.analyzerInput;
  const { userId, roleId } = context;

  if (verifyRole(roleId, process.env.ROLE_STUDENT_CODE_CODE))
    throw Error("User does not have permission.");

  const fileCode = uuid() + ".jar";
  const fileUrl = path.join(__dirname, "../../../backend-files/", fileCode);
  const base64Content = analyzerBase64.split(",").pop();
  const fileBase64 = Buffer.from(base64Content, "base64");

  if (id !== 0) {
    const oldAnalyzer = await context.prisma.analyzer.findUnique({
      where: {
        id: id,
      },
    });
    fs.stat(oldAnalyzer.directoryUrl, (error) => {
      if (error == null) {
        fs.unlink(oldAnalyzer.directoryUrl, (error) => {
          if (!error) {
            fs.writeFile(fileUrl, fileBase64, (error) => {
              if (error) throw Error("Cannot write analyzer.");
            });
          }
        });
      } else if (error.code === "ENOENT") {
        fs.writeFile(fileUrl, fileBase64, (error) => {
          if (error) throw Error("Cannot write analyzer.");
        });
      }
    });
  } else {
    fs.writeFile(fileUrl, fileBase64, (error) => {
      if (error) throw Error("Cannot write analyzer.");
    });
  }

  const analyzer = await context.prisma.analyzer.upsert({
    where: {
      id: id,
    },
    update: {
      description: description,
      analyzerBase64: analyzerBase64,
      analyzerFileName: analyzerFileName,
      analyzerFileExtension: analyzerFileExtension,
      analyzerFileSize: analyzerFileSize,
    },
    create: {
      name: name,
      description: description,
      analyzerBase64: analyzerBase64,
      analyzerFileName: analyzerFileName,
      analyzerFileExtension: analyzerFileExtension,
      analyzerFileSize: analyzerFileSize,
      directoryUrl: fileUrl,
      developerId: userId,
    },
  });

  return analyzer !== null;
}

module.exports = {
  signUp,
  logIn,
  logOut,
  refreshJWT,
  upsertUser,
  changePassword,
  registerCourse,
  upsertCourse,
  registerGroup,
  assignAssignment,
  upsertAssignment,
  submitAssignment,
  assignQuestion,
  postComment,
  upsertAnalyzer,
};
