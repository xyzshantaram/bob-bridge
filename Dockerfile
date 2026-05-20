FROM denoland/deno:alpine-2.7.14 AS builder

WORKDIR /app

COPY deno.json deno.lock ./
COPY src/ ./src/

RUN deno cache --allow-import src/main.ts

FROM denoland/deno:alpine-2.7.14

WORKDIR /app

COPY --from=builder /app/deno.json /app/deno.lock ./
COPY --from=builder /app/src/ ./src/

RUN deno cache --allow-import src/main.ts

USER deno

CMD ["run", "--allow-net", "--allow-read", "--allow-import", "src/main.ts"]
