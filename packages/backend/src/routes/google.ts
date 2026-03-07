import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import config from '../config';
import { authenticate } from '../middleware';
import { AppDataSource } from '../config/database';
import { ProjectDriveFolder } from '../entities/ProjectDriveFolder';
import { GoogleDriveAuthService, GoogleDriveTokenError } from '../services/GoogleDriveAuthService';
import { GoogleDriveStorageProvider } from '../services/GoogleDriveStorageProvider';

const router = Router();

let _authService: GoogleDriveAuthService | null = null;
let _storageProvider: GoogleDriveStorageProvider | null = null;

function isGoogleDriveConfigured(): boolean {
  return !!(config.google.clientId && config.google.clientSecret && config.tokenEncryption.key);
}

function requireGoogleConfig(_req: Request, res: Response, next: NextFunction): void {
  if (!isGoogleDriveConfigured()) {
    res.status(501).json({ error: 'Google Drive integration is not configured on this server' });
    return;
  }
  next();
}

function getAuthService(): GoogleDriveAuthService {
  if (!_authService) _authService = new GoogleDriveAuthService();
  return _authService;
}

function getStorageProvider(): GoogleDriveStorageProvider {
  if (!_storageProvider) _storageProvider = new GoogleDriveStorageProvider(getAuthService());
  return _storageProvider;
}

// In-memory map of state → userId for CSRF protection during OAuth flow.
// In production, use Redis or a DB table with TTL.
const pendingStates = new Map<string, { userId: string; email: string; ts: number }>();

// Clean stale entries older than 10 minutes
function cleanStaleStates() {
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  for (const [key, val] of pendingStates) {
    if (val.ts < tenMinutesAgo) pendingStates.delete(key);
  }
}

/**
 * GET /api/google/connect
 * Returns the Google OAuth consent URL for the authenticated user.
 */
router.get('/connect', authenticate, requireGoogleConfig, (req: Request, res: Response) => {
  try {
    cleanStaleStates();

    const state = crypto.randomBytes(24).toString('hex');
    pendingStates.set(state, {
      userId: req.userId!,
      email: req.user!.email,
      ts: Date.now(),
    });

    const authUrl = getAuthService().getAuthorizationUrl(req.user!.email, state);

    res.json({ authorizationUrl: authUrl });
  } catch (error) {
    console.error('Error generating Google Drive connect URL:', error);
    res.status(500).json({ error: 'Failed to generate Google Drive authorization URL' });
  }
});

/**
 * GET /api/google/callback
 * Handles the OAuth callback from Google, exchanges code for tokens.
 * Redirects the user back to the frontend with a success/error indicator.
 */
