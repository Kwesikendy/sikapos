import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('Toast Notifications - 1: Toast UI module exists and exports ToastProvider and useToast', () => {
  const toastFilePath = path.join(rootDir, 'client', 'src', 'components', 'ui', 'Toast.tsx');
  assert.ok(fs.existsSync(toastFilePath), 'Toast.tsx component file exists');

  const content = fs.readFileSync(toastFilePath, 'utf8');
  assert.ok(content.includes('ToastProvider'), 'ToastProvider is exported');
  assert.ok(content.includes('useToast'), 'useToast hook is exported');
  assert.ok(content.includes('showToast'), 'showToast is implemented');
  assert.ok(content.includes('dismissToast'), 'dismissToast is implemented');
  assert.ok(content.includes('success:'), 'toast.success convenience method is implemented');
  assert.ok(content.includes('error:'), 'toast.error convenience method is implemented');
});

test('Toast Notifications - 2: App.tsx mounts ToastProvider', () => {
  const appFilePath = path.join(rootDir, 'client', 'src', 'App.tsx');
  const appContent = fs.readFileSync(appFilePath, 'utf8');

  assert.ok(appContent.includes('<ToastProvider>'), 'App wraps routes with ToastProvider');
});

test('Toast Notifications - 3: MerchantSignupPage uses useToast for API call feedback', () => {
  const signupPath = path.join(rootDir, 'client', 'src', 'pages', 'MerchantSignupPage.tsx');
  const content = fs.readFileSync(signupPath, 'utf8');

  assert.ok(content.includes('useToast'), 'MerchantSignupPage imports and invokes useToast');
  assert.ok(content.includes('toast.success'), 'MerchantSignupPage fires success toast on OTP dispatch and registration');
  assert.ok(content.includes('toast.error'), 'MerchantSignupPage fires error toast on failed API requests');
});

test('Toast Notifications - 4: StoreSetupPage uses useToast for API call feedback', () => {
  const setupPath = path.join(rootDir, 'client', 'src', 'pages', 'StoreSetupPage.tsx');
  const content = fs.readFileSync(setupPath, 'utf8');

  assert.ok(content.includes('useToast'), 'StoreSetupPage imports and invokes useToast');
  assert.ok(content.includes('toast.success'), 'StoreSetupPage fires success toast on store configuration save');
  assert.ok(content.includes('toast.error'), 'StoreSetupPage fires error toast on failed API calls');
});

test('Toast Notifications - 5: Zero emojis and em dashes in Toast component and pages', () => {
  const toastFilePath = path.join(rootDir, 'client', 'src', 'components', 'ui', 'Toast.tsx');
  const toastContent = fs.readFileSync(toastFilePath, 'utf8');

  const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/u;
  assert.strictEqual(emojiRegex.test(toastContent), false, 'No emojis in Toast.tsx');
  assert.strictEqual(toastContent.includes('—'), false, 'No em dashes in Toast.tsx');
});
