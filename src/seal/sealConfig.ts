// 配置参数集中管理


// src/seal/sealConfig.ts
export const sealConfig = {
  touch: {
    maxPoints: 5
  },

  record: {
    minPoints: 3,
    sampleTime: 200 // ms，录入稳定窗口
  },

  recognize: {
    minPoints: 3,
    tolerance: 0.45, // 识别容差（真实硬件一定要放宽）
    stableTime: 150  // ms，识别稳定窗口
  }
}
