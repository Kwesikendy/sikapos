import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('AuthContext - 1: AuthContext module exists and exports AuthProvider and useAuth', () => {
  const contextPath = path.join(rootDir, 'client', 'src', 'context', 'AuthContext.tsx');
  assert.ok(fs.existsSync(contextPath), 'client/src/context/AuthContext.tsx exists');

  const content = fs.readFileSync(contextPath, 'utf8');
  assert.ok(content.includes('export const AuthProvider'), 'AuthProvider is exported');
  assert.ok(content.includes('export const useAuth'), 'useAuth is exported');
  assert.ok(content.includes('export const AuthContext'), 'AuthContext is exported');
  assert.ok(content.includes('loginWithPassword'), 'loginWithPassword is provided in context');
  assert.ok(content.includes('loginWithPin'), 'loginWithPin is provided in context');
  assert.ok(content.includes('logout'), 'logout is provided in context');
  assert.ok(content.includes('checkAuth'), 'checkAuth session verification is provided');
});

test('AuthContext - 2: ProtectedRoute component exists with session verification and redirection', () => {
  const protectedPath = path.join(rootDir, 'client', 'src', 'components', 'auth', 'ProtectedRoute.tsx');
  assert.ok(fs.existsSync(protectedPath), 'client/src/components/auth/ProtectedRoute.tsx exists');

  const content = fs.readFileSync(protectedPath, 'utf8');
  assert.ok(content.includes('export const ProtectedRoute'), 'ProtectedRoute component is exported');
  assert.ok(content.includes('useAuth'), 'ProtectedRoute consumes useAuth hook');
  assert.ok(content.includes('isLoading'), 'ProtectedRoute checks session loading state');
  assert.ok(content.includes('isAuthenticated'), 'ProtectedRoute checks authentication status');
  assert.ok(content.includes('Navigate'), 'ProtectedRoute redirects unauthenticated visitors');
  assert.ok(content.includes('/cashier-login'), 'Default redirect target is /cashier-login');
});

test('AuthContext - 3: App.tsx wraps application in AuthProvider and protects /terminal', () => {
  const appPath = path.join(rootDir, 'client', 'src', 'App.tsx');
  const content = fs.readFileSync(appPath, 'utf8');

  assert.ok(content.includes('<AuthProvider>'), 'App.tsx mounts <AuthProvider>');
  assert.ok(content.includes('ProtectedRoute'), 'App.tsx imports ProtectedRoute');
  assert.ok(
    content.includes('<ProtectedRoute>') && content.includes('<PosTerminalPage />'),
    'App.tsx protects /terminal route with ProtectedRoute component'
  );
});

test('AuthContext - 4: Zero emojis and em dashes across auth context and protected route modules', () => {
  const files = [
    path.join(rootDir, 'client', 'src', 'context', 'AuthContext.tsx'),
    path.join(rootDir, 'client', 'src', 'components', 'auth', 'ProtectedRoute.tsx'),
  ];

  const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/u;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    assert.strictEqual(emojiRegex.test(content), false, `No emojis in ${path.basename(file)}`);
    assert.strictEqual(content.includes('—'), false, `No em dashes in ${path.basename(file)}`);
  }
});

test('AuthContext - 5: Logout function clears session, removes local storage user data, and redirects to signup', () => {
  const contextPath = path.join(rootDir, 'client', 'src', 'context', 'AuthContext.tsx');
  const content = fs.readFileSync(contextPath, 'utf8');

  // Verify session clearance
  assert.ok(content.includes('authApi.logout()'), 'Calls backend logout API');
  assert.ok(content.includes('syncToken(null)'), 'Clears active session token state');
  assert.ok(content.includes('setUser(null)'), 'Resets active user state');
  assert.ok(content.includes('setTenant(null)'), 'Resets active tenant state');

  // Verify local storage clearance
  assert.ok(content.includes('localStorage.removeItem'), 'Removes items from localStorage');
  assert.ok(content.includes('sessionStorage.removeItem'), 'Removes items from sessionStorage');
  assert.ok(content.includes('sikapos_user'), 'Removes stored user information');

  // Verify redirection to signup page
  assert.ok(content.includes('/merchant-signup'), 'Default redirect target is /merchant-signup');
  assert.ok(content.includes('navigate(redirectTo'), 'Uses navigate to redirect to signup page');
});

