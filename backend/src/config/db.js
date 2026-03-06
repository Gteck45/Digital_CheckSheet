const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
require("dotenv").config();

/* ===============================
   DATABASE CONFIG
================================*/

const DB_NAME = process.env.DB_NAME || "digital_checksheet";

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
  timezone: "Z",
};

const pool = mysql.createPool(dbConfig);

/* ===============================
   TEST CONNECTION
================================*/

const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL Connected");
    conn.release();
    return true;
  } catch (err) {
    console.error("❌ DB Connection Failed:", err.message);
    return false;
  }
};

/* ===============================
   INIT DATABASE
================================*/

const initializeDatabase = async () => {
  try {
    const conn = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      charset: "utf8mb4",
    });

    // Create DB
    await conn.execute(`
      CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    await conn.end();

    await createTables();
    await seedPages();
    await createSuperAdmin();

    console.log("✅ Database Initialized");
  } catch (err) {
    console.error("❌ DB Init Error:", err.message);
    throw err;
  }
};

/* ===============================
   SAFETY DROP
================================*/

const checkDev = () => {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("❌ Drop only allowed in development mode");
  }
};

/* ===============================
   DROP DATABASE
================================*/

const dropDatabase = async () => {
  checkDev();

  const conn = await mysql.createConnection(dbConfig);

  await conn.execute(`DROP DATABASE IF EXISTS \`${DB_NAME}\``);
  await conn.execute(`CREATE DATABASE \`${DB_NAME}\``);

  await conn.end();

  console.log("✅ Database Reset");
};

/* ===============================
   DROP TABLES
================================*/

const dropTables = async () => {
  checkDev();

  const tables = [
    "api_stats",
    "login_activities",
    "activity_logs",
  ];

  await pool.execute("SET FOREIGN_KEY_CHECKS=0");

  for (const t of tables) {
    await pool.execute(`DROP TABLE IF EXISTS ${t}`);
  }

  await pool.execute("SET FOREIGN_KEY_CHECKS=1");

  console.log("✅ Tables Dropped");
};

/* ===============================
   CREATE TABLES
================================*/

const createTables = async () => {
  await pool.execute("SET FOREIGN_KEY_CHECKS=0;");

  /* USERS */

  await pool.execute(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status ENUM('active','inactive') DEFAULT 'active',
    last_login TIMESTAMP NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB;
  `);

  /* ROLES */

  await pool.execute(`
  CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB;
  `);

  /* PAGES */

  await pool.execute(`
  CREATE TABLE IF NOT EXISTS pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    url VARCHAR(255) NOT NULL UNIQUE,
    icon VARCHAR(255),
    display_order INT DEFAULT 0,
    is_external BOOLEAN DEFAULT 0,
    status ENUM('active','inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB;
`);

  /* USER ROLES */

  await pool.execute(`
  CREATE TABLE IF NOT EXISTS user_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    role_id INT,

    UNIQUE KEY uq_user_role (user_id,role_id),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
  ) ENGINE=InnoDB;
  `);

  /* ROLE PAGES */

  await pool.execute(`
  CREATE TABLE IF NOT EXISTS role_pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT,
    page_id INT,
    UNIQUE KEY uq_role_page (role_id,page_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
  ) ENGINE=InnoDB;
  `);

  /* ACTIVITY LOG */

  await pool.execute(`
  CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100),
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB;
  `);

  /* LINES */

  await pool.execute(`
      CREATE TABLE IF NOT EXISTS \`lines\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        status ENUM('active','inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

  /* STATION */

  await pool.execute(`
      CREATE TABLE IF NOT EXISTS \`stations\` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  status ENUM('active','inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
    `);

  /* Brand */

  await pool.execute(`
   CREATE TABLE IF NOT EXISTS \`brands\` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  status ENUM('active','inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
    `);

    
  /* Model */
  await pool.execute(`
  CREATE TABLE IF NOT EXISTS \`models\` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  status ENUM('active','inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_model_brand
    FOREIGN KEY (brand_id)
    REFERENCES brands(id)
    ON DELETE CASCADE,
  UNIQUE KEY unique_model_per_brand (brand_id, name)
) ENGINE=InnoDB;
    `);

     /* Inspection Slots */
  await pool.execute(`
CREATE TABLE IF NOT EXISTS \`inspection_slots\` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slot_id VARCHAR(20) UNIQUE NOT NULL,
  shift CHAR(1) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  fill_window INT DEFAULT 120,
  grace_period INT DEFAULT 10,
  status_rule VARCHAR(100) DEFAULT 'After End → Locked',
  backend_method VARCHAR(50) DEFAULT 'checkSlotStatus()',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
    `);




