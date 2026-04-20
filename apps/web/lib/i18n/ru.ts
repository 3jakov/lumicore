import type { Dictionary } from '@/lib/i18n';

export const ru = {
  app: {
    name: 'Lumicore',
  },
  nav: {
    sections: {
      workspaces: 'Рабочие области',
      administration: 'Администрирование',
    },
    dashboard: 'Панель',
    projects: 'Проекты',
    tasks: 'Работы',
    time: 'Время',
    praegu: 'Сейчас',
    tools: 'Инструменты',
    documents: 'Мои документы',
    people: 'Сотрудники',
    timesheet: 'Табель',
    reports: 'Отчёты',
    settings: 'Настройки',
    acknowledgementBadge: 'Подтв.',
  },
  common: {
    comingSoon: 'Скоро',
    retry: 'Попробовать снова',
    save: 'Сохранить',
    cancel: 'Отмена',
    saving: 'Сохранение...',
    saveChanges: 'Сохранить изменения',
    saved: 'Сохранено',
    checkConnection: 'Проверьте подключение и попробуйте снова.',
  },
  auth: {
    login: {
      title: 'Вход',
      otp: 'Войти по номеру телефона',
      password: 'Войти по e-mail и паролю',
    },
  },
  shell: {
    placeholder: 'Основа готова для следующих этапов.',
    sidebarTitle: 'Основа приложения',
    sidebarDescription: 'Маршруты и структура модулей соответствуют плану реализации.',
  },
  projects: {
    title: 'Проекты',
    description: 'Все активные и архивные проекты полевых работ и производства.',
    create: 'Новый проект',
    failedToLoad: 'Не удалось загрузить проекты',
    emptyTitle: 'Проектов пока нет',
    emptyDescription: 'Проекты появятся здесь после создания.',
    countSingular: 'проект',
    countPlural: 'проекта',
  },
  settings: {
    title: 'Настройки',
    profile: {
      title: 'Профиль',
      description: 'Управляйте именем, языком и форматом отображения времени.',
      formDescription: 'Ваши личные настройки. Изменения применяются сразу после сохранения.',
      fullName: 'Полное имя',
      namePlaceholder: 'Ваше имя',
      language: 'Язык',
      timeFormat: 'Формат времени',
    },
  },
} as const satisfies Dictionary;
