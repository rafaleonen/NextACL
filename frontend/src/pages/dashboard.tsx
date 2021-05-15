import { useAuth } from "../hooks/auth"

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <h1>dashboard: {user?.email}</h1>
  )
}