-- Command product identity: orgs, memberships, profiles (separate from public.*)

CREATE TYPE command.organization_role AS ENUM (
  'intofocus_admin',
  'org_admin',
  'org_viewer'
);

CREATE TYPE command.membership_status AS ENUM (
  'active',
  'invited',
  'suspended',
  'removed'
);

CREATE TABLE command.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  is_platform_org boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organizations_platform_slug CHECK (
    NOT is_platform_org OR slug = 'intofocus-ai'
  )
);

CREATE UNIQUE INDEX organizations_single_platform_org
  ON command.organizations ((is_platform_org))
  WHERE is_platform_org = true;

CREATE TABLE command.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text,
  avatar_path text,
  avatar_updated_at timestamptz,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE command.organization_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES command.organizations (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role command.organization_role NOT NULL DEFAULT 'org_viewer',
  status command.membership_status NOT NULL DEFAULT 'invited',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE OR REPLACE FUNCTION command.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER organizations_set_updated_at
  BEFORE UPDATE ON command.organizations
  FOR EACH ROW
  EXECUTE FUNCTION command.set_updated_at();

CREATE TRIGGER user_profiles_set_updated_at
  BEFORE UPDATE ON command.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION command.set_updated_at();

CREATE TRIGGER organization_memberships_set_updated_at
  BEFORE UPDATE ON command.organization_memberships
  FOR EACH ROW
  EXECUTE FUNCTION command.set_updated_at();

CREATE OR REPLACE FUNCTION command.enforce_intofocus_admin_platform_org()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = command, public
AS $$
DECLARE
  platform boolean;
BEGIN
  IF NEW.role = 'intofocus_admin' THEN
    SELECT is_platform_org INTO platform
    FROM command.organizations
    WHERE id = NEW.organization_id;

    IF NOT COALESCE(platform, false) THEN
      RAISE EXCEPTION 'intofocus_admin is only allowed on the platform organization';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER organization_memberships_enforce_intofocus_admin
  BEFORE INSERT OR UPDATE OF role, organization_id ON command.organization_memberships
  FOR EACH ROW
  EXECUTE FUNCTION command.enforce_intofocus_admin_platform_org();

CREATE OR REPLACE FUNCTION command.role_rank(r command.organization_role)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE r
    WHEN 'org_viewer' THEN 1
    WHEN 'org_admin' THEN 2
    WHEN 'intofocus_admin' THEN 3
  END;
$$;

CREATE OR REPLACE FUNCTION command.is_intofocus_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = command, auth, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM command.organization_memberships m
    JOIN command.organizations o ON o.id = m.organization_id
    WHERE m.user_id = auth.uid()
      AND m.status = 'active'
      AND m.role = 'intofocus_admin'
      AND o.is_platform_org = true
  );
$$;

CREATE OR REPLACE FUNCTION command.user_has_org_role(
  p_organization_id uuid,
  p_min_role command.organization_role
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = command, auth, public
AS $$
  SELECT command.is_intofocus_admin()
    OR EXISTS (
      SELECT 1
      FROM command.organization_memberships m
      WHERE m.user_id = auth.uid()
        AND m.organization_id = p_organization_id
        AND m.status = 'active'
        AND command.role_rank(m.role) >= command.role_rank(p_min_role)
    );
$$;

GRANT EXECUTE ON FUNCTION command.is_intofocus_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION command.user_has_org_role(uuid, command.organization_role) TO authenticated;

ALTER TABLE command.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE command.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE command.organization_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY organizations_select ON command.organizations
  FOR SELECT TO authenticated
  USING (
    command.is_intofocus_admin()
    OR EXISTS (
      SELECT 1
      FROM command.organization_memberships m
      WHERE m.organization_id = organizations.id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

CREATE POLICY organizations_insert ON command.organizations
  FOR INSERT TO authenticated
  WITH CHECK (command.is_intofocus_admin());

CREATE POLICY organizations_update ON command.organizations
  FOR UPDATE TO authenticated
  USING (command.is_intofocus_admin() OR command.user_has_org_role(id, 'org_admin'))
  WITH CHECK (command.is_intofocus_admin() OR command.user_has_org_role(id, 'org_admin'));

CREATE POLICY user_profiles_select ON command.user_profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR command.is_intofocus_admin());

CREATE POLICY user_profiles_insert ON command.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR command.is_intofocus_admin());

CREATE POLICY user_profiles_update ON command.user_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR command.is_intofocus_admin())
  WITH CHECK (id = auth.uid() OR command.is_intofocus_admin());

CREATE POLICY memberships_select ON command.organization_memberships
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR command.is_intofocus_admin()
    OR command.user_has_org_role(organization_id, 'org_admin')
  );

CREATE POLICY memberships_insert ON command.organization_memberships
  FOR INSERT TO authenticated
  WITH CHECK (
    command.is_intofocus_admin()
    OR command.user_has_org_role(organization_id, 'org_admin')
  );

CREATE POLICY memberships_update ON command.organization_memberships
  FOR UPDATE TO authenticated
  USING (
    command.is_intofocus_admin()
    OR command.user_has_org_role(organization_id, 'org_admin')
  )
  WITH CHECK (
    command.is_intofocus_admin()
    OR command.user_has_org_role(organization_id, 'org_admin')
  );

CREATE POLICY memberships_delete ON command.organization_memberships
  FOR DELETE TO authenticated
  USING (
    command.is_intofocus_admin()
    OR command.user_has_org_role(organization_id, 'org_admin')
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON command.organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON command.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON command.organization_memberships TO authenticated;

-- Seed platform org, profiles, IntoFocus staff memberships
INSERT INTO command.organizations (name, slug, is_platform_org)
VALUES ('IntoFocus AI', 'intofocus-ai', true)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    is_platform_org = EXCLUDED.is_platform_org,
    is_active = true;

INSERT INTO command.user_profiles (id)
SELECT id FROM auth.users
ON CONFLICT (id) DO NOTHING;

INSERT INTO command.organization_memberships (organization_id, user_id, role, status)
SELECT o.id, u.id, 'intofocus_admin'::command.organization_role, 'active'::command.membership_status
FROM command.organizations o
CROSS JOIN auth.users u
WHERE o.slug = 'intofocus-ai'
  AND u.email IN ('brian.w@intofocus.ai', 'marc.s@intofocus.ai')
ON CONFLICT (organization_id, user_id) DO UPDATE
SET role = EXCLUDED.role,
    status = EXCLUDED.status;

-- Private avatar uploads (signed URLs in app)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'command-avatars',
  'command-avatars',
  false,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY command_avatars_select_own ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'command-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY command_avatars_insert_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'command-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY command_avatars_update_own ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'command-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'command-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY command_avatars_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'command-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
