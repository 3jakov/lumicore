-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('Hinnapakkumises', 'Ettevalmistuses', 'Töös', 'Lõpetatud');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('Uus', 'Teha', 'Töös', 'Tehtud');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('Madal', 'Keskmine', 'Kõrgeim');

-- CreateEnum
CREATE TYPE "EmployeeGroup" AS ENUM ('Paigaldus', 'Tootmine', 'Kontor', 'Ladu');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('Aktiivne', 'Arhiveeritud');

-- CreateEnum
CREATE TYPE "ToolStatus" AS ENUM ('Töökorras', 'Rikki', 'Hoolduses');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('et', 'ru');

-- CreateEnum
CREATE TYPE "TimeFormat" AS ENUM ('H24', 'H12');

-- CreateEnum
CREATE TYPE "TagEntityType" AS ENUM ('project', 'task');

-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('production', 'general');

-- CreateTable
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "full_name" TEXT NOT NULL,
    "photo_url" TEXT,
    "avatar_color" TEXT NOT NULL DEFAULT '#4F46E5',
    "initials" TEXT NOT NULL,
    "group" "EmployeeGroup" NOT NULL,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'Aktiivne',
    "work_schedule" TEXT,
    "norm_hours_per_week" INTEGER NOT NULL DEFAULT 40,
    "project_access_all" BOOLEAN NOT NULL DEFAULT true,
    "phone" TEXT,
    "email" TEXT,
    "password_hash" TEXT,
    "language" "Language" NOT NULL DEFAULT 'et',
    "time_format" "TimeFormat" NOT NULL DEFAULT 'H24',
    "hourly_rate" DECIMAL(10,2),
    "personal_id" TEXT,
    "birth_date" DATE,
    "additional_info" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "archived_at" TIMESTAMPTZ,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeRole" (
    "employee_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "EmployeeRole_pkey" PRIMARY KEY ("employee_id","role_id")
);

