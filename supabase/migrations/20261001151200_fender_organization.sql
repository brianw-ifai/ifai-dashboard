-- Client organization for the Fender dashboard.
-- intofocus_admin is reserved for the platform org, so staff access here is org_admin.

INSERT INTO command.organizations (name, slug, is_platform_org)
VALUES ('Fender', 'fender', false)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    is_active = true;

INSERT INTO command.organization_memberships (organization_id, user_id, role, status)
SELECT o.id, u.id, 'org_admin'::command.organization_role, 'active'::command.membership_status
FROM command.organizations o
CROSS JOIN auth.users u
WHERE o.slug = 'fender'
  AND u.email IN ('brian.w@intofocus.ai', 'marc.s@intofocus.ai')
ON CONFLICT (organization_id, user_id) DO UPDATE
SET role = EXCLUDED.role,
    status = EXCLUDED.status;