router.get('/callback', requireGoogleConfig, async (req: Request, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  try {
    const code = req.query.code as string;
    const state = req.query.state as string;
    const error = req.query.error as string;

    if (error) {
      return res.redirect(`${frontendUrl}/google/callback?error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      return res.redirect(`${frontendUrl}/google/callback?error=missing_params`);
    }

    const pending = pendingStates.get(state);
    if (!pending) {
      return res.redirect(`${frontendUrl}/google/callback?error=invalid_state`);
    }
    pendingStates.delete(state);

    await getAuthService().handleCallback(code, pending.userId);

    res.redirect(`${frontendUrl}/google/callback?success=true`);
  } catch (err) {
    console.error('Error in Google Drive OAuth callback:', err);
    res.redirect(`${frontendUrl}/google/callback?error=callback_failed`);
  }
});

/**
 * GET /api/google/status
 * Returns the Google Drive connection status for the authenticated user.
 */
router.get('/status', authenticate, async (req: Request, res: Response) => {
  try {
    if (!isGoogleDriveConfigured()) {
      res.json({ connected: false, configured: false });
      return;
    }
    const info = await getAuthService().getConnectionInfo(req.userId!);
    res.json({ ...info, configured: true });
  } catch (error) {
    console.error('Error getting Google Drive status:', error);
    res.status(500).json({ error: 'Failed to get Google Drive status' });
  }
});

/**
 * POST /api/google/disconnect
 * Revokes Google Drive access and deletes stored tokens.
 */
router.post('/disconnect', authenticate, requireGoogleConfig, async (req: Request, res: Response) => {
  try {
    await getAuthService().disconnect(req.userId!);
    res.json({ message: 'Google Drive disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting Google Drive:', error);
    res.status(500).json({ error: 'Failed to disconnect Google Drive' });
  }
});

// ─── Drive Folder Management ────────────────────────────────────────────────

/**
 * GET /api/google/folders
 * List root-level Drive folders for the authenticated user.
 */
router.get('/folders', authenticate, requireGoogleConfig, async (req: Request, res: Response) => {
  try {
    const connected = await getAuthService().isConnected(req.userId!);
    if (!connected) {
      res.status(400).json({ error: 'Google Drive not connected' });
      return;
    }

    const folders = await getStorageProvider().listFolders(req.userId!);
    res.json(folders);
  } catch (error) {
    if (error instanceof GoogleDriveTokenError) {
      res.status(401).json({ error: 'reconnect_required', message: error.message });
      return;
    }
    console.error('Error listing Drive folders:', error);
    res.status(500).json({ error: 'Failed to list Drive folders' });
  }
});

/**
 * GET /api/google/folders/:folderId/children
 * List subfolders of a specific Drive folder.
 */
router.get('/folders/:folderId/children', authenticate, requireGoogleConfig, async (req: Request, res: Response) => {
  try {
    const connected = await getAuthService().isConnected(req.userId!);
    if (!connected) {
      res.status(400).json({ error: 'Google Drive not connected' });
      return;
    }

    const { folderId } = req.params;
    const folders = await getStorageProvider().listFolders(req.userId!, folderId);
    res.json(folders);
  } catch (error) {
    if (error instanceof GoogleDriveTokenError) {
      res.status(401).json({ error: 'reconnect_required', message: error.message });
      return;
    }
    console.error('Error listing Drive subfolders:', error);
    res.status(500).json({ error: 'Failed to list Drive subfolders' });
  }
});

/**
 * GET /api/google/projects/:projectId/drive-folder
 * Get the Drive folder mapping for a project.
 */
router.get('/projects/:projectId/drive-folder', authenticate, requireGoogleConfig, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const repo = AppDataSource.getRepository(ProjectDriveFolder);

    const mapping = await repo.findOne({
      where: { projectId, userId: req.userId! },
    });

    if (!mapping) {
      res.json({ mapped: false });
      return;
    }

    res.json({
      mapped: true,
      driveFolderId: mapping.driveFolderId,
      driveFolderName: mapping.driveFolderName,
      driveFolderUrl: mapping.driveFolderUrl,
    });
  } catch (error) {
    console.error('Error getting project Drive folder:', error);
    res.status(500).json({ error: 'Failed to get project Drive folder' });
  }
});

/**
 * PUT /api/google/projects/:projectId/drive-folder
 * Set or update the Drive folder mapping for a project.
 */
router.put('/projects/:projectId/drive-folder', authenticate, requireGoogleConfig, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { driveFolderId, driveFolderName, driveFolderUrl } = req.body;

    if (!driveFolderId || !driveFolderName) {
      res.status(400).json({ error: 'driveFolderId and driveFolderName are required' });
      return;
    }

    const repo = AppDataSource.getRepository(ProjectDriveFolder);

    let mapping = await repo.findOne({
      where: { projectId, userId: req.userId! },
    });

    if (mapping) {
      mapping.driveFolderId = driveFolderId;
      mapping.driveFolderName = driveFolderName;
      mapping.driveFolderUrl = driveFolderUrl;
    } else {
      mapping = repo.create({
        projectId,
        userId: req.userId!,
        driveFolderId,
        driveFolderName,
        driveFolderUrl,
      });
    }

    await repo.save(mapping);
    res.json({
      mapped: true,
      driveFolderId: mapping.driveFolderId,
      driveFolderName: mapping.driveFolderName,
      driveFolderUrl: mapping.driveFolderUrl,
    });
  } catch (error) {
    console.error('Error setting project Drive folder:', error);
    res.status(500).json({ error: 'Failed to set project Drive folder' });
  }
});

/**
 * DELETE /api/google/projects/:projectId/drive-folder
 * Remove the explicit folder mapping (reverts to auto-create on next upload).
 */
router.delete('/projects/:projectId/drive-folder', authenticate, requireGoogleConfig, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const repo = AppDataSource.getRepository(ProjectDriveFolder);

    const mapping = await repo.findOne({
      where: { projectId, userId: req.userId! },
    });

    if (mapping) {
      await repo.remove(mapping);
    }

    res.json({ mapped: false });
  } catch (error) {
    console.error('Error removing project Drive folder mapping:', error);
    res.status(500).json({ error: 'Failed to remove project Drive folder mapping' });
  }
});

export default router;
