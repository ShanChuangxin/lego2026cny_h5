// 触控采集（基于卖家提供的SDK重构）
// 使用方式：const { activeTouchPoints } = useTouchSystem(containerRef)

import { ref, onMounted, onUnmounted } from 'vue'
import type { TouchPoint } from './types'

export function useTouchSystem(
  containerRef: any,
  config = {
    maxPoints: 5,
    endDelay: 600
  }
) {
  const activeTouchPoints = ref<TouchPoint[]>([])

  const handleStart = (e: TouchEvent) => {
    e.preventDefault()
    const rect = containerRef.value.getBoundingClientRect()

    for (const t of Array.from(e.changedTouches)) {
      if (activeTouchPoints.value.length >= config.maxPoints) continue

      activeTouchPoints.value.push({
        id: t.identifier,
        x: t.clientX - rect.left,
        y: t.clientY - rect.top,
        isActive: true,
        isEnding: false,
        timestamp: Date.now()
      })
    }
  }

  const handleMove = (e: TouchEvent) => {
    e.preventDefault()
    const rect = containerRef.value.getBoundingClientRect()

    for (const t of Array.from(e.changedTouches)) {
      const p = activeTouchPoints.value.find(p => p.id === t.identifier)
      if (!p) continue

      p.x = t.clientX - rect.left
      p.y = t.clientY - rect.top
      p.timestamp = Date.now()
    }
  }

  const handleEnd = (e: TouchEvent) => {
    e.preventDefault()

    for (const t of Array.from(e.changedTouches)) {
      const p = activeTouchPoints.value.find(p => p.id === t.identifier)
      if (!p) continue

      p.isActive = false
      p.isEnding = true

      setTimeout(() => {
        activeTouchPoints.value =
          activeTouchPoints.value.filter(pt => pt.id !== t.identifier)
      }, config.endDelay)
    }
  }

  onMounted(() => {
    const el = containerRef.value
    el.addEventListener('touchstart', handleStart, { passive: false })
    el.addEventListener('touchmove', handleMove, { passive: false })
    el.addEventListener('touchend', handleEnd, { passive: false })
    el.addEventListener('touchcancel', handleEnd, { passive: false })
  })

  onUnmounted(() => {
    activeTouchPoints.value = []
  })

  return {
    activeTouchPoints
  }
}
