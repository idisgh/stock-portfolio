<template>
  <NuxtPage />
</template>

<script setup>
// 앱 시작 시 로그인 상태 확인
const { fetchUser } = useAuth()
await fetchUser()
</script>
