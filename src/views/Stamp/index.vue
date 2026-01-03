<template>
  <div
    class="touch-system"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    @touchcancel="handleTouchEnd"
  >
    <!-- 动态触控点位 -->
    <div
      v-for="point in activeTouchPoints"
      :key="point.id"
      class="touch-point"
      :class="{
        'touch-active': point.isActive,
        'touch-ending': point.isEnding,
      }"
      :style="{
        left: point.x + 'px',
        top: point.y + 'px',
      }"
    >
      <div class="point-inner"></div>
      <div class="ripple-effect"></div>
    </div>

    <!-- 调试信息面板 -->
    <!-- <div class="debug-panel">
      <div class="debug-info">
        <div class="debug-item">
          总点数:
          <span class="debug-value">{{ activeTouchPoints.length }}</span>
        </div>
        <div class="debug-item">
          活跃:
          <span class="debug-value">{{
            activeTouchPoints.filter((p) => p.isActive).length
          }}</span>
        </div>
        <div class="debug-item">
          结束中:
          <span class="debug-value">{{
            activeTouchPoints.filter((p) => p.isEnding).length
          }}</span>
        </div>
      </div>
      <button @click="clearAllTouchPoints" class="debug-button">清空</button>
    </div> -->
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from "vue";

interface TouchPoint {
  id: number;
  x: number;
  y: number;
  isActive: boolean;
  isEnding: boolean;
  timestamp: number;
  lastMoveTime?: number; // 最后移动时间
  stabilityCount?: number; // 稳定性计数，用于防止意外丢失
}

// 活跃的触控点位（最多5个）
const activeTouchPoints = ref<TouchPoint[]>([]);
const maxTouchPoints = 5;
const touchEndDelay = 800; // 触摸结束后保持显示时间（毫秒） - 缩短以及时释放
const touchSensitivity = 2; // 触控灵敏度阈值（像素） - 更低阈值提高灵敏度
const touchStabilityThreshold = 3; // 触控点稳定性阈值
const touchRecoveryEnabled = ref(true); // 启用触控点恢复机制

// 处理触摸开始
const handleTouchStart = (event: TouchEvent) => {
  event.preventDefault();
  event.stopPropagation();

  console.log(`TouchStart: 检测到 ${event.changedTouches.length} 个新触控点`);

  // 处理所有新增的触控点
  for (let i = 0; i < event.changedTouches.length; i++) {
    const touch = event.changedTouches[i];

    // 检查是否已存在相同ID的触控点
    const existingIndex = activeTouchPoints.value.findIndex(
      (p) => p.id === touch.identifier
    );

    // 如果已存在，更新而不是跳过
    if (existingIndex !== -1) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      activeTouchPoints.value[existingIndex].x = touch.clientX - rect.left;
      activeTouchPoints.value[existingIndex].y = touch.clientY - rect.top;
      activeTouchPoints.value[existingIndex].isActive = true;
      activeTouchPoints.value[existingIndex].isEnding = false;
      activeTouchPoints.value[existingIndex].timestamp = Date.now();
      continue;
    }

    // 如果达到最大点数限制，移除最旧的非活跃点位
    if (activeTouchPoints.value.length >= maxTouchPoints) {
      const inactivePoints = activeTouchPoints.value.filter(
        (p) => !p.isActive || p.isEnding
      );
      if (inactivePoints.length > 0) {
        const oldestInactiveIndex = activeTouchPoints.value.findIndex(
          (p) => p.id === inactivePoints[0].id
        );
        activeTouchPoints.value.splice(oldestInactiveIndex, 1);
      } else {
        // 如果所有点都是活跃的，移除最旧的点
        const oldestIndex = activeTouchPoints.value.reduce(
          (oldestIdx, point, index) => {
            return point.timestamp <
              activeTouchPoints.value[oldestIdx].timestamp
              ? index
              : oldestIdx;
          },
          0
        );
        activeTouchPoints.value.splice(oldestIndex, 1);
      }
    }

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const newPoint: TouchPoint = {
      id: touch.identifier,
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
      isActive: true,
      isEnding: false,
      timestamp: Date.now(),
      lastMoveTime: Date.now(),
      stabilityCount: 1,
    };

    activeTouchPoints.value.push(newPoint);
    console.log(
      `新增触控点 ID: ${touch.identifier}, 坐标: (${Math.round(
        newPoint.x
      )}, ${Math.round(newPoint.y)})`
    );
  }
};

