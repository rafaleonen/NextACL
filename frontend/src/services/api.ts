import axios, { AxiosError, AxiosResponse} from 'axios'
import { parseCookies, setCookie } from 'nookies'
import { signOut } from '../hooks/auth'
import { AuthTokenError } from './errors/AuthTokenError'

let isRefreshing = false
let failedRequestQueue = []


export function setupAPIClient(context = undefined) {
  let cookies = parseCookies(context)

  const api = axios.create({
    baseURL: 'http://localhost:3333',
    headers: {
      Authorization: `Bearer ${cookies['next-acl.token']}`
    }
  })

  const successReponse = (response: AxiosResponse ) => response
  
  const errorResponse = (error: AxiosError) => {
    if(error.response.status === 401) {
      if(error.response.data?.code === 'token.expired') {
        cookies = parseCookies(context)
  
        const { 'next-acl.refreshToken': refreshToken } = cookies;
        const originalConfig = error.config
  
        if(!isRefreshing) {
          isRefreshing = true
  
          api.post('/refresh', {
            refreshToken
          }).then(response => {
            const { token } = response.data
    
            setCookie(context, 'next-acl.token', token, {
              maxAge: 60 * 60 * 24 * 30, //30 days
              path: '/'
            })
      
            setCookie(context, 'next-acl.refreshToken', response.data.refreshToken, {
              maxAge: 60 * 60 * 24 * 30,
              path: '/'
            })
    
            api.defaults.headers['Authorization'] = `Bearer ${token}`
  
            failedRequestQueue.forEach(request => request.onSuccess(token))
            failedRequestQueue = []
          }).catch(err => {
            failedRequestQueue.forEach(request => request.onFailure(err))
            failedRequestQueue = []
  
            if(process.browser) {
              signOut()
            }
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
        if(process.browser) {
          signOut()
        } else {
          Promise.reject(new AuthTokenError())
        }
      }
    }
  
    return Promise.reject(error)
  }
  
  //Interceptors

  api.interceptors.response.use(successReponse, errorResponse)

  return api
}
