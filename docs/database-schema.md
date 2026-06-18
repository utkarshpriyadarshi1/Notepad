# Database Schema

Smritipatra Desktop stores information offline in SQLite. The schema contains the following entities:

## 1. `sys_migrations`
Stores database schema version history.
- `migration_id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `version_build` (INTEGER UNIQUE)
- `executed_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

## 2. `sticky_folders`
Represents custom folders grouping widgets.
- `folder_uuid` (TEXT PRIMARY KEY)
- `folder_name` (TEXT)
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

## 3. `sticky_widgets`
Represents individual sticky note widget properties.
- `widget_uuid` (TEXT PRIMARY KEY)
- `parent_folder_uuid` (TEXT, FOREIGN KEY to `sticky_folders.folder_uuid` ON DELETE CASCADE)
- `widget_title` (TEXT)
- `widget_theme_preset` (TEXT)
- `widget_view_mode` (TEXT DEFAULT 'tasks')
- `widget_markdown_content` (TEXT)
- `placement_x_pos` (INTEGER)
- `placement_y_pos` (INTEGER)
- `geometry_width` (INTEGER)
- `geometry_height` (INTEGER)
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)
- `is_pinned` (INTEGER DEFAULT 0)

## 4. `task_items`
Represents checklists inside widget cards.
- `item_uuid` (TEXT PRIMARY KEY)
- `parent_widget_uuid` (TEXT, FOREIGN KEY to `sticky_widgets.widget_uuid` ON DELETE CASCADE)
- `item_text_payload` (TEXT)
- `is_marked_completed` (INTEGER)
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)
