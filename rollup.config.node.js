import string from 'rollup-plugin-string';

export default {
  format: 'cjs',
  plugins: [
    string({
      include: 'test/*.txt'
    })
  ]
}
