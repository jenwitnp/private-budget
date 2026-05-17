-- Add member (ผู้แทน/ผู้รับมอบ) columns to transactions_detail_with_categories view

CREATE OR REPLACE VIEW "public"."transactions_detail_with_categories" AS
 SELECT "t"."id",
    "t"."transaction_number",
    "t"."amount",
    "t"."currency",
    "t"."status",
    "t"."item_name",
    "t"."description",
    "t"."notes",
    "t"."payment_method",
    "t"."transaction_date",
    "t"."created_at",
    "t"."updated_at",
    "u"."id" AS "user_id",
    "u"."username" AS "user_username",
    "u"."first_name" AS "user_first_name",
    "u"."last_name" AS "user_last_name",
    "concat"("u"."first_name", ' ', "u"."last_name") AS "user_full_name",
    "u"."email" AS "user_email",
    "u"."phone_number" AS "user_phone",
    "u"."id_card_number" AS "user_id_card",
    "u"."role" AS "user_role",
    "ba"."id" AS "bank_account_id",
    "ba"."account_number",
    "ba"."account_name",
    "ba"."bank",
    "ba"."bank_name",
    "ba"."branch_name",
    "ba"."account_holder_name",
    "ba"."account_holder_id" AS "account_holder_id_card",
    "ba"."is_primary" AS "bank_account_is_primary",
    "ba"."is_active" AS "bank_account_is_active",
    "ba"."verified" AS "bank_account_verified",
    "ba"."account_balance",
    "d"."id" AS "district_id",
    "d"."name" AS "district_name",
    "d"."province",
    "sd"."id" AS "sub_district_id",
    "sd"."name" AS "sub_district_name",
    "sd"."villages_count",
    "c"."id" AS "category_id",
    "c"."name" AS "category_name",
    "c"."description" AS "category_description",
    "c"."color" AS "category_color",
    "c"."icon" AS "category_icon",
    "approval_user"."id" AS "approved_by_id",
    "concat"("approval_user"."first_name", ' ', "approval_user"."last_name") AS "approved_by_name",
    "approval_user"."username" AS "approved_by_username",
    "t"."approved_at",
    "rejection_user"."id" AS "rejected_by_id",
    "concat"("rejection_user"."first_name", ' ', "rejection_user"."last_name") AS "rejected_by_name",
    "rejection_user"."username" AS "rejected_by_username",
    "t"."rejected_at",
    "payment_user"."id" AS "paid_by_id",
    "concat"("payment_user"."first_name", ' ', "payment_user"."last_name") AS "paid_by_name",
    "payment_user"."username" AS "paid_by_username",
    "t"."paid_at",
    "created_by_user"."id" AS "created_by_id",
    "concat"("created_by_user"."first_name", ' ', "created_by_user"."last_name") AS "created_by_name",
    "t"."fee_amount",
    "t"."net_amount",
    "t"."thumbnail",
    "t"."error_code",
    "t"."error_message",
    "t"."ip_address",
    "t"."user_agent",
    "t"."member_id",
    "m"."first_name" AS "member_first_name",
    "m"."last_name" AS "member_last_name",
    "m"."level" AS "member_level",
    "m"."district" AS "member_district",
    "m"."subdistrict" AS "member_subdistrict"
   FROM (((((((((("public"."transactions" "t"
     LEFT JOIN "public"."users" "u" ON (("t"."user_id" = "u"."id")))
     LEFT JOIN "public"."bank_accounts" "ba" ON (("t"."bank_account_id" = "ba"."id")))
     LEFT JOIN "public"."districts" "d" ON (("t"."districts_id" = "d"."id")))
     LEFT JOIN "public"."sub_districts" "sd" ON (("t"."sub_districts_id" = "sd"."id")))
     LEFT JOIN "public"."categories" "c" ON (("t"."category_id" = "c"."id")))
     LEFT JOIN "public"."users" "approval_user" ON (("t"."approved_by" = "approval_user"."id")))
     LEFT JOIN "public"."users" "rejection_user" ON (("t"."rejected_by" = "rejection_user"."id")))
     LEFT JOIN "public"."users" "payment_user" ON (("t"."paid_by" = "payment_user"."id")))
     LEFT JOIN "public"."users" "created_by_user" ON (("t"."created_by" = "created_by_user"."id")))
     LEFT JOIN "public"."members" "m" ON (("t"."member_id" = "m"."id")));

GRANT ALL ON TABLE "public"."transactions_detail_with_categories" TO "anon";
GRANT ALL ON TABLE "public"."transactions_detail_with_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions_detail_with_categories" TO "service_role";
