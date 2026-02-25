const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function fixSchema() {
    const db = await open({
        filename: path.join(__dirname, 'database.sqlite'),
        driver: sqlite3.Database
    });

    try {
        await db.exec('ALTER TABLE users ADD COLUMN current_session_id TEXT');
        console.log('Added current_session_id column');
    } catch (e) {
        console.log('current_session_id column already exists or table busy');
    }

    try {
        await db.exec('ALTER TABLE users ADD COLUMN last_seen DATETIME');
        console.log('Added last_seen column');
    } catch (e) {
        console.log('last_seen column already exists or table busy');
    }

    // Clear any stuck sessions
    await db.run('UPDATE users SET current_session_id = NULL, last_seen = NULL');
    console.log('Cleared all active sessions');

    process.exit(0);
}

fixSchema().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
