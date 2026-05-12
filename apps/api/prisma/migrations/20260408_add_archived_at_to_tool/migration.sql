-- AlterTable: add soft-delete column to Tool
ALTER TABLE "Tool" ADD COLUMN "archived_at" TIMESTAMPTZ;

-- CreateIndex: support efficient filtering of non-archived tools
CREATE INDEX "Tool_archived_at_idx" ON "Tool"("archived_at");
