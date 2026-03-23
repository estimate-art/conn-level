# LevelUp Analytics Dashboard

## A client-side web app for retail analytics — import Excel reports, clean messy data, and visualize KPIs in real time. Built for field sales managers who work with multi-outlet performance data daily.

Live: no backend required — everything runs in the browser.


# Stack
LayerTechFrameworkNext.js 14 (App Router), React, TypeScriptUIshadcn/ui, Tailwind CSS, Glassmorphism designData processingSheetJS (xlsx) — client-side Excel parsingState persistencelocalStorage (no database needed)

## Key Features
1. Retail Statistics Module

Import one or multiple .xlsx report files simultaneously
Auto column detection — finds relevant columns by keywords, not fixed positions (resilient to file structure changes)
Row aggregation — merges split outlet rows into single objects automatically
Multiple dashboard views: KPI cards with color-coded achievement levels, compact flex report, PrP/PoP specialized reports
Pacing analysis — calculates required daily rate to hit monthly targets

2. Sales Analytics Module

Flexible column mapping parser — configured once, saved to localStorage
Codifier system — multi-stage data cleaning pipeline:

Name normalization (multiple spellings → single clean name)
Keyword-based product classification ("case" → "Чохол")
Smart IMEI detection (separates smartphones from accessories)
Index grouping (final classification layer)


Grouped analytics by employee or product category, with filtering and sorting

3. SMS Generator

Generates pre-filled sms: links for service numbers 150 and 640
Real-time validation, zero backend


# Architecture
```src/
├── app/
│   ├── page.tsx              # Main router + global state
│   └── globals.css           # CSS variables, glassmorphism theme
└── components/layout/
    ├── statistics-dashboard.tsx
    ├── sales-analytics.tsx
    ├── sms-form.tsx
    ├── vf-view.tsx           # KPI card dashboard
    ├── flexbox-report.tsx    # Compact all-outlets report
    ├── prp-report.tsx
    ├── pop-report.tsx
    └── pacing-dialog.tsx
```

Run Locally
bashnpm install
npm run dev
# Open http://localhost:9002

# Why This Exists
Standard Excel reports from retail chains are messy — outlets split across rows, inconsistent column names, different file structures per region. This tool was built to solve that specific problem: take raw, inconsistent sales data and turn it into clean, actionable dashboards without any server infrastructure.


# Аналітична панель "LevelUp"

Цей проєкт є веб-додатком, розробленим на Next.js та Tailwind CSS, який надає інструменти для аналізу даних про продуктивність роздрібних точок та аналітики продажів. Додаток дозволяє імпортувати Excel-файли, обробляти їх "на льоту" та візуалізувати дані в інтерактивному інтерфейсі.

## Основні технології

- **Frontend:** Next.js, React, TypeScript
- **UI:** shadcn/ui, Tailwind CSS
- **Робота з Excel:** `xlsx`
- **Зберігання даних:** `localStorage` браузера

## Архітектура та логіка роботи

Додаток складається з трьох основних модулів, які функціонують незалежно один від одного, використовуючи кешування в `localStorage` для збереження стану між сесіями.

### 1. Статистика ритейлу (`/src/components/layout/statistics-dashboard.tsx`)

Цей модуль призначений для аналізу щоденних звітів про продуктивність торгових точок.

**Логіка роботи:**
1.  **Імпорт:** Користувач завантажує один або декілька `.xlsx` файлів. Додаток підтримує завантаження звітів за різні періоди або від різних регіональних менеджерів.
2.  **Обробка:**
    - Дані з усіх файлів об'єднуються в єдиний масив.
    - Для кожного унікального аутлету всі відповідні рядки зводяться в один об'єкт, що містить повну інформацію про показники ("факт" та "рівні"). Це вирішує проблему, коли дані для одного аутлету розбиті на кілька рядків.
    - Додаток автоматично знаходить потрібні стовпці за ключовими словами (`Активації PrP+PoP`, `Контракти B2C`, `MNP` тощо).
3.  **Візуалізація:**
    - **Vf-View, Flex-View:** Інтерактивні дашборди для перегляду показників по кожному аутлету. Колірне кодування карток залежить від досягнутого рівня.
    - **Flexbox Report:** Компактний звіт по всіх аутлетах на одній сторінці.
    - **PrP/PoP Reports:** Спеціалізовані звіти, які генеруються, якщо у завантажених файлах є відповідні аркуші (`PrP`, `PoP`).
4.  **Кешування:** Всі оброблені дані, звіти та дата імпорту зберігаються в `localStorage` під ключем `analyticsData`.

---

### 2. Аналітика продажів (`/src/components/layout/sales-analytics.tsx`)

Цей модуль надає потужні інструменти для аналізу детальних звітів про продажі.

**Логіка роботи:**
1.  **Імпорт:** Користувач завантажує один `.xlsx` файл зі звітом про продажі.
2.  **Парсер (Налаштування стовпців):**
    - Користувач повинен один раз вказати, які стовпці у файлі відповідають за необхідні дані: "Опис" (співробітник), "Код", "Назва", "Вартість", "Відділ" та "IMEI".
    - Ці налаштування зберігаються в `localStorage` (`salesColumnMapping`) і застосовуються автоматично при наступних завантаженнях.
3.  **Кодифікатор (Очищення даних):**
    - Це ключовий інструмент для трансформації "сирих" даних у чисті та уніфіковані.
    - **Опис / Відділ:** Дозволяє згрупувати різні варіанти написання (напр., "Іванов І. І.", "Ivanov I.") в одне чисте ім'я ("Іванов").
    - **Код / Смартфони:** Працює за ключовими словами. Дозволяє призначити єдиний код продукту для товарів, у назві яких є певне слово (напр., всі товари зі словом "case" отримують код "Чохол"). Розділення на "Код" (без IMEI) та "Смартфони" (з IMEI) дозволяє уникнути конфліктів.
    - **Індекс:** Фінальний етап класифікації. Дозволяє призначити групу (індекс) для кожного уніфікованого коду продукту (напр., код "iPhone 15 Pro" потрапляє в індекс "Елітні смарти").
    - Шаблон кодифікатора зберігається в `localStorage` (`salesCodifierTemplate`).
4.  **Аналіз:** Після налаштування парсера та кодифікатора користувач може перейти до екрана аналітики, де дані групуються за індексами або співробітниками, з можливістю фільтрації та сортування.
5.  **Кешування:** Завантажені дані, налаштування парсера та кодифікатора зберігаються в `localStorage`.

---

### 3. Форма для SMS (`/src/components/layout/sms-form.tsx`)

Простий інструмент для швидкого генерування SMS-запитів на номери сервісів 150 та 640. Форма валідує введені дані та відкриває стандартний додаток для надсилання SMS з уже заповненим текстом.

## Як запустити проєкт

1.  Встановіть залежності:
    ```bash
    npm install
    ```
2.  Запустіть сервер для розробки:
    ```bash
    npm run dev
    ```
3.  Відкрийте [http://localhost:9002](http://localhost:9002) у вашому браузері.
