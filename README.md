# sails-deploy
Sails.js app deployment based on arunoda's meteor-up

## Usage

First-time deployment:
```
npm install -g sails-deploy-up
cd your/project/path
sails-up init deployment-name.json
# Edit deployment-name.json:
#     set the SSH connection params in the servers array. Use root or a user that can sudo without password.
#     set the relative (or absolute) app path at the app key.
#     set any environment variables at the env key
sails-up setup deployment-name.json
sails-up deploy deployment-name.json
```

Updates:
```
sails-up deploy deployment-name.json
```
