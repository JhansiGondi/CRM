const { setupDatabase } = require('./database');

async function seed() {
    const db = await setupDatabase();

    const leads = [
        { name: 'John Smith', email: 'john@example.com', phone: '123-456-7890', company: 'Tech Corp', status: 'New', notes: 'Interested in enterprise plan.' },
        { name: 'Sarah Wilson', email: 'sarah@design-studio.com', phone: '987-654-3210', company: 'Design Studio', status: 'Contacted', notes: 'Sent pricing details.' },
        { name: 'Mike Johnson', email: 'mike@builders.io', phone: '555-0199', company: 'Builders Inc', status: 'Qualified', notes: 'Budget confirmed.' },
        { name: 'Emma Davis', email: 'emma@marketing.net', phone: '444-222-3333', company: 'Marketing Pro', status: 'Closed', notes: 'Account activated.' }
    ];

    for (const lead of leads) {
        await db.run(
            'INSERT INTO leads (name, email, phone, company, status, notes) VALUES (?, ?, ?, ?, ?, ?)',
            [lead.name, lead.email, lead.phone, lead.company, lead.status, lead.notes]
        );
    }

    console.log('Database seeded successfully!');
    process.exit(0);
}

seed().catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
