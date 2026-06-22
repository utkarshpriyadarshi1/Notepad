# Database Schema (Version 14)

Notepad stores information offline in SQLite. The unified database schema contains the following tables and relation constraints:

---

## 1. `sys_migrations`
Stores database schema migration version history.
- `migration_id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `version_build` (INTEGER UNIQUE)
- `executed_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

---

## 2. `sys_layout_state`
Stores application layout state details.
- `layout_key` (TEXT PRIMARY KEY)
- `open_note_uuids` (TEXT)
- `selected_note_uuid` (TEXT)

---

## 3. `sticky_folders`
Represents custom folders grouping notes.
- `folder_uuid` (TEXT PRIMARY KEY)
- `folder_name` (TEXT)
- `folder_color` (TEXT DEFAULT 'indigo')
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

---

## 4. `sticky_notes`
Represents individual sticky note or dashboard note card properties.
- `note_uuid` (TEXT PRIMARY KEY)
- `parent_folder_uuid` (TEXT, FOREIGN KEY to `sticky_folders.folder_uuid` ON DELETE CASCADE)
- `note_title` (TEXT)
- `note_theme_preset` (TEXT)
- `note_view_mode` (TEXT DEFAULT 'markdown')
- `note_markdown_content` (TEXT)
- `placement_x_pos` (INTEGER)
- `placement_y_pos` (INTEGER)
- `geometry_width` (INTEGER)
- `geometry_height` (INTEGER)
- `is_flagged` (INTEGER DEFAULT 0)
- `sort_order` (INTEGER DEFAULT 0)
- `is_pinned` (INTEGER DEFAULT 0)
- `local_file_path` (TEXT)
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

---

## 5. `task_items`
Represents checklists inside note cards.
- `item_uuid` (TEXT PRIMARY KEY)
- `parent_note_uuid` (TEXT, FOREIGN KEY to `sticky_notes.note_uuid` ON DELETE CASCADE)
- `item_text_payload` (TEXT)
- `is_marked_completed` (INTEGER)
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

---

## 6. `events_log`
Represents calendar events associated with a notebook widget.
- `event_uuid` (TEXT PRIMARY KEY)
- `parent_note_uuid` (TEXT, FOREIGN KEY to `sticky_notes.note_uuid` ON DELETE CASCADE)
- `event_text` (TEXT)
- `event_time` (DATETIME DEFAULT CURRENT_TIMESTAMP)
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

---

## 7. `expense_log`
Represents financial expense logs associated with a notebook widget.
- `expense_uuid` (TEXT PRIMARY KEY)
- `parent_note_uuid` (TEXT, FOREIGN KEY to `sticky_notes.note_uuid` ON DELETE CASCADE)
- `expense_amount` (REAL)
- `expense_category` (TEXT)
- `expense_description` (TEXT)
- `expense_date` (TEXT DEFAULT CURRENT_DATE)
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

---

## 8. `vcs_commits`
Represents local git-like snapshots (VCS history) for individual notes.
- `commit_uuid` (TEXT PRIMARY KEY)
- `parent_note_uuid` (TEXT, FOREIGN KEY to `sticky_notes.note_uuid` ON DELETE CASCADE)
- `commit_message` (TEXT)
- `note_title_snapshot` (TEXT)
- `note_content_snapshot` (TEXT)
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

---

## 9. Optimization Indexes
To maintain responsive queries, the database defines the following search indexes:
- `idx_vcs_parent_note` ON `vcs_commits(parent_note_uuid)`
- `idx_notes_parent_folder` ON `sticky_notes(parent_folder_uuid)`
- `idx_tasks_parent_note` ON `task_items(parent_note_uuid)`
- `idx_events_parent_note` ON `events_log(parent_note_uuid)`
- `idx_expenses_parent_note` ON `expense_log(parent_note_uuid)`
