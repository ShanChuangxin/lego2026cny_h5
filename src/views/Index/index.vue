<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Toast } from 'vant'

// 定义页面元素
const pageNum = ref(0)  
// 通用的翻页函数
// 0为初始页，1为规则页面，2为地图页面，3为印章详情页面，4为抽奖页面
function navigateToPage(page) {
  pageNum.value = page;
}

// 印章页面相关功能
let stampPageIndex = 0  // 印章界面索引
// 切换到印章页面函数
function navigateToStampPage(page){
  console.log("stamp page：" + page)
  // 当前所在页面状态记录
  stampPageIndex = page;
  navigateToPage(3);
}

// 切换到抽奖页面函数
function navitageToLuckyDrawPage(){
  // 如果是锁定状态，则直接返回
  // undo
  // 如果是解锁状态，则进行跳转
  console.log("跳转到抽奖页面");
  navigateToPage(4);
}

</script>

<template>
  <div class="page-body">
    <!-- 起始页面 -->
    <div v-show="pageNum==0" class="land-page">
      <!-- 活动时间和地点 -->
      <div class="time-location"></div>
      <!-- 按钮-马上开始 -->
      <div class="btn-start" @click="navigateToPage(2)"></div>
      <!-- 活动规则超链接 -->
      <div class="link-ruler" @click="navigateToPage(1)"></div>
    </div>

    <!-- 活动规则页面 -->
    <div v-show="pageNum == 1" class="ruler-page">
      <!-- 马花纹装饰 -->
      <div class="figure-horse"></div>
      <!-- icon和slogan -->
      <div class="icon-slogan"></div>
      <!-- 规则内容 -->
      <div class="ruler-content"></div>
      <!-- 按钮-马上开始 -->
      <div class="btn-start" @click="navigateToPage(2)"></div>
    </div>

    <!-- 打卡地图页面 -->
    <div v-show="pageNum==2" class="map-page">
      <div class="figure-bg">
        <!-- icon和slogan -->
        <div class="icon-slogan"></div>
        <!-- 路径地图 -->
        <div class="path-map">
          <!-- 马上有好事 -->
          <div class="btn-nice" @click="navigateToStampPage(1)">
            <div v-show="true" class="nice-unlock"></div>
          </div>
          <!-- 马上有萌宠 -->
          <div class="btn-pet" @click="navigateToStampPage(2)">
            <div v-show="true" class="pet-unlock"></div>
          </div>
          <!-- 马上大冒险 -->
          <div class="btn-risk" @click="navigateToStampPage(3)">
            <div v-show="true" class="risk-unlock"></div>
          </div>
          <!-- 马上提新车 -->
          <div class="btn-car" @click="navigateToStampPage(4)">
            <div v-show="true" class="car-unlock"></div>
          </div>
        </div>
        <!-- 抽奖按钮 -->
        <div class="btn-draw" @click="navitageToLuckyDrawPage">
          <!-- 锁的状态 -->
          <div class="unlock-status"></div>
        </div>
      </div>
    </div>

    <!-- 盖章界面 -->
    <div v-show="pageNum==3" class="stamp-page">
      <!-- 马花纹装饰 -->
      <div class="figure-horse"></div>
      <!-- icon和slogan -->
      <div class="icon-slogan"></div>
      <!-- 标题 -->
      <div class="btn-title"></div>
      <!-- 规则介绍 -->
      <div class="link-ruler"></div>
      <!-- 盖章区 -->
      <div class="stamp-area">
        <div class="stamp-status"></div>
      </div>
      <!-- 返回按钮 -->
      <div class="btn-back" @click="navigateToPage(2)"></div>
      <!-- 印戳 -->
      <div v-show="true" class="stamp"></div>
      <!-- 弹窗容器 -->
      <div v-show="false" class="pop-container">
        <div class="pop-window"></div>
      </div>
    </div>

    <!-- 抽奖界面 -->
    <div v-show="pageNum==4" class="luckydraw-page">
      <!-- 马花纹装饰 -->
      <div class="figure-horse"></div>
      <!-- icon和slogan -->
      <div class="icon-slogan"></div>
      <!-- 游戏转盘 -->
      <!-- 注意：这个背景图漏切了！！！-->
      <div class="turntable-container">
        <!-- 转盘 -->
        <div class="turn-table"></div>
        <!-- 指针 -->
        <div class="pointer"></div>
        <!-- 转盘周围的装饰 -->
        <div class="turntable-figure"></div>
      </div>
      <!-- 开始抽奖按钮 -->
      <div class="btn-luckydraw"></div>
      <!-- 弹窗容器 -->
      <div v-show="true" class="pop-container">
        <div v-show="false" class="pop-lucky"></div>
        <div v-show="true" class="pop-nolucky"></div>
        <div class="btn-ok"></div>
      </div>
    </div>
    
  
  </div>

</template>

