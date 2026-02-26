create view public.transactions_detail_with_categories as
select
  t.id,
  t.transaction_number,
  t.amount,
  t.currency,
  t.status,
  t.item_name,
  t.description,
  t.notes,
  t.payment_method,
  t.transaction_date,
  t.created_at,
  t.updated_at,
  u.id as user_id,
  u.username as user_username,
  u.first_name as user_first_name,
  u.last_name as user_last_name,
  concat(u.first_name, ' ', u.last_name) as user_full_name,
  u.email as user_email,
  u.phone_number as user_phone,
  u.id_card_number as user_id_card,
  u.role as user_role,
  ba.id as bank_account_id,
  ba.account_number,
  ba.account_name,
  ba.bank,
  ba.bank_name,
  ba.branch_name,
  ba.account_holder_name,
  ba.account_holder_id as account_holder_id_card,
  ba.is_primary as bank_account_is_primary,
  ba.is_active as bank_account_is_active,
  ba.verified as bank_account_verified,
  ba.account_balance,
  d.id as district_id,
  d.name as district_name,
  d.province,
  sd.id as sub_district_id,
  sd.name as sub_district_name,
  sd.villages_count,
  c.id as category_id,
  c.name as category_name,
  c.description as category_description,
  c.color as category_color,
  c.icon as category_icon,
  approval_user.id as approved_by_id,
  concat(
    approval_user.first_name,
    ' ',
    approval_user.last_name
  ) as approved_by_name,
  approval_user.username as approved_by_username,
  t.approved_at,
  rejection_user.id as rejected_by_id,
  concat(
    rejection_user.first_name,
    ' ',
    rejection_user.last_name
  ) as rejected_by_name,
  rejection_user.username as rejected_by_username,
  t.rejected_at,
  payment_user.id as paid_by_id,
  concat(
    payment_user.first_name,
    ' ',
    payment_user.last_name
  ) as paid_by_name,
  payment_user.username as paid_by_username,
  t.paid_at,
  created_by_user.id as created_by_id,
  concat(
    created_by_user.first_name,
    ' ',
    created_by_user.last_name
  ) as created_by_name,
  t.fee_amount,
  t.net_amount,
  t.error_code,
  t.error_message,
  t.ip_address,
  t.user_agent
from
  transactions t
  left join users u on t.user_id = u.id
  left join bank_accounts ba on t.bank_account_id = ba.id
  left join districts d on t.districts_id = d.id
  left join sub_districts sd on t.sub_districts_id = sd.id
  left join categories c on t.category_id = c.id
  left join users approval_user on t.approved_by = approval_user.id
  left join users rejection_user on t.rejected_by = rejection_user.id
  left join users payment_user on t.paid_by = payment_user.id
  left join users created_by_user on t.created_by = created_by_user.id;