/* eslint-env node */
import initSqlJs from 'sql.js';

const LATEST_SCHEMA_VERSION = 10;

export async function initializeLocalDatabase(ipcRenderer, defaultName, currentWindowId = 'main_notepad') {
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
        CREATE INDEX IF NOT EXISTS idx_vcs_parent_note ON vcs_commits(parent_note_uuid);
    `);

    // Create default folder
    db.run("INSERT OR IGNORE INTO sticky_folders (folder_uuid, folder_name) VALUES (?, ?)", ['folder_1', 'My Notebook']);

    db.run(`
        INSERT OR IGNORE INTO sticky_notes 
        (note_uuid, parent_folder_uuid, note_title, note_theme_preset, note_view_mode, note_markdown_content, placement_x_pos, placement_y_pos, geometry_width, geometry_height, is_pinned) 
        VALUES (?, 'folder_1', ?, 'yellow', 'markdown', '# Write ideas here...', 100, 100, 350, 420, 0)
    `, ['note_1', defaultName]);

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
            // Upgrade from 5 to 6: Add is_pinned column (master step)
            if (activeVersion < 6) {
                try {
                    db.run("ALTER TABLE sticky_widgets ADD COLUMN is_pinned INTEGER DEFAULT 0");
                    console.log("⚡ [Migration] Added is_pinned column to sticky_widgets.");
                } catch (e) {
                    console.error("Migration fallback (is_pinned already exists):", e);
                }
            }

            // Upgrade to 7: Add logging tables (notepad step)
            if (activeVersion < 7) {
                db.run(`
                    CREATE TABLE IF NOT EXISTS events_log (event_uuid TEXT PRIMARY KEY, parent_widget_uuid TEXT, event_text TEXT, event_time DATETIME DEFAULT CURRENT_TIMESTAMP, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(parent_widget_uuid) REFERENCES sticky_widgets(widget_uuid) ON DELETE CASCADE);
                    CREATE TABLE IF NOT EXISTS expense_log (expense_uuid TEXT PRIMARY KEY, parent_widget_uuid TEXT, expense_amount REAL, expense_category TEXT, expense_description TEXT, expense_date TEXT DEFAULT CURRENT_DATE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(parent_widget_uuid) REFERENCES sticky_widgets(widget_uuid) ON DELETE CASCADE);
                    CREATE TABLE IF NOT EXISTS vcs_commits (commit_uuid TEXT PRIMARY KEY, parent_widget_uuid TEXT, commit_message TEXT, widget_title_snapshot TEXT, widget_content_snapshot TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(parent_widget_uuid) REFERENCES sticky_widgets(widget_uuid) ON DELETE CASCADE);
                    CREATE INDEX IF NOT EXISTS idx_vcs_parent_widget ON vcs_commits(parent_widget_uuid);
                `);
                console.log("⚡ [Migration] Added events_log, expense_log, vcs_commits tables.");
            }

            // Upgrade to 8: Add is_flagged & sort_order (notepad step)
            if (activeVersion < 8) {
                try {
                    db.run("ALTER TABLE sticky_widgets ADD COLUMN is_flagged INTEGER DEFAULT 0");
                } catch (e) {
                    console.warn("Column is_flagged already exists:", e);
                }
                try {
                    db.run("ALTER TABLE sticky_widgets ADD COLUMN sort_order INTEGER DEFAULT 0");
                } catch (e) {
                    console.warn("Column sort_order already exists:", e);
                }
                console.log("⚡ [Migration] Added is_flagged and sort_order columns.");
            }

            // Upgrade to 9: Refactor sticky_widgets to sticky_notes (notepad step)
            if (activeVersion < 9) {
                db.run(`
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
                `);

                // Migrate data from widgets to notes table
                try {
                    let hasPinnedColumn = false;
                    try {
                        db.exec("SELECT is_pinned FROM sticky_widgets LIMIT 1");
                        hasPinnedColumn = true;
                    } catch (e) {
                        hasPinnedColumn = false;
                    }

                    if (hasPinnedColumn) {
                        db.run(`
                            INSERT INTO sticky_notes (note_uuid, parent_folder_uuid, note_title, note_theme_preset, note_view_mode, note_markdown_content, placement_x_pos, placement_y_pos, is_flagged, sort_order, is_pinned, created_at, updated_at)
                            SELECT widget_uuid, parent_folder_uuid, widget_title, widget_theme_preset, widget_view_mode, widget_markdown_content, placement_x_pos, placement_y_pos, is_flagged, sort_order, is_pinned, created_at, updated_at
                            FROM sticky_widgets;
                        `);
                    } else {
                        db.run(`
                            INSERT INTO sticky_notes (note_uuid, parent_folder_uuid, note_title, note_theme_preset, note_view_mode, note_markdown_content, placement_x_pos, placement_y_pos, is_flagged, sort_order, is_pinned, created_at, updated_at)
                            SELECT widget_uuid, parent_folder_uuid, widget_title, widget_theme_preset, widget_view_mode, widget_markdown_content, placement_x_pos, placement_y_pos, is_flagged, sort_order, 0, created_at, updated_at
                            FROM sticky_widgets;
                        `);
                    }
                    db.run("DROP TABLE IF EXISTS sticky_widgets;");
                } catch (e) {
                    console.log("[Migration] No sticky_widgets found or already migrated:", e);
                }

                // Migrate dependent tables
                const tablesToMigrate = [
                    {
                        oldName: 'task_items',
                        tempName: 'task_items_old',
                        createSql: `CREATE TABLE IF NOT EXISTS task_items (item_uuid TEXT PRIMARY KEY, parent_note_uuid TEXT, item_text_payload TEXT, is_marked_completed INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(parent_note_uuid) REFERENCES sticky_notes(note_uuid) ON DELETE CASCADE);`,
                        insertSql: `INSERT INTO task_items (item_uuid, parent_note_uuid, item_text_payload, is_marked_completed, created_at, updated_at) SELECT item_uuid, parent_widget_uuid, item_text_payload, is_marked_completed, created_at, updated_at FROM task_items_old;`
                    },
                    {
                        oldName: 'events_log',
                        tempName: 'events_log_old',
                        createSql: `CREATE TABLE IF NOT EXISTS events_log (event_uuid TEXT PRIMARY KEY, parent_note_uuid TEXT, event_text TEXT, event_time DATETIME DEFAULT CURRENT_TIMESTAMP, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(parent_note_uuid) REFERENCES sticky_notes(note_uuid) ON DELETE CASCADE);`,
                        insertSql: `INSERT INTO events_log (event_uuid, parent_note_uuid, event_text, event_time, created_at) SELECT event_uuid, parent_widget_uuid, event_text, event_time, created_at FROM events_log_old;`
                    },
                    {
                        oldName: 'expense_log',
                        tempName: 'expense_log_old',
                        createSql: `CREATE TABLE IF NOT EXISTS expense_log (expense_uuid TEXT PRIMARY KEY, parent_note_uuid TEXT, expense_amount REAL, expense_category TEXT, expense_description TEXT, expense_date TEXT DEFAULT CURRENT_DATE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(parent_note_uuid) REFERENCES sticky_notes(note_uuid) ON DELETE CASCADE);`,
                        insertSql: `INSERT INTO expense_log (expense_uuid, parent_note_uuid, expense_amount, expense_category, expense_description, expense_date, created_at) SELECT expense_uuid, parent_widget_uuid, expense_amount, expense_category, expense_description, expense_date, created_at FROM expense_log_old;`
                    },
                    {
                        oldName: 'vcs_commits',
                        tempName: 'vcs_commits_old',
                        createSql: `CREATE TABLE IF NOT EXISTS vcs_commits (commit_uuid TEXT PRIMARY KEY, parent_note_uuid TEXT, commit_message TEXT, note_title_snapshot TEXT, note_content_snapshot TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(parent_note_uuid) REFERENCES sticky_notes(note_uuid) ON DELETE CASCADE);`,
                        insertSql: `INSERT INTO vcs_commits (commit_uuid, parent_note_uuid, commit_message, note_title_snapshot, note_content_snapshot, created_at) SELECT commit_uuid, parent_widget_uuid, commit_message, widget_title_snapshot, widget_content_snapshot, created_at FROM vcs_commits_old;`
                    }
                ];

                tablesToMigrate.forEach(t => {
                    try {
                        db.run(`ALTER TABLE ${t.oldName} RENAME TO ${t.tempName};`);
                        db.run(t.createSql);
                        db.run(t.insertSql);
                        db.run(`DROP TABLE ${t.tempName};`);
                    } catch (e) {
                        console.log(`[Migration] Failed or already migrated table ${t.oldName}:`, e);
                    }
                });

                db.run(`CREATE INDEX IF NOT EXISTS idx_vcs_parent_note ON vcs_commits(parent_note_uuid);`);
                console.log("⚡ [Migration] Relocated sticky_widgets reference to sticky_notes schema.");
            }

            // Upgrade to 10: Sync is_pinned column onto sticky_notes (master + notepad unification step)
            if (activeVersion < 10) {
                try {
                    db.run("ALTER TABLE sticky_notes ADD COLUMN is_pinned INTEGER DEFAULT 0");
                    console.log("⚡ [Migration] Added is_pinned column to sticky_notes table.");
                } catch (e) {
                    console.warn("Migration: column is_pinned might already exist on sticky_notes:", e);
                }
            }

            db.run("INSERT OR IGNORE INTO sys_migrations (version_build) VALUES (?)", [LATEST_SCHEMA_VERSION]);
            console.log(`⚡ [Migration] Upgraded database to Version ${LATEST_SCHEMA_VERSION}.`);
        }
    } else {
        db.run(`
            INSERT OR IGNORE INTO sticky_notes 
            (note_uuid, parent_folder_uuid, note_title, note_theme_preset, note_view_mode, note_markdown_content, placement_x_pos, placement_y_pos, geometry_width, geometry_height, is_pinned) 
            VALUES (?, 'folder_1', ?, 'yellow', 'markdown', '# Write ideas here...', 100, 100, 350, 420, 0)
        `, ['note_1', defaultName]);
    }

    try {
        db.run("UPDATE sticky_notes SET note_view_mode = 'tasks' WHERE note_view_mode = 'checklist'");
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