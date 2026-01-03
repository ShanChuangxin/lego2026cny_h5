// 印章识别（核心算法）
// 1. 当前触点数：3-5
// 2. 点到中心距离结构约等于录入指纹
// 3. 与旋转方向无关
// 4. 返回一个印章中心坐标

// src/seal/useSealRecognizer.ts
import { ref } from 'vue'

export function useSealRecognizer(
  activeTouchPoints: any,
  fingerprint: any,
  config: any
) {
  const isSealed = ref(false)
  const sealCenter = ref({ x: 0, y: 0 })

  let sealTimer: number | null = null
  let locked = false

  function triggerSeal(cx: number, cy: number) {
    // 已锁定期间不重复触发
    if (locked) return

    locked = true
    isSealed.value = true
    sealCenter.value = { x: cx, y: cy }

    // 2 秒后消失并解锁
    sealTimer && clearTimeout(sealTimer)
    sealTimer = window.setTimeout(() => {
      isSealed.value = false
      locked = false
    }, 2000)
  }

  function checkSeal() {
    if (!fingerprint.value) return
    if (locked) return

    const active = activeTouchPoints.value.filter(p => p.isActive)
    if (active.length < config.recognize.minPoints) return

    // 计算质心
    const cx = active.reduce((s, p) => s + p.x, 0) / active.length
    const cy = active.reduce((s, p) => s + p.y, 0) / active.length

    // 当前距离签名
    let distances = active.map(p =>
      Math.sqrt(
        Math.pow(p.x - cx, 2) +
        Math.pow(p.y - cy, 2)
      )
    )

    distances.sort((a, b) => a - b)

    const max = distances[distances.length - 1] || 1
    const normalized = distances.map(d => d / max)

    const len = Math.min(
      fingerprint.value.signature.length,
      normalized.length
    )

    let diff = 0
    for (let i = 0; i < len; i++) {
      diff += Math.abs(
        fingerprint.value.signature[i] -
        normalized[i]
      )
    }

    const avgDiff = diff / len
    console.log('识别 diff:', avgDiff)

    if (avgDiff < config.recognize.tolerance) {
      triggerSeal(cx, cy)
    }
  }

  return {
    isSealed,
    sealCenter,
    checkSeal
  }
}


