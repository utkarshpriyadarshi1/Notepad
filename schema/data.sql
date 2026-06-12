-- data.sql
-- Static assets and template data seed records

-- Insert default folder
INSERT OR IGNORE INTO sticky_folders (folder_uuid, folder_name) 
VALUES ('folder_1', 'My Notebook');

-- Insert default widget
INSERT OR IGNORE INTO sticky_widgets 
(widget_uuid, parent_folder_uuid, widget_title, widget_theme_preset, widget_view_mode, widget_markdown_content, placement_x_pos, placement_y_pos, geometry_width, geometry_height) 
VALUES ('widget_1', 'folder_1', 'New Sticky Note', 'yellow', 'tasks', '# Write ideas here...', 100, 100, 350, 420);

-- Insert migration record
INSERT OR IGNORE INTO sys_migrations (version_build) 
VALUES (5);
