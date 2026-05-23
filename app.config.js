// app.config.js
module.exports = {
    // App Branding Configurations
    appName: "StickyFlow Desktop",
    taskManagerServiceName: "StickyFlow_TaskCore_Service",
    appVersion: "1.0.0",

    // Asset Asset Mapping Routes
    // (Note: paths are relative to the project execution environment root)
    icons: {
        appIcon: "./electron/assets/app-icon.ico",       // Desktop app profile icon
        trayIcon: "./electron/assets/hero.png",     // Taskbar system tray icon
        taskbarIcon: "./electron/assets/vite.svg" // Operational dock taskbar icon
    },

    // Window Layout Defaults
    windowDefaults: {
        width: 350,
        height: 420,
        alwaysOnTop: true,
        resizable: true
    }
};
