# Keycloak Configuration

This directory contains the Keycloak realm configuration for the Renovator Project Management Platform.

## Overview

The platform uses Keycloak as the OAuth 2.0 Identity Provider for user authentication and authorization. The realm configuration is automatically imported when the Keycloak container starts.

## Realm Configuration

- **Realm Name**: `renovator`
- **Client ID**: `renovator-app`
- **Client Secret**: `renovator-client-secret-change-in-production` (⚠️ Change in production!)
- **Protocol**: OpenID Connect (OAuth 2.0 Authorization Code Flow)

## Client Configuration

### Redirect URIs
The following redirect URIs are configured for OAuth callbacks:
- `http://localhost:3000/*` - Frontend wildcard
- `http://localhost:4000/*` - Backend wildcard
- `http://localhost:3000/auth/callback` - Frontend callback
- `http://localhost:4000/auth/callback` - Backend callback

### Web Origins
CORS is configured for:
- `http://localhost:3000` - Frontend
- `http://localhost:4000` - Backend

### OAuth 2.0 Flow Settings
- **Standard Flow (Authorization Code)**: Enabled ✅
- **Implicit Flow**: Disabled ❌
- **Direct Access Grants**: Enabled ✅
- **Service Accounts**: Disabled ❌
- **Public Client**: No (confidential client with secret)

### Token Settings
- **Access Token Lifespan**: 3600 seconds (1 hour)
- **Refresh Token**: Enabled
- **Backchannel Logout**: Enabled

## User Attributes

The following user attributes are mapped to JWT claims:
- `email` - User email address
- `given_name` - First name
- `family_name` - Last name
- `phone` - Phone number (custom attribute)
- `company` - Company name (custom attribute)

## Roles

### Realm Roles
- **renovator**: Standard user role (default)
- **admin**: Administrator role with full access

## Demo User

A demo user is pre-configured for testing:
- **Email**: demo@renovator.com
- **Password**: Demo123!
- **Role**: renovator
- **Company**: Demo Renovations Inc

## Security Settings

- **SSL Required**: External (SSL required for external requests)
- **Registration**: Enabled (users can self-register)
- **Email as Username**: Enabled
- **Password Policy**: Minimum 8 characters with at least 1 digit, 1 lowercase, 1 uppercase
- **Brute Force Protection**: Enabled
  - Max failures: 5
  - Wait time: 15 minutes after max failures
  - Quick login check: 1 second

## Accessing Keycloak Admin Console

1. Start the Docker containers:
   ```bash
   docker-compose up -d
   ```

2. Wait for Keycloak to start (check logs):
   ```bash
   docker-compose logs -f keycloak
   ```

3. Access the admin console:
   - URL: http://localhost:8080
   - Username: `admin` (from KEYCLOAK_ADMIN env var)
   - Password: `admin123` (from KEYCLOAK_ADMIN_PASSWORD env var)

4. Navigate to the `renovator` realm to view/modify configuration

## OAuth 2.0 Endpoints

Once Keycloak is running, the following endpoints are available:

- **Authorization Endpoint**: 
  ```
  http://localhost:8080/realms/renovator/protocol/openid-connect/auth
  ```

- **Token Endpoint**: 
  ```
  http://localhost:8080/realms/renovator/protocol/openid-connect/token
  ```

- **UserInfo Endpoint**: 
  ```
  http://localhost:8080/realms/renovator/protocol/openid-connect/userinfo
  ```

- **Logout Endpoint**: 
  ```
  http://localhost:8080/realms/renovator/protocol/openid-connect/logout
  ```

- **Token Introspection**: 
  ```
  http://localhost:8080/realms/renovator/protocol/openid-connect/token/introspect
  ```

- **Token Revocation**: 
  ```
  http://localhost:8080/realms/renovator/protocol/openid-connect/revoke
  ```

## Production Considerations

⚠️ **Before deploying to production:**

1. **Change the client secret** in both:
   - `keycloak/renovator-realm.json`
   - `.env` file (KEYCLOAK_CLIENT_SECRET)

2. **Update redirect URIs** to match your production domains:
   - Replace `http://localhost:3000/*` with your frontend URL
   - Replace `http://localhost:4000/*` with your backend URL

3. **Update web origins** for CORS:
   - Replace localhost URLs with production domains

4. **Enable SSL**:
   - Set `sslRequired` to `"all"` in realm configuration
   - Configure proper TLS certificates

5. **Disable demo user**:
   - Remove or disable the demo user from the realm

6. **Review password policy**:
   - Consider strengthening password requirements

7. **Configure email settings**:
   - Set up SMTP for email verification and password reset

8. **Review brute force protection settings**:
   - Adjust thresholds based on your security requirements

## Modifying the Realm

To modify the realm configuration:

1. Make changes in the Keycloak admin console
2. Export the realm:
   ```bash
   docker exec -it renovator-keycloak /opt/keycloak/bin/kc.sh export \
     --dir /tmp/export \
     --realm renovator \
     --users realm_file
   ```
3. Copy the exported file:
   ```bash
   docker cp renovator-keycloak:/tmp/export/renovator-realm.json ./keycloak/
   ```
4. Commit the updated configuration

## Troubleshooting

### Keycloak won't start
- Check if PostgreSQL is healthy: `docker-compose ps`
- View Keycloak logs: `docker-compose logs keycloak`
- Ensure port 8080 is not in use

### Realm not imported
- Check the volume mount in docker-compose.yml
- Verify the realm JSON file exists: `ls -la keycloak/`
- Check Keycloak logs for import errors

### Authentication fails
- Verify client secret matches in both Keycloak and backend
- Check redirect URIs are correctly configured
- Ensure the realm name is correct in environment variables
