<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Toast } from 'vant'
import vueQr from 'vue-qr/src/packages/vue-qr.vue'

// 城市信息相关
const cityList = ["广州", "上海", "北京", "重庆", "郑州", "线上"];
const currentList = "";

const route = useRoute();
onMounted(() => {
  console.log(route.query);
});

// 定义页面元素
const pageNum = ref(0)  
// 通用的翻页函数
// 0为初始页，1为规则页面，2为地图页面，3为印章详情页面，4为抽奖页面
function navigateToPage(page) {
  // Toast("敬请期待");
  // return;
  pageNum.value = page;
}

// 地图页面相关功能


// 印章页面相关功能
let stampPageIndex = 1;  // 印章界面索引
const isShowCheckRule = ref(false);  // 是否显示印章打卡页面规则
const isNiceCheck = ref(true); //   已盖章-有好事
const isPetCheck = ref(true); //   已盖章-有宠物
const isRiskCheck = ref(true); //   已盖章-大冒险
const isCarCheck = ref(true); //   已盖章-提新车
// 定义qrcode相关信息
const qrCode = ref('')  // 二维码的值
const qrCodeSize = ref(180) // 码的黑色块尺寸
const qrCodeMargin = ref(0)
const isShowBackupQrCode = ref(false); // 是否显示备用打卡二维码
// 切换到印章页面函数
function navigateToStampPage(page) {
  console.log("stamp page：" + page)
  // 当前所在页面状态记录
  stampPageIndex = page;
  navigateToPage(3);
}
// 切换显示打卡规则弹窗函数
function switchShowCheckRule(isShowRule) {
  isShowCheckRule.value = isShowRule;
}
// 显示备用扫码打卡二维码
function showBackupQrCode(isShowCode) {
  // 显示二维码
  isShowBackupQrCode.value = isShowCode;
  if (isShowCode) {
    console.log("显示备用打卡二维码");
    // 更新二维码的值
    qrCode.value = "abcdefghijklmn" + "_" + stampPageIndex.toString();
    console.log(qrCode.value);

  } else {
    // 重新从服务器拉取是否已经打卡状态
    console.log("隐藏二维码并从服务器拉取最新的打卡状态");
    // undo  
  }
}

// 切换到抽奖页面函数
function navitageToLuckyDrawPage(){
  // 如果是解锁状态，则进行跳转
  if (isNiceCheck.value && isPetCheck.value && isRiskCheck.value && isCarCheck.value){
    console.log("跳转到抽奖页面");
    navigateToPage(4);    
  } else {
    Toast("还未完成所有打卡挑战")
  }
}

// 抽奖页面相关功能
const alreadyLucyDraw = ref(false);  // 是否已经抽奖
const isLuckyDog = ref(false);  // 是否中奖
function startLuckyDraw() {
  console.log("开始抽奖");
}

