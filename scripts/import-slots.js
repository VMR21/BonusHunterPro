import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { db } from '../server/db.js';
import { slotDatabase } from '../shared/schema.js';

async function importSlots() {
  try {
    // Read and parse the CSV file
    const csvData = fs.readFileSync('attached_assets/slots_1756197328567.csv', 'utf8');
    const slots = parse(csvData, { 
      columns: true, 
      skip_empty_lines: true 
    });

    console.log(`Found ${slots.length} slots to import`);

    // Clear existing slots
    await db.delete(slotDatabase);
    console.log('Cleared existing slots');

    // Transform and insert slots in batches
    const batchSize = 100;
    let imported = 0;

    for (let i = 0; i < slots.length; i += batchSize) {
      const batch = slots.slice(i, i + batchSize).map(slot => ({
        name: slot.name || slot.Name || '',
        provider: slot.provider || slot.Provider || '',
        imageUrl: slot.image_url || slot.imageUrl || slot['Image URL'] || null,
        category: slot.category || slot.Category || null,
      })).filter(slot => slot.name && slot.provider);

      if (batch.length > 0) {
        await db.insert(slotDatabase).values(batch);
        imported += batch.length;
        console.log(`Imported ${imported}/${slots.length} slots`);
      }
    }

    console.log(`Successfully imported ${imported} slots`);
    process.exit(0);
  } catch (error) {
    console.error('Error importing slots:', error);
    process.exit(1);
  }
}

importSlots();