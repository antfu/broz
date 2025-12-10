import type { CommandOptions } from './types'

export async function resolveConfig(url: string, options: Partial<CommandOptions>): Promise<CommandOptions> {
  return {
    url: url || 'https://github.com/antfu/broz#readme',
    top: options.top || false,
    height: options.height ? Number(options.height) : undefined,
    width: options.width ? Number(options.width) : undefined,
    frame: options.frame || false,
  }
}
