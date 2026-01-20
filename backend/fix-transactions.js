const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'agro_marketplace',
  password: 'admin123',
  port: 5432,
});

async function fixTransactionsTable() {
  const client = await pool.connect();
  
  try {
    console.log('Checking current transactions table structure...\n');
    
    // First, check what columns exist
    const existingColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      ORDER BY ordinal_position
    `);
    
    console.log('Current columns in transactions table:');
    existingColumns.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });
    console.log('\n');
    
    // Now add missing columns one by one
    const columnsToAdd = [
      { name: 'offer_id', type: 'INTEGER REFERENCES offers(id)' },
      { name: 'agreed_price_per_kg', type: 'DECIMAL(10,2)' },
      { name: 'estimated_weight', type: 'DECIMAL(10,2)' },
      { name: 'estimated_total', type: 'DECIMAL(10,2)' },
      { name: 'actual_weight', type: 'DECIMAL(10,2)' },
      { name: 'balance_ticket_url', type: 'VARCHAR(500)' },
      { name: 'final_amount', type: 'DECIMAL(10,2)' },
      { name: 'platform_commission', type: 'DECIMAL(10,2)' },
      { name: 'bank_commission', type: 'DECIMAL(10,2)' },
      { name: 'seller_net_amount', type: 'DECIMAL(10,2)' },
      { name: 'buyer_confirmed_weight', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'weight_updated_at', type: 'TIMESTAMP' },
      { name: 'buyer_confirmed_at', type: 'TIMESTAMP' },
      { name: 'total_count', type: 'INTEGER' }
    ];
    
    console.log('Adding missing columns...\n');
    
    for (const column of columnsToAdd) {
      const exists = existingColumns.rows.some(row => row.column_name === column.name);
      
      if (!exists) {
        console.log(`Adding column: ${column.name}`);
        await client.query(`ALTER TABLE transactions ADD COLUMN ${column.name} ${column.type}`);
      } else {
        console.log(`Column already exists: ${column.name}`);
      }
    }
    
    console.log('\n✅ Transactions table fixed successfully!\n');
    
    // Verify final structure
    const finalColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      ORDER BY ordinal_position
    `);
    
    console.log('Final columns in transactions table:');
    finalColumns.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('Error fixing transactions table:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

fixTransactionsTable();
