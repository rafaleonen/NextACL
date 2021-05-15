import { createContext, ReactNode, useContext } from 'react'

interface SignInCredentials {
  email: string
  password: string
}

interface AuthContextData {
  signIn: (credentials: SignInCredentials) => Promise<void>
  isAuthenticated: boolean
}

interface AuthProviderProps {
  children: ReactNode
}

const AuthContext = createContext({} as AuthContextData)

export const AuthProvider = ({ children}: AuthProviderProps) => {
  const isAuthenticated = false

  const signIn = async ({ email, password }: SignInCredentials) => {
    console.log(email, password)
  }

  return (
    <AuthContext.Provider value={{ signIn, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if(!context) {
    throw new Error("useAuth must be used within a Provider")
  }

  return context
}

