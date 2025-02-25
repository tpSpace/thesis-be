/*
  Warnings:

  - The `status` column on the `student_assignment` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "assignmentstatus" AS ENUM ('ASSIGNED', 'SUBMITTED', 'GENERATED', 'QUESTIONED', 'ANSWERED', 'FINALIZED', 'CLOSED');

-- AlterTable
ALTER TABLE "assignment_question" ADD COLUMN     "level" TEXT,
ADD COLUMN     "scope" TEXT;

-- AlterTable
ALTER TABLE "student_assignment" DROP COLUMN "status",
ADD COLUMN     "status" "assignmentstatus" NOT NULL DEFAULT 'ASSIGNED';

-- DropEnum
DROP TYPE "AssignmentStatus";

-- CreateTable
CREATE TABLE "localization_report" (
    "id" SERIAL NOT NULL,
    "location" TEXT NOT NULL,
    "line_number" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "student_assignment_id" INTEGER NOT NULL,

    CONSTRAINT "localization_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executed_test" (
    "id" SERIAL NOT NULL,
    "executed_test" TEXT NOT NULL,
    "is_failing" BOOLEAN NOT NULL,
    "student_assignment_id" INTEGER NOT NULL,

    CONSTRAINT "executed_test_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "localization_report" ADD CONSTRAINT "localization_report_student_assignment_id_fkey" FOREIGN KEY ("student_assignment_id") REFERENCES "student_assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executed_test" ADD CONSTRAINT "executed_test_student_assignment_id_fkey" FOREIGN KEY ("student_assignment_id") REFERENCES "student_assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
