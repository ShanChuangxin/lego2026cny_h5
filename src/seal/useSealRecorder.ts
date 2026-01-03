// 印章录入（一次性）
// 1. 计算所有触点的几何中心
// 2. 记录每个点到中心点的距离
// 3. 排序 + 归一化
// 4. 和旋转方向无关
// 注意：需要保存这个fingerprint(JSON)
// src/seal/useSealRecorder.ts
export function recordSeal(points: any[]) {
  if (points.length < 3) return null

  // 质心
  const cx = points.reduce((s, p) => s + p.x, 0) / points.length
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length

  // 计算所有点到质心的距离
  const distances = points.map(p =>
    Math.sqrt(
      Math.pow(p.x - cx, 2) +
      Math.pow(p.y - cy, 2)
    )
  )

  // 排序
  distances.sort((a, b) => a - b)

  // 归一化（除以最大值）
  const max = distances[distances.length - 1] || 1
  const normalized = distances.map(d => d / max)

  return {
    count: normalized.length,
    signature: normalized
  }
}

