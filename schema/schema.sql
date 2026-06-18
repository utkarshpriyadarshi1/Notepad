-- schema.sql
-- SQLite database table schema setups

CREATE TABLE IF NOT EXISTS sys_migrations (
    migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
    version_build INTEGER UNIQUE,
    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sticky_folders (
    folder_uuid TEXT PRIMARY KEY,
    folder_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sticky_widgets (
    widget_uuid TEXT PRIMARY KEY,
    parent_folder_uuid TEXT,
    widget_title TEXT,
    widget_theme_preset TEXT,
    widget_view_mode TEXT DEFAULT 'tasks',
    widget_markdown_content TEXT,
    placement_x_pos INTEGER,
    placement_y_pos INTEGER,
    geometry_width INTEGER,
    geometry_height INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_pinned INTEGER DEFAULT 0,
    FOREIGN KEY(parent_folder_uuid) REFERENCES sticky_folders(folder_uuid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_items (
    item_uuid TEXT PRIMARY KEY,
    parent_widget_uuid TEXT,
    item_text_payload TEXT,
    is_marked_completed INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(parent_widget_uuid) REFERENCES sticky_widgets(widget_uuid) ON DELETE CASCADE
);
