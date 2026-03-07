Now I have the complete picture. Here is the refined architecture and implementation plan, taking into account that Keycloak already uses Google as an Identity Provider.

---

# Refined Google Drive Integration Plan

## Key Architectural Insight: Why a Separate OAuth Flow is Still Needed

I evaluated three possible approaches given your Keycloak-Google IdP setup:

**Approach A -- Keycloak Token Exchange (retrieve brokered Google token):**
Keycloak exposes `GET /auth/realms/renovator/broker/google/token` to retrieve the Google access token stored during login. However, this token only carries the scopes requested during login (`openid email profile`), **not** `drive.file`. You'd have to add Drive scopes to Keycloak's Google IdP config, which forces *every* user to consent to Drive access at login -- bad UX, and some users may refuse to log in at all.

**Approach B -- Add Drive scope to Keycloak Google IdP:**
Same problem as A -- couples login with storage consent. Also, Cloud-IAM (your managed Keycloak) may not reliably support Token Exchange V1 (it's a preview feature).

**Approach C -- Separate Google OAuth flow for Drive only (recommended):**
Keep Keycloak login unchanged. Add a *separate, opt-in* Google OAuth consent flow that requests only `drive.file` scope. Since users already have a Google session (they logged in via Google through Keycloak), they won't need to re-enter credentials -- Google will recognize the session and show only the Drive consent screen.

**Recommendation: Approach C.** Clean separation of concerns, opt-in for users, works for users who log in via Google *and* those who might log in via username/password.

---

## What Changes vs. the Original Plan

| Aspect | Original Plan | Refined Plan |
|--------|--------------|--------------|
| **Google Cloud project** | Create new | **Reuse existing** (`renovator-489414`) |
| **OAuth client** | Create new | **Reuse existing** client -- just add backend redirect URIs |
| **Google Drive API** | Enable | Still needed -- **enable in existing project** |
| **Login hint** | Not considered | **Pass user's email** as `login_hint` so Google pre-selects the right account |
| **Users who login via password** | Not considered | **Fully supported** -- they link Google Drive separately |
| **Consent UX** | Full Google login + consent | **Consent only** (Google session already exists from Keycloak login) |

---

## 1. Google Cloud Console Setup (Minimal)

1. **Enable Google Drive API** in the project (APIs & Services > Library > "Google Drive API" > Enable)
2. **Add redirect URIs** to the existing OAuth client:
   - `http://localhost:4000/api/google/callback` (local dev)
   - `https://your-render-backend-domain/api/google/callback` (production)
3. **OAuth consent screen**: Add `https://www.googleapis.com/auth/drive.file` scope (under "Scopes" section)

No new credentials needed -- reuse `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from the existing client.

---

## 2. Database Changes

### 2.1 New Table: `user_google_drive_tokens`

Stores encrypted Google OAuth2 tokens specifically for Drive access, per user.

```sql
CREATE TABLE user_google_drive_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  google_email VARCHAR(255) NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  token_expires_at TIMESTAMP NOT NULL,
  scopes TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2.2 New Table: `project_drive_folders`

Maps each project to a Google Drive folder.

```sql
CREATE TABLE project_drive_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  drive_folder_id VARCHAR(255) NOT NULL,
  drive_folder_name VARCHAR(255) NOT NULL,
  drive_folder_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);
```

### 2.3 Alter `documents` Table

```sql
ALTER TABLE documents
  ADD COLUMN storage_provider VARCHAR(20) NOT NULL DEFAULT 'local',
  ADD COLUMN drive_file_id VARCHAR(255);
```

---

## 3. Backend Implementation

### 3.1 New Dependencies

```bash
cd packages/backend
npm install googleapis google-auth-library
```

### 3.2 Configuration Additions

Add to `packages/backend/src/config/index.ts`:

```typescript
google: {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4000/api/google/callback',
},
tokenEncryption: {
  key: process.env.TOKEN_ENCRYPTION_KEY || '',
}
```

### 3.3 New Environment Variables

```env
# Reuse from existing Google OAuth client
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:4000/api/google/callback

# Generate with: openssl rand -hex 32
TOKEN_ENCRYPTION_KEY=<32-byte-hex-key>
```

### 3.4 Token Encryption Service

`packages/backend/src/services/TokenEncryptionService.ts`

AES-256-GCM encryption/decryption for storing Google tokens at rest. Uses `TOKEN_ENCRYPTION_KEY` from env.

### 3.5 New Entities

- `UserGoogleDriveToken` -- maps to `user_google_drive_tokens`
- `ProjectDriveFolder` -- maps to `project_drive_folders`

### 3.6 Modify `Document` Entity

Add two new columns:

```typescript
@Column({ name: 'storage_provider', type: 'varchar', length: 20, default: 'local' })
storageProvider: 'local' | 'google_drive';

@Column({ name: 'drive_file_id', type: 'varchar', length: 255, nullable: true })
driveFileId?: string;
```

### 3.7 Google Drive Auth Service

`packages/backend/src/services/GoogleDriveAuthService.ts`

```typescript
class GoogleDriveAuthService {
  // Generate consent URL with login_hint (user's email from Keycloak session)
  // Passes: access_type=offline, prompt=consent, scope=drive.file
  // login_hint means Google skips account selection for users who logged in via Google
  getAuthorizationUrl(userEmail: string, state: string): string;

  // Exchange code for tokens, encrypt, store in DB
  handleCallback(code: string, userId: string): Promise<UserGoogleDriveToken>;

  // Return a fresh access token (auto-refreshes using stored refresh token)
  getAccessToken(userId: string): Promise<string>;

  // Revoke and delete stored tokens
  disconnect(userId: string): Promise<void>;

  // Check connection status
  isConnected(userId: string): Promise<boolean>;

  // Get connected Google email
  getConnectionInfo(userId: string): Promise<{ connected: boolean; email?: string }>;
}
```

**Key detail**: `getAuthorizationUrl` passes `login_hint=user@gmail.com` extracted from the Keycloak user profile. For users who logged in via Google through Keycloak, Google will recognize the session and only show the Drive consent screen -- no re-login needed.

### 3.8 Google Drive Storage Provider

`packages/backend/src/services/GoogleDriveStorageProvider.ts`

```typescript
class GoogleDriveStorageProvider {
  uploadFile(userId: string, folderId: string, fileBuffer: Buffer,
             fileName: string, mimeType: string): Promise<DriveUploadResult>;
  downloadFile(userId: string, driveFileId: string): Promise<Buffer>;
  deleteFile(userId: string, driveFileId: string): Promise<void>;
  createFolder(userId: string, folderName: string,
               parentFolderId?: string): Promise<DriveFolderResult>;
  listFolders(userId: string, parentFolderId?: string): Promise<DriveFolder[]>;
}
```

### 3.9 Storage Resolver

`packages/backend/src/services/StorageResolver.ts`

The routing brain that decides local vs. Drive for each operation:

```typescript
class StorageResolver {
  // Determines storage mode: checks if user has connected Google Drive
  async getStorageMode(userId: string): Promise<'local' | 'google_drive'>;

  // Get or auto-create project folder in user's Drive
  async resolveProjectFolder(userId: string, projectId: string,
                              projectName: string): Promise<string>;

  // Unified upload: routes to local or Drive based on user's config
  async uploadFile(userId: string, projectId: string, projectName: string,
                   fileBuffer: Buffer, fileName: string, mimeType: string): Promise<StorageResult>;

  // Unified read: handles both local files and Drive files
  async readFile(document: Document, userId: string): Promise<Buffer>;

  // Unified download URL: proxies or returns direct URL
  async getDownloadUrl(document: Document, userId: string): Promise<string>;

  // Unified delete
  async deleteFile(document: Document, userId: string): Promise<void>;
}
```

**Folder resolution logic:**
1. Check `project_drive_folders` for existing mapping
2. If exists -> use that `drive_folder_id`
3. If not -> create folder named `"Renovator - {Project Name}"` in Drive root
4. Save mapping to `project_drive_folders`
5. Return folder ID

### 3.10 Modify Existing Services

**`DocumentService`**: Replace `FileStorageService` with `StorageResolver`. On upload, save `storageProvider` and `driveFileId` on the document entity.

**`PhotoService`**: Same change. Thumbnails are also uploaded to Google Drive (same folder) when Drive is the provider.

Both services remain backward-compatible: existing documents with `storage_provider = 'local'` continue working as before.

### 3.11 New API Routes

**Google Drive auth** (`packages/backend/src/routes/google.ts`):

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/google/connect` | Returns Google OAuth2 consent URL (with `login_hint`) |
| `GET` | `/api/google/callback` | Handles OAuth2 callback, stores tokens, redirects to frontend |
| `GET` | `/api/google/status` | Returns `{ connected, email }` |
| `POST` | `/api/google/disconnect` | Revokes tokens, deletes from DB |

**Drive folder management** (added to existing project routes):

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/google/folders` | List root-level Drive folders |
| `GET` | `/api/google/folders/:folderId/children` | List subfolders |
| `GET` | `/api/projects/:projectId/drive-folder` | Get project's folder mapping |
| `PUT` | `/api/projects/:projectId/drive-folder` | Set/update folder mapping |
| `DELETE` | `/api/projects/:projectId/drive-folder` | Remove mapping (revert to auto-create) |

### 3.12 Modify Download Route

`GET /api/documents/:id/download` now checks `storageProvider`:
- `local` -> existing presigned URL logic
- `google_drive` -> backend fetches from Drive using stored tokens and streams to client

---

## 4. Frontend Implementation

### 4.1 New Hook: `useGoogleDrive`

```typescript
function useGoogleDrive() {
  return {
    isConnected: boolean;
    googleEmail: string | null;
    loading: boolean;
    connect: () => void;      // opens Google consent in popup/redirect
    disconnect: () => void;
    refreshStatus: () => void;
  };
}
```

### 4.2 Google Drive Settings UI

In the user profile/settings area, add a "Google Drive" section:

- **Disconnected state**: "Connect Google Drive" button + explanation
- **Connected state**: Shows linked Google email + "Disconnect" button
- **Connecting flow**:
  1. User clicks "Connect Google Drive"
  2. Frontend calls `GET /api/google/connect`
  3. Opens Google consent URL (popup or same-tab redirect)
  4. Google recognizes user's session from Keycloak login -- shows only Drive consent
  5. Callback stores tokens, redirects to frontend success route
  6. UI updates to "Connected"

### 4.3 Google OAuth Callback Page

New route at `/google/callback` in the frontend that:
1. Extracts the result (success/error) from URL params
2. Shows success/error message
3. Closes popup or redirects back to settings

### 4.4 Project Folder Selector

In the project's Documents/Photos tab header, add a small "Drive Folder" control:
- Shows current folder name (or "Auto-create on first upload")
- "Choose Folder" button opens a folder picker modal
- Folder picker navigates the user's Drive folder tree
- "Create New Folder" option within the picker
- "Reset to Auto" removes explicit mapping

### 4.5 Minor UI Updates

- **Upload components** (`DocumentUpload`, `PhotoUpload`): Add a small indicator showing "Uploading to Google Drive" vs "Uploading to local storage" based on connection status
- **List components** (`DocumentList`, `PhotoGallery`): Add a small Google Drive icon badge on Drive-stored files
- **Error handling**: If Drive token is expired/revoked, show "Reconnect Google Drive" prompt

### 4.6 i18n Translations

Add new translation keys for both `en` and `uk` locales.

---

## 5. Scope Decision: `drive.file` vs `drive`

| Scope | Access | Google Review Required | Recommendation |
|-------|--------|----------------------|----------------|
| `drive.file` | Only files/folders created by the app | No (sensitive scope, but no verification needed) | **Start here** |
| `drive` | All files and folders in user's Drive | Yes (restricted scope, requires verification) | Only if users need to browse existing folders |

With `drive.file`, the folder picker can only show folders created by your app. For the auto-create-per-project behavior, this is perfectly sufficient. If you later want users to pick *any* existing folder in their Drive, you can either upgrade to `drive` scope (requires Google review) or integrate the [Google Picker API](https://developers.google.com/drive/picker) on the frontend as a lighter alternative.

---

## 6. Phased Implementation Order

### Phase 1: Foundation
1. Enable Google Drive API in Google Cloud Console (`renovator-489414`)
2. Add backend redirect URIs to existing OAuth client
3. Generate `TOKEN_ENCRYPTION_KEY`, add to env
4. Database migration (3 tables/alterations)
5. New TypeORM entities (`UserGoogleDriveToken`, `ProjectDriveFolder`)
6. Modify `Document` entity (add `storageProvider`, `driveFileId`)
7. `TokenEncryptionService`
8. `GoogleDriveAuthService`
9. Google auth routes (`/api/google/*`)
10. Backend config updates

### Phase 2: Storage Integration
11. Install `googleapis` + `google-auth-library`
12. `GoogleDriveStorageProvider`
13. `StorageResolver`
14. Modify `DocumentService` to use `StorageResolver`
15. Modify `PhotoService` to use `StorageResolver`
16. Modify document/photo download routes
17. Project folder mapping routes

### Phase 3: Frontend
18. `useGoogleDrive` hook
19. Google Drive connection UI (settings/profile)
20. OAuth callback page (`/google/callback`)
21. Project folder selector component
22. Upload component Drive indicators
23. List component Drive badges
24. i18n translations

### Phase 4: Polish
25. Error handling for expired/revoked tokens
26. Graceful fallback (if Drive is unavailable, prompt reconnect)
27. Backward compatibility verification (existing local files unaffected)
28. Testing

---

## 7. Security Considerations

- **Token encryption**: Google refresh tokens encrypted with AES-256-GCM at rest in PostgreSQL
- **No tokens on frontend**: Google Drive tokens never leave the backend. Frontend only knows `isConnected: true/false`
- **Backend proxies all file access**: Files served through backend, not via direct Google Drive URLs
- **Credential reuse**: Same Google OAuth client used for both Keycloak IdP and Drive access -- users see the same app name, building trust
- **`login_hint`**: Pre-fills Google account selection using the email from the user's Keycloak session, preventing accidental linking of the wrong Google account
