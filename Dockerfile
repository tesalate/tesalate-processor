# STAGE 1: Build
FROM node:20-alpine3.16 as builder
WORKDIR /home/node/app
COPY . ./
RUN yarn global add typescript ts-node \
  && yarn --frozen-lockfile \
  && tsc -p ./tsconfig.build.json

# STAGE 2: Remove
FROM node:20-alpine3.16 as ts-remover
WORKDIR /home/node/app
COPY --from=builder /home/node/app/package.json ./package.json
COPY --from=builder /home/node/app/yarn.lock ./yarn.lock
COPY --from=builder /home/node/app/dist ./dist
RUN yarn install --production --frozen-lockfile

# STAGE 3: Production
FROM node:20-alpine3.16
RUN apk add --no-cache --upgrade bash
WORKDIR /home/node/app
COPY wait-for-it.sh ./
COPY --from=ts-remover /home/node/app/ ./
CMD ["yarn", "start"]
