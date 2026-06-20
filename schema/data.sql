-- data.sql
-- Static assets and template data seed records (Schema Version 11)

-- Insert default folder
INSERT OR IGNORE INTO sticky_folders (folder_uuid, folder_name) 
VALUES ('folder_1', 'My Notebook');

-- Insert default note
INSERT OR IGNORE INTO sticky_notes 
(note_uuid, parent_folder_uuid, note_title, note_theme_preset, note_view_mode, note_markdown_content, placement_x_pos, placement_y_pos, geometry_width, geometry_height, is_pinned) 
VALUES ('note_1', 'folder_1', 'New Note', 'yellow', 'markdown', '# Write ideas here...', 100, 100, 350, 420, 0);

-- Insert migration record
INSERT OR IGNORE INTO sys_migrations (version_build) 
VALUES (11);
