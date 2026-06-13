const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'frontend', 'dist');

console.log('🧼 Cleaning workspace build directories...');

function deleteFolderRecursive(directoryPath) {
    if (fs.existsSync(directoryPath)) {
        fs.readdirSync(directoryPath).forEach((file) => {
            const curPath = path.join(directoryPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                // recurse
                deleteFolderRecursive(curPath);
            } else {
                // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(directoryPath);
    }
}

try {
    if (fs.existsSync(distDir)) {
        console.log(`Deleting: ${distDir}`);
        deleteFolderRecursive(distDir);
        console.log('✅ Cleaned frontend dist and build folders.');
    } else {
        console.log('✨ No build folders found to clean.');
    }
} catch (error) {
    console.error('❌ Failed to clean directories:', error.message);
}
