// Test script to verify API endpoints and database connectivity
// Run this script to test basic functionality

import connectDB from '../src/lib/mongodb.js';

async function testDatabaseConnection() {
    console.log('🔄 Testing database connection...');

    try {
        await connectDB();
        console.log('✅ Database connection successful!');
        return true;
    } catch (error) {
        console.log('❌ Database connection failed:', error.message);
        return false;
    }
}

async function testAPIEndpoints() {
    console.log('🔄 Testing API endpoints...');

    const endpoints = [
        'http://localhost:3000/api/auth/ms-login',
        'http://localhost:3000/api/student/transactions',
        'http://localhost:3000/api/admin/dashboard'
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer test-token'
                }
            });

            console.log(`${endpoint}: ${response.status}`);
        } catch (error) {
            console.log(`${endpoint}: Connection failed`);
        }
    }
}

async function runTests() {
    console.log('🚀 Starting application tests...\n');

    const dbConnected = await testDatabaseConnection();

    if (dbConnected) {
        await testAPIEndpoints();
    }

    console.log('\n📝 Test complete! Check the browser at http://localhost:3000');
}

runTests().catch(console.error);
