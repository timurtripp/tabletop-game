FROM node:alpine as node
WORKDIR /usr/app
COPY package.json /usr/app
COPY webpack.config.js /usr/app
COPY src /usr/app/src
COPY asset /usr/app/asset
RUN npm ci
RUN npm run build

FROM nginx:alpine
COPY --from=node /usr/app/dist /usr/share/nginx/html/dist
COPY index.html /usr/share/nginx/html
COPY texture /usr/share/nginx/html/texture
COPY icon.png /usr/share/nginx/html