//  Templates table
   await pool.execute(`
  CREATE TABLE IF NOT EXISTS \`templates\` (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(150) NOT NULL,

    entity_type ENUM('line','station','model') NOT NULL,
    entity_id INT NOT NULL,

    version INT DEFAULT 1,

    schema_json JSON NOT NULL,

    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_deleted (is_deleted)

  ) ENGINE=InnoDB;
`);

     //  Templates Submission
    
  await pool.execute(`
  CREATE TABLE IF NOT EXISTS \`template_submissions\` (
    id INT AUTO_INCREMENT PRIMARY KEY,

    template_id INT NOT NULL,
    submitted_by INT,

    response_json JSON NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_template (template_id),

    CONSTRAINT fk_template_submission
      FOREIGN KEY (template_id)
      REFERENCES templates(id)
      ON DELETE RESTRICT

  ) ENGINE=InnoDB;
`);
  /* ROLE PAGE CATEGORIES — stores UI-only category labels per role */
  await pool.execute(`
  CREATE TABLE IF NOT EXISTS role_page_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_id INT NOT NULL,
    cat_key VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_cat (role_id, cat_key)
  ) ENGINE=InnoDB;
  `);

  /* Add cat_key column to role_pages_order if it doesn't exist yet */
  try {
    await pool.execute(`
      ALTER TABLE role_pages_order
      ADD COLUMN cat_key VARCHAR(100) NULL DEFAULT NULL
    `);
  } catch (e) {
    if (e.code !== 'ER_DUP_FIELDNAME') throw e;
  }

  await pool.execute("SET FOREIGN_KEY_CHECKS=1;");

  console.log("✅ Tables Created");
};

/* ===============================
   CREATE SUPER ADMIN
================================*/

const createSuperAdmin = async () => {
  const ADMIN_USER = process.env.ADMIN_USER || "admin";
  const ADMIN_PASS = process.env.ADMIN_PASS || "admin@123";
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@system.com";

  // Check role
  const [role] = await pool.execute(
    `SELECT id FROM roles WHERE name='SUPER_ADMIN'`,
  );

  let roleId;

  if (!role.length) {
    const [r] = await pool.execute(
      `INSERT INTO roles (name,description)
       VALUES ('SUPER_ADMIN','System Owner')`,
    );

    roleId = r.insertId;
  } else {
    roleId = role[0].id;
  }

  // Check user
  const [user] = await pool.execute(`SELECT id FROM users WHERE username=?`, [
    ADMIN_USER,
  ]);

  if (user.length) {
    console.log("ℹ️ Super Admin Exists");
    return;
  }

  // Hash Password
  const hash = await bcrypt.hash(ADMIN_PASS, 10);

  // Insert User
  const [u] = await pool.execute(
    `
    INSERT INTO users
    (username,email,password_hash,status)
    VALUES (?,?,?,?)
  `,
    [ADMIN_USER, ADMIN_EMAIL, hash, "active"],
  );

  // Assign Role
  await pool.execute(
    `
    INSERT INTO user_roles (user_id,role_id)
    VALUES (?,?)
  `,
    [u.insertId, roleId],
  );

  console.log("✅ Super Admin Created");
  console.log("👉 Username:", ADMIN_USER);
  console.log("👉 Password:", ADMIN_PASS);
};

/* ===============================
   Insert All Sidebar Pages Automatically
================================*/

const seedPages = async () => {
  const pages = [
    ['Dashboard','/dashboard','LayoutDashboard'],
    ['Users','/users','Users'],
    ['Roles','/roles','Shield'],
    ['Pages','/pages','FileText'],
    ['Lines','/lines','LucideChartNoAxesGantt'],
    ['Station','/stations','TrainIcon'],
    ['Brand','/brands','BrainIcon'],
    ['Model','/models','PartyPopper'],
    ['Inspection Slot','/inspection-slots','Timer'],
    ['Templates','/templates','ListChecks'],
    ['Addons','/addons','AlignVerticalDistributeCenter'],
    ['Manage Report','/manage_report','FileTextIcon'],
    ['New Audit','/audit-list','NewspaperIcon']
  ];

  for (const p of pages) {
    await pool.execute(`
      INSERT INTO pages (name,url,icon,status)
      SELECT ?,?,?, 'active'
      WHERE NOT EXISTS (
        SELECT 1 FROM pages WHERE url=?
      )
    `,[p[0],p[1],p[2],p[1]]);
  }

  console.log("✅ Pages Seeded");
};

/* ===============================
   EXECUTE QUERY
================================*/

const executeQuery = async (query, params = []) => {
  try {
    const q = query.toUpperCase();

    if (
      q.includes("JOIN") ||
      q.includes("GROUP BY") ||
      q.includes("COUNT(") ||
      q.includes("ORDER BY") ||
      q.includes("LIMIT")
    ) {
      const [rows] = await pool.query(query, params);
      return rows;
    }

    const [rows] = await pool.execute(query, params);
    return rows;
  } catch (err) {
    console.error("❌ SQL Error:", err.message);
    throw err;
  }
};

/* ===============================
   EXPORT
================================*/

module.exports = {
  pool,
  executeQuery,
  execute: executeQuery, // 👈 add this line
  testConnection,
  initializeDatabase,
  dropDatabase,
  dropTables,
};
