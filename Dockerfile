FROM node:alpine AS build
COPY . /
RUN npm install

FROM node:alpine
WORKDIR '/allproxy'
RUN apk add --no-cache tcpdump
RUN apk add --no-cache curl
RUN curl -L https://dl.k8s.io/v1.23.4/bin/linux/amd64/kubectl -o /bin/kubectl
RUN chmod +x /bin/kubectl

RUN mkdir /allproxy/client
RUN mkdir /allproxy/proto
COPY package.json /allproxy/package.json
COPY private /allproxy/private
COPY --from=build node_modules /allproxy/node_modules
COPY --from=build build /allproxy/build
COPY --from=build node-http-mitm-proxy /allproxy/node-http-mitm-proxy
COPY --from=build client/build /allproxy/client/build
COPY client/package.json /allproxy/client/package.json
COPY scripts /allproxy/scripts

EXPOSE 8888
CMD ["yarn", "start", "--listen", "8888"]
