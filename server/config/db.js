
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',         // or 127.0.0.1
  user: process.env.DB_USER || '',              // your MySQL username
  password: process.env.DB_PASSWORD ,              // your MySQL password (empty if not set)
  database: process.env.DB_NAME || 'softcon_trade'  // replace with your DB name
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Connected to MySQL database.');
  }
});

module.exports = db;


//=============================
// const mysql = require('mysql2/promise'); // ✅ use promise version
// const db = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
// });
// module.exports = db;
