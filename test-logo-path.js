const fs = require('fs');
const path = require('path');

console.log('🔍 Testing logo file paths...');
console.log('Current working directory:', process.cwd());
console.log('__dirname would be:', __dirname);

const possiblePaths = [
    path.join(__dirname, 'public/nbsclogo.png'),
    path.join(__dirname, 'SDMS-main/public/nbsclogo.png'),
    path.join(__dirname, 'image/nbsclogo.png'),
    path.join(__dirname, 'SDMS-main/image/nbsclogo.png'),
    path.join(process.cwd(), 'public/nbsclogo.png'),
    path.join(process.cwd(), 'SDMS-main/public/nbsclogo.png'),
    path.join(process.cwd(), 'image/nbsclogo.png'),
    path.join(process.cwd(), 'SDMS-main/image/nbsclogo.png')
];

console.log('\n📁 Checking possible logo paths:');
possiblePaths.forEach((testPath, index) => {
    const exists = fs.existsSync(testPath);
    console.log(`${index + 1}. ${exists ? '✅' : '❌'} ${testPath}`);
    if (exists) {
        const stats = fs.statSync(testPath);
        console.log(`   Size: ${stats.size} bytes`);
    }
});

// Also check what's in the current directory
console.log('\n📂 Contents of current directory:');
try {
    const files = fs.readdirSync('.');
    files.forEach(file => {
        const isDir = fs.statSync(file).isDirectory();
        console.log(`   ${isDir ? '📁' : '📄'} ${file}`);
    });
} catch (err) {
    console.log('   Error reading directory:', err.message);
}

// Check SDMS-main directory if it exists
if (fs.existsSync('SDMS-main')) {
    console.log('\n📂 Contents of SDMS-main directory:');
    try {
        const files = fs.readdirSync('SDMS-main');
        files.forEach(file => {
            const isDir = fs.statSync(path.join('SDMS-main', file)).isDirectory();
            console.log(`   ${isDir ? '📁' : '📄'} ${file}`);
        });
    } catch (err) {
        console.log('   Error reading SDMS-main directory:', err.message);
    }
}