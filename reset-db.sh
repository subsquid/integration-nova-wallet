set -e
rm -rf db/migrations/*.js
npm run db:reset
npm run db:create-migration -n "nova"
npm run db:migrate
yarn run processor:start