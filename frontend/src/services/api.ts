import axios, { AxiosError, AxiosResponse} from 'axios'
import { parseCookies, setCookie } from 'nookies'
import { signOut } from '../hooks/auth'

let cookies = parseCookies()
let isRefreshing = false
let failedRequestQueue = []

export const api = axios.create({
  baseURL: 'http://localhost:3333',
  headers: {
    Authorization: `Bearer ${cookies['next-acl.token']}`
  }
})

//Interceptors

const successReponse = (response: AxiosResponse ) => response
const errorResponse = (error: AxiosError) => {
  if(error.response.status === 401) {
    if(error.response.data?.code === 'token.expired') {
      cookies = parseCookies()

      const { 'next-acl.refreshToken': refreshToken } = cookies;
      const originalConfig = error.config

      if(!isRefreshing) {
        isRefreshing = true

        api.post('/refresh', {
          refreshToken
        }).then(response => {
          const { token } = response.data
  
          setCookie(undefined, 'next-acl.token', token, {
            maxAge: 60 * 60 * 24 * 30, //30 days
            path: '/'
          })
    
          setCookie(undefined, 'next-acl.refreshToken', response.data.refreshToken, {
            maxAge: 60 * 60 * 24 * 30,
            path: '/'
          })
  
          api.defaults.headers['Authorization'] = `Bearer ${token}`

          failedRequestQueue.forEach(request => request.onSuccess(token))
          failedRequestQueue = []
        }).catch(err => {
          failedRequestQueue.forEach(request => request.onFailure(err))
          failedRequestQueue = []
        }).finally(() => {
          isRefreshing = false
        })
      } 

      return new Promise((resolve, reject) => {
        failedRequestQueue.push({
         onSuccess: (token: string) => {
          originalConfig.headers['Authorization'] = `Bearer ${token}`
          resolve(api(originalConfig))
         },
         onFailure: (err: AxiosResponse) => {
          reject(err)
         }
        })
      })
    } else {
      signOut()
    }
  }

  return Promise.reject(error)
}

api.interceptors.response.use(successReponse, errorResponse)