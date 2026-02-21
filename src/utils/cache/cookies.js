/** 统一处理 Cookie */

import CacheKey from "@/constants/cache-key"
import Cookies from "js-cookie"

// 檢測是否在 GAS 環境中
const isGasEnvironment = () => {
  return import.meta.env.VITE_USE_GAS === "true" || import.meta.env.VITE_USE_GAS === true
}

export const getToken = () => {
  if (isGasEnvironment()) {
    return localStorage.getItem(CacheKey.TOKEN)
  }
  return Cookies.get(CacheKey.TOKEN)
}

export const setToken = (token) => {
  if (isGasEnvironment()) {
    localStorage.setItem(CacheKey.TOKEN, token)
    return
  }
  Cookies.set(CacheKey.TOKEN, token)
}

export const removeToken = () => {
  if (isGasEnvironment()) {
    localStorage.removeItem(CacheKey.TOKEN)
    return
  }
  Cookies.remove(CacheKey.TOKEN)
}