// 清除用户打信息并回到主页
function clearUserCheckInfo() {
  console.log("清除用户信息并回到主页");
  // 1. 清除用户打卡信息
  // Undo
  // 2. 回到主页
  navigateToPage(0);
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
        <div class="icon-slogan">
          <!-- 隐藏按钮-清除用户信息 -->
          <div class="btn-clear" @click="clearUserCheckInfo()"></div>
        </div>
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
          <div v-if="isNiceCheck&&isPetCheck&&isNiceCheck&&isCarCheck" class="unlock-status"></div>
          <div v-else class="lock-status"></div>
        </div>
      </div>
    </div>

    <!-- 盖章界面 -->
    <div v-show="pageNum==3" class="stamp-page">
      <!-- 马花纹装饰 -->
      <div class="figure-horse"></div>
      <!-- icon和slogan -->
      <div class="icon-slogan">
        <div class="btn-backup" @click="showBackupQrCode(true)"></div>
      </div>
      <!-- 标题，四个不同的主题，对应四个不同的按钮标题 -->
      <div v-show="stampPageIndex==1" class="btn-nice-title"></div>
      <div v-show="stampPageIndex==2" class="btn-pet-title"></div>
      <div v-show="stampPageIndex==3" class="btn-risk-title"></div>
      <div v-show="stampPageIndex==4" class="btn-car-title"></div>
      <!-- 规则介绍 -->
      <div class="link-ruler" @click="switchShowCheckRule(true)"></div>
      <!-- 盖章区 -->
      <div class="stamp-area">
        <div v-if="(stampPageIndex==1&&isNiceCheck)||(stampPageIndex==2&&isPetCheck)||(stampPageIndex==3&&isRiskCheck)||(stampPageIndex==4&&isCarCheck)" class="stamp-status-already"></div>
        <div v-else class="stamp-status-tip"></div>
      </div>
      <!-- 返回按钮 -->
      <div class="btn-back" @click="navigateToPage(2)"></div>
      <!-- 印戳，四个不同的印戳 -->
      <div v-show="stampPageIndex==1 && isNiceCheck" class="stamp-nice"></div>
      <div v-show="stampPageIndex==2 && isPetCheck" class="stamp-pet"></div>
      <div v-show="stampPageIndex==3 && isRiskCheck" class="stamp-risk"></div>
      <div v-show="stampPageIndex==4 && isCarCheck" class="stamp-car"></div>
      <!-- 规则弹窗容器 -->
      <div v-show="isShowCheckRule" @click="switchShowCheckRule(false)"class="pop-container">
        <!-- 打卡规则，四个不同的打卡点规则不同 -->
        <div v-show="stampPageIndex==1" class="pop-nice-rule"></div>
        <div v-show="stampPageIndex==2" class="pop-pet-rule"></div>
        <div v-show="stampPageIndex==3" class="pop-risk-rule"></div>
        <div v-show="stampPageIndex==4" class="pop-car-rule"></div>
      </div>
      <!-- 备用扫码打卡二维码 -->
      <div v-show="isShowBackupQrCode" @click="showBackupQrCode(false)" class="backup-container">
        <!-- 显示当前打卡点的二维码 -->
        <div class="qrcode-area">
            <vue-qr :text="qrCode" :size="qrCodeSize" :margin="qrCodeMargin"></vue-qr>
        </div>
      </div>
    </div>

    <!-- 抽奖界面 -->
    <div v-show="pageNum==4" class="luckydraw-page">
      <!-- 马花纹装饰 -->
      <div class="figure-horse"></div>
      <!-- icon和slogan -->
      <div class="icon-slogan">
          <!-- 隐藏按钮-清除用户信息 -->
          <div class="btn-clear" @click="clearUserCheckInfo()"></div>
      </div>
      <!-- 游戏转盘 -->
      <!-- 注意：这个背景图漏切了！！！-->
      <div class="turntable-container">
        <!-- 转盘 -->
        <div class="turn-table"></div>
        <!-- 转盘周围的装饰 -->
        <div class="turntable-figure"></div>
        <!-- 指针 -->
        <div class="pointer" @click="startLuckyDraw"></div>
      </div>
      <!-- 开始抽奖按钮 -->
      <div class="btn-luckydraw" @click="startLuckyDraw"></div>
      <!-- 弹窗容器 -->
      <div v-show="alreadyLucyDraw" class="pop-container">
        <div v-if="isLuckyDog" class="pop-lucky"></div>
        <div v-else class="pop-nolucky"></div>
        <!-- <div class="btn-ok"></div> -->
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
      bottom: 1.7rem;
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
      bottom: 1.45rem;
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
        .btn-clear {
        position: absolute;
        top: .34rem;
        left: 0rem;
        width: .4666rem;
        height: .4666rem;
        background-color: rgba(255, 255, 255, 0);
      }
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
      .btn-backup {
        position: absolute;
        top: .34rem;
        left: 0rem;
        width: .4666rem;
        height: .4666rem;
        background-color: rgba(255, 255, 255, 0);
      }
    }
    .btn-nice-title {
      position: absolute;
      top: 2rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 1.7266rem;
      height: .43rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/btn-nice.png") top center no-repeat;
      background-size: 100% 100%; 
    }
    .btn-pet-title {
      position: absolute;
      top: 2rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 1.7266rem;
      height: .43rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/btn-pet.png") top center no-repeat;
      background-size: 100% 100%; 
    }
    .btn-risk-title {
      position: absolute;
      top: 2rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 1.7266rem;
      height: .43rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/btn-risk.png") top center no-repeat;
      background-size: 100% 100%; 
    }
    .btn-car-title {
      position: absolute;
      top: 2rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 1.7266rem;
      height: .43rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/btn-car.png") top center no-repeat;
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
      .stamp-status-already {
        position: absolute;
        bottom: .1rem;
        margin-left: 50%;
        transform: translateX(-50%);
        width: .6rem;
        height: .1866rem;
        background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/character-stamp-already.png") top center no-repeat;
        background-size: 100% 100%; 
      } 
      .stamp-status-tip {
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
    .stamp-nice {
      position: absolute;
      top: 4.5rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 2.3533rem;
      height: 2.1066rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/stamp-nice.png") top center no-repeat;
      background-size: 100% 100%; 
    }
    .stamp-pet {
      position: absolute;
      top: 4.5rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 2.3533rem;
      height: 2.1066rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/stamp-pet.png") top center no-repeat;
      background-size: 100% 100%; 
    }
    .stamp-risk {
      position: absolute;
      top: 4.5rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 2.3533rem;
      height: 2.1066rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/stamp-risk.png") top center no-repeat;
      background-size: 100% 100%; 
    }
    .stamp-car {
      position: absolute;
      top: 4.5rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 2.3533rem;
      height: 2.1066rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/stamp-car.png") top center no-repeat;
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
      .pop-nice-rule {
        width: 4.2466rem;
        height: 2.58rem;
        background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/ruler-nice.png") top center no-repeat;
        background-size: 100% 100%; 
      }
      .pop-pet-rule {
        width: 4.2466rem;
        height: 2.0933rem;
        background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/ruler-pet.png") top center no-repeat;
        background-size: 100% 100%; 
      }
      .pop-risk-rule {
        width: 4.2466rem;
        height: 2.3266rem;
        background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/ruler-risk.png") top center no-repeat;
        background-size: 100% 100%; 
      }
      .pop-car-rule {
        width: 4.2466rem;
        height: 2.58rem;
        background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/ruler-car.png") top center no-repeat;
        background-size: 100% 100%; 
      }
    }
    .backup-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, .6);
      display: flex;
      justify-content: center;
      align-items: center;
      .qrcode-area {
          width: 2.6rem;
          height: 2.6rem;
          background-color: white;
          display: flex;
          align-items: center;
          justify-content: center;
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
      .btn-clear {
        position: absolute;
        top: .34rem;
        left: 0rem;
        width: .4666rem;
        height: .4666rem;
        background-color: rgba(255, 255, 255, 0);
      }
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