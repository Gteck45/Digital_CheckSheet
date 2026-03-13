const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
require("dotenv").config();

/* ===============================
   DATABASE CONFIG
================================*/

const DB_NAME = process.env.DB_NAME;

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
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
    await ensureTemplateSchema();
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

  
// Activity Log table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        username VARCHAR(50) NULL,
        action VARCHAR(100) NOT NULL,
        resource VARCHAR(100) NULL,
        resource_id INT NULL,
        ip_address VARCHAR(45) NULL,
        user_agent TEXT NULL,
        details JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_action (action),
        INDEX idx_created_at (created_at),
        INDEX idx_username (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created activity_logs table');


    // Login Activity table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS login_activities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        username VARCHAR(50) NULL,
        ip_address VARCHAR(45) NULL,
        user_agent TEXT NULL,
        success BOOLEAN NOT NULL DEFAULT TRUE,
        login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        logout_time TIMESTAMP NULL,
        session_duration INT NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_username (username),
        INDEX idx_login_time (login_time),
        INDEX idx_success (success)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created login_activities table');

    
    // API Stats table for latency tracking
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS api_stats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        endpoint VARCHAR(255) NOT NULL,
        method VARCHAR(10) NOT NULL,
        response_time_ms INT NOT NULL,
        status_code INT NOT NULL,
        user_id INT NULL,
        ip_address VARCHAR(45) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_endpoint (endpoint),
        INDEX idx_method (method),
        INDEX idx_response_time (response_time_ms),
        INDEX idx_created_at (created_at),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created api_stats table');

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

    status ENUM('active','inactive') DEFAULT 'active',

    schema_json JSON NOT NULL,

    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_deleted (is_deleted),
    INDEX idx_templates_status (status)

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


  // Role Pages Order table (for page hierarchy)
await pool.execute(`
  CREATE TABLE IF NOT EXISTS role_pages_order (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    page_id INT NOT NULL,
    parent_page_id INT NULL,
    display_order INT DEFAULT 0,
    cat_key VARCHAR(100) NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_role_page_order (role_id, page_id),
    INDEX idx_role_id (role_id),
    INDEX idx_page_id (page_id),
    INDEX idx_parent_page_id (parent_page_id),
    INDEX idx_display_order (display_order),

    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_page_id) REFERENCES pages(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`);


  /* AUDITS */
  await pool.execute(`
CREATE TABLE IF NOT EXISTS \`audits\` (
  id INT AUTO_INCREMENT PRIMARY KEY,

  entity_type ENUM('line','station','model') NOT NULL,
  entity_id INT NOT NULL,
  entity_name VARCHAR(150) NOT NULL DEFAULT '',

  template_id INT NOT NULL,
  template_name VARCHAR(150) DEFAULT '',

  slot_id INT NULL,

  auditor_id INT NULL,
  auditor_name VARCHAR(100) DEFAULT '',

  audit_date DATE NOT NULL,
  audit_time TIME NOT NULL,

  /* GPS LOCATION */

  gps_lat DECIMAL(10,6) NULL,
  gps_lng DECIMAL(10,6) NULL,

  /* AUDIT ANSWERS */

  answers JSON NOT NULL,

  status ENUM('submitted','draft') DEFAULT 'submitted',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  /* INDEXES */

  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_auditor (auditor_id),
  INDEX idx_date (audit_date),
  INDEX idx_location (gps_lat, gps_lng),

  /* FK */

  CONSTRAINT fk_audit_template
  FOREIGN KEY (template_id)
  REFERENCES templates(id)
  ON DELETE RESTRICT

) ENGINE=InnoDB;
`);

  await pool.execute("SET FOREIGN_KEY_CHECKS=1;");

  console.log("✅ Tables Created");
};

const ensureTemplateSchema = async () => {
  const [tables] = await pool.execute(`
    SHOW TABLES LIKE 'templates'
  `);

  if (!tables.length) {
    return;
  }

  const [statusColumn] = await pool.execute(`
    SHOW COLUMNS FROM templates LIKE 'status'
  `);

  if (!statusColumn.length) {
    await pool.execute(`
      ALTER TABLE templates
      ADD COLUMN status ENUM('active','inactive') DEFAULT 'active' AFTER version
    `);
    console.log("✅ Added status column to templates table");
  }

  const [statusIndex] = await pool.execute(`
    SHOW INDEX FROM templates WHERE Key_name = 'idx_templates_status'
  `);

  if (!statusIndex.length) {
    await pool.execute(`
      ALTER TABLE templates
      ADD INDEX idx_templates_status (status)
    `);
    console.log("✅ Added templates status index");
  }
};

/* ===============================
   CREATE SUPER ADMIN
================================*/

const createSuperAdmin = async () => {
  const ADMIN_USER = process.env.ADMIN_USER;
  const ADMIN_PASS = process.env.ADMIN_PASS ;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

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
  console.log("👉 Email:", ADMIN_EMAIL);
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
  ensureTemplateSchema,
  testConnection,
  initializeDatabase,
  dropDatabase,
  dropTables,
};
