import filesize from 'rollup-plugin-filesize'

export default {
  entry: 'src/index.js',
  dest: 'dist/netflux.es2015.umd.js',
  format: 'umd',
  moduleName: 'netflux',
  plugins: [
    filesize()
  ]
}
