import { validateUserPermission } from "../utils/validateUserPermission";
import { useAuth } from "./auth";

interface PermissionParams {
  permissions?: string[]
  roles?: string[]
}

export function usePermission({ permissions, roles }: PermissionParams) {
  const { user, isAuthenticated } = useAuth()

  if(!isAuthenticated) {
    return false
  }

  const userHasValidPermission = validateUserPermission({
    user,
    permissions,
    roles
  })

  return userHasValidPermission
}