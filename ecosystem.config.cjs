module.exports = {
  apps: [
    {
      name: 'genstore-web',
      script: 'serve.cjs',
      max_memory_restart: '256M',
      max_restarts: 5,
      min_uptime: '10s',
      restart_delay: 4000,
      env: {
        NODE_ENV: 'production',
        PORT: 3005,
        API_TARGET: 'http://localhost:3006',
      },
    },
    {
      name: 'genstore-api',
      script: 'server/dist/index.js',
      node_args: '--env-file=.env',
      max_memory_restart: '256M',
      max_restarts: 5,
      min_uptime: '10s',
      restart_delay: 4000,
      env: {
        NODE_ENV: 'production',
        API_PORT: 3006,
      },
    },
  ],
};
