const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔍 CHECKING SQLITE DATABASE STRUCTURE');
console.log('=====================================');

const dbPath = path.join(__dirname, 'prisma', 'dev.db');
console.log(`📂 Database path: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    return;
  }
  console.log('✅ Connected to SQLite database');
});

// Check tables
db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
  if (err) {
    console.error('❌ Error getting tables:', err.message);
    return;
  }
  
  console.log('\n📊 TABLES FOUND:');
  if (rows.length === 0) {
    console.log('❌ No tables found in database');
  } else {
    rows.forEach((row) => {
      console.log(`  ✅ ${row.name}`);
    });
  }
  
  // Check User table data if exists
  db.all("SELECT COUNT(*) as count FROM User", [], (err, rows) => {
    if (err) {
      console.log('❌ User table not found or error:', err.message);
    } else {
      console.log(`\n👥 USER TABLE: ${rows[0].count} records`);
    }
    
    // Check Report table data if exists
    db.all("SELECT COUNT(*) as count FROM Report", [], (err, rows) => {
      if (err) {
        console.log('❌ Report table not found or error:', err.message);
      } else {
        console.log(`📋 REPORT TABLE: ${rows[0].count} records`);
      }
      
      db.close();
    });
  });
});
