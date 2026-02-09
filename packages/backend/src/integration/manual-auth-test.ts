/**
 * Manual Authentication Test Script
 * 
 * This script tests the OAuth flow with the actual running Keycloak instance.
 * Run this with: npx tsx src/integration/manual-auth-test.ts
 * 
 * Prerequisites:
 * - Docker containers must be running (docker-compose up)
 * - Keycloak must be healthy and accessible at http://localhost:8080
 */

import { AuthService } from '../services/AuthService';
import { AppDataSource } from '../config/database';

async function testAuthenticationFlow() {
  console.log('🔐 Starting OAuth Authentication Flow Test\n');

  try {
    // Initialize database connection
    console.log('📊 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    const authService = new AuthService();

    // Test 1: Generate Authorization URL
    console.log('Test 1: Generate Authorization URL');
    console.log('─────────────────────────────────────');
    const redirectUri = 'http://localhost:4000/auth/callback';
    const state = 'test-state-' + Date.now();
    const authUrl = authService.getAuthorizationUrl(redirectUri, state);
    
    console.log('✅ Authorization URL generated successfully');
    console.log('URL:', authUrl);
    console.log('');

    // Verify URL components
    const urlObj = new URL(authUrl);
    const params = urlObj.searchParams;
    
    console.log('URL Parameters:');
    console.log('  - client_id:', params.get('client_id'));
    console.log('  - redirect_uri:', params.get('redirect_uri'));
    console.log('  - response_type:', params.get('response_type'));
    console.log('  - scope:', params.get('scope'));
    console.log('  - state:', params.get('state'));
    console.log('');

    // Validate URL components
    if (params.get('client_id') !== 'renovator-app') {
      throw new Error('Invalid client_id');
    }
    if (params.get('response_type') !== 'code') {
      throw new Error('Invalid response_type');
    }
    if (params.get('scope') !== 'openid email profile') {
      throw new Error('Invalid scope');
    }
    if (params.get('state') !== state) {
      throw new Error('Invalid state');
    }

    console.log('✅ All URL parameters are correct\n');

    // Test 2: Verify Keycloak connectivity
    console.log('Test 2: Verify Keycloak Connectivity');
    console.log('─────────────────────────────────────');
    
    try {
      // Try to validate a dummy token (will fail but confirms Keycloak is reachable)
      await authService.validateAccessToken('dummy-token');
    } catch (error: any) {
      // We expect this to fail, but it should be a validation error, not a connection error
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        console.log('❌ Cannot connect to Keycloak');
        console.log('Error:', error.message);
        console.log('\nPlease ensure:');
        console.log('  1. Docker containers are running: docker-compose up');
        console.log('  2. Keycloak is healthy: docker ps');
        console.log('  3. Keycloak is accessible at http://localhost:8080');
        throw error;
      } else {
        // This is expected - token validation failed but Keycloak is reachable
        console.log('✅ Keycloak is reachable and responding');
        console.log('   (Token validation failed as expected for dummy token)');
        console.log('');
      }
    }

    // Test 3: Test session management
    console.log('Test 3: Session Management');
    console.log('─────────────────────────────────────');
    
    // Create a test user
    const testUserInfo = {
      sub: 'test-user-' + Date.now(),
      email: 'test@example.com',
      given_name: 'Test',
      family_name: 'User',
    };

    const user = await authService.createOrUpdateUser(testUserInfo);
    console.log('✅ Test user created:', user.email);

    // Create a session
    const mockTokens = {
      accessToken: 'test-access-token-' + Date.now(),
      refreshToken: 'test-refresh-token-' + Date.now(),
      expiresIn: 3600,
      tokenType: 'Bearer' as const,
    };

    const session = await authService.createSession(user.id, mockTokens);
    console.log('✅ Session created:', session.id);

    // Retrieve session
    const retrievedSession = await authService.getSession(session.id);
    if (!retrievedSession) {
      throw new Error('Failed to retrieve session');
    }
    console.log('✅ Session retrieved successfully');

    // Clean up
    await authService.deleteSession(session.id);
    console.log('✅ Session deleted successfully');
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('🎉 All Authentication Tests Passed!');
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('Summary:');
    console.log('  ✅ Authorization URL generation works');
    console.log('  ✅ Keycloak is reachable and responding');
    console.log('  ✅ Session management works correctly');
    console.log('');
    console.log('Next Steps:');
    console.log('  1. Test the full OAuth flow in a browser');
    console.log('  2. Navigate to the authorization URL');
    console.log('  3. Login with Keycloak credentials');
    console.log('  4. Verify the callback receives an authorization code');
    console.log('');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Close database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('📊 Database connection closed');
    }
  }
}

// Run the test
testAuthenticationFlow();
