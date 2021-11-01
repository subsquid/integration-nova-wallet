FROM node:14 AS builder
WORKDIR /hydra-build
ADD package.json .
ADD yarn.lock .
RUN yarn install
ADD tsconfig.json .
ADD src src
RUN npm run build


FROM node:14 AS processor
WORKDIR /hydra-project
COPY --from=builder /hydra-build/package.json .
COPY --from=builder /hydra-build/yarn.lock .
RUN yarn install
COPY --from=builder /hydra-build/lib lib
ADD db db
ADD manifest.yml .
ADD schema.graphql .
ADD .env .
CMD ["npm", "run", "processor:start"]


FROM processor AS query-node
CMD ["node", "./lib/generated/server.js"]
