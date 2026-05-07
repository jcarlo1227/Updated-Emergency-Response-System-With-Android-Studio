import { AmbulanceUnit } from '../models/index.js';
export async function seedAmbulanceUnits() {
    const count = await AmbulanceUnit.countDocuments();
    if (count >= 12) {
        console.log(`Ambulance units already seeded (${count}/12)`);
        return;
    }
    const ops = [];
    for (let i = 1; i <= 12; i++) {
        ops.push({
            updateOne: {
                filter: { unitNumber: i },
                update: { $setOnInsert: { unitNumber: i, availabilityStatus: 'available' } },
                upsert: true,
            },
        });
    }
    await AmbulanceUnit.bulkWrite(ops, { ordered: false });
    console.log('Ambulance units seeded (12 physical units)');
}
