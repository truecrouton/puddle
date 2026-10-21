import Database from 'better-sqlite3';
import path from 'path';

// Point to a local SQLite file in your project root
const dbPath = path.resolve(process.cwd(), '../server/data/puddle.sqlite');
const db = new Database(dbPath);

export default db;