apps:
  - script   : dist/index.js
    instances: 2
    exec_mode: cluster
    name: single-service
    args:
      - 3015
      - 6379
      - bhome.mdkkee.ng.0001.apne1.cache.amazonaws.com
    env_dev    :
      NODE_ENV: development
    env:
      NODE_ENV: production