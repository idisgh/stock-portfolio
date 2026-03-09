<template>
  <div class="min-h-screen bg-gray-900 flex items-center justify-center">
    <div class="bg-gray-800 p-8 rounded-xl shadow-xl w-full max-w-md">
      <h1 class="text-2xl font-bold text-white mb-6 text-center">
        Stock Portfolio
      </h1>

      <!-- 탭: 로그인 / 회원가입 전환 -->
      <div class="flex mb-6 bg-gray-700 rounded-lg p-1">
        <button
          @click="mode = 'login'"
          :class="mode === 'login' ? 'bg-blue-600 text-white' : 'text-gray-400'"
          class="flex-1 py-2 rounded-md text-sm font-medium transition"
        >
          로그인
        </button>
        <button
          @click="mode = 'register'"
          :class="mode === 'register' ? 'bg-blue-600 text-white' : 'text-gray-400'"
          class="flex-1 py-2 rounded-md text-sm font-medium transition"
        >
          회원가입
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- 회원가입 시에만 이름 필드 표시 -->
        <div v-if="mode === 'register'">
          <label class="block text-gray-400 text-sm mb-1">이름</label>
          <input
            v-model="name"
            type="text"
            placeholder="홍길동"
            class="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label class="block text-gray-400 text-sm mb-1">이메일</label>
          <input
            v-model="email"
            type="email"
            placeholder="you@example.com"
            class="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label class="block text-gray-400 text-sm mb-1">비밀번호</label>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            class="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <!-- 에러 메시지 -->
        <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>

        <button
          type="submit"
          :disabled="submitting"
          class="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
        >
          {{ submitting ? '처리 중...' : (mode === 'login' ? '로그인' : '가입하기') }}
        </button>
      </form>


    </div>
  </div>
</template>

<script setup lang="ts">
const { login, register, user } = useAuth()

// 이미 로그인 상태면 메인으로 리다이렉트
watchEffect(() => {
  if (user.value) navigateTo('/')
})

const mode = ref('login')
const email = ref('')
const password = ref('')
const name = ref('')
const error = ref('')
const submitting = ref(false)

async function handleSubmit() {
  error.value = ''
  submitting.value = true

  try {
    if (mode.value === 'login') {
      await login(email.value, password.value)
    } else {
      await register(email.value, password.value, name.value)
    }
    navigateTo('/')
  } catch (e) {
    error.value = e.data?.statusMessage || '오류가 발생했습니다'
  } finally {
    submitting.value = false
  }
}
</script>
