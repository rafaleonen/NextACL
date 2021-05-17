import { ReactNode } from "react";
import { usePermission } from "../hooks/permission";

interface CanProps {
  children: ReactNode
  permissions?: string[]
  roles?: string[] 
}

export function Can({ roles, permissions, children }: CanProps) {
  const userCanSeeComponent = usePermission({ permissions, roles })

  console.log(userCanSeeComponent)

  if(!userCanSeeComponent) {
    return null
  }

  return (
    <>
      {children}
    </>
  )
}