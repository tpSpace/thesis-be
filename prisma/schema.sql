-- Enum for AssignmentStatus
CREATE TYPE assignmentstatus AS ENUM (
    'ASSIGNED',
    'SUBMITTED',
    'GENERATED',
    'QUESTIONED',
    'ANSWERED',
    'FINALIZED',
    'CLOSED'
);
-- Table: role
CREATE TABLE role (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT
);
-- Table: t_user
CREATE TABLE t_user (
    id SERIAL PRIMARY KEY,
    username VARCHAR NOT NULL UNIQUE,
    password VARCHAR NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    phone VARCHAR NOT NULL,
    about TEXT,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    refresh_token UUID UNIQUE,
    last_login DATE DEFAULT CURRENT_DATE,
    create_on DATE DEFAULT CURRENT_DATE,
    school_id VARCHAR UNIQUE,
    role_id INTEGER NOT NULL,
    FOREIGN KEY (role_id) REFERENCES role(id)
);
-- Table: course
CREATE TABLE course (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL UNIQUE,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    instructed_by INTEGER NOT NULL,
    FOREIGN KEY (instructed_by) REFERENCES t_user(id)
);
-- Table: t_group
CREATE TABLE t_group (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL UNIQUE,
    course_id INTEGER NOT NULL,
    FOREIGN KEY (course_id) REFERENCES course(id)
);
-- Table: student_group
CREATE TABLE student_group (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    FOREIGN KEY (group_id) REFERENCES t_group(id),
    FOREIGN KEY (student_id) REFERENCES t_user(id)
);
-- Table: student_course
CREATE TABLE student_course (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    FOREIGN KEY (course_id) REFERENCES course(id),
    FOREIGN KEY (student_id) REFERENCES t_user(id)
);
-- Table: assignment
CREATE TABLE assignment (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL UNIQUE,
    description TEXT NOT NULL,
    due_date DATE NOT NULL,
    course_id INTEGER NOT NULL,
    FOREIGN KEY (course_id) REFERENCES course(id)
);
-- Table: student_assignment
CREATE TABLE student_assignment (
    id SERIAL PRIMARY KEY,
    url TEXT,
    status assignmentstatus NOT NULL DEFAULT 'ASSIGNED',
    submit_at DATE,
    assigned_for INTEGER NOT NULL,
    assigned_by INTEGER NOT NULL,
    assignment_id INTEGER NOT NULL,
    FOREIGN KEY (assigned_for) REFERENCES t_group(id),
    FOREIGN KEY (assigned_by) REFERENCES t_user(id),
    FOREIGN KEY (assignment_id) REFERENCES assignment(id)
);
-- Table: assignment_question
CREATE TABLE assignment_question (
    id SERIAL PRIMARY KEY,
    generated_text TEXT NOT NULL,
    overwrite_text TEXT,
    help_text TEXT,
    level VARCHAR,
    scope VARCHAR,
    is_assigned BOOLEAN NOT NULL DEFAULT FALSE,
    modified_on DATE DEFAULT CURRENT_DATE,
    modified_by INTEGER,
    student_assignment_id INTEGER NOT NULL,
    FOREIGN KEY (modified_by) REFERENCES t_user(id),
    FOREIGN KEY (student_assignment_id) REFERENCES student_assignment(id)
);
-- Table: localization_report
CREATE TABLE localization_report (
    id SERIAL PRIMARY KEY,
    location TEXT NOT NULL,
    line_number INTEGER NOT NULL,
    score FLOAT NOT NULL,
    student_assignment_id INTEGER NOT NULL,
    FOREIGN KEY (student_assignment_id) REFERENCES student_assignment(id)
);
-- Table: executed_test
CREATE TABLE executed_test (
    id SERIAL PRIMARY KEY,
    executed_test TEXT NOT NULL,
    is_failing BOOLEAN NOT NULL,
    student_assignment_id INTEGER NOT NULL,
    FOREIGN KEY (student_assignment_id) REFERENCES student_assignment(id)
);
-- Table: analyzer
CREATE TABLE analyzer (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    analyzer_base64 TEXT,
    analyzer_file_name VARCHAR,
    analyzer_file_extension VARCHAR,
    analyzer_file_size VARCHAR,
    directory_url TEXT,
    developer_id INTEGER NOT NULL,
    FOREIGN KEY (developer_id) REFERENCES t_user(id)
);
-- Table: question_comment
CREATE TABLE question_comment (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    created_on DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by INTEGER NOT NULL,
    parent_id INTEGER,
    assignment_question_id INTEGER NOT NULL,
    FOREIGN KEY (created_by) REFERENCES t_user(id),
    FOREIGN KEY (parent_id) REFERENCES question_comment(id),
    FOREIGN KEY (assignment_question_id) REFERENCES assignment_question(id)
);
-- Table: assignment_attachment
CREATE TABLE assignment_attachment (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    extension VARCHAR NOT NULL,
    size VARCHAR NOT NULL,
    attachment_base64 TEXT NOT NULL,
    assignment_id INTEGER NOT NULL,
    FOREIGN KEY (assignment_id) REFERENCES assignment(id)
);