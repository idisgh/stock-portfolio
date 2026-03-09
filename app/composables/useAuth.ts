// composables/useAuth.ts
// ======================
// 앱 전체에서 로그인 상태를 공유하는 "composable"
// composable = Vue의 재사용 가능한 상태+로직 묶음
// useState()는 Nuxt 전용 — 페이지 이동해도 상태 유지됨

interface User {
  id: number
  email: string
  name: string
}

export function useAuth() {
  // useState: Nuxt의 전역 상태. 모든 컴포넌트에서 같은 값 공유
  const user = useState<User | null>('auth-user', () => null)
  const loading = useState('auth-loading', () => true)

  // 현재 로그인 상태 확인 (페이지 새로고침 시 호출)
  // useRequestHeaders로 SSR 시에도 쿠키를 서버에 전달
  async function fetchUser() {
    try {
      loading.value = true
      const headers = import.meta.server ? useRequestHeaders(['cookie']) : {}
      user.value = await $fetch('/api/auth/me', { headers })
    } catch {
      user.value = null
    } finally {
      loading.value = false
    }
  }

  // 로그인
  async function login(email: string, password: string) {
    const result = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    })
    user.value = result as User
    return result
  }

  // 회원가입
  async function register(email: string, password: string, name: string) {
    const result = await $fetch('/api/auth/register', {
      method: 'POST',
      body: { email, password, name }
    })
    user.value = result as User
    return result
  }

  // 로그아웃
  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    navigateTo('/login')
  }

  return {
    user,
    loading,
    fetchUser,
    login,
    register,
    logout,
  }
}
