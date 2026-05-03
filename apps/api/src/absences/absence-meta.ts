import { AbsenceType } from '@prisma/client';

export interface AbsenceMeta {
  /** Short code displayed in UI cells (e.g. "Б", "СД") */
  code: string;
  /** Full Russian label */
  label: string;
  /** Whether this absence type reduces the employee's norm hours */
  reduces_norm: boolean;
}

export const ABSENCE_META: Record<AbsenceType, AbsenceMeta> = {
  Bolnichnyi:                     { code: 'Б',    label: 'Больничный',                                          reduces_norm: true  },
  OplachivaemyiOtpusk:            { code: 'ОО',   label: 'Оплачиваемый отпуск',                                 reduces_norm: true  },
  NeoplachivaemyiOtpusk:          { code: 'НО',   label: 'Неоплачиваемый отпуск',                               reduces_norm: true  },
  UchebnyiOtpusk:                 { code: 'УО',   label: 'Учебный отпуск',                                      reduces_norm: true  },
  NeoplachivaemyiUchebnyiOtpusk:  { code: 'НУО',  label: 'Неоплачиваемый учебный отпуск',                       reduces_norm: true  },
  DekretnyiOtpusk:                { code: 'ДО',   label: 'Декретный отпуск',                                    reduces_norm: true  },
  NeoplachivaemyiDekretnyiOtpusk: { code: 'НДО',  label: 'Неоплачиваемый декретный отпуск',                     reduces_norm: true  },
  Komandirovka:                   { code: 'К',    label: 'Командировка (Контрактные часы не сокращаются)',       reduces_norm: false },
  DenDonora:                      { code: 'ДД',   label: 'День донора (Не сокращаются договорные часы)',         reduces_norm: false },
  DenZdorovya:                    { code: 'ДЗ',   label: 'День здоровья',                                       reduces_norm: true  },
  Progul:                         { code: 'П',    label: 'Прогул',                                              reduces_norm: true  },
  OtpuskPoInvalidnosti:           { code: 'ОПИ',  label: 'Отпуск по инвалидности',                              reduces_norm: true  },
  OtcovskiyOtpusk:                { code: 'ОтО',  label: 'Отцовский отпуск',                                    reduces_norm: true  },
  OtpuskPoBerennosti:             { code: 'ОПБР', label: 'Отпуск по беременности и родам',                      reduces_norm: true  },
  OtpuskPoUsynovleniyu:           { code: 'ОПУ',  label: 'Отпуск по усыновлению',                               reduces_norm: true  },
  OtpuskPoUkhoduZaRebenkom:       { code: 'ОПУР', label: 'Отпуск по уходу за ребенком',                         reduces_norm: true  },
  VoennayaSluzhba:                { code: 'ВС',   label: 'Военная служба',                                      reduces_norm: true  },
  DenSudebnogRazbiratelstva:      { code: 'ДСР',  label: 'День судебного разбирательства (Контрактные часы не сокращаются)', reduces_norm: false },
  VOzhidaniiRaboty:               { code: 'ВОР',  label: 'В ожидании работы',                                   reduces_norm: true  },
  UkhodZaBolnym:                  { code: 'УЗБ',  label: 'Уход за больным',                                     reduces_norm: true  },
  LichnyePrichiny:                { code: 'ЛП',   label: 'Личные причины (Количество часов по контракту не сокращается)', reduces_norm: false },
  Obuchenie:                      { code: 'ОБ',   label: 'Обучение (Контрактные часы не сокращаются)',           reduces_norm: false },
  ProverkaZdorovya:               { code: 'ПЗ',   label: 'Проверка здоровья (Контрактные часы не сокращаются)', reduces_norm: false },
  SvobodnyiDenPoProsby:           { code: 'СДР',  label: 'Свободный день по просьбе работника',                 reduces_norm: true  },
  DenPogody:                      { code: 'ДП',   label: 'День погоды',                                         reduces_norm: true  },
  Opozdanie:                      { code: 'ОНР',  label: 'Опоздание (Договорные часы не сокращены)',            reduces_norm: false },
  SvobodnyiDen:                   { code: 'СД',   label: 'Свободный день',                                      reduces_norm: true  },
  KompensiruyushchiyOtpusk:       { code: 'КО',   label: 'Компенсирующий отпуск',                               reduces_norm: true  },
};
