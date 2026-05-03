// Enums matching the Prisma schema in apps/api/prisma/schema.prisma
// These must stay in sync with the Prisma enum definitions

export enum ProjectStatus {
  Hinnapakkumises = 'Hinnapakkumises',
  Ettevalmistuses = 'Ettevalmistuses',
  Toos = 'Töös', // "Töös" — Toos as enum key for TS safety
  Lopetatud = 'Lõpetatud',
}

export enum TaskStatus {
  Uus = 'Uus',
  Teha = 'Teha',
  Toos = 'Töös', // "Töös" — Toos as enum key for TS safety
  Tehtud = 'Tehtud',
}

export enum Priority {
  Madal = 'Madal',
  Keskmine = 'Keskmine',
  Korgeim = 'Kõrgeim', // "Kõrgeim" — Korgeim as enum key for TS safety
}

export enum EmployeeGroup {
  Paigaldus = 'Paigaldus',
  Tootmine = 'Tootmine',
  Kontor = 'Kontor',
  Ladu = 'Ladu',
}

export enum EmployeeStatus {
  Aktiivne = 'Aktiivne',
  Arhiveeritud = 'Arhiveeritud',
}

export enum Language {
  ET = 'et',
  RU = 'ru',
}

export enum TimeFormat {
  H24 = 'H24',
  H12 = 'H12',
}

export enum ToolStatus {
  Tookorras = 'Töökorras', // "Töökorras" — Tookorras as enum key for TS safety
  Rikki = 'Rikki',
  Hoolduses = 'Hoolduses',
}

export enum TagEntityType {
  project = 'project',
  task = 'task',
}

export enum TemplateType {
  production = 'production',
  general = 'general',
}

export enum AbsenceType {
  Bolnichnyi = 'Bolnichnyi',
  OplachivaemyiOtpusk = 'OplachivaemyiOtpusk',
  NeoplachivaemyiOtpusk = 'NeoplachivaemyiOtpusk',
  UchebnyiOtpusk = 'UchebnyiOtpusk',
  NeoplachivaemyiUchebnyiOtpusk = 'NeoplachivaemyiUchebnyiOtpusk',
  DekretnyiOtpusk = 'DekretnyiOtpusk',
  NeoplachivaemyiDekretnyiOtpusk = 'NeoplachivaemyiDekretnyiOtpusk',
  Komandirovka = 'Komandirovka',
  DenDonora = 'DenDonora',
  DenZdorovya = 'DenZdorovya',
  Progul = 'Progul',
  OtpuskPoInvalidnosti = 'OtpuskPoInvalidnosti',
  OtcovskiyOtpusk = 'OtcovskiyOtpusk',
  OtpuskPoBerennosti = 'OtpuskPoBerennosti',
  OtpuskPoUsynovleniyu = 'OtpuskPoUsynovleniyu',
  OtpuskPoUkhoduZaRebenkom = 'OtpuskPoUkhoduZaRebenkom',
  VoennayaSluzhba = 'VoennayaSluzhba',
  DenSudebnogRazbiratelstva = 'DenSudebnogRazbiratelstva',
  VOzhidaniiRaboty = 'VOzhidaniiRaboty',
  UkhodZaBolnym = 'UkhodZaBolnym',
  LichnyePrichiny = 'LichnyePrichiny',
  Obuchenie = 'Obuchenie',
  ProverkaZdorovya = 'ProverkaZdorovya',
  SvobodnyiDenPoProsby = 'SvobodnyiDenPoProsby',
  DenPogody = 'DenPogody',
  Opozdanie = 'Opozdanie',
  SvobodnyiDen = 'SvobodnyiDen',
  KompensiruyushchiyOtpusk = 'KompensiruyushchiyOtpusk',
}
