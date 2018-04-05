apps:
  - script   : dist/index.js
    instances: 1
    exec_mode: cluster
    name: websocket-service
    args:
      - 3015
      - 6379
      - bhome.mdkkee.ng.0001.apne1.cache.amazonaws.com
    env_dev    :
      NODE_ENV: development
    env:
      NODE_ENV: production
  - script   : dist/watch.js
    instances: 1
    name: watcher
    exec_mode: cluster
    args:
      - 6379
      - bhome.mdkkee.ng.0001.apne1.cache.amazonaws.com
    env_dev    :
      NODE_ENV: development
    env:
      NODE_ENV: production