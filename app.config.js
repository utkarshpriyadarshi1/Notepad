// app.config.js
module.exports = {
    // App Branding Configurations
    appName: "Sticky Notes",
    defaultTitle: "New Sticky Note",
    dbFileName: "stickyflow_data.db",
    colorThemes: {
        glass: "bg-white/40 border-white/20 text-slate-900 header-white/30 glass-effect",
        white: "bg-white/40 border-white/20 text-slate-900 header-white/30 glass-effect",
        black: "bg-black border-white/20 text-slate-900 header-white/30 text-white",
        yellow: "bg-amber-200/90 border-amber-300/50 text-amber-900 header-amber-300/60",
        pink: "bg-rose-200/90 border-rose-300/50 text-rose-900 header-rose-300/60",
        blue: "bg-sky-200/90 border-sky-300/50 text-sky-900 header-sky-300/60",
        green: "bg-emerald-200/90 border-emerald-300/50 text-emerald-900 header-emerald-300/60"
    },
    taskManagerServiceName: "StickyFlow_TaskCore_Service", appVersion: "1.0.0",

    // Asset Asset Mapping Routes
    // (Note: paths are relative to the project execution environment root)
    icons: {
        appIcon: "./electron/assets/app-icon.ico", // app-icon.ico",       // Desktop app profile icon
        trayIcon: "./electron/assets/app-logo.png",     // Taskbar system tray icon
        taskbarIcon: "./electron/assets/app-logo.png" // Operational dock taskbar icon
    },

    // Window Layout Defaults
    windowDefaults: {
        width: 350, height: 420, alwaysOnTop: true, resizable: true
    }
};
