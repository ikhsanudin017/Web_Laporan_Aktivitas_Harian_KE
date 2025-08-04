const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔍 ANALYZING ACTUAL DATABASE STRUCTURE');
console.log('======================================');

const dbPath = path.join(__dirname, 'prisma', 'dev.db');
const db = new sqlite3.Database(dbPath);

// Check users table
db.all("SELECT COUNT(*) as count FROM users", [], (err, rows) => {
  if (err) {
    console.error('❌ Error reading users:', err.message);
  } else {
    console.log(`👥 USERS TABLE: ${rows[0].count} records`);
    
    // Get sample user data
    db.all("SELECT * FROM users LIMIT 3", [], (err, users) => {
      if (err) {
        console.error('❌ Error getting user samples:', err.message);
      } else {
        console.log('\n📋 SAMPLE USERS:');
        users.forEach(user => {
          console.log(`  🔹 ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Role: ${user.role}`);
        });
      }
    });
  }
});

// Check daily_reports table
db.all("SELECT COUNT(*) as count FROM daily_reports", [], (err, rows) => {
  if (err) {
    console.error('❌ Error reading daily_reports:', err.message);
  } else {
    console.log(`\n📊 DAILY_REPORTS TABLE: ${rows[0].count} records`);
    
    // Get sample report data
    db.all("SELECT * FROM daily_reports LIMIT 3", [], (err, reports) => {
      if (err) {
        console.error('❌ Error getting report samples:', err.message);
      } else {
        console.log('\n📋 SAMPLE REPORTS:');
        reports.forEach(report => {
          console.log(`  🔹 ID: ${report.id}, Date: ${report.date}, User: ${report.user_id}, Activities: ${report.activities ? report.activities.substring(0, 50) + '...' : 'N/A'}`);
        });
      }
      
      db.close();
    });
  }
});
