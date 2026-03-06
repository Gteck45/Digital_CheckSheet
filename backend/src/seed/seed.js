const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Drop and recreate database
    console.log('🗑️ Dropping and recreating database...');
    await db.dropDatabase();
    
    // Test database connection
    await db.testConnection();
    
    // Create tables
    console.log('📋 Creating tables...');
    await db.createTables();

    // Check if data already exists
    const existingUsers = await db.executeQuery('SELECT COUNT(*) as count FROM users');
    if (existingUsers[0].count > 0) {
      console.log('📊 Database already has data. Skipping seed...');
      return;
    }

    console.log('🔐 Creating default roles...');
    await createDefaultRoles();

    console.log('📄 Creating default pages...');
    await createDefaultPages();

    console.log('👤 Creating default admin user...');
    await createDefaultUsers();

    console.log('🔗 Setting up role-page assignments...');
    await assignRolesToPages();

    console.log('👨‍💼 Assigning roles to users...');
    await assignRolesToUsers();

    console.log('📝 Creating sample activity logs...');
    await createSampleActivityLogs();

    console.log('🏭 Creating manufacturing data (lines, stations, brands, models)...');
    await createManufacturingData();

    console.log('🕐 Creating inspection slots...');
    await createInspectionSlots();

    console.log('📋 Creating sample templates...');
    await createSampleTemplates();

    console.log('✅ Database seeding completed successfully!');

    // Display default credentials
    console.log('\n🚀 Default Admin Credentials:');
    console.log('Email: admin@cmscrm.com');
    console.log('Password: Admin123!');
    console.log('\n🔧 Manager Credentials:');
    console.log('Email: manager@cmscrm.com');
    console.log('Password: Manager123!');
    console.log('\n👤 User Credentials:');
    console.log('Email: user@cmscrm.com');
    console.log('Password: User123!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

async function createDefaultRoles() {
  const roles = [
    {
      name: 'super_admin',
      description: 'Super Administrator with full system access'
    },
    {
      name: 'admin',
      description: 'Administrator with management access'
    },
    {
      name: 'manager',
      description: 'Manager with limited administrative access'
    },
    {
      name: 'user',
      description: 'Regular user with basic access'
    }
  ];

  for (const role of roles) {
    await db.executeQuery(
      'INSERT INTO roles (name, description) VALUES (?, ?)',
      [role.name, role.description]
    );
  }

  console.log(`✅ Created ${roles.length} default roles`);
}

async function createDefaultPages() {
  const pages = [
    // Admin Pages
    {
      name: 'Dashboard',
      url: '/dashboard',
      icon: null,
      is_external: false
    },
    {
      name: 'Users Management',
      url: '/users',
      icon: null,
      is_external: false
    },
    {
      name: 'Roles Management',
      url: '/roles',
      icon: null,
      is_external: false
    },
    {
      name: 'Pages Management',
      url: '/pages',
      icon: null,
      is_external: false
    },
    {
      name: 'Activity Logs',
      url: '/activity',
      icon: null,
      is_external: false
    },
    {
      name: 'System Settings',
      url: '/settings',
      icon: null,
      is_external: false
    },
    {
      name: 'Reports',
      url: '/reports',
      icon: null,
      is_external: false
    },
    // User Pages
    {
      name: 'Profile',
      url: '/profile',
      icon: null,
      is_external: false
    },
    {
      name: 'Help Center',
      url: '/help',
      icon: null,
      is_external: false
    },
    // External Pages
    {
      name: 'Company Website',
      url: 'https://example.com',
      icon: null,
      is_external: true
    },
    {
      name: 'Documentation',
      url: 'https://docs.example.com',
      icon: null,
      is_external: true
    }
  ];

  for (const page of pages) {
    await db.executeQuery(
      'INSERT INTO pages (name, url, icon, is_external) VALUES (?, ?, ?, ?)',
      [page.name, page.url, page.icon, page.is_external]
    );
  }

  console.log(`✅ Created ${pages.length} default pages`);
}

async function createDefaultUsers() {
  const users = [
    {
      username: 'superadmin',
      email: 'superadmin@cmscrm.com',
      password: 'SuperAdmin123!',
      status: 'active'
    },
    {
      username: 'admin',
      email: 'admin@cmscrm.com',
      password: 'Admin123!',
      status: 'active'
    },
    {
      username: 'manager',
      email: 'manager@cmscrm.com',
      password: 'Manager123!',
      status: 'active'
    },
    {
      username: 'user',
      email: 'user@cmscrm.com',
      password: 'User123!',
      status: 'active'
    },
    {
      username: 'testuser',
      email: 'test@cmscrm.com',
      password: 'Test123!',
      status: 'inactive'
    }
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 12);
    await db.executeQuery(
      'INSERT INTO users (username, email, password_hash, status) VALUES (?, ?, ?, ?)',
      [user.username, user.email, hashedPassword, user.status]
    );
  }

  console.log(`✅ Created ${users.length} default users`);
}

