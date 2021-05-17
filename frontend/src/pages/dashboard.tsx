import { useEffect } from "react"
import { Can } from "../components/Can"
import { useAuth } from "../hooks/auth"
import { usePermission } from "../hooks/permission"
import { setupAPIClient } from "../services/api"
import { api } from "../services/apiClient"
import { withSSRAuth } from "../utils/withSSRAuth"

export default function Dashboard() {
  const { user, signOut } = useAuth()

  useEffect(() => {
    api.get('/me')
      .then(response => console.log(response.data))
  }, [])

  return (
    <>
      <h1>dashboard: {user?.email}</h1>

      <button onClick={signOut}>SignOut</button>

      <Can permissions={['metrics.list']}>
        <div>Métricas</div>
      </Can>
    </>
  )
}

export const getServerSideProps = withSSRAuth(async (context) => {
  const apiClient = setupAPIClient(context)

  const response = await apiClient.get('/me')

  console.log(response.data)

  return {
    props: {}
  }
})
