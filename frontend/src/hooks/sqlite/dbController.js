/* eslint-env node */
import initSqlJs from 'sql.js';

const LATEST_SCHEMA_VERSION = 6;

export async function initializeLocalDatabase(ipcRenderer, defaultName, currentWindowId = 'widget_1') {
    try {
        const SQL = await initSqlJs({ locateFile: () => `./sql-wasm.wasm` });
        let activeDb;
        const diskFileBuffer = ipcRenderer ? await ipcRenderer.invoke('load-db-file') : null;

        if (diskFileBuffer) {
            activeDb = new SQL.Database(diskFileBuffer);
            executeDatabaseUpgrades(activeDb, defaultName, currentWindowId);
        } else {
            activeDb = new SQL.Database();
            buildNormalizedSchema(activeDb, defaultName, currentWindowId);
        }
        return activeDb;
    } catch (err) {
        if (ipcRenderer) {
            ipcRenderer.send('log-ui-event', {
                level: 'FATAL', moduleName: 'DB_Controller', message: err.message, stack: err.stack
            });
        }
        throw err;
    }
}

function buildNormalizedSchema(db, defaultName, currentWindowId) {
    db.run(`
        CREATE TABLE IF NOT EXISTS sys_migrations (migration_id INTEGER PRIMARY KEY AUTOINCREMENT, version_build INTEGER UNIQUE, executed_at DATETIME DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS sticky_folders (folder_uuid TEXT PRIMARY KEY, folder_name TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS sticky_widgets (widget_uuid TEXT PRIMARY KEY, parent_folder_uuid TEXT, widget_title TEXT, widget_theme_preset TEXT, widget_view_mode TEXT DEFAULT 'tasks', widget_markdown_content TEXT, placement_x_pos INTEGER, placement_y_pos INTEGER, geometry_width INTEGER, geometry_height INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, is_pinned INTEGER DEFAULT 0, FOREIGN KEY(parent_folder_uuid) REFERENCES sticky_folders(folder_uuid) ON DELETE CASCADE);
        CREATE TABLE IF NOT EXISTS task_items (item_uuid TEXT PRIMARY KEY, parent_widget_uuid TEXT, item_text_payload TEXT, is_marked_completed INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(parent_widget_uuid) REFERENCES sticky_widgets(widget_uuid) ON DELETE CASCADE);
    `);

    // Create default folder
    db.run("INSERT OR IGNORE INTO sticky_folders (folder_uuid, folder_name) VALUES (?, ?)", ['folder_1', 'My Notebook']);

    db.run(`
        INSERT OR IGNORE INTO sticky_widgets 
        (widget_uuid, parent_folder_uuid, widget_title, widget_theme_preset, widget_view_mode, widget_markdown_content, placement_x_pos, placement_y_pos, geometry_width, geometry_height, is_pinned) 
        VALUES (?, 'folder_1', ?, 'yellow', 'tasks', '# Write ideas here...', 100, 100, 350, 420, 0)
    `, [currentWindowId, defaultName]);

    db.run("INSERT OR IGNORE INTO sys_migrations (version_build) VALUES (?)", [LATEST_SCHEMA_VERSION]);
}

function executeDatabaseUpgrades(db, defaultName, currentWindowId) {
    db.run("CREATE TABLE IF NOT EXISTS sys_migrations (migration_id INTEGER PRIMARY KEY AUTOINCREMENT, version_build INTEGER UNIQUE, executed_at DATETIME DEFAULT CURRENT_TIMESTAMP)");

    let activeVersion = 0;
    try {
        const migrationRes = db.exec("SELECT max(version_build) FROM sys_migrations");
        if (migrationRes.length > 0 && migrationRes[0].values) {
            activeVersion = parseInt(migrationRes[0].values[0][0] || 0, 10);
        }
    } catch { activeVersion = 1; }

    if (activeVersion < LATEST_SCHEMA_VERSION) {
        if (activeVersion < 5) {
            // Drop outdated legacy schemas and construct clean, refactored production tables
            db.run(`DROP TABLE IF EXISTS task_items; DROP TABLE IF EXISTS sticky_widgets; DROP TABLE IF EXISTS sticky_folders; DROP TABLE IF EXISTS tasks; DROP TABLE IF EXISTS widgets; DROP TABLE IF EXISTS sticky_meta; DROP TABLE IF EXISTS note_contents;`);
            buildNormalizedSchema(db, defaultName, currentWindowId);
            console.log(`⚡ [Migration] Database naming conventions refactored completely. Upgraded to Version ${LATEST_SCHEMA_VERSION}.`);
        } else {
            // Upgrade from 5 to 6: Add is_pinned column
            try {
                db.run("ALTER TABLE sticky_widgets ADD COLUMN is_pinned INTEGER DEFAULT 0");
                console.log("⚡ [Migration] Added is_pinned column to sticky_widgets.");
            } catch (e) {
                console.error("Migration: column is_pinned might already exist:", e);
            }
            db.run("INSERT OR IGNORE INTO sys_migrations (version_build) VALUES (?)", [LATEST_SCHEMA_VERSION]);
        }
    } else {
        db.run(`
            INSERT OR IGNORE INTO sticky_widgets 
            (widget_uuid, parent_folder_uuid, widget_title, widget_theme_preset, widget_view_mode, widget_markdown_content, placement_x_pos, placement_y_pos, geometry_width, geometry_height, is_pinned) 
            VALUES (?, 'folder_1', ?, 'yellow', 'tasks', '# Write ideas here...', 100, 100, 350, 420, 0)
        `, [currentWindowId, defaultName]);
    }

    try {
        db.run("UPDATE sticky_widgets SET widget_view_mode = 'tasks' WHERE widget_view_mode = 'checklist'");
    } catch (e) {
        console.error("Migration fallback error:", e);
    }
}

export async function persistDatabaseToDisk(ipcRenderer, targetDb) {
    if (!targetDb || !ipcRenderer) return;
    try {
        const rawUint8Array = targetDb.export();
        await ipcRenderer.invoke('save-db-file', rawUint8Array);
        ipcRenderer.send('broadcast-db-update');
    } catch (err) {
        console.error("Failed writing binary buffer array back to data file:", err);
    }
}