async function assignRolesToPages() {
  // Get role and page IDs
  const roles = await db.executeQuery('SELECT id, name FROM roles');
  const pages = await db.executeQuery('SELECT id, name FROM pages');

  const roleMap = {};
  const pageMap = {};
  
  roles.forEach(role => roleMap[role.name] = role.id);
  pages.forEach(page => pageMap[page.name] = page.id);

  // Define role-page assignments
  const assignments = [
    // Super Admin - Access to everything
    { role: 'super_admin', pages: Object.keys(pageMap) },
    
    // Admin - Access to most admin functions
    { 
      role: 'admin', 
      pages: [
        'Dashboard', 'Users Management', 'Roles Management', 'Pages Management',
        'Activity Logs', 'Reports', 'Profile', 'Help Center'
      ]
    },
    
    // Manager - Limited admin access
    { 
      role: 'manager', 
      pages: [
        'Dashboard', 'Users Management', 'Reports', 'Profile', 'Help Center'
      ]
    },
    
    // User - Basic access
    { 
      role: 'user', 
      pages: [
        'Profile', 'Help Center', 'Company Website', 'Documentation'
      ]
    }
  ];

  for (const assignment of assignments) {
    const roleId = roleMap[assignment.role];
    for (const pageName of assignment.pages) {
      const pageId = pageMap[pageName];
      if (roleId && pageId) {
        await db.executeQuery(
          'INSERT INTO role_pages (role_id, page_id) VALUES (?, ?)',
          [roleId, pageId]
        );
      }
    }
  }

  console.log('✅ Assigned pages to roles');
}

async function assignRolesToUsers() {
  // Get user and role IDs
  const users = await db.executeQuery('SELECT id, username FROM users');
  const roles = await db.executeQuery('SELECT id, name FROM roles');

  const userMap = {};
  const roleMap = {};
  
  users.forEach(user => userMap[user.username] = user.id);
  roles.forEach(role => roleMap[role.name] = role.id);

  // Define user-role assignments
  const assignments = [
    { username: 'superadmin', roles: ['super_admin'] },
    { username: 'admin', roles: ['admin'] },
    { username: 'manager', roles: ['manager'] },
    { username: 'user', roles: ['user'] },
    { username: 'testuser', roles: ['user'] }
  ];

  for (const assignment of assignments) {
    const userId = userMap[assignment.username];
    for (const roleName of assignment.roles) {
      const roleId = roleMap[roleName];
      if (userId && roleId) {
        await db.executeQuery(
          'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
          [userId, roleId]
        );
      }
    }
  }

  console.log('✅ Assigned roles to users');
}

