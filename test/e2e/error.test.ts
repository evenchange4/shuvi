import { AppCtx, Page, launchFixture } from '../utils';

jest.setTimeout(5 * 60 * 1000);

afterEach(() => {
  // force require to load file to make sure compiled file get load correctlly
  jest.resetModules();
});

describe('Basic Features', () => {
  let ctx: AppCtx;
  let page: Page;
  let logSpy = jest.spyOn(console, 'log');

  beforeAll(async () => {
    ctx = await launchFixture('error', { ssr: true });
  });

  afterAll(async () => {
    await page.close();
    await ctx.close();
    logSpy.mockRestore();
  });

  test('should log onDocumentProps error', async () => {
    page = await ctx.browser.page(ctx.url('/'));

    expect(logSpy).toHaveBeenLastCalledWith(
      'shuvi app run error',
      expect.objectContaining({
        message: 'onDocumentProps not returning object.'
      })
    );
  });
});
