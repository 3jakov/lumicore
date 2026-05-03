-- CreateTable
CREATE TABLE "PhotoComment" (
    "id" SERIAL NOT NULL,
    "photo_id" INTEGER NOT NULL,
    "author_id" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "PhotoComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PhotoComment_photo_id_idx" ON "PhotoComment"("photo_id");

-- CreateIndex
CREATE INDEX "PhotoComment_author_id_idx" ON "PhotoComment"("author_id");

-- AddForeignKey
ALTER TABLE "PhotoComment" ADD CONSTRAINT "PhotoComment_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "Photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoComment" ADD CONSTRAINT "PhotoComment_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
