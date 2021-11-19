set -e
rm -rf db/migrations/*.js
npm run db:reset
npm run db:create-migration -n "fearless" 
npm run db:migrate
yarn run processor:start