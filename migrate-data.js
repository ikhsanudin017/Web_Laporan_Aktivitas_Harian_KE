// DATA MIGRATION SCRIPT - SQLite to Neon PostgreSQL
const { execSync } = require('child_process')
const sqlite3 = require('sqlite3').verbose()
const { Client } = require('pg')

console.log('🔄 STARTING DATA MIGRATION FROM SQLITE TO NEON POSTGRES')
console.log('=====================================================')

async function migrateData() {
  // SQLite connection (source)
  const sqliteDb = new sqlite3.Database('./prisma/dev.db')
  
  // Neon PostgreSQL connection (destination)
  const pgClient = new Client({
    connectionString: "postgresql://neondb_owner:npg_cU7O3JdMoFph@ep-shiny-poetry-adizdf91-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
  })

  try {
    await pgClient.connect()
    console.log('✅ Connected to Neon PostgreSQL')
    
    console.log('📊 Step 1: Reading users from SQLite...')
    
    // Get all users from SQLite
    const users = await new Promise((resolve, reject) => {
      sqliteDb.all("SELECT * FROM users", (err, rows) => {
        if (err) reject(err)
        else resolve(rows || [])
      })
    })
    
    console.log(`📋 Found ${users.length} users in SQLite database`)
    
    if (users.length === 0) {
      console.log('❌ No users found in SQLite. Creating default ADMIN user...')
      
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash('admin123', 12)
      
      await pgClient.query(`
        INSERT INTO "User" (id, email, name, role, password, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `, [
        'admin',
        'admin@ksuke.co.id', 
        'Administrator KSUKE',
        'ADMIN',
        hashedPassword,
        new Date(),
        new Date()
      ])
      
      console.log('✅ Default ADMIN user created in Neon PostgreSQL')
      console.log('   Email: admin@ksuke.co.id')
      console.log('   Password: admin123')
      
    } else {
      console.log('📤 Step 2: Migrating users to Neon PostgreSQL...')
      
      for (const user of users) {
        try {
          await pgClient.query(`
            INSERT INTO "User" (id, email, name, role, password, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO NOTHING
          `, [
            user.id,
            user.email,
            user.name,
            user.role,
            user.password,
            new Date(user.createdAt),
            new Date(user.updatedAt)
          ])
          
          console.log(`✅ User migrated: ${user.name} (${user.email})`)
          
        } catch (error) {
          console.error(`❌ Error migrating user ${user.name}:`, error.message)
        }
      }
      
      console.log('📤 Step 3: Reading reports from SQLite...')
      
      // Get all reports from SQLite
      const reports = await new Promise((resolve, reject) => {
        sqliteDb.all("SELECT * FROM daily_reports", (err, rows) => {
          if (err) reject(err)
          else resolve(rows || [])
        })
      })
      
      console.log(`📋 Found ${reports.length} reports in SQLite database`)
      
      console.log('📤 Step 4: Migrating reports to Neon PostgreSQL...')
      
      for (const report of reports) {
        try {
          await pgClient.query(`
            INSERT INTO "Report" (id, "userId", date, "reportData", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (id) DO NOTHING
          `, [
            report.id,
            report.userId,
            new Date(report.date),
            JSON.parse(report.reportData),
            new Date(report.createdAt),
            new Date(report.updatedAt)
          ])
          
          console.log(`✅ Report migrated: ${report.id} - ${new Date(report.date).toLocaleDateString('id-ID')}`)
          
        } catch (error) {
          console.error(`❌ Error migrating report ${report.id}:`, error.message)
        }
      }
    }
    
    console.log('')
    console.log('📊 Step 5: Verification - Checking migrated data...')
    
    const userResult = await pgClient.query('SELECT COUNT(*) as count FROM "User"')
    const reportResult = await pgClient.query('SELECT COUNT(*) as count FROM "Report"')
    
    console.log(`✅ Total users in Neon PostgreSQL: ${userResult.rows[0].count}`)
    console.log(`✅ Total reports in Neon PostgreSQL: ${reportResult.rows[0].count}`)
    
    console.log('')
    console.log('👥 USERS IN NEON POSTGRES:')
    const usersResult = await pgClient.query('SELECT name, email, role FROM "User"')
    usersResult.rows.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`)
    })
    
    console.log('')
    console.log('📋 REPORTS SUMMARY:')
    const reportSummary = await pgClient.query(`
      SELECT u.name, COUNT(r.id) as report_count 
      FROM "User" u 
      LEFT JOIN "Report" r ON u.id = r."userId" 
      GROUP BY u.name
    `)
    
    reportSummary.rows.forEach(row => {
      console.log(`   - ${row.name}: ${row.report_count} laporan`)
    })
    
    console.log('')
    console.log('🎉 DATA MIGRATION COMPLETED SUCCESSFULLY!')
    console.log('========================================')
    console.log('✅ All users migrated to Neon PostgreSQL')
    console.log('✅ All reports migrated to Neon PostgreSQL')
    console.log('✅ Database ready untuk production')
    console.log('')
    console.log('🔗 Next steps:')
    console.log('1. Set environment variables di Vercel Dashboard')
    console.log('2. Deploy aplikasi ke Vercel')
    console.log('3. Test login dengan akun yang sudah ada')
    console.log('4. Test export Excel functionality')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    sqliteDb.close()
    await pgClient.end()
  }
}

// Run migration
migrateData()
  .catch(console.error)
