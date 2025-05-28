-- 1. Create ENUM types
CREATE TYPE job_status AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');
CREATE TYPE feedback_type AS ENUM ('GENERAL', 'ERROR_EXPLANATION', 'SUGGESTION', 'REFLECTION_QUESTION');
CREATE TYPE log_type AS ENUM ('INFO', 'WARNING', 'ERROR', 'DEBUG');

-- 2. Core table: one row per grading attempt
CREATE TABLE grading_job (
  id                    SERIAL PRIMARY KEY,
  student_id            INTEGER NOT NULL,
  assignment_id         INTEGER NOT NULL,
  student_assignment_id INTEGER NOT NULL,
  attempt_number        INTEGER NOT NULL,
  status                job_status  NOT NULL DEFAULT 'PENDING',
  started_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at          TIMESTAMPTZ,
  error_message         TEXT,
  UNIQUE (student_assignment_id, attempt_number)
);

-- 3. Test case results
CREATE TABLE test_result (
  id              SERIAL PRIMARY KEY,
  grading_job_id  INTEGER NOT NULL
    REFERENCES grading_job(id) ON DELETE CASCADE,
  test_name       TEXT    NOT NULL,
  passed          BOOLEAN NOT NULL,
  output          TEXT,
  error_output    TEXT,
  duration_ms     INTEGER
);

-- 4. LLM-generated feedback and questions
CREATE TABLE feedback (
  id              SERIAL PRIMARY KEY,
  grading_job_id  INTEGER NOT NULL
    REFERENCES grading_job(id) ON DELETE CASCADE,
  type            feedback_type NOT NULL DEFAULT 'GENERAL',
  content         TEXT    NOT NULL
);

-- 5. Bug localization reports (optional SBFL data)
CREATE TABLE bug_report (
  id               SERIAL PRIMARY KEY,
  grading_job_id   INTEGER NOT NULL
    REFERENCES grading_job(id) ON DELETE CASCADE,
  file_path        TEXT    NOT NULL,
  line_number      INTEGER NOT NULL,
  confidence_score REAL    NOT NULL,
  description      TEXT
);

-- 6. Execution and system logs
CREATE TABLE execution_log (
  id              SERIAL PRIMARY KEY,
  grading_job_id  INTEGER NOT NULL
    REFERENCES grading_job(id) ON DELETE CASCADE,
  type            log_type NOT NULL DEFAULT 'INFO',
  message         TEXT    NOT NULL,
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT now()
);