// 处理触摸移动
const handleTouchMove = (event: TouchEvent) => {
  event.preventDefault();
  event.stopPropagation();

  for (let i = 0; i < event.changedTouches.length; i++) {
    const touch = event.changedTouches[i];
    const rect = (event.target as HTMLElement).getBoundingClientRect();

    const pointIndex = activeTouchPoints.value.findIndex(
      (p) => p.id === touch.identifier
    );

    if (pointIndex !== -1) {
      const newX = touch.clientX - rect.left;
      const newY = touch.clientY - rect.top;
      const currentPoint = activeTouchPoints.value[pointIndex];

      // 更種極的移动距离检测，提高响应性
      const distance = Math.sqrt(
        Math.pow(newX - currentPoint.x, 2) + Math.pow(newY - currentPoint.y, 2)
      );

      const timeDiff = Date.now() - currentPoint.timestamp;

      // 更频繁的更新，提高响应性
      if (distance > touchSensitivity || timeDiff > 16) {
        activeTouchPoints.value[pointIndex].x = newX;
        activeTouchPoints.value[pointIndex].y = newY;
        activeTouchPoints.value[pointIndex].timestamp = Date.now();
        activeTouchPoints.value[pointIndex].lastMoveTime = Date.now();
        // 确保点位保持活跃状态
        activeTouchPoints.value[pointIndex].isActive = true;
        activeTouchPoints.value[pointIndex].isEnding = false;
        // 增加稳定性计数
        activeTouchPoints.value[pointIndex].stabilityCount = Math.min(
          (activeTouchPoints.value[pointIndex].stabilityCount || 0) + 1,
          touchStabilityThreshold + 2
        );
      }
    } else {
      // 如果找不到对应的触控点，可能是丢失了，尝试重新创建
      console.warn(`触控移动中找不到点 ID: ${touch.identifier}，尝试重新创建`);
      if (activeTouchPoints.value.length < maxTouchPoints) {
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        const recoveredPoint: TouchPoint = {
          id: touch.identifier,
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
          isActive: true,
          isEnding: false,
          timestamp: Date.now(),
          lastMoveTime: Date.now(),
          stabilityCount: 1,
        };
        activeTouchPoints.value.push(recoveredPoint);
      }
    }
  }
};

// 处理触摸结束
const handleTouchEnd = (event: TouchEvent) => {
  event.preventDefault();
  event.stopPropagation();

  console.log(`TouchEnd: ${event.changedTouches.length} 个触控点结束`);

  for (let i = 0; i < event.changedTouches.length; i++) {
    const touch = event.changedTouches[i];
    const pointIndex = activeTouchPoints.value.findIndex(
      (p) => p.id === touch.identifier
    );

    if (pointIndex !== -1) {
      const point = activeTouchPoints.value[pointIndex];
      point.isActive = false;
      point.isEnding = true;
      point.timestamp = Date.now(); // 更新结束时间戳

      console.log(`触控点 ID: ${touch.identifier} 结束`);

      // 更短的延迟移除时间，但给出足够的视觉反馈
      setTimeout(() => {
        const currentIndex = activeTouchPoints.value.findIndex(
          (p) => p.id === touch.identifier
        );
        if (currentIndex !== -1) {
          activeTouchPoints.value.splice(currentIndex, 1);
          console.log(`移除触控点 ID: ${touch.identifier}`);
        }
      }, Math.min(touchEndDelay, 800)); // 缩短延迟时间以及时释放资源
    } else {
      console.warn(`TouchEnd 中找不到触控点 ID: ${touch.identifier}`);
    }
  }
};

