-- schema.sql
-- SQLite database table schema setups (Schema Version 11)

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

CREATE TABLE IF NOT EXISTS sticky_notes (
    note_uuid TEXT PRIMARY KEY, 
    parent_folder_uuid TEXT, 
    note_title TEXT, 
    note_theme_preset TEXT, 
    note_view_mode TEXT DEFAULT 'markdown', 
    note_markdown_content TEXT, 
    placement_x_pos INTEGER, 
    placement_y_pos INTEGER, 
    geometry_width INTEGER, 
    geometry_height INTEGER, 
    is_flagged INTEGER DEFAULT 0, 
    sort_order INTEGER DEFAULT 0, 
    is_pinned INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY(parent_folder_uuid) REFERENCES sticky_folders(folder_uuid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_items (
    item_uuid TEXT PRIMARY KEY, 
    parent_note_uuid TEXT, 
    item_text_payload TEXT, 
    is_marked_completed INTEGER, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY(parent_note_uuid) REFERENCES sticky_notes(note_uuid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS events_log (
    event_uuid TEXT PRIMARY KEY, 
    parent_note_uuid TEXT, 
    event_text TEXT, 
    event_time DATETIME DEFAULT CURRENT_TIMESTAMP, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY(parent_note_uuid) REFERENCES sticky_notes(note_uuid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS expense_log (
    expense_uuid TEXT PRIMARY KEY, 
    parent_note_uuid TEXT, 
    expense_amount REAL, 
    expense_category TEXT, 
    expense_description TEXT, 
    expense_date TEXT DEFAULT CURRENT_DATE, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY(parent_note_uuid) REFERENCES sticky_notes(note_uuid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vcs_commits (
    commit_uuid TEXT PRIMARY KEY, 
    parent_note_uuid TEXT, 
    commit_message TEXT, 
    note_title_snapshot TEXT, 
    note_content_snapshot TEXT, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY(parent_note_uuid) REFERENCES sticky_notes(note_uuid) ON DELETE CASCADE
);

-- Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_vcs_parent_note ON vcs_commits(parent_note_uuid);
CREATE INDEX IF NOT EXISTS idx_notes_parent_folder ON sticky_notes(parent_folder_uuid);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_note ON task_items(parent_note_uuid);
CREATE INDEX IF NOT EXISTS idx_events_parent_note ON events_log(parent_note_uuid);
CREATE INDEX IF NOT EXISTS idx_expenses_parent_note ON expense_log(parent_note_uuid);
