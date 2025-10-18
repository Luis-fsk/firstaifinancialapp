/**
 * Safe profile query helpers
 * 
 * These helpers ensure that sensitive subscription data is not exposed
 * when querying profiles of other users (connections).
 */

// Safe fields that can be exposed to connections
export const SAFE_PROFILE_FIELDS = 'id,user_id,username,display_name,avatar_url,bio,connections_count,posts_count,created_at,updated_at';

// All fields including sensitive subscription data (only for own profile)
export const FULL_PROFILE_FIELDS = '*';

/**
 * Get the appropriate fields to select based on whether querying own profile or others
 * @param isOwnProfile - Whether the profile being queried belongs to the current user
 * @returns Comma-separated list of fields to select
 */
export function getProfileFields(isOwnProfile: boolean): string {
  return isOwnProfile ? FULL_PROFILE_FIELDS : SAFE_PROFILE_FIELDS;
}
