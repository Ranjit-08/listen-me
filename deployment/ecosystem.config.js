module.exports = {
  apps: [{
    name:       'aura-music',
    script:     'server.js',
    cwd:        '/home/ec2-user/aura-music/backend',
    instances:  2,
    exec_mode:  'cluster',
    watch:      false,
    max_memory_restart: '500M',
    env_production: {
      NODE_ENV: 'production',
      PORT:     5000
    },
    error_file:      '/home/ec2-user/logs/aura-error.log',
    out_file:        '/home/ec2-user/logs/aura-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    autorestart:     true,
    restart_delay:   3000
  }]
};