module.exports = {
  apps: [
    {
      name: 'natalna-api',
      script: 'dist/main.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env_file: '.env.production',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