-- CreateTable
CREATE TABLE "EmployeeProjectAccess" (
    "employee_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,

    CONSTRAINT "EmployeeProjectAccess_pkey" PRIMARY KEY ("employee_id","project_id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'Ettevalmistuses',
    "start_date" DATE,
    "end_date" DATE,
    "description" TEXT,
    "location_address" TEXT,
    "location_lat" DOUBLE PRECISION,
    "location_lng" DOUBLE PRECISION,
    "contract_number" TEXT,
    "project_manager_id" INTEGER,
    "client_company_name" TEXT,
    "client_reg_code" TEXT,
    "client_contact_name" TEXT,
    "client_phone" TEXT,
    "client_email" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "archived_at" TIMESTAMPTZ,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectEmployee" (
    "project_id" INTEGER NOT NULL,
    "employee_id" INTEGER NOT NULL,

    CONSTRAINT "ProjectEmployee_pkey" PRIMARY KEY ("project_id","employee_id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "entity_type" "TagEntityType" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_at" TIMESTAMPTZ,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTag" (
    "project_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "ProjectTag_pkey" PRIMARY KEY ("project_id","tag_id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'Uus',
    "project_id" INTEGER,
    "template_id" INTEGER,
    "priority" "Priority" NOT NULL DEFAULT 'Keskmine',
    "location_address" TEXT,
    "location_lat" DOUBLE PRECISION,
    "location_lng" DOUBLE PRECISION,
    "start_time" TIMESTAMPTZ,
    "end_time" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "archived_at" TIMESTAMPTZ,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAssignee" (
    "task_id" INTEGER NOT NULL,
    "employee_id" INTEGER NOT NULL,

    CONSTRAINT "TaskAssignee_pkey" PRIMARY KEY ("task_id","employee_id")
);

-- CreateTable
CREATE TABLE "TaskTag" (
    "task_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "TaskTag_pkey" PRIMARY KEY ("task_id","tag_id")
);

-- CreateTable
CREATE TABLE "TaskTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TemplateType" NOT NULL DEFAULT 'general',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "default_group" "EmployeeGroup",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeEntry" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "project_id" INTEGER,
    "task_id" INTEGER,
    "no_project_reason" TEXT,
    "started_at" TIMESTAMPTZ NOT NULL,
    "ended_at" TIMESTAMPTZ,
    "is_manual" BOOLEAN NOT NULL DEFAULT false,
    "needs_review" BOOLEAN NOT NULL DEFAULT false,
    "is_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pause" (
    "id" SERIAL NOT NULL,
    "time_entry_id" INTEGER NOT NULL,
    "pause_start" TIMESTAMPTZ NOT NULL,
    "pause_end" TIMESTAMPTZ,

    CONSTRAINT "Pause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeEntryComment" (
    "id" SERIAL NOT NULL,
    "time_entry_id" INTEGER NOT NULL,
    "author_id" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeEntryComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" SERIAL NOT NULL,
    "s3_key" TEXT NOT NULL,
    "thumbnail_s3_key" TEXT,
    "project_id" INTEGER,
    "task_id" INTEGER,
    "author_id" INTEGER NOT NULL,
    "gps_lat" DOUBLE PRECISION,
    "gps_lng" DOUBLE PRECISION,
    "gps_verified" BOOLEAN NOT NULL DEFAULT false,
    "taken_at" TIMESTAMPTZ NOT NULL,
    "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "file_size_bytes" INTEGER NOT NULL,
    "original_filename" TEXT NOT NULL,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "s3_key" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size_bytes" INTEGER NOT NULL,
    "uploaded_by_id" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tool" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "photo_s3_key" TEXT,
    "current_location_project_id" INTEGER,
    "current_location_text" TEXT,
    "responsible_employee_id" INTEGER,
    "status" "ToolStatus" NOT NULL DEFAULT 'Töökorras',
    "description" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Tool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskTool" (
    "task_id" INTEGER NOT NULL,
    "tool_id" INTEGER NOT NULL,

    CONSTRAINT "TaskTool_pkey" PRIMARY KEY ("task_id","tool_id")
);

-- CreateTable
CREATE TABLE "InternalDocument" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "s3_key" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "requires_ack" BOOLEAN NOT NULL DEFAULT true,
    "uploaded_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "archived_at" TIMESTAMPTZ,

    CONSTRAINT "InternalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocAckAssignment" (
    "id" SERIAL NOT NULL,
    "document_id" INTEGER NOT NULL,
    "employee_id" INTEGER,
    "group" "EmployeeGroup",
    "assigned_by_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMPTZ,

    CONSTRAINT "DocAckAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocAcknowledgement" (
    "id" SERIAL NOT NULL,
    "document_id" INTEGER NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "document_version" INTEGER NOT NULL,
    "acknowledged_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocAcknowledgement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpCode" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER,
    "phone" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanySettings" (
    "id" SERIAL NOT NULL,
    "company_name" TEXT NOT NULL,
    "reg_code" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "logo_s3_key" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "CompanySettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_phone_key" ON "Employee"("phone");
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");
CREATE INDEX "Employee_status_idx" ON "Employee"("status");
CREATE INDEX "Employee_group_idx" ON "Employee"("group");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_entity_type_key" ON "Tag"("name", "entity_type");

-- CreateIndex
CREATE UNIQUE INDEX "TaskTemplate_name_key" ON "TaskTemplate"("name");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");
CREATE INDEX "Project_archived_at_idx" ON "Project"("archived_at");

-- CreateIndex
CREATE INDEX "Task_project_id_status_idx" ON "Task"("project_id", "status");
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "TimeEntry_employee_id_started_at_idx" ON "TimeEntry"("employee_id", "started_at");
CREATE INDEX "TimeEntry_project_id_idx" ON "TimeEntry"("project_id");
-- Partial index for no-project entries (manual SQL — Prisma doesn't support partial indexes via @@index)
CREATE INDEX "TimeEntry_no_project_idx" ON "TimeEntry"("employee_id") WHERE "project_id" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Photo_s3_key_key" ON "Photo"("s3_key");
CREATE INDEX "Photo_project_id_idx" ON "Photo"("project_id");
CREATE INDEX "Photo_author_id_uploaded_at_idx" ON "Photo"("author_id", "uploaded_at");

-- CreateIndex
CREATE UNIQUE INDEX "Document_s3_key_key" ON "Document"("s3_key");
CREATE INDEX "Document_project_id_idx" ON "Document"("project_id");

-- CreateIndex
CREATE INDEX "InternalDocument_archived_at_idx" ON "InternalDocument"("archived_at");

-- CreateIndex
CREATE INDEX "DocAckAssignment_document_id_idx" ON "DocAckAssignment"("document_id");
CREATE INDEX "DocAckAssignment_employee_id_idx" ON "DocAckAssignment"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "DocAcknowledgement_document_id_employee_id_document_version_key"
    ON "DocAcknowledgement"("document_id", "employee_id", "document_version");
CREATE INDEX "DocAcknowledgement_employee_id_idx" ON "DocAcknowledgement"("employee_id");

-- CreateIndex
CREATE INDEX "OtpCode_phone_expires_at_idx" ON "OtpCode"("phone", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_hash_key" ON "RefreshToken"("token_hash");

-- AddForeignKey
ALTER TABLE "EmployeeRole" ADD CONSTRAINT "EmployeeRole_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EmployeeRole" ADD CONSTRAINT "EmployeeRole_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EmployeeProjectAccess" ADD CONSTRAINT "EmployeeProjectAccess_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EmployeeProjectAccess" ADD CONSTRAINT "EmployeeProjectAccess_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Project" ADD CONSTRAINT "Project_project_manager_id_fkey" FOREIGN KEY ("project_manager_id") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProjectEmployee" ADD CONSTRAINT "ProjectEmployee_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProjectEmployee" ADD CONSTRAINT "ProjectEmployee_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProjectTag" ADD CONSTRAINT "ProjectTag_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProjectTag" ADD CONSTRAINT "ProjectTag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Task" ADD CONSTRAINT "Task_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "TaskTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TaskTag" ADD CONSTRAINT "TaskTag_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskTag" ADD CONSTRAINT "TaskTag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Pause" ADD CONSTRAINT "Pause_time_entry_id_fkey" FOREIGN KEY ("time_entry_id") REFERENCES "TimeEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TimeEntryComment" ADD CONSTRAINT "TimeEntryComment_time_entry_id_fkey" FOREIGN KEY ("time_entry_id") REFERENCES "TimeEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Photo" ADD CONSTRAINT "Photo_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Document" ADD CONSTRAINT "Document_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Tool" ADD CONSTRAINT "Tool_current_location_project_id_fkey" FOREIGN KEY ("current_location_project_id") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Tool" ADD CONSTRAINT "Tool_responsible_employee_id_fkey" FOREIGN KEY ("responsible_employee_id") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TaskTool" ADD CONSTRAINT "TaskTool_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskTool" ADD CONSTRAINT "TaskTool_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "Tool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InternalDocument" ADD CONSTRAINT "InternalDocument_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DocAckAssignment" ADD CONSTRAINT "DocAckAssignment_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "InternalDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DocAckAssignment" ADD CONSTRAINT "DocAckAssignment_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DocAckAssignment" ADD CONSTRAINT "DocAckAssignment_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DocAcknowledgement" ADD CONSTRAINT "DocAcknowledgement_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "InternalDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DocAcknowledgement" ADD CONSTRAINT "DocAcknowledgement_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OtpCode" ADD CONSTRAINT "OtpCode_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
