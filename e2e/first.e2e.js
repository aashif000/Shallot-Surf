// e2e/first.e2e.js
describe('ShallotSurf smoke', () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true });
  });

  it('adds a new tab and navigates', async () => {
    await expect(element(by.id('open-browser'))).toBeVisible();
    await element(by.id('open-browser')).tap();

    // Wait for browser screen
    await expect(element(by.id('address-input'))).toBeVisible();

    // Add a new tab
    await element(by.id('btn-add-tab')).tap();
    // There should be a new tab in the TabView (tab-1 etc)
    await expect(element(by.id('add-tab'))).toBeVisible();
  });

  it('searches for query', async () => {
    await element(by.id('address-input')).replaceText('example.com\n');
    await waitFor(element(by.text('Loading...'))).toBeNotVisible().withTimeout(5000);
  });
});
