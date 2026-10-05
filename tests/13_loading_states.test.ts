import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('Loading States - 1: LoadingOverlay component exists and exports correctly', () => {
  const overlayPath = path.join(rootDir, 'client', 'src', 'components', 'ui', 'LoadingOverlay.tsx');
  assert.ok(fs.existsSync(overlayPath), 'client/src/components/ui/LoadingOverlay.tsx exists');

  const content = fs.readFileSync(overlayPath, 'utf8');
  assert.ok(content.includes('export const LoadingOverlay'), 'LoadingOverlay is exported');
  assert.ok(content.includes('role="status"'), 'LoadingOverlay has accessibility role status');
  assert.ok(content.includes('aria-live="polite"'), 'LoadingOverlay has aria-live attribute');
  assert.ok(content.includes('Loader2'), 'Uses Loader2 spinner');
});

test('Loading States - 2: MerchantSignupPage implements button loading states and LoadingOverlay', () => {
  const signupPath = path.join(rootDir, 'client', 'src', 'pages', 'MerchantSignupPage.tsx');
  const content = fs.readFileSync(signupPath, 'utf8');

  // Initial submission loading
  assert.ok(content.includes('isLoading={isLoading}'), 'Initial submit button has isLoading');
  assert.ok(content.includes('if (isLoading) return'), 'Guards against double initial submission');

  // Resend OTP loading
  assert.ok(content.includes('isResendingOtp'), 'Tracks isResendingOtp state');
  assert.ok(content.includes('Resending Code...'), 'Displays feedback while resending code');

  // Verification and tenant registration loading
  assert.ok(content.includes('isLoading={isVerifyingOtp}'), 'Verify button has isVerifyingOtp');
  assert.ok(content.includes('if (isVerifyingOtp) return'), 'Guards against double verification submission');
  assert.ok(content.includes('<LoadingOverlay'), 'Renders LoadingOverlay');
  assert.ok(content.includes('isOpen={isVerifyingOtp}'), 'LoadingOverlay activates during verification');
});

test('Loading States - 3: StoreSetupPage implements button loading states and LoadingOverlay', () => {
  const setupPath = path.join(rootDir, 'client', 'src', 'pages', 'StoreSetupPage.tsx');
  const content = fs.readFileSync(setupPath, 'utf8');

  // Action button loading
  assert.ok(content.includes('isLoading={isSaving}'), 'Submit button has isLoading={isSaving}');
  assert.ok(content.includes('disabled={isSaving'), 'Buttons are disabled while saving');
  assert.ok(content.includes('if (isSaving'), 'Guards against double store setup submission');
  assert.ok(content.includes('<LoadingOverlay'), 'Renders LoadingOverlay');
  assert.ok(content.includes('isOpen={isSaving}'), 'LoadingOverlay activates while saving');
});

test('Loading States - 4: PosTerminalPage implements button loading states and LoadingOverlay', () => {
  const posPath = path.join(rootDir, 'client', 'src', 'pages', 'PosTerminalPage.tsx');
  const content = fs.readFileSync(posPath, 'utf8');

  // Checkout transaction processing
  assert.ok(content.includes('disabled={isProcessingSale}'), 'Checkout button is disabled while processing');
  assert.ok(content.includes('if (isProcessingSale) return'), 'Guards against double sale processing');
  assert.ok(content.includes('Processing Transaction...'), 'Displays processing text on checkout button');

  // Add Product loading
  assert.ok(content.includes('disabled={isAddingProduct}'), 'Add product button is disabled while adding');
  assert.ok(content.includes('if (isAddingProduct) return'), 'Guards against double product creation');

  // History and Logout loading
  assert.ok(content.includes('disabled={isLoadingHistory}'), 'History button is disabled while loading');
  assert.ok(content.includes('disabled={isLoggingOut}'), 'Logout button is disabled while logging out');

  // Loading Overlays
  assert.ok(content.includes('isOpen={isProcessingSale}'), 'LoadingOverlay activates during transaction processing');
  assert.ok(content.includes('isOpen={isLoggingOut}'), 'LoadingOverlay activates during logout');
});

test('Loading States - 5: Zero emojis and em dashes across all updated files', () => {
  const files = [
    path.join(rootDir, 'client', 'src', 'components', 'ui', 'LoadingOverlay.tsx'),
    path.join(rootDir, 'client', 'src', 'pages', 'MerchantSignupPage.tsx'),
    path.join(rootDir, 'client', 'src', 'pages', 'StoreSetupPage.tsx'),
    path.join(rootDir, 'client', 'src', 'pages', 'PosTerminalPage.tsx'),
  ];

  const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/u;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    assert.strictEqual(emojiRegex.test(content), false, `No emojis in ${path.basename(file)}`);
    assert.strictEqual(content.includes('—'), false, `No em dashes in ${path.basename(file)}`);
  }
});
