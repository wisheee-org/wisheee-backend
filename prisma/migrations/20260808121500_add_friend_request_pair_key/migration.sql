-- Add a canonical key so A -> B and B -> A cannot coexist as pending requests.
ALTER TABLE "friend_requests" ADD COLUMN "pair_key" TEXT;

-- Reciprocal legacy requests mean both users consented. Convert each unordered
-- pair into one canonical friendship before enforcing the pending invariant.
WITH "reciprocal_pairs" AS (
    SELECT
        LEAST("request"."sender_id", "request"."addressee_id") AS "user_one",
        GREATEST("request"."sender_id", "request"."addressee_id") AS "user_two",
        MIN("request"."created_at") AS "created_at",
        MAX("request"."updated_at") AS "updated_at"
    FROM "friend_requests" AS "request"
    WHERE EXISTS (
        SELECT 1
        FROM "friend_requests" AS "reverse_request"
        WHERE "reverse_request"."sender_id" = "request"."addressee_id"
          AND "reverse_request"."addressee_id" = "request"."sender_id"
    )
    GROUP BY
        LEAST("request"."sender_id", "request"."addressee_id"),
        GREATEST("request"."sender_id", "request"."addressee_id")
)
INSERT INTO "friends" ("id", "user_one", "user_two", "created_at", "updated_at")
SELECT
    'migrated_' || MD5("pair"."user_one" || ':' || "pair"."user_two"),
    "pair"."user_one",
    "pair"."user_two",
    "pair"."created_at",
    "pair"."updated_at"
FROM "reciprocal_pairs" AS "pair"
WHERE NOT EXISTS (
    SELECT 1
    FROM "friends" AS "friend"
    WHERE ("friend"."user_one" = "pair"."user_one" AND "friend"."user_two" = "pair"."user_two")
       OR ("friend"."user_one" = "pair"."user_two" AND "friend"."user_two" = "pair"."user_one")
);

-- A pending request is invalid once a friendship exists, including friendships
-- just created from reciprocal requests above.
DELETE FROM "friend_requests" AS "request"
USING "friends" AS "friend"
WHERE ("friend"."user_one" = "request"."sender_id" AND "friend"."user_two" = "request"."addressee_id")
   OR ("friend"."user_one" = "request"."addressee_id" AND "friend"."user_two" = "request"."sender_id");

UPDATE "friend_requests"
SET "pair_key" = LEAST("sender_id", "addressee_id") || ':' || GREATEST("sender_id", "addressee_id");

ALTER TABLE "friend_requests" ALTER COLUMN "pair_key" SET NOT NULL;

CREATE UNIQUE INDEX "friend_requests_pair_key_key" ON "friend_requests"("pair_key");

CREATE INDEX "friend_requests_sender_id_created_at_idx" ON "friend_requests"("sender_id", "created_at");

CREATE INDEX "friend_requests_addressee_id_created_at_idx" ON "friend_requests"("addressee_id", "created_at");
