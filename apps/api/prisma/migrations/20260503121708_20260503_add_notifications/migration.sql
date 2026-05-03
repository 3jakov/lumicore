-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TimerForgottenStart', 'TimerForgottenStop');

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL,
    "read_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_employee_id_read_at_idx" ON "Notification"("employee_id", "read_at");

-- CreateIndex
CREATE INDEX "Notification_created_at_idx" ON "Notification"("created_at");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
