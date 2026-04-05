# --- Stage 1: Build frontend apps ---
FROM node:20 AS frontend-build
RUN corepack enable
WORKDIR /frontends
COPY ./frontends/ ./
RUN pnpm install --frozen-lockfile
# Build each frontend app — the VITE_BASE_PATH must match the URL segment
# used by FrontendAssetsService (e.g. /users, /admin)
RUN VITE_BASE_PATH=/users pnpm --filter ./users run build
# To add another app:
# RUN VITE_BASE_PATH=/admin pnpm --filter ./admin run build

# --- Stage 2: Build API ---
FROM node:20 AS api-build
WORKDIR /code
COPY ./package.json ./package-lock.json /code/
RUN npm ci
COPY . /code
RUN npm run build

# --- Stage 3: Runtime ---
FROM node:20-alpine AS runtime
WORKDIR /code

COPY --from=api-build /code/package.json /code/package.json
COPY --from=api-build /code/package-lock.json /code/package-lock.json
RUN npm ci --omit=optional --omit=dev && npm cache clean --force
RUN npm audit --omit=optional --omit=dev

COPY --from=api-build /code/build /code/build
COPY --from=api-build /code/openapi-nodegen-api-file.yml /code/openapi-nodegen-api-file.yml

# Copy built frontend assets (only dist/ folders needed at runtime)
COPY --from=frontend-build /frontends/users/dist /code/frontends/users/dist
# To add another app:
# COPY --from=frontend-build /frontends/admin/dist /code/frontends/admin/dist

COPY ./docker-entrypoint.sh /sbin/
RUN chmod 755 /sbin/docker-entrypoint.sh

RUN chown -R node:node /code/
USER node

ENTRYPOINT [ "/sbin/docker-entrypoint.sh" ]
CMD ["prod"]
