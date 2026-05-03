-- CreateEnum
CREATE TYPE "AbsenceType" AS ENUM ('Bolnichnyi', 'OplachivaemyiOtpusk', 'NeoplachivaemyiOtpusk', 'UchebnyiOtpusk', 'NeoplachivaemyiUchebnyiOtpusk', 'DekretnyiOtpusk', 'NeoplachivaemyiDekretnyiOtpusk', 'Komandirovka', 'DenDonora', 'DenZdorovya', 'Progul', 'OtpuskPoInvalidnosti', 'OtcovskiyOtpusk', 'OtpuskPoBerennosti', 'OtpuskPoUsynovleniyu', 'OtpuskPoUkhoduZaRebenkom', 'VoennayaSluzhba', 'DenSudebnogRazbiratelstva', 'VOzhidaniiRaboty', 'UkhodZaBolnym', 'LichnyePrichiny', 'Obuchenie', 'ProverkaZdorovya', 'SvobodnyiDenPoProsby', 'DenPogody', 'Opozdanie', 'SvobodnyiDen', 'KompensiruyushchiyOtpusk');

-- CreateTable
CREATE TABLE "Absence" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "type" "AbsenceType" NOT NULL,
    "date_from" DATE NOT NULL,
    "date_to" DATE NOT NULL,
    "comment" TEXT,
    "created_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Absence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Absence_employee_id_idx" ON "Absence"("employee_id");

-- CreateIndex
CREATE INDEX "Absence_date_from_date_to_idx" ON "Absence"("date_from", "date_to");

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
