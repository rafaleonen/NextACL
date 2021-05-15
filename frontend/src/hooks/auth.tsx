import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { setCookie, parseCookies, destroyCookie } from 'nookies'
import Router from 'next/router'

import { api } from '../services/api'

interface User {
  email: string
  permissions: string[]
  roles: string[]
}

interface SignInCredentials {
  email: string
  password: string
}

interface AuthContextData {
  signIn: (credentials: SignInCredentials) => Promise<void>
  isAuthenticated: boolean
  user: User
}

interface AuthProviderProps {
  children: ReactNode
}

const AuthContext = createContext({} as AuthContextData)

export const signOut = () => {
  destroyCookie(undefined, 'next-acl.token')
  destroyCookie(undefined, 'next-acl.refreshToken')

  Router.push('/')
}

export const AuthProvider = ({ children}: AuthProviderProps) => {
  const [user, setUser] = useState<User>()
  const isAuthenticated = !!user

  useEffect(() => {
    const { 'next-acl.token': token } = parseCookies()

    if(token) {
      api.get('/me').then(response => {
        const { email, permissions, roles } = response.data

        setUser({
          email,
          permissions,
          roles
        })
      }).catch(() => {
        signOut()
      }) 
    }
  }, [])

  const signIn = async ({ email, password }: SignInCredentials) => {
    try {
      const data = { email, password }
      const response = await api.post('/sessions', data)

      const { token, refreshToken, permissions, roles } = response.data

      setCookie(undefined, 'next-acl.token', token, {
        maxAge: 60 * 60 * 24 * 30, //30 days
        path: '/'
      })

      setCookie(undefined, 'next-acl.refreshToken', refreshToken, {
        maxAge: 60 * 60 * 24 * 30,
        path: '/'
      })

      setUser({
        email,
        permissions,
        roles
      })

      api.defaults.headers['Authorization'] = `Bearer ${token}`

      Router.push('/dashboard')
    } catch(err) {
      console.log(err.message)
    }
  }

  return (
    <AuthContext.Provider value={{ signIn, isAuthenticated, user }}>
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

