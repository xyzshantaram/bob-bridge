FROM denoland/deno:2.0-alpine AS builder

WORKDIR /app

COPY deno.json deno.lock ./
COPY src/ ./src/

RUN deno cache src/main.ts

FROM denoland/deno:2.0-alpine

WORKDIR /app

COPY --from=builder /app/deno.json /app/deno.lock ./
COPY --from=builder /app/src/ ./src/

RUN deno cache src/main.ts

USER deno

CMD ["run", "--allow-net", "--allow-read", "--allow-import", "src/main.ts"]
