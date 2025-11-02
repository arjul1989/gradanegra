const { getFirestore } = require('../config/firebase');
const { generateId } = require('../utils/crypto');

/**
 * User Model
 * Represents a user in the system with roles
 */
class User {
  constructor(data) {
    this.id = data.id || generateId(16);
    this.email = data.email;
    this.name = data.name;
    this.tenantId = data.tenantId || null; // null for platform admin
    this.role = data.role; // platform_admin, tenant_admin, finance, operations
    this.active = data.active !== undefined ? data.active : true;
    this.firebaseUid = data.firebaseUid || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Save user to Firestore
   */
  async save() {
    const db = getFirestore();
    const userData = {
      email: this.email,
      name: this.name,
      tenantId: this.tenantId,
      role: this.role,
      active: this.active,
      firebaseUid: this.firebaseUid,
      createdAt: this.createdAt,
      updatedAt: new Date()
    };

    await db.collection('users').doc(this.id).set(userData);
    return this;
  }

  /**
   * Find user by ID
   */
  static async findById(userId) {
    const db = getFirestore();
    const doc = await db.collection('users').doc(userId).get();
    
    if (!doc.exists) {
      return null;
    }

    return new User({ id: doc.id, ...doc.data() });
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const db = getFirestore();
    const snapshot = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return new User({ id: doc.id, ...doc.data() });
  }

  /**
   * Find user by Firebase UID
   */
  static async findByFirebaseUid(firebaseUid) {
    const db = getFirestore();
    const snapshot = await db.collection('users')
      .where('firebaseUid', '==', firebaseUid)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return new User({ id: doc.id, ...doc.data() });
  }

  /**
   * Find users by tenant
   */
  static async findByTenant(tenantId) {
    const db = getFirestore();
    const snapshot = await db.collection('users')
      .where('tenantId', '==', tenantId)
      .where('active', '==', true)
      .get();
    
    return snapshot.docs.map(doc => new User({ id: doc.id, ...doc.data() }));
  }

  /**
   * Update user
   */
  async update(data) {
    const db = getFirestore();
    const updates = {
      ...data,
      updatedAt: new Date()
    };

    await db.collection('users').doc(this.id).update(updates);
    Object.assign(this, updates);
    return this;
  }

  /**
   * Deactivate user
   */
  async deactivate() {
    return this.update({ active: false });
  }

  /**
   * Check if user has permission
   */
  hasPermission(permission) {
    const permissions = {
      platform_admin: ['all'],
      tenant_admin: ['manage_tenant', 'manage_users', 'manage_events', 'view_finance', 'validate_tickets'],
      finance: ['view_finance', 'export_reports'],
      operations: ['validate_tickets', 'view_events']
    };

    const userPermissions = permissions[this.role] || [];
    return userPermissions.includes('all') || userPermissions.includes(permission);
  }

  /**
   * Convert to JSON (remove sensitive data)
   */
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      tenantId: this.tenantId,
      role: this.role,
      active: this.active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = User;
