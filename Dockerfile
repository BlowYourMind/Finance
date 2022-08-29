FROM node:17-alpine3.14 as builder

WORKDIR /app

COPY package.json .
COPY yarn.lock .

RUN yarn --production=true
RUN cp -R node_modules prod_node_modules
RUN yarn --production=false
COPY . .

RUN yarn build

FROM node:17-alpine3.14

ENV NODE_ENV=production
ENV PORT=3013

EXPOSE $PORT

WORKDIR /app

COPY package.json .

COPY --from=builder /app/prod_node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# HEALTHCHECK CMD wget localhost:3004/cashforo-main || exit 1
