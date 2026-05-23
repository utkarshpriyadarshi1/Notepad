import initSqlJs from 'sql.js';

let dbInstance = null;

// Initialize the pure Wasm offline SQLite DB
export async function initDatabase() {
  if (dbInstance) return dbInstance;
  
  const SQL = await initSqlJs({
    locateFile: file => `https://js.org{file}`
  });
  
  // Try loading previous DB state from LocalStorage binary string, or create fresh
  const savedDb = localStorage.getItem('sqlite_backup');
  if (savedDb) {
    const u8 = Uint8Array.from(atob(savedDb), c => c.charCodeAt(0));
    dbInstance = new SQL.Database(u8);
  } else {
    dbInstance = new SQL.Database();
    // Execute structural schema setup
    dbInstance.run(`
      CREATE TABLE IF NOT EXISTS sticky_notes (id TEXT PRIMARY KEY, title TEXT, color_theme TEXT);
      CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, note_id TEXT, task_text TEXT, is_completed INTEGER);
    `);
    persistDatabase(dbInstance);
  }
  return dbInstance;
}

// Persist SQLite data into LocalStorage as a portable base64 string
export function persistDatabase(db) {
  const binaryArray = db.export();
  const base64String = btoa(String.fromCharCode.apply(null, binaryArray));
  localStorage.setItem('sqlite_backup', base64String);
}
