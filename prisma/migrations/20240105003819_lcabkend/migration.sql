-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ASSIGNED', 'SUBMITTED', 'GENERATED', 'QUESTIONED', 'ANSWERED', 'FINALIZED', 'CLOSED');

-- CreateTable
CREATE TABLE "t_user" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "about" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "refresh_token" UUID,
    "last_login" DATE DEFAULT CURRENT_TIMESTAMP,
    "create_on" DATE DEFAULT CURRENT_TIMESTAMP,
    "school_id" TEXT,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "t_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "instructed_by" INTEGER NOT NULL,

    CONSTRAINT "course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_group" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "course_id" INTEGER NOT NULL,

    CONSTRAINT "t_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_group" (
    "id" SERIAL NOT NULL,
    "group_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,

    CONSTRAINT "student_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_course" (
    "id" SERIAL NOT NULL,
    "course_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,

    CONSTRAINT "student_course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "due_date" DATE NOT NULL,
    "course_id" INTEGER NOT NULL,

    CONSTRAINT "assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_assignment" (
    "id" SERIAL NOT NULL,
    "url" TEXT,
    "status" "AssignmentStatus" NOT NULL DEFAULT E'ASSIGNED',
    "submit_at" DATE,
    "assigned_for" INTEGER NOT NULL,
    "assigned_by" INTEGER NOT NULL,
    "assignment_id" INTEGER NOT NULL,

    CONSTRAINT "student_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_question" (
    "id" SERIAL NOT NULL,
    "generated_text" TEXT NOT NULL,
    "overwrite_text" TEXT,
    "help_text" TEXT,
    "is_assigned" BOOLEAN NOT NULL DEFAULT false,
    "modified_on" DATE DEFAULT CURRENT_TIMESTAMP,
    "modified_by" INTEGER,
    "student_assignment_id" INTEGER NOT NULL,

    CONSTRAINT "assignment_question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analyzer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "analyzer_base64" TEXT,
    "analyzer_file_name" TEXT,
    "analyzer_file_extension" TEXT,
    "analyzer_file_size" TEXT,
    "directory_url" TEXT,
    "developer_id" INTEGER NOT NULL,

    CONSTRAINT "analyzer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_comment" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "created_on" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER NOT NULL,
    "parent_id" INTEGER,
    "assignment_question_id" INTEGER NOT NULL,

    CONSTRAINT "question_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_attachment" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "attachment_base64" TEXT NOT NULL,
    "assignment_id" INTEGER NOT NULL,

    CONSTRAINT "assignment_attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_user_username_key" ON "t_user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "t_user_email_key" ON "t_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "t_user_refresh_token_key" ON "t_user"("refresh_token");

-- CreateIndex
CREATE UNIQUE INDEX "t_user_school_id_key" ON "t_user"("school_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_name_key" ON "course"("name");

-- CreateIndex
CREATE UNIQUE INDEX "t_group_name_key" ON "t_group"("name");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_name_key" ON "assignment"("name");

-- AddForeignKey
ALTER TABLE "t_user" ADD CONSTRAINT "t_user_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course" ADD CONSTRAINT "course_instructed_by_fkey" FOREIGN KEY ("instructed_by") REFERENCES "t_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_group" ADD CONSTRAINT "t_group_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_group" ADD CONSTRAINT "student_group_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "t_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_group" ADD CONSTRAINT "student_group_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "t_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_course" ADD CONSTRAINT "student_course_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "t_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_course" ADD CONSTRAINT "student_course_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_assignment" ADD CONSTRAINT "student_assignment_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "t_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_assignment" ADD CONSTRAINT "student_assignment_assigned_for_fkey" FOREIGN KEY ("assigned_for") REFERENCES "t_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_assignment" ADD CONSTRAINT "student_assignment_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_question" ADD CONSTRAINT "assignment_question_modified_by_fkey" FOREIGN KEY ("modified_by") REFERENCES "t_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_question" ADD CONSTRAINT "assignment_question_student_assignment_id_fkey" FOREIGN KEY ("student_assignment_id") REFERENCES "student_assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyzer" ADD CONSTRAINT "analyzer_developer_id_fkey" FOREIGN KEY ("developer_id") REFERENCES "t_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_comment" ADD CONSTRAINT "question_comment_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "t_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_comment" ADD CONSTRAINT "question_comment_assignment_question_id_fkey" FOREIGN KEY ("assignment_question_id") REFERENCES "assignment_question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_attachment" ADD CONSTRAINT "assignment_attachment_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
