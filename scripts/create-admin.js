#!/usr/bin/env node

/**
 * Seed script to create initial platform admin user
 * Run: node scripts/create-admin.js
 */

require('dotenv').config();
const { initializeFirebase, getAuth } = require('../src/config/firebase');
const User = require('../src/models/User');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  try {
    console.log('\n🎫 Grada Negra - Create Platform Admin\n');
    console.log('This script will create a platform administrator user.\n');

    // Initialize Firebase
    initializeFirebase();

    // Get user input
    const email = await question('Email: ');
    const password = await question('Password (min 6 chars): ');
    const name = await question('Full Name: ');

    if (!email || !password || !name) {
      console.error('\n❌ All fields are required');
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('\n❌ Password must be at least 6 characters');
      process.exit(1);
    }

    console.log('\n🔄 Creating admin user...');

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      console.error(`\n❌ User with email ${email} already exists`);
      process.exit(1);
    }

    // Create Firebase Auth user
    const auth = getAuth();
    const firebaseUser = await auth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: true // Auto-verify admin
    });

    // Create user in database
    const user = new User({
      email,
      name,
      role: 'platform_admin',
      tenantId: null,
      firebaseUid: firebaseUser.uid,
      active: true
    });

    await user.save();

    console.log('\n✅ Platform admin created successfully!');
    console.log('\nUser Details:');
    console.log('  Email:', email);
    console.log('  Name:', name);
    console.log('  Role: platform_admin');
    console.log('  User ID:', user.id);
    console.log('  Firebase UID:', firebaseUser.uid);
    console.log('\nYou can now login with these credentials.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin:', error.message);
    process.exit(1);
  }
}

// Run
createAdmin();
