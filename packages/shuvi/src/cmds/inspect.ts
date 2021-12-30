import { inspect } from 'util';
import path from 'path';
import program from 'commander';
import { highlight } from 'cli-highlight';
import chalk from '@shuvi/utils/lib/chalk';
import { getApi } from '@shuvi/service';
import { getBundler } from '@shuvi/service/lib/bundler/bundler';
import { getProjectDir, getConfigFromCli } from '../utils';
import { getPackageInfo } from '../utils';

export default async function main(argv: string[]) {
  const pkgInfo = getPackageInfo();
  program
    .name(pkgInfo.name)
    .description('inspect internal webpack config')
    .usage('inspect [options] [...paths]')
    .helpOption()
    .option('--mode <mode>', 'specify env mode (default: development)')
    .option('--verbose', 'show full webpack config')
    .option('--config <file>', 'path to config file')
    .option('--config-overrides [json]', 'config overrides json')
    .parse(argv, { from: 'user' });
  const cwd = getProjectDir(program);
  const mode = ['development', 'production'].includes(program.mode)
    ? program.mode
    : 'development';

  Object.assign(process.env, {
    NODE_ENV: mode
  });
  const config = getConfigFromCli(program);
  const api = await getApi({
    cwd,
    config,
    configFile: program.config && path.resolve(cwd, program.config),
    mode,
    phase: 'PHASE_INSPECT_WEBPACK'
  });
  const bundler = getBundler(api.pluginContext);

  const configs = await bundler.resolveWebpackConfig();

  configs.forEach(({ name, config }) => {
    console.log(chalk.cyan.bold(`${name} webpack config`));
    const configString = inspect(config, { depth: program.verbose ? 10 : 2 });
    if (process.env.__DISABLE_HIGHLIGHT__ === 'true') {
      console.log(configString);
    } else {
      console.log(highlight(configString, { language: 'js' }));
    }
  });
}