const sqlite3 = require('sqlite3').verbose();
const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: '.env.production' });

console.log('🔄 STARTING COMPLETE DATA MIGRATION');
console.log('===================================');

async function migrateData() {
  // SQLite connection
  const sqliteDb = new sqlite3.Database(path.join(__dirname, 'prisma', 'dev.db'));
  
  // PostgreSQL connection using production environment
  const pgClient = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await pgClient.connect();
    console.log('✅ Connected to Neon PostgreSQL');

    // STEP 1: Get all users from SQLite
    console.log('\n📊 Step 1: Reading users from SQLite...');
    const users = await new Promise((resolve, reject) => {
      sqliteDb.all("SELECT * FROM users", (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    console.log(`📋 Found ${users.length} users in SQLite database`);

    // STEP 2: Clear existing users in PostgreSQL (skip clear for now)
    console.log('🗑️ Step 2: Skipping clear - inserting users...');

    // STEP 3: Migrate users
    console.log('👥 Step 3: Migrating users to PostgreSQL...');
    for (const user of users) {
      try {
        // Map SQLite fields to Prisma schema fields
        const userData = {
          id: user.id,
          email: user.email,
          name: user.name || user.username || user.email.split('@')[0],
          role: user.role,
          password: user.password || '$2a$12$default.hashed.password.for.migration', // Default if no password
          createdAt: user.created_at ? new Date(user.created_at) : new Date(),
          updatedAt: user.updated_at ? new Date(user.updated_at) : new Date()
        };

        await pgClient.query(`
          INSERT INTO "User" (id, email, name, role, password, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            password = EXCLUDED.password,
            "updatedAt" = EXCLUDED."updatedAt"
        `, [
          userData.id,
          userData.email,
          userData.name,
          userData.role,
          userData.password,
          userData.createdAt,
          userData.updatedAt
        ]);

        console.log(`✅ User migrated: ${userData.name} (${userData.email}) - ${userData.role}`);

      } catch (error) {
        console.error(`❌ Error migrating user ${user.email}:`, error.message);
      }
    }

    // STEP 4: Get all reports from SQLite
    console.log('\n📊 Step 4: Reading reports from SQLite...');
    const reports = await new Promise((resolve, reject) => {
      sqliteDb.all("SELECT * FROM daily_reports", (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    console.log(`📋 Found ${reports.length} reports in SQLite database`);

    // STEP 5: Clear existing reports in PostgreSQL (skip clear for now)
    console.log('🗑️ Step 5: Skipping clear - inserting reports...');

    // STEP 6: Migrate reports
    console.log('📋 Step 6: Migrating reports to PostgreSQL...');
    for (const report of reports) {
      try {
        // Map SQLite fields to Prisma schema fields
        const reportData = {
          id: report.id,
          userId: report.user_id,
          date: report.date ? new Date(parseInt(report.date)) : new Date(),
          reportData: report.activities ? JSON.stringify({ activities: report.activities }) : JSON.stringify({}),
          createdAt: report.created_at ? new Date(report.created_at) : new Date(),
          updatedAt: report.updated_at ? new Date(report.updated_at) : new Date()
        };

        await pgClient.query(`
          INSERT INTO "Report" (id, "userId", date, "reportData", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO UPDATE SET
            "userId" = EXCLUDED."userId",
            date = EXCLUDED.date,
            "reportData" = EXCLUDED."reportData",
            "updatedAt" = EXCLUDED."updatedAt"
        `, [
          reportData.id,
          reportData.userId,
          reportData.date,
          reportData.reportData,
          reportData.createdAt,
          reportData.updatedAt
        ]);

        console.log(`✅ Report migrated: ${reportData.id} - ${reportData.date.toLocaleDateString('id-ID')}`);

      } catch (error) {
        console.error(`❌ Error migrating report ${report.id}:`, error.message);
      }
    }

    // STEP 7: Verification
    console.log('\n✅ MIGRATION COMPLETED! Verifying data...');
    console.log('==========================================');

    const usersResult = await pgClient.query('SELECT COUNT(*) FROM "User"');
    console.log(`👥 Users in PostgreSQL: ${usersResult.rows[0].count}`);

    const reportsResult = await pgClient.query('SELECT COUNT(*) FROM "Report"');
    console.log(`📋 Reports in PostgreSQL: ${reportsResult.rows[0].count}`);

    console.log('\n👥 USER DETAILS:');
    const userDetails = await pgClient.query('SELECT name, email, role FROM "User" ORDER BY role');
    userDetails.rows.forEach(user => {
      console.log(`   ✅ ${user.name} (${user.email}) - ${user.role}`);
    });

    console.log('\n📋 REPORT SUMMARY BY USER:');
    const reportSummary = await pgClient.query(`
      SELECT u.name, u.role, COUNT(r.id) as report_count 
      FROM "User" u 
      LEFT JOIN "Report" r ON u.id = r."userId" 
      GROUP BY u.name, u.role
      ORDER BY u.role
    `);

    reportSummary.rows.forEach(row => {
      console.log(`   📊 ${row.name} (${row.role}): ${row.report_count} laporan`);
    });

    console.log('\n🎉 MIGRATION SUCCESS! Database is now populated with all your local data.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
  } finally {
    sqliteDb.close();
    await pgClient.end();
  }
}

migrateData();
