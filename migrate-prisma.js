const { PrismaClient } = require('@prisma/client');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

console.log('🔄 PRISMA-BASED DATA MIGRATION');
console.log('==============================');

const prisma = new PrismaClient();

async function migrateData() {
  try {
    console.log('✅ Connected to PostgreSQL via Prisma');

    // SQLite connection
    const sqliteDb = new sqlite3.Database(path.join(__dirname, 'prisma', 'dev.db'));

    // STEP 1: Read users from SQLite
    console.log('\n📊 Step 1: Reading users from SQLite...');
    const users = await new Promise((resolve, reject) => {
      sqliteDb.all("SELECT * FROM users", (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    console.log(`📋 Found ${users.length} users in SQLite database`);

    // STEP 2: Migrate users
    console.log('👥 Step 2: Migrating users to PostgreSQL...');
    for (const user of users) {
      try {
        const userData = {
          id: user.id,
          email: user.email,
          name: user.name || user.username || user.email.split('@')[0],
          role: user.role,
          password: user.password || await bcrypt.hash('password123', 12),
          createdAt: user.created_at ? new Date(user.created_at) : new Date(),
          updatedAt: user.updated_at ? new Date(user.updated_at) : new Date()
        };

        await prisma.user.upsert({
          where: { id: userData.id },
          update: userData,
          create: userData
        });

        console.log(`✅ User migrated: ${userData.name} (${userData.email}) - ${userData.role}`);

      } catch (error) {
        console.error(`❌ Error migrating user ${user.email}:`, error.message);
      }
    }

    // STEP 3: Read reports from SQLite
    console.log('\n📊 Step 3: Reading reports from SQLite...');
    const reports = await new Promise((resolve, reject) => {
      sqliteDb.all("SELECT * FROM daily_reports", (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    console.log(`📋 Found ${reports.length} reports in SQLite database`);

    // STEP 4: Migrate reports
    console.log('📋 Step 4: Migrating reports to PostgreSQL...');
    for (const report of reports) {
      try {
        const reportData = {
          id: report.id,
          userId: report.user_id,
          date: report.date ? new Date(parseInt(report.date)) : new Date(),
          reportData: report.activities ? { activities: report.activities } : {},
          createdAt: report.created_at ? new Date(report.created_at) : new Date(),
          updatedAt: report.updated_at ? new Date(report.updated_at) : new Date()
        };

        await prisma.dailyReport.upsert({
          where: { id: reportData.id },
          update: reportData,
          create: reportData
        });

        console.log(`✅ Report migrated: ${reportData.id} - ${reportData.date.toLocaleDateString('id-ID')}`);

      } catch (error) {
        console.error(`❌ Error migrating report ${report.id}:`, error.message);
      }
    }

    // STEP 5: Verification
    console.log('\n✅ MIGRATION COMPLETED! Verifying data...');
    console.log('==========================================');

    const userCount = await prisma.user.count();
    console.log(`👥 Users in PostgreSQL: ${userCount}`);

    const reportCount = await prisma.dailyReport.count();
    console.log(`📋 Reports in PostgreSQL: ${reportCount}`);

    console.log('\n👥 USER DETAILS:');
    const userDetails = await prisma.user.findMany({
      select: { name: true, email: true, role: true },
      orderBy: { role: 'asc' }
    });

    userDetails.forEach(user => {
      console.log(`   ✅ ${user.name} (${user.email}) - ${user.role}`);
    });

    console.log('\n📋 REPORT SUMMARY BY USER:');
    const reportSummary = await prisma.user.findMany({
      include: {
        reports: {
          select: { id: true }
        }
      },
      orderBy: { role: 'asc' }
    });

    reportSummary.forEach(user => {
      console.log(`   📊 ${user.name} (${user.role}): ${user.reports.length} laporan`);
    });

    console.log('\n🎉 MIGRATION SUCCESS! Database is now populated with all your local data.');

    sqliteDb.close();

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateData();
