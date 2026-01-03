// 印章相关类型定义
export interface TouchPoint {
  id: number
  x: number
  y: number
  isActive: boolean
  isEnding: boolean
  timestamp: number
}

export interface SealFingerprint {
  pointCount: number
  distances: number[]   // 点到中心的距离（归一化）
}
