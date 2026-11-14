# Tests of the Dentora Lab

The tests never touch the production database. They run against an isolated
Postgres (the same schema, empty).

## Setup (once)

```powershell
docker run -d --name dentora-test-db -e POSTGRES_PASSWORD=dentora_test `
  -e POSTGRES_USER=dentora -e POSTGRES_DB=dentora_test -p 5433:5432 postgres:16-alpine

$env:DATABASE_URL = "postgresql://dentora:dentora_test@localhost:5433/dentora_test?schema=public"
npx prisma migrate deploy
```

The connection can also be given with `TEST_DATABASE_URL`:

```powershell
$env:TEST_DATABASE_URL = "postgresql://dentora:dentora_test@localhost:5433/dentora_test?schema=public"
```

## Running

```powershell
npm test          # all tests
npm run test:watch
```

## What is covered

| File | Area |
| --- | --- |
| `tests/unit/lab-domain.test.ts` | price split, Greek number and date formats, removal of contact details, the redirect url of the sign-in (the cause of the 494 errors), the encryption of the files, the upload limits |
| `tests/unit/lab-portfolio.test.ts` | the real type of an image (magic bytes), the dimensions, the size limits |
| `tests/integration/lab-offers.test.ts` | an offer with and without the mandatory consents, the request to a specific designer, a double submission, two parallel acceptances, an offer that was already handled, the access rules, the idempotent creation of a work |
| `tests/integration/lab-payments.test.ts` | the release of the money (only once, only when it is held), the idempotency keys, the escrow, the webhook (an event only once), the refund |
| `tests/integration/lab-uploads.test.ts` | the chunked upload with the checksum, an incomplete upload, a wrong checksum, the access of another user, the deliverable of the designer (only the assigned one) |
| `tests/integration/lab-portfolio.test.ts` | the CRUD of the portfolio, the ownership, the cover image, the order |

The Stripe calls are mocked, the database is the isolated Postgres.
