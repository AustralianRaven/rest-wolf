import { test, expect } from '../../../playwright';
import { closeAllCollections, createCollection, createRequest, openCollectionSettings, selectCollectionPaneTab } from '../../utils/page';

test.describe('Create collection', () => {
  test.afterEach(async ({ page }) => {
    // cleanup: close all collections
    await closeAllCollections(page);
  });

  test('Create collection and add a simple HTTP request', async ({ page, createTmpDir }) => {
    const collectionName = 'test-collection';
    const requestName = 'ping';

    await createCollection(page, collectionName, await createTmpDir(collectionName));

    // Create a new request using the dialog/modal flow
    await createRequest(page, requestName, collectionName);

    // Set the URL
    await page.locator('#request-url .CodeMirror').click();
    await page.locator('#request-url').locator('textarea').fill('http://localhost:8081');
    await page.locator('#request-actions').getByTestId('save-request-button').click();

    // Send a request
    await page.locator('#request-url .CodeMirror').click();
    await page.locator('#request-url').locator('textarea').fill('/ping');
    await page.locator('#request-actions').getByTestId('save-request-button').click();
    await page.getByTestId('send-arrow-icon').click();

    // Verify the response
    await expect(page.getByRole('main')).toContainText('200 OK');
  });

  test('a newly created collection has no version set (shows "Not Set")', async ({ page, createTmpDir }) => {
    const collectionName = 'versioned-collection';
    await createCollection(page, collectionName, await createTmpDir(collectionName));

    await openCollectionSettings(page, collectionName);
    await selectCollectionPaneTab(page, 'overview');
    await expect(page.getByTestId('info-version-value')).toHaveText('Not Set');
  });
});
