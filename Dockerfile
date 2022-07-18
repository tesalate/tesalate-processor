# STAGE 1
FROM node:18.6.0-alpine as ts-compiler
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package.json yarn.lock ./
RUN yarn global add typescript ts-node rimraf

# RUN yarn global add copyfiles
USER node
COPY --chown=node:node . .
RUN yarn
RUN rimraf dist/
RUN tsc -b

# STAGE 2
FROM node:18.6.0-alpine as ts-remover
WORKDIR /home/node/app
COPY --from=ts-compiler /home/node/app/package.json ./
COPY --from=ts-compiler /home/node/app/yarn.lock ./
COPY --from=ts-compiler /home/node/app/dist ./dist/
RUN yarn install --production


# STAGE 3
FROM node:18.6.0-alpine
RUN apk add --no-cache --upgrade bash
WORKDIR /home/node/app
# COPY ecosystem.config.json wait-for-it.sh ./
COPY ecosystem.config.json ./
COPY --from=ts-remover /home/node/app/ ./
CMD yarn start