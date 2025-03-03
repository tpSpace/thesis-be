# lcasystem-BE

## Setup

- setup db (init schema with prisma)
- setup env for db (db url)
- init prisma for db migration with prisma/seed.js

## Run

```bash
docker build -t lcasystem-be:latest .
docker run -p 4000:4000 --env-file .env --name lcasystem-backend lcasystem-be:latest
```
