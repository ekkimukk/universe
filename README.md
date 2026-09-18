# Worklog

Статический рабочий журнал для GitHub Pages.

## Структура

```text
.
├── index.html
├── style.css
├── app.js
└── notes/
    ├── 2026-09-18.md
    ├── 2026-09-17.md
    └── ...
```

Сайт автоматически получает список `.md` файлов из каталога `notes/` через GitHub API.
Файлы с именами, отличными от `YYYY-MM-DD.md`, игнорируются.

## Запуск

1. Создайте GitHub repository.
2. Положите файлы сайта в корень.
3. Создайте каталог `notes/`.
4. Добавляйте туда Markdown-файлы из Obsidian.
5. В GitHub включите Pages:
   `Settings → Pages → Deploy from a branch → main → / (root)`.
6. Откройте адрес GitHub Pages.

Для URL вида `https://USERNAME.github.io/REPOSITORY/` owner/repo определяются автоматически.

Если используется custom domain, укажите `owner` и `repo` в начале `app.js`.

## Ограничения

Это полностью статический сайт. Серверной части нет.

Сайт использует GitHub Contents API для получения списка файлов и
raw.githubusercontent.com для загрузки Markdown. Для обычного личного
рабочего журнала этого достаточно.

## Obsidian

Редактируйте только `notes/YYYY-MM-DD.md`. После `git push` GitHub Pages
обновит содержимое сайта.

Поддерживаются обычный Markdown, таблицы, чекбоксы, кодовые блоки,
ссылки, изображения по URL и базовый GFM-синтаксис.
