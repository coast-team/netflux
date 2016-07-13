import string from 'rollup-plugin-string'

export default {
  plugins: [
    string({
    	include:'**/*.txt'
    })
  ]
}
