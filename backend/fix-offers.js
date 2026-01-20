const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'agro_marketplace',
  password: 'admin123',
  port: 5432,
});

async function fixOffersTable() {
  const client = await pool.connect();
  
  try {
    console.log('Checking current offers table structure...\n');
    
    // First, check what columns exist
    const existingColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'offers' 
      ORDER BY ordinal_position
    `);
    
    console.log('Current columns in offers table:');
    existingColumns.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });
    console.log('\n');
    
    // Now add missing columns one by one
    const columnsToAdd = [
      { name: 'payment_term', type: 'VARCHAR(50)' },
      { name: 'payment_method', type: 'VARCHAR(50)' },
      { name: 'has_buyer_certification', type: 'BOOLEAN DEFAULT FALSE' }
    ];
    
    console.log('Adding missing columns...\n');
    
    for (const column of columnsToAdd) {
      const exists = existingColumns.rows.some(row => row.column_name === column.name);
      
      if (!exists) {
        console.log(`Adding column: ${column.name}`);
        await client.query(`ALTER TABLE offers ADD COLUMN ${column.name} ${column.type}`);
      } else {
        console.log(`Column already exists: ${column.name}`);
      }
    }
    
    console.log('\n✅ Offers table fixed successfully!\n');
    
    // Verify final structure
    const finalColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'offers' 
      ORDER BY ordinal_position
    `);
    
    console.log('Final columns in offers table:');
    finalColumns.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('Error fixing offers table:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

fixOffersTable();
