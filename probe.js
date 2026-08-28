// Probe script: verify better-sqlite3 native binding loads on this platform.
const Database = require('better-sqlite3');
const db = new Database(':memory:');
db.exec('CREATE TABLE t (a INTEGER); INSERT INTO t VALUES (1);');
console.log('sqlite-ok', db.prepare('SELECT a FROM t').get());
