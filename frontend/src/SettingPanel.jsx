import React from 'react';
import { exportUserData, importUserData } from './services/db';

export default function SettingsPanel() {
  
  const handleFileImport = (event) => {
    const fileReader = new FileReader();
    fileReader.onload = async (e) => {
      const success = await importUserData(e.target.result);
      if (success) {
        alert("Data successfully imported! App will refresh.");
        window.location.reload();
      } else {
        alert("Invalid backup file layout.");
      }
    };
    fileReader.readAsText(event.target.files[0]);
  };

  return (
    <div className="p-4 bg-slate-800 text-white rounded-lg flex flex-col gap-3">
      <h3 className="text-sm font-bold">Data Management</h3>
      <div className="flex gap-4">
        <button 
          onClick={exportUserData}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-xs rounded font-medium"
        >
          📥 Export Backup (.json)
        </button>
        
        <label className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-xs rounded font-medium cursor-pointer">
          📤 Import Backup
          <input 
            type="file" 
            accept=".json" 
            onChange={handleFileImport} 
            className="hidden" 
          />
        </label>
      </div>
    </div>
  );
}
