import type { CAC } from 'cac'
import type { CommandOptions } from './types'
import process from 'node:process'
import { cac } from 'cac'
import { app } from 'electron'
import pkgJson from '../package.json'
import { resolveConfig } from './config'
import { createMainWindow } from './window'

let main = null

const cli: CAC = cac(pkgJson.name)

cli
  .command('[url]', 'launch broz')
  .option('--top', 'set window always on top')
  .option('--height <height>', 'set initial window height')
  .option('--width <width>', 'set initial window width')
  .option('--frame', 'set window has a frame')
  .action(async (url: string, options: Partial<CommandOptions>) => {
    const config = await resolveConfig(url, options)

    app.setName('Broz')
    app.on('window-all-closed', () => app.quit())

    try {
      await app.whenReady()
      main = createMainWindow(config)

      await main.loadURL(
        config.url.includes('://')
          ? config.url
          : `http://${config.url}`,
      )
    }
    catch (e) {
      console.error(e)
      process.exit(1)
    }
  })

cli.help()
cli.version(pkgJson.version)
cli.parse()
