import nextConfig from 'eslint-config-next'

const configs = Array.isArray(nextConfig) ? nextConfig : [nextConfig]

const eslintConfig = [
  ...configs,
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]

export default eslintConfig
