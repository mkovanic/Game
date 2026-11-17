# Sviečky a kľúče – statický web (úvodná stránka + hra) na nginx.
#   docker buildx build --platform linux/amd64 --build-arg SITE_URL=https://17november.eu -t <registry>/sviecky-a-kluce:<verzia> --push .
FROM node:22-alpine AS site
WORKDIR /app
ARG SITE_URL=https://17november.eu
# PostHog je voliteľný: --build-arg POSTHOG_KEY=phc_… (projektový kľúč, je verejný)
ARG POSTHOG_KEY=
ARG POSTHOG_HOST=https://eu.i.posthog.com
COPY package.json ./
COPY src/story.js src/story.js
COPY tools/build-site.mjs tools/build-site.mjs
COPY dist dist
COPY web web
RUN SITE_URL=$SITE_URL POSTHOG_KEY=$POSTHOG_KEY POSTHOG_HOST=$POSTHOG_HOST node tools/build-site.mjs

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=site /app/site /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/healthz || exit 1
