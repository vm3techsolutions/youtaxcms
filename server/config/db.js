// db.js
const mysql = require('mysql2/promise'); // ✅ Promise-based MySQL

// Create a connection pool for automatic reconnection
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '',
  waitForConnections: true,
  connectionLimit: 10,     // adjust as needed
  queueLimit: 0
});

// Optional: test the connection when the app starts
(async () => {
  try {
    const connection = await db.getConnection();
    console.log('✅ MySQL Database connected successfully.');
    connection.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
})();

module.exports = db;



 
// const mysql = require('mysql2');

// const db = mysql.createConnection({
//   host: process.env.DB_HOST || 'localhost',         // or 127.0.0.1
//   port: process.env.DB_PORT,
//   user: process.env.DB_USER || '',              // your MySQL username
//   password: process.env.DB_PASSWORD ,              // your MySQL password (empty if not set)
//   database: process.env.DB_NAME   // replace with your DB name
// });

// // Connect to MySQL
// db.connect((err) => {
//   if (err) {
//     console.error('Database connection failed:', err);
//   } else {
//     console.log('Connected to MySQL database.');
//   }
// });

// module.exports = db;


//=============================
// const mysql = require('mysql2/promise'); // ✅ use promise version
// const db = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
// });
// module.exports = db;