async function createSampleActivityLogs() {
  // Get admin user ID
  const adminUser = await db.executeQuery(
    'SELECT id FROM users WHERE username = ? LIMIT 1',
    ['admin']
  );
  
  if (adminUser.length === 0) return;
  
  const adminUserId = adminUser[0].id;

  // Create sample activity logs
  const activities = [
    {
      user_id: adminUserId,
      username: 'admin',
      action: 'login',
      resource: 'system',
      ip_address: '127.0.0.1',
      details: JSON.stringify({ method: 'LOGIN', success: true })
    },
    {
      user_id: adminUserId,
      username: 'admin',
      action: 'create',
      resource: 'user',
      resource_id: 2,
      ip_address: '127.0.0.1',
      details: JSON.stringify({ username: 'manager', email: 'manager@cmscrm.com' })
    },
    {
      user_id: adminUserId,
      username: 'admin',
      action: 'create',
      resource: 'role',
      resource_id: 1,
      ip_address: '127.0.0.1',
      details: JSON.stringify({ name: 'admin', description: 'Administrator role' })
    },
    {
      user_id: adminUserId,
      username: 'admin',
      action: 'view',
      resource: 'dashboard',
      ip_address: '127.0.0.1',
      details: JSON.stringify({ method: 'GET', path: '/api/stats/dashboard' })
    }
  ];

  for (const activity of activities) {
    await db.executeQuery(
      `INSERT INTO activity_logs (user_id, username, action, resource, resource_id, ip_address, user_agent, details) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        activity.user_id,
        activity.username,
        activity.action,
        activity.resource,
        activity.resource_id || null,
        activity.ip_address,
        'CMSCRM Seeder/1.0',
        activity.details
      ]
    );
  }

  // Create sample login activities
  await db.executeQuery(
    `INSERT INTO login_activities (user_id, username, ip_address, user_agent, success, login_time) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [adminUserId, 'admin', '127.0.0.1', 'CMSCRM Seeder/1.0', true, new Date()]
  );

  console.log('✅ Created sample activity logs');
}

// ─── Manufacturing Data ────────────────────────────────────────────────────

async function createManufacturingData() {
  // Lines
  const lines = [
    { name: 'Assembly Line A', status: 'active' },
    { name: 'Assembly Line B', status: 'active' },
    { name: 'Paint Shop Line', status: 'active' },
    { name: 'Quality Control Line', status: 'active' },
  ];
  for (const line of lines) {
    await db.executeQuery(
      'INSERT INTO `lines` (name, status) VALUES (?, ?)',
      [line.name, line.status]
    );
  }
  console.log(`  ✅ Created ${lines.length} lines`);

  // Stations
  const stations = [
    { name: 'Welding Station', status: 'active' },
    { name: 'Assembly Station', status: 'active' },
    { name: 'Inspection Station', status: 'active' },
    { name: 'Packaging Station', status: 'active' },
    { name: 'Painting Station', status: 'active' },
    { name: 'Quality Check Station', status: 'active' },
  ];
  for (const station of stations) {
    await db.executeQuery(
      'INSERT INTO `stations` (name, status) VALUES (?, ?)',
      [station.name, station.status]
    );
  }
  console.log(`  ✅ Created ${stations.length} stations`);

  // Brands
  const brands = [
    { name: 'Toyota', status: 'active' },
    { name: 'Honda', status: 'active' },
    { name: 'Suzuki', status: 'active' },
    { name: 'Maruti', status: 'active' },
  ];
  for (const brand of brands) {
    await db.executeQuery(
      'INSERT INTO `brands` (name, status) VALUES (?, ?)',
      [brand.name, brand.status]
    );
  }
  console.log(`  ✅ Created ${brands.length} brands`);

  // Models (fetch brand IDs first)
  const dbBrands = await db.executeQuery('SELECT id, name FROM `brands`');
  const brandMap = {};
  dbBrands.forEach(b => brandMap[b.name] = b.id);

  const models = [
    { name: 'Corolla', brand: 'Toyota', status: 'active' },
    { name: 'Camry', brand: 'Toyota', status: 'active' },
    { name: 'Innova', brand: 'Toyota', status: 'active' },
    { name: 'City', brand: 'Honda', status: 'active' },
    { name: 'Civic', brand: 'Honda', status: 'active' },
    { name: 'Swift', brand: 'Suzuki', status: 'active' },
    { name: 'Baleno', brand: 'Suzuki', status: 'active' },
    { name: 'Alto', brand: 'Maruti', status: 'active' },
    { name: 'WagonR', brand: 'Maruti', status: 'active' },
  ];
  for (const model of models) {
    const brand_id = brandMap[model.brand];
    if (brand_id) {
      await db.executeQuery(
        'INSERT INTO `models` (name, brand_id, status) VALUES (?, ?, ?)',
        [model.name, brand_id, model.status]
      );
    }
  }
  console.log(`  ✅ Created ${models.length} models`);
}

async function createInspectionSlots() {
  // Morning shift slots (09:00 – 16:00 with lunch break 13:00-14:00)
  const slots = [
    { slot_id: 'M-S1', shift: 'M', start_time: '09:00', end_time: '10:00', fill_window: 60, grace_period: 10 },
    { slot_id: 'M-S2', shift: 'M', start_time: '10:00', end_time: '11:00', fill_window: 60, grace_period: 10 },
    { slot_id: 'M-S3', shift: 'M', start_time: '11:00', end_time: '12:00', fill_window: 60, grace_period: 10 },
    { slot_id: 'M-S4', shift: 'M', start_time: '12:00', end_time: '13:00', fill_window: 60, grace_period: 10 },
    { slot_id: 'A-S1', shift: 'A', start_time: '14:00', end_time: '15:00', fill_window: 60, grace_period: 10 },
    { slot_id: 'A-S2', shift: 'A', start_time: '15:00', end_time: '16:00', fill_window: 60, grace_period: 10 },
    { slot_id: 'A-S3', shift: 'A', start_time: '16:00', end_time: '17:00', fill_window: 60, grace_period: 10 },
    { slot_id: 'E-S1', shift: 'E', start_time: '17:00', end_time: '18:00', fill_window: 60, grace_period: 10 },
    { slot_id: 'E-S2', shift: 'E', start_time: '18:00', end_time: '19:00', fill_window: 60, grace_period: 10 },
    { slot_id: 'N-S1', shift: 'N', start_time: '22:00', end_time: '23:00', fill_window: 60, grace_period: 15 },
    { slot_id: 'N-S2', shift: 'N', start_time: '23:00', end_time: '00:00', fill_window: 60, grace_period: 15 },
  ];

  for (const slot of slots) {
    await db.executeQuery(
      'INSERT INTO `inspection_slots` (slot_id, shift, start_time, end_time, fill_window, grace_period) VALUES (?, ?, ?, ?, ?, ?)',
      [slot.slot_id, slot.shift, slot.start_time, slot.end_time, slot.fill_window, slot.grace_period]
    );
  }
  console.log(`  ✅ Created ${slots.length} inspection slots`);
}

async function createSampleTemplates() {
  // Get a line/station/model id for linking
  const lines = await db.executeQuery('SELECT id FROM `lines` LIMIT 4');
  const stations = await db.executeQuery('SELECT id FROM `stations` LIMIT 3');
  const models = await db.executeQuery('SELECT id FROM `models` LIMIT 3');
  const templates = [
    {
      name: 'Daily Welding Inspection',
      entity_type: 'line',
      entity_id: lines[0]?.id,
      schema_json: JSON.stringify({
        fields: [
          { id: 'f1', type: 'text', label: 'Inspector Name', required: true },
          { id: 'f2', type: 'text', label: 'Shift', required: true },
          { id: 'f3', type: 'checkbox', label: 'Weld Integrity OK', required: true },
          { id: 'f4', type: 'checkbox', label: 'PPE Compliance', required: true },
          { id: 'f5', type: 'textarea', label: 'Remarks', required: false },
        ]
      }),
    },
    {
      name: 'Paint Quality Checklist',
      entity_type: 'line',
      entity_id: lines[2]?.id,
      schema_json: JSON.stringify({
        fields: [
          { id: 'f1', type: 'text', label: 'Inspector Name', required: true },
          { id: 'f2', type: 'select', label: 'Paint Type', options: ['Gloss', 'Matte', 'Metallic'], required: true },
          { id: 'f3', type: 'number', label: 'Coat Thickness (μm)', required: true },
          { id: 'f4', type: 'checkbox', label: 'Surface Defect Free', required: true },
          { id: 'f5', type: 'textarea', label: 'Defect Notes', required: false },
        ]
      }),
    },
    {
      name: 'Station Assembly Checklist',
      entity_type: 'station',
      entity_id: stations[1]?.id,
      schema_json: JSON.stringify({
        fields: [
          { id: 'f1', type: 'text', label: 'Operator Name', required: true },
          { id: 'f2', type: 'checkbox', label: 'Torque Check Done', required: true },
          { id: 'f3', type: 'checkbox', label: 'Alignment Verified', required: true },
          { id: 'f4', type: 'number', label: 'Units Completed', required: true },
          { id: 'f5', type: 'textarea', label: 'Issues Observed', required: false },
        ]
      }),
    },
    {
      name: 'Final QC Inspection Form',
      entity_type: 'model',
      entity_id: models[0]?.id,
      schema_json: JSON.stringify({
        fields: [
          { id: 'f1', type: 'text', label: 'QC Inspector', required: true },
          { id: 'f2', type: 'text', label: 'Vehicle VIN', required: true },
          { id: 'f3', type: 'select', label: 'Quality Grade', options: ['A', 'B', 'C', 'Reject'], required: true },
          { id: 'f4', type: 'checkbox', label: 'Passed Safety Check', required: true },
          { id: 'f5', type: 'checkbox', label: 'Electrical Systems OK', required: true },
          { id: 'f6', type: 'textarea', label: 'Final Remarks', required: false },
        ]
      }),
    },
  ];

  for (const tpl of templates) {
    if (!tpl.entity_id) continue; // skip if related entity not found
    await db.executeQuery(
      `INSERT INTO \`templates\` (name, entity_type, entity_id, schema_json)
       VALUES (?, ?, ?, ?)`,
      [tpl.name, tpl.entity_type, tpl.entity_id, tpl.schema_json]
    );
  }
  console.log(`  ✅ Created sample templates`);
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('\n🎉 Database seeding completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Database seeding failed:', error);
      process.exit(1);
    });
}

module.exports = {
  seedDatabase,
  createDefaultRoles,
  createDefaultPages,
  createDefaultUsers,
  assignRolesToPages,
  assignRolesToUsers,
  createSampleActivityLogs,
  createManufacturingData,
  createInspectionSlots,
  createSampleTemplates,
};