# Деплой (обновление сервера)

В проекте используется серверный скрипт `scripts/deploy.sh`, который автоматически:
— подтягивает последние изменения из Git,
— устанавливает зависимости бэкенда и фронтенда,
— собирает Next.js-приложение,
— при необходимости перезапускает сервисы.

## Первичная настройка сервера (выполняется один раз)

1. Клонируйте репозиторий на сервер и перейдите в каталог проекта:

git clone <REPO_URL> /srv/startloft
cd /srv/startloft

2. Настройте переменные окружения бэкенда.

Создайте файл `backend/.env` и заполните его:

MONGODB_URI=
ADMIN_TOKEN=
ADMIN_SYNC_TOKEN=
FRONTEND_URL=

Где:
MONGODB_URI — строка подключения к MongoDB  
ADMIN_TOKEN — токен администратора  
ADMIN_SYNC_TOKEN — токен для синхронизаций  
FRONTEND_URL — URL фронтенда (например https://site.kz)

3. Настройте переменные окружения фронтенда (при необходимости).

Откройте файл `frontend/.env.local` и убедитесь, что API указывает на бэкенд:

NEXT_PUBLIC_API_URL=https://api.site.kz

4. Сделайте deploy-скрипт исполняемым:

chmod +x scripts/deploy.sh

## Запуск деплоя (обновление кода)

Из корня проекта выполните:

./scripts/deploy.sh

Скрипт обновит код, установит зависимости и соберёт фронтенд.

## Перезапуск сервисов (опционально)

Если используется systemd, можно сразу указать имена сервисов:

BACKEND_SERVICE=startloft-backend \
FRONTEND_SERVICE=startloft-frontend \
SUDO=sudo \
./scripts/deploy.sh

После деплоя будут выполнены команды перезапуска сервисов через systemctl.

Если systemd не используется, перезапустите бэкенд и фронтенд вручную
(PM2, Docker, screen, tmux и т.д.).

## Дополнительные параметры (при необходимости)

Можно переопределять поведение скрипта через переменные окружения:

REPO_DIR — путь к репозиторию (по умолчанию корень проекта)  
GIT_REMOTE — Git remote (по умолчанию origin)  
GIT_BRANCH — ветка (по умолчанию текущая)  
BACKEND_DIR — каталог бэкенда (backend)  
FRONTEND_DIR — каталог фронтенда (frontend)  
VENV_DIR — путь к virtualenv (backend/venv)  
PYTHON_BIN — интерпретатор Python (python3)  
NPM_BIN — npm  
BACKEND_SERVICE — systemd-сервис бэкенда  
FRONTEND_SERVICE — systemd-сервис фронтенда  
SYSTEMCTL_CMD — команда systemctl  
SUDO — sudo (если требуется)

Документ предназначен для быстрого деплоя и обновления проекта на сервере.