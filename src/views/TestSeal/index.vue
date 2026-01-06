<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTouchSystem } from '@/seal/useTouchSystem'
import { useSealRecognizer } from '@/seal/useSealRecognizer'
import { recordSeal } from '@/seal/useSealRecorder'
import { sealConfig } from '@/seal/sealConfig'
// import sealImg from '@/assets/images/seal/seal.png'

const containerRef = ref<HTMLElement | null>(null)

// const { activeTouchPoints } =
//   useTouchSystem(containerRef, sealConfig.touch)

// 印章指纹
const fingerprint = ref<any>(null)

// 是否处于录入阶段
const isRecording = ref(true)

// 稳定缓冲
let recordBuffer: any[] = []
let recordTimer: number | null = null
let checkTimer: number | null = null

// const {
//   isSealed,
//   sealCenter,
//   checkSeal
// } = useSealRecognizer(activeTouchPoints, fingerprint, sealConfig)

// 监听触点变化
// watch(activeTouchPoints, () => {
//   const active =
//     activeTouchPoints.value.filter(p => p.isActive)

//   // === 录入阶段 ===
//   if (isRecording.value) {
//     if (active.length >= sealConfig.record.minPoints) {
//       recordBuffer.push(...active)

//       if (!recordTimer) {
//         recordTimer = window.setTimeout(() => {
//           const fp = recordSeal(recordBuffer)
//           if (fp) {
//             fingerprint.value = fp
//             isRecording.value = false
//             console.log('印章指纹录入完成:', fp)
//           }
//           recordBuffer = []
//           recordTimer = null
//         }, sealConfig.record.sampleTime)
//       }
//     }
//   }

//   // === 识别阶段 ===
//   else {
//     if (!checkTimer) {
//       checkTimer = window.setTimeout(() => {
//         checkSeal()
//         checkTimer = null
//       }, sealConfig.recognize.stableTime)
//     }
//   }
// }, { deep: true })
</script>

<template>
  <div ref="containerRef" class="touch-area">
    <div class="hint">
      {{ isRecording ? '请盖一次印章进行录入' : '请盖章打卡' }}
    </div>

    <!-- <img
      v-if="isSealed"
      :src="sealImg"
      class="seal"
      :style="{
        left: sealCenter.x + 'px',
        top: sealCenter.y + 'px'
      }"
    /> -->
  </div>
</template>

<style scoped>
.touch-area {
  width: 100vw;
  height: 100vh;
  position: relative;
  background: rgba(0,0,0,0.05);
  touch-action: none;
}

.hint {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 18px;
  color: #333;
}

.seal {
  position: absolute;
  width: 160px;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
</style>
