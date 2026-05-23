import { initDatabase, persistDatabase } from './db';

// EXPORT FUNCTION: Converts database data into a single downloadable JSON file
export async function exportUserData() {
  const db = await initDatabase();
  
  // Extract rows cleanly
  const notesResult = db.exec("SELECT * FROM sticky_notes");
  const tasksResult = db.exec("SELECT * FROM tasks");

  const backupData = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    sticky_notes: notesResult[0] ? notesResult[0].values : [],
    tasks: tasksResult[0] ? tasksResult[0].values : []
  };

  // Convert to JSON blob
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `sticky_tasks_backup_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// IMPORT FUNCTION: Replaces current local state with structural file data
export async function importUserData(jsonFileContent) {
  try {
    const parsed = JSON.parse(jsonFileContent);
    const db = await initDatabase();

    // Clear current database content safely
    db.run("DELETE FROM tasks; DELETE FROM sticky_notes;");

    // Insert imported notes
    if (parsed.sticky_notes) {
      parsed.sticky_notes.forEach(note => {
        db.run("INSERT INTO sticky_notes VALUES (?, ?, ?)", note);
      });
    }

    // Insert imported tasks
    if (parsed.tasks) {
      parsed.tasks.forEach(task => {
        db.run("INSERT INTO tasks VALUES (?, ?, ?, ?)", task);
      });
    }

    // Lock changes in local storage
    persistDatabase(db);
    return true;
  } catch (error) {
    console.error("Failed to parse or map backup profile:", error);
    return false;
  }
}
