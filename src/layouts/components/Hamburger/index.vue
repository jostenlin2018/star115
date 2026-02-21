<script setup>
import { Expand, Fold } from "@element-plus/icons-vue"

const props = defineProps({
  isActive: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(["toggleClick"])

const toggleClick = () => {
  emit("toggleClick")
}
</script>

<template>
  <div @click="toggleClick">
    <el-icon :size="20" class="icon">
      <Fold v-if="props.isActive" />
      <Expand v-else />
    </el-icon>
  </div>
</template>

<style lang="scss" scoped>
.icon {
  vertical-align: middle;
  color: var(--v3-hamburger-text-color);
}
</style>
