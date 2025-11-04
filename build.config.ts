import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/index'],
  declaration: 'node16',
  clean: true,
  rollup: {
    inlineDependencies: true,
    json: {
      compact: true,
      namedExports: false,
      preferConst: true,
    },
    commonjs: {
      requireReturnsDefault: 'auto',
    },
    dts: {
      respectExternal: false,
    },
  },
})