// 增强的触控点稳定化和恢复机制
const stabilizeTouchPoints = () => {
  const now = Date.now();

  // 检查和恢复丢失的触控点
  activeTouchPoints.value.forEach((point, index) => {
    // 如果触控点长时间没有移动，降低稳定性计数
    if (point.lastMoveTime && now - point.lastMoveTime > 200) {
      if (point.stabilityCount && point.stabilityCount > 0) {
        point.stabilityCount--;
      }
    }

    // 如果稳定性计数过低，可能是丢失的触控点
    if (point.stabilityCount && point.stabilityCount <= 0 && !point.isEnding) {
      console.warn(`触控点 ID: ${point.id} 可能已丢失，尝试恢复`);
      point.isActive = false;
    }
  });
};

// 清理长时间未更新的触控点（防止意外情况）
const cleanupOldTouchPoints = () => {
  const now = Date.now();
  const beforeCount = activeTouchPoints.value.length;

  activeTouchPoints.value = activeTouchPoints.value.filter((point) => {
    // 更严格的清理条件，但给稳定触控点更多时间
    const isStable = (point.stabilityCount || 0) >= touchStabilityThreshold;
    const timeoutDuration = point.isEnding
      ? touchEndDelay + 500
      : isStable
      ? 5000
      : 2000;

    const shouldKeep = now - point.timestamp < timeoutDuration;

    if (!shouldKeep) {
      console.log(
        `清理触控点 ID: ${point.id}，稳定性: ${point.stabilityCount}`
      );
    }

    return shouldKeep;
  });

  const afterCount = activeTouchPoints.value.length;
  if (beforeCount !== afterCount) {
    console.log(`清理了 ${beforeCount - afterCount} 个过期触控点`);
  }
};

// 强制清理所有触控点（用于重置）
const clearAllTouchPoints = () => {
  activeTouchPoints.value = [];
};

// 调试信息
const getDebugInfo = () => {
  return {
    totalPoints: activeTouchPoints.value.length,
    activePoints: activeTouchPoints.value.filter((p) => p.isActive).length,
    endingPoints: activeTouchPoints.value.filter((p) => p.isEnding).length,
    points: activeTouchPoints.value.map((p) => ({
      id: p.id,
      x: Math.round(p.x),
      y: Math.round(p.y),
      isActive: p.isActive,
      isEnding: p.isEnding,
    })),
  };
};

// 添加触控增强功能
const enhanceTouchDetection = () => {
  // 监听所有触控事件并记录，用于诊断
  const logTouchEvent = (eventType: string, event: TouchEvent) => {
    console.log(
      `${eventType}: ${event.touches.length} touches, ${event.changedTouches.length} changed`
    );
  };

  // 添加额外的触控事件监听器用于调试
  const touchElement = document.querySelector(".touch-system");
  if (touchElement) {
    touchElement.addEventListener(
      "touchstart",
      (e) => logTouchEvent("TouchStart", e as TouchEvent),
      { passive: false }
    );
    touchElement.addEventListener(
      "touchmove",
      (e) => logTouchEvent("TouchMove", e as TouchEvent),
      { passive: false }
    );
    touchElement.addEventListener(
      "touchend",
      (e) => logTouchEvent("TouchEnd", e as TouchEvent),
      { passive: false }
    );
  }
};

// 定期清理和状态检查
let cleanupInterval: any;
let debugInterval: any;
let stabilityInterval: any;

onMounted(() => {
  // 更频繁的稳定化检查
  stabilityInterval = setInterval(stabilizeTouchPoints, 200);
  cleanupInterval = setInterval(cleanupOldTouchPoints, 800);

  // 调试信息输出
  debugInterval = setInterval(() => {
    const info = getDebugInfo();
    if (info.totalPoints > 0) {
      console.log("触控状态:", info);
    }
  }, 1500);

  // 增强触控检测
  enhanceTouchDetection();
});

