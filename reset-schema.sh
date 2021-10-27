set -e
rm -rf src/generated/
yarn run codegen
yarn run processor:migrate
./reset-db.sh 
yarn run processor:start