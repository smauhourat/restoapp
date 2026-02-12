export function seedDatabase(database) {
    const fs = require('fs');

    const sqlFile = fs.readFileSync('./src/server/tests/utils/seed_test_db.sql', 'utf8');
    const queries = sqlFile.split(';').filter(query => query.trim() !== '');
    //const queries = sqlFile.split(';').filter(query => query.trim().startsWith('INSERT'));
    for (const query of queries) {
        database.exec(query);
        //console.log('Ejecutada:', query.slice(0, 50) + '...');
    }
}