onUnmounted(() => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  if (debugInterval) {
    clearInterval(debugInterval);
  }
  if (stabilityInterval) {
    clearInterval(stabilityInterval);
  }
});
</script>

<style lang="scss" scoped>
.touch-system {
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  // background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  background: #000;
  overflow: hidden;
  touch-action: none; // 禁用默认触控行为
  user-select: none; // 禁用文本选择
}

.touch-point {
  position: absolute;
  width: 80px;
  height: 80px;
  transform: translate(-50%, -50%);
  z-index: 10;
  pointer-events: none; // 避免干扰触控事件

  .point-inner {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.9) 0%,
      rgba(255, 255, 255, 0.4) 50%,
      transparent 100%
    );
    border: 3px solid rgba(255, 255, 255, 0.7);
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.6),
      0 0 40px rgba(255, 255, 255, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.3);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform: scale(0);
    opacity: 0;
  }

  .ripple-effect {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 160px;
    height: 160px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
    transition: all 0.6s ease-out;
  }

  // 触控激活状态
  &.touch-active {
    .point-inner {
      transform: scale(1);
      opacity: 1;
      animation: touchPulse 1.2s ease-in-out infinite;
    }

    .ripple-effect {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
      animation: rippleExpand 1.5s ease-out infinite;
    }
  }

  // 触控结束状态
  &.touch-ending {
    .point-inner {
      animation: touchFadeOut 0.8s ease-out forwards;
    }

    .ripple-effect {
      animation: rippleFadeOut 0.8s ease-out forwards;
    }
  }
}

// 触控脉冲动画
@keyframes touchPulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.6),
      0 0 40px rgba(255, 255, 255, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.3);
  }

  50% {
    transform: scale(1.15);
    box-shadow: 0 0 30px rgba(255, 255, 255, 0.8),
      0 0 60px rgba(255, 255, 255, 0.6), inset 0 0 30px rgba(255, 255, 255, 0.4);
  }
}

// 涟漪扩散动画
@keyframes rippleExpand {
  0% {
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 0.8;
  }

  50% {
    opacity: 0.4;
  }

  100% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }
}

// 触控结束淡出动画
@keyframes touchFadeOut {
  0% {
    transform: scale(1);
    opacity: 1;
  }

  100% {
    transform: scale(0.3);
    opacity: 0;
  }
}

// 涟漪淡出动画
@keyframes rippleFadeOut {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.3;
  }

  100% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}

// 响应式适配
@media (max-width: 768px) {
  .touch-point {
    width: 70px;
    height: 70px;

    .ripple-effect {
      width: 140px;
      height: 140px;
    }
  }
}

@media (max-width: 480px) {
  .touch-point {
    width: 60px;
    height: 60px;

    .ripple-effect {
      width: 120px;
      height: 120px;
    }
  }
}

// 调试面板样式
.debug-panel {
  position: fixed;
  top: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px;
  color: white;
  font-family: "Courier New", monospace;
  font-size: 14px;
  z-index: 1000;
  border: 1px solid rgba(255, 255, 255, 0.2);

  .debug-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
  }

  .debug-item {
    display: flex;
    justify-content: space-between;
    min-width: 120px;

    .debug-value {
      color: #00ff88;
      font-weight: bold;
      margin-left: 10px;
    }
  }

  .debug-button {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.5);
    }

    &:active {
      background: rgba(255, 255, 255, 0.3);
    }
  }
}

// 小屏幕上调整调试面板
@media (max-width: 480px) {
  .debug-panel {
    top: 10px;
    left: 10px;
    font-size: 12px;
    padding: 12px;

    .debug-item {
      min-width: 100px;
    }
  }
}
</style>
