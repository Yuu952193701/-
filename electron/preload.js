const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  loadAllData: () => ipcRenderer.invoke('load-all-data'),
  saveData: (key, value) => ipcRenderer.invoke('save-data', key, value),
  createBackup: (type) => ipcRenderer.invoke('create-backup', type),
  restoreBackup: (filename) => ipcRenderer.invoke('restore-backup', filename),
  deleteBackup: (filename) => ipcRenderer.invoke('delete-backup', filename),
  getBackups: () => ipcRenderer.invoke('get-backups'),
  getAppPathInfo: () => ipcRenderer.invoke('get-app-path-info')
});
