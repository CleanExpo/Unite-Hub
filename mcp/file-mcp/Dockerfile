FROM node:20-alpine

RUN apk add --no-cache grep

WORKDIR /app
COPY server.js .

ENV PORT=3104
ENV REPO_ROOT=/repo

EXPOSE 3104

CMD ["node", "server.js"]
