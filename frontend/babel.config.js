module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-react',
  ],
  plugins: [
    '@babel/plugin-transform-modules-commonjs', // Convierte ESM a CommonJS
  ],
  env: {
    test: {
      plugins: [
        [
          'istanbul',
          {
            exclude: [
              '**/*.test.js',
              '**/*.test.jsx',
              '**/tests/**',
              '**/cypress/**',
              '/src/services/firebase.js', // Excluir firebase.js
            ],
          },
        ],
      ],
    },
  },
};