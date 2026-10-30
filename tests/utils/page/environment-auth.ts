import { test, expect, Page } from '../../../playwright';

/**
 * Locators for an environment's Auth tab, including the read-only view of an environment's
 * copy of a saved auth, and for the Preferences > Auth Modes panel.
 */
export const buildEnvironmentAuthLocators = (page: Page) => ({
  /** The Auth tab in the environment details tab strip */
  authTab: () => page.getByTestId('responsive-tab-auth'),
  /** The read-only view shown while the environment holds a copy of a saved auth */
  linkedSavedAuth: {
    view: () => page.getByTestId('linked-saved-auth'),
    authModeLabel: () => page.getByTestId('linked-saved-auth').getByTestId('auth-mode-label'),
    fields: () => page.getByTestId('linked-saved-auth').locator('.single-line-editor'),
    copyButton: () => page.getByTestId('linked-saved-auth-copy'),
    detachButton: () => page.getByTestId('linked-saved-auth-detach')
  },
  /** The editable environment auth form */
  editor: {
    authModeLabel: () => page.getByTestId('auth-mode-label').first(),
    fieldContaining: (text: string) => page.locator('.single-line-editor').filter({ hasText: text }).first(),
    saveButton: () => page.getByRole('button', { name: 'Save Environment Auth' })
  },
  /** Preferences > Auth Modes */
  preferencesAuthModes: {
    panel: () => page.getByTestId('preferences-auth-modes'),
    item: (name: string) => page.getByTestId('preferences-auth-modes').locator('.auth-mode-name').filter({ hasText: name })
  }
});

/** Switch the open environment settings to the Auth tab. */
export const openEnvironmentAuthTab = async (page: Page) => {
  await test.step('Open the environment Auth tab', async () => {
    const locators = buildEnvironmentAuthLocators(page);
    await locators.authTab().click();
    await expect(locators.authTab()).toHaveClass(/active/);
  });
};
