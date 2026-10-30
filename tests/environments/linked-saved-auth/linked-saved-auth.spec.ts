import path from 'path';
import fs from 'fs';
import { test, expect, Page } from '../../../playwright';
import {
  buildEnvironmentAuthLocators,
  buildPreferencesLocators,
  closeAllCollections,
  createCollection,
  createEnvironment,
  openEnvironmentAuthTab,
  openEnvironmentConfigTab,
  openPreferences
} from '../../utils/page';

type Format = 'yml' | 'bru';

// The auth a teammate's environment file carries when its environment uses a saved auth that
// only exists on the teammate's machine.
const LINKED_COPY = {
  mode: 'apikey',
  apikey: { key: 'x-api-key', value: '{{API_KEY}}', placement: 'header' },
  namedAuthModeUid: 'saved-auth-from-a-teammate',
  namedAuthModeName: 'KC V2'
};

const linkedCopyOnDisk: Record<Format, string> = {
  yml: [
    'auth:',
    '  mode: apikey',
    '  apikey:',
    '    key: x-api-key',
    '    value: "{{API_KEY}}"',
    '    placement: header',
    `  namedAuthModeUid: ${LINKED_COPY.namedAuthModeUid}`,
    `  namedAuthModeName: ${LINKED_COPY.namedAuthModeName}`,
    ''
  ].join('\n'),
  bru: `meta {\n  authJson: ${JSON.stringify(LINKED_COPY)}\n}\n`
};

const findEnvironmentFile = (collectionsDir: string, collectionName: string, envName: string): string | null => {
  for (const root of [path.join(collectionsDir, collectionName), collectionsDir]) {
    const envDir = path.join(root, 'environments');
    if (!fs.existsSync(envDir)) continue;
    const match = fs.readdirSync(envDir).find((name) => new RegExp(`^${envName}\\.(bru|ya?ml)$`, 'i').test(name));
    if (match) return path.join(envDir, match);
  }
  return null;
};

const stageEnvironmentWithLinkedCopy = async (page: Page, collectionsDir: string, collectionName: string, format: Format) => {
  await createCollection(page, collectionName, collectionsDir, format);
  await createEnvironment(page, 'Dev', 'collection');

  await test.step('Write a copy of a saved auth into the environment file, as a teammate would commit it', async () => {
    await expect.poll(() => findEnvironmentFile(collectionsDir, collectionName, 'Dev')).not.toBeNull();
    const envFile = findEnvironmentFile(collectionsDir, collectionName, 'Dev') as string;
    fs.appendFileSync(envFile, `\n${linkedCopyOnDisk[format]}`);
    expect(fs.readFileSync(envFile, 'utf-8')).toContain(LINKED_COPY.namedAuthModeName);
  });

  await openEnvironmentConfigTab(page, 'collection');
  await openEnvironmentAuthTab(page);
  await expect(buildEnvironmentAuthLocators(page).linkedSavedAuth.view()).toBeVisible();
};

test.describe('Environment auth linked to a saved auth', () => {
  test.afterEach(async ({ page }) => {
    if (!page.isClosed()) {
      await closeAllCollections(page);
    }
  });

  for (const format of ['yml', 'bru'] as Format[]) {
    test(`Given a ${format} environment carrying a copy of a saved auth this machine lacks, When its Auth tab opens, Then the copy is shown read-only under the saved auth name`, async ({ page, createTmpDir }) => {
      const { linkedSavedAuth } = buildEnvironmentAuthLocators(page);
      const collectionsDir = await createTmpDir(`linked-saved-auth-${format}`);
      await stageEnvironmentWithLinkedCopy(page, collectionsDir, `linked-auth-${format}`, format);

      await test.step('Then the auth picker is labelled with the saved auth name', async () => {
        await expect(linkedSavedAuth.authModeLabel(), 'picker should show the saved auth name').toHaveText(LINKED_COPY.namedAuthModeName);
      });

      await test.step('Then the note explains the saved auth is not on this machine', async () => {
        await expect(linkedSavedAuth.view(), 'note should say the saved auth is missing locally').toContainText('KC V2 isn\'t in your saved auths');
      });

      await test.step('Then both copy and detach actions are offered', async () => {
        await expect(linkedSavedAuth.copyButton(), 'copy action should be offered').toBeVisible();
        await expect(linkedSavedAuth.detachButton(), 'detach action should be offered').toBeVisible();
      });

      await test.step('Then the stored key name is shown in a read-only field', async () => {
        await expect(linkedSavedAuth.fields().first(), 'key field should hold the stored value').toContainText('x-api-key');
        await expect(linkedSavedAuth.fields().first(), 'key field should be read-only').toHaveClass(/read-only/);
      });
    });
  }

  test('Given an environment carrying a copy of a saved auth, When Detach & edit is clicked, Then the auth becomes an editable form', async ({ page, createTmpDir }) => {
    const { linkedSavedAuth, editor } = buildEnvironmentAuthLocators(page);
    const collectionsDir = await createTmpDir('linked-saved-auth-detach');
    await stageEnvironmentWithLinkedCopy(page, collectionsDir, 'linked-auth-detach', 'yml');

    await test.step('When Detach & edit is clicked', async () => {
      await linkedSavedAuth.detachButton().click();
      await expect(linkedSavedAuth.view(), 'read-only view should close').toHaveCount(0);
    });

    await test.step('Then the editable auth form is shown', async () => {
      await expect(editor.saveButton(), 'save button should appear').toBeVisible();
    });

    await test.step('Then the picker shows the plain auth type with the settings kept', async () => {
      await expect(editor.authModeLabel(), 'picker should show the plain auth type').toHaveText('API Key');
      await expect(editor.fieldContaining('x-api-key'), 'key name should be kept').toBeVisible();
    });
  });

  test('Given an environment carrying a copy of a saved auth, When it is copied to my saved auths, Then it is listed under Preferences > Auth Modes', async ({ page, createTmpDir }) => {
    const { linkedSavedAuth, preferencesAuthModes } = buildEnvironmentAuthLocators(page);
    const preferences = buildPreferencesLocators(page);
    const collectionsDir = await createTmpDir('linked-saved-auth-copy');
    await stageEnvironmentWithLinkedCopy(page, collectionsDir, 'linked-auth-copy', 'yml');

    await test.step('When Copy to my saved auths is clicked', async () => {
      await linkedSavedAuth.copyButton().click();
      await expect(page.getByText(/Saved as ".*KC V2.*" in Preferences/), 'a confirmation toast should appear').toBeVisible();
    });

    await test.step('When Preferences > Auth Modes is opened', async () => {
      await openPreferences(page);
      await expect(preferences.tab('Auth Modes'), 'Auth Modes tab should exist').toBeVisible();
      await preferences.tab('Auth Modes').click();
      await expect(preferencesAuthModes.panel(), 'Auth Modes panel should open').toBeVisible();
    });

    await test.step('Then the copied auth is listed', async () => {
      await expect(preferencesAuthModes.item('KC V2'), 'copied auth should be listed').toBeVisible();
    });
  });
});