<style lang="scss" scoped>
.page-body {
  // 通用设计
  position: absolute;
  width: 100vw;
  height: 100vh;
  overflow: hidden;

  // 起始页面
  .land-page {
    width: 100%;
    height: 100%;
    background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/index/bg.jpg") top center no-repeat;
    background-size: cover;
    // 活动时间和地点
    .time-location {
      position: absolute;
      margin-top: .65rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 1.3533rem;
      height: .3266rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/index/time-location.png") top center no-repeat;
      background-size: 100% 100%;
    }
    // 马上开始按钮
    .btn-start {
      position: absolute;
      bottom: .7rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 1.5866rem;
      height: .5733rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/index/btn-start.png") top center no-repeat;
      background-size: 100% 100%;
    }
    // 活动规则超链接
    .link-ruler {
      position: absolute;
      bottom: .45rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width:.54rem;
      height: .1466rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/index/link-ruler.png") top center no-repeat;
      background-size: 100% 100%;
    }
  }

  // 规则页面
  .ruler-page {
    position: relative;
    width: 100%;
    height: 100%;
    background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/ruler/bg.jpg") top center no-repeat;
    background-size: cover;
    .figure-horse {
      position: absolute;
      left: 0;
      bottom: 0;
      width: 2.94rem;
      height: 2.9266rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/ruler/figure-horse.png") top center no-repeat;
      background-size: 100% 100%;
    }
    .icon-slogan {
      position: absolute;
      top: .5rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 3.1066rem;
      height: 1.1933rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/ruler/slogan.png") top center no-repeat;
      background-size: 100% 100%;
    }
    .ruler-content {
      position: absolute;
      top: 2rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 3.8733rem;
      height: 6.6066rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/ruler/ruler-content.png") top center no-repeat;
      background-size: 100% 100%;
    }
    .btn-start {
      position: absolute;
      bottom: 1.5rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 1.5866rem;
      height: .5733rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/ruler/btn-start.png") top center no-repeat;
      background-size: 100% 100%;
    }
  }

  // 打卡地图页面
  .map-page {
    position: relative;
    width: 100%;
    height: 100%;
    background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/check-map/bg.jpg") top center no-repeat;
    background-size: cover;
    .figure-bg {
      position: relative;
      width: 100%;
      height: 100%;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/check-map/figure-bg.png") top center no-repeat;
      background-size: cover;
      .icon-slogan {
      position: absolute;
      top: .5rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 3.1066rem;
      height: 1.1933rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/check-map/slogan.png") top center no-repeat;
      background-size: 100% 100%; 
      }
      .path-map {
        position: absolute;
        top: 2.2rem;
        margin-left: 50%;
        transform: translateX(-50%);
        width: 4.08rem;
        height: 5.9466rem;
        background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/check-map/path-map.png") top center no-repeat;
        background-size: 100% 100%; 
        .btn-nice {
          position: absolute;
          top: 0rem;
          left: 0rem;
          width: 2rem;
          height: .8rem;
          // background-color: pink;
          .nice-unlock {
            position: absolute;
            top: 0rem;
            left: 0rem;
            width:.96rem;
            height: .78rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/check-map/icon-unlock-nice.png") top center no-repeat;
            background-size: 100% 100%; 
          }
        }
        .btn-pet {
          position: absolute;
          top: 1.32rem;
          right: 0rem;
          width: 2rem;
          height: .8rem;
          // background-color: pink;
          .pet-unlock {
            position: absolute;
            top: 0rem;
            left: 0rem;
            width:.96rem;
            height: .78rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/check-map/icon-unlock-pet.png") top center no-repeat;
            background-size: 100% 100%; 
          }
        }
        .btn-risk {
          position: absolute;
          top: 2.49rem;
          left: 0rem;
          width: 2rem;
          height: .8rem;
          // background-color: pink;
          .risk-unlock {
            position: absolute;
            top: 0rem;
            left: 0rem;
            width:.96rem;
            height: .78rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/check-map/icon-unlock-risk.png") top center no-repeat;
            background-size: 100% 100%; 
          }
        }
        .btn-car {
          position: absolute;
          top: 3.95rem;
          right: 0rem;
          width: 2rem;
          height: .8rem;
          // background-color: pink;
          .car-unlock {
            position: absolute;
            top: 0rem;
            left: 0rem;
            width:.96rem;
            height: .78rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/check-map/icon-unlock-car.png") top center no-repeat;
            background-size: 100% 100%; 
          }
        }
      }
      .btn-draw {
        position: absolute;
        top: 8rem;
        margin-left: 50%;
        transform: translateX(-50%);
        width: 2.1866rem;
        height: 1.1066rem;
        background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/check-map/btn-luckydraw.png") top center no-repeat;
        background-size: 100% 100%; 
        padding-left: .2rem;  // 为了把锁的状态居中后往右移一些
        .lock-status {
          position: absolute;
          top: .15rem;
          margin-left: 50%;
          transform: translateX(-50%);
          width: .18rem;
          height: .28rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/check-map/icon-lock.png") top center no-repeat;
          background-size: 100% 100%; 
        }
        .unlock-status {
          position: absolute;
          top: .15rem;
          margin-left: 50%;
          transform: translateX(-50%);
          width: .2133rem;
          height: .28rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/check-map/icon-unlock.png") top center no-repeat;
          background-size: 100% 100%; 
        }
      }

    }

  }

  // 盖章打卡页面
  .stamp-page {
    position: relative;
    width: 100%;
    height: 100%;
    background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/bg.jpg") top center no-repeat;
    background-size: cover;
    .figure-horse {
      position: absolute;
      left: 0;
      bottom: 0;
      width: 2.94rem;
      height: 2.9266rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/figure-horse.png") top center no-repeat;
      background-size: 100% 100%;
    }
    .icon-slogan {
      position: absolute;
      top: .5rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 3.1066rem;
      height: 1.1933rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/slogan.png") top center no-repeat;
      background-size: 100% 100%;
    }
    .btn-title {
      position: absolute;
      top: 2rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 1.7266rem;
      height: .43rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/btn-nice.png") top center no-repeat;
      background-size: 100% 100%; 
    }
    .link-ruler {
      position: absolute;
      top: 2.6rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: .86rem;
      height: .2133rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/link-ruler.png") top center no-repeat;
      background-size: 100% 100%; 
    }
    .stamp-area {
      position: absolute;
      top: 3rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 4.12rem;
      height: 5.0333rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/stamp-area-no-font.png") top center no-repeat;
      background-size: 100% 100%; 
      .stamp-status {
        position: absolute;
        bottom: .1rem;
        margin-left: 50%;
        transform: translateX(-50%);
        width: .6rem;
        height: .1866rem;
        background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/character-stamp-area.png") top center no-repeat;
        background-size: 100% 100%; 
      } 
    }
    .btn-back {
      position: absolute;
      top: 8.5rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 1.5866rem;
      height: .5733rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/btn-back.png") top center no-repeat;
      background-size: 100% 100%; 
    }
    .stamp {
      position: absolute;
      top: 4.5rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 2.3533rem;
      height: 2.1066rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/stamp-nice.png") top center no-repeat;
      background-size: 100% 100%; 
    }
    .pop-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, .6);
      display: flex;
      justify-content: center;
      align-items: center;
      .pop-window {
        width: 4.2466rem;
        height: 2.58rem;
        background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/ruler-nice.png") top center no-repeat;
        background-size: 100% 100%; 
      }
    }
  }

  // 抽奖页面
  .luckydraw-page {
    position: relative;
    width: 100%;
    height: 100%;
    background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/lucky-draw/bg.jpg") top center no-repeat;
    background-size: cover;
    .figure-horse {
      position: absolute;
      left: 0;
      bottom: 0;
      width: 2.94rem;
      height: 2.9266rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/lucky-draw/figure-horse.png") top center no-repeat;
      background-size: 100% 100%;
    }
    .icon-slogan {
      position: absolute;
      top: .5rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 3.1066rem;
      height: 1.1933rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/lucky-draw/slogan.png") top center no-repeat;
      background-size: 100% 100%;
    }
    .turntable-container {  // 缺少切图，临时用其它素材
      position: absolute;
      top: 2rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 4.7266rem; 
      height: 4.78rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/lucky-draw/figure-turntable.png") top center no-repeat;
      background-size: 100% 100%;
      .turn-table {
        position: absolute;
        top: .9rem;
        left: .93rem;
        width: 3.1066rem;
        height: 3.1066rem;
        background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/lucky-draw/turntable.png") top center no-repeat;
        background-size: 100% 100%;
        transform-origin: center center;
      }
      .pointer {
        position: absolute;
        top: 1.88rem;
        left: 2.09rem;
        width: .7866rem;
        height: 1rem;
        background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/lucky-draw/pointer.png") top center no-repeat;
        background-size: 100% 100%;
        z-index: 1;
      }
      .turntable-figure {
        position: absolute;
        top: 0;
        left: 0;
        width: 4.7266rem; 
        height: 4.78rem;
        background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/lucky-draw/figure-turntable.png") top center no-repeat;
        background-size: 100% 100%;
        z-index: 1;
      }
    }
    .btn-luckydraw {
      position: absolute;
      top: 7.5rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 1.58rem;
      height: .5733rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/lucky-draw/btn-luckydraw.png") top center no-repeat;
      background-size: 100% 100%;
    }
    .pop-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, .6);
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0;
      .pop-lucky {
        width: 2.9066rem;
        height: 4.2rem;
        background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/lucky-draw/popwindow-luckydog.png") top center no-repeat;
        background-size: 100% 100%; 
      }
      .pop-nolucky {
        width: 2.9066rem;
        height: 2.2733rem;
        background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/lucky-draw/popwindow-nolucky.png") top center no-repeat;
        background-size: 100% 100%; 
      }
      .btn-ok {
        position: absolute;
        bottom: 2rem;
        width: 1.58rem;
        height: .5733rem;
        background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/lucky-draw/btn-make-sure.png") top center no-repeat;
        background-size: 100% 100%; 
      }
    }
  }
}
</style>