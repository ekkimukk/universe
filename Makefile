SHELL := /bin/bash

NOTES_DIR := notes
TODAY := $(shell date +%Y-%m-%d)
TODAY_FILE := $(NOTES_DIR)/$(TODAY).md
OBSIDIAN_DIR := /home/eg/miscellanea/obsidian/fyrirPekkingu/Work (Universe Data)/journal

.PHONY: today new open list clean cp

# Создать дневник на сегодня
today:
	@mkdir -p $(NOTES_DIR)
	@if [ -f "$(TODAY_FILE)" ]; then \
		echo "Файл уже существует: $(TODAY_FILE)"; \
	else \
		cp template.md "$(TODAY_FILE)"; \
		sed -i "s/{{DATE}}/$(TODAY)/g" "$(TODAY_FILE)"; \
		echo "Создан: $(TODAY_FILE)"; \
	fi
	@$(MAKE) open FILE="$(TODAY_FILE)"

# Создать дневник для произвольной даты:
# make new DATE=2026-09-19
new:
	@mkdir -p $(NOTES_DIR)
	@if [ -z "$(DATE)" ]; then \
		echo "Использование: make new DATE=YYYY-MM-DD"; \
		exit 1; \
	fi
	@if [ -f "$(NOTES_DIR)/$(DATE).md" ]; then \
		echo "Файл уже существует: $(NOTES_DIR)/$(DATE).md"; \
	else \
		cp template.md "$(NOTES_DIR)/$(DATE).md"; \
		sed -i "s/{{DATE}}/$(DATE)/g" "$(NOTES_DIR)/$(DATE).md"; \
		echo "Создан: $(NOTES_DIR)/$(DATE).md"; \
	fi

# Открыть файл системным приложением по умолчанию
open:
	@if [ -n "$(FILE)" ]; then \
		xdg-open "$(FILE)" >/dev/null 2>&1 & \
	else \
		echo "Использование: make open FILE=notes/YYYY-MM-DD.md"; \
	fi

# Показать существующие рабочие дни
list:
	@find $(NOTES_DIR) -maxdepth 1 -type f -name '*.md' -printf '%f\n' 2>/dev/null | sort -r

# Удалить временные файлы редактора
clean:
	@find $(NOTES_DIR) -type f \( -name '*~' -o -name '*.swp' \) -delete

cp:
	@cp "$(OBSIDIAN_DIR)"/* "$(NOTES_DIR)"

commit-push:
	git add .
	git commit -m '✎﹏﹏﹏﹏'
	git push
