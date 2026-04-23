module.exports = {
  apps: [
    {
      name: 'genstore-web',
      script: 'serve.cjs',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        API_TARGET: 'http://localhost:3002',
      },
    },
    {
      name: 'genstore-api',
      script: 'server/dist/index.js',
      node_args: '--env-file=.env',
      env: {
        NODE_ENV: 'production',
        API_PORT: 3002,
      },
    },
  ],
};
