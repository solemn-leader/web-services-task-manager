CREATE TABLE IF NOT EXISTS tasks (
 id SERIAL PRIMARY KEY,
 title VARCHAR(120) NOT NULL CHECK (length(trim(title)) > 0),
 description VARCHAR(2000) NOT NULL DEFAULT '',
 importance SMALLINT NOT NULL CHECK (importance BETWEEN 1 AND 5),
 due_date DATE NOT NULL,
 status VARCHAR(10) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','doing','done')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO tasks(title, description, importance, due_date, status) VALUES
 ('Подготовить демонстрацию', 'Показать четыре контейнера и работу сервиса приоритетов', 5, CURRENT_DATE + 2, 'doing'),
 ('Проверить сохранение данных', 'Перезапустить контейнеры без удаления тома', 4, CURRENT_DATE + 4, 'todo'),
 ('Прочитать требования практикума', 'Сопоставить проект с критериями оценки', 3, CURRENT_DATE - 1, 'done');
