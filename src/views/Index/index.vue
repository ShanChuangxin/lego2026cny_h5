<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Toast } from 'vant'
import vueQr from 'vue-qr/src/packages/vue-qr.vue'
import { getUserInfoAPI, stampCheckAPI, stampStatusAPI, withdrawAPI, clearDrawInfoAPI } from '@/apis/user'
import type { UserInfo } from '@/types/user'
import chapter from "../../components/chapter.vue";

// 城市信息相关
const cityList = ["广州", "上海", "北京", "重庆", "郑州", "线上"];
const currentCity = ref("guangzhou");
// 定义用户信息
let auth_code = "";
// let user_id = "";
// let uqr_code = ""; // 注意这是用户的qrcode，不是打卡页面的qrcode
// let draw_time = "";
// let draw_status = 0;  // 所抽的奖品等级，1-5代表着1-5等奖

const userInfo = ref<UserInfo>()

// 通过url参数获取用户信息
const route = useRoute();
const loadUserInfo = async () => {
    console.log("获取的参数信息为：", route.query);
    if (route.query.authCode) {
        auth_code = route.query.authCode as string;
        console.log("auth_code: ", auth_code);
        const res = await getUserInfoAPI({ auth_code});           
        console.log(res);
        if (res.data.errcode == 0) {
            userInfo.value = res.data.data;
            qrCode.value = res.data.data.qr_code;
            // 状态记录
            userInfo.value.user_id = res.data.data.user_id;
            userInfo.value.qr_code = res.data.data.qr_code;
            userInfo.value.draw_time = res.data.data.draw_time.toString();
            userInfo.value.draw_status = res.data.data.draw_status; // 所抽的奖品等级，1-5代表着1-5等奖
            userInfo.value.verify_status = res.data.data.verify_status; // 是否核销
            isNiceCheck.value = Boolean(res.data.data.position_time_1);
            isPetCheck.value = Boolean(res.data.data.position_time_2);
            isRiskCheck.value = Boolean(res.data.data.position_time_3);
            isCarCheck.value = Boolean(res.data.data.position_time_4);
            // 页面记录同步
            if (userInfo.value.draw_status != 0) {  // 百分百中奖，0为未抽奖
              // 1. 更新中奖弹窗信息
              alreadyLucyDraw.value = true; // 打开中奖弹窗
              // undo // 更新弹窗内容
              // 2. 跳转到抽奖页面
              navigateToPage(4);
            } else if (!isCarCheck && !isPetCheck && !isRiskCheck && !isCarCheck) { // 没有打过任何打卡点，跳到首页
              navigateToPage(0);  // 跳转到首页
            } else {
              navigateToPage(2);  // 跳转到地图页面
            }
        } else {
            Toast(res.data.errmsg);
        }
    } else {
        Toast("参数不正确，请重新点击链接进入~");
    }
}
onMounted(() => loadUserInfo());

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
// 电子印章相关信息
const fffImg = ref<string>(""); // 未盖章完成的图片
const blackImg = ref<string>("");  // 印戳图片，但是设置为空，因为不使用电子印章SDK组件的印戳渲染，只使用盖章成功的回调函数
const errorNumber = ref(0.1); // 0-1，数字越小，检查越严格。一般0.1
const arrAy = ref<any>([1, 1.0075192724740782, 1.0111229484707331, 1.069166113052584, 1.1348035748452034, 1.4507467151160764, 1.5075372936197426, 1.7161704869389864, 1.754161213064937, 1.9332532130008513]);  // 电子印章数据特征
// 盖章完成方法
const adoptFn = async () => {
  // TODO: 盖章完成方法
  console.log("盖章完成");
  addStamp(); // 盖印章。注意，只使用了电子印章的SDK印章成功r的r回调，但是不使用SDK中的渲染印戳图片功能
};
// 切换到印章页面函数
function navigateToStampPage(page) {
  console.log("stamp page：" + page)
  // 当前所在页面状态记录
  stampPageIndex = page;
  navigateToPage(3);
}
// 切换显示打卡规则弹窗函数
function switchShowCheckRule(isShowRule) {
  console.log("打开规则介绍");
  isShowCheckRule.value = isShowRule;
}
// 封装异步打卡函数
const stampCheck = async () => {
  const res = await stampCheckAPI({user_id: userInfo.value.user_id, position_num: stampPageIndex})
  console.log(res);
  // 不需要做处理，只是通知服务器该打卡点被打卡
  // 有可能出现服务器没有同步的情况
}
// 盖印戳函数。这里应该是用电子印章
function addStamp() {
  // 1. 更新UI界面上的印戳
  if (stampPageIndex == 1 && isNiceCheck.value == false) {
    isNiceCheck.value = true;
  } else if (stampPageIndex == 2 && isPetCheck.value == false) {
    isPetCheck.value = true;
  } else if (stampPageIndex == 3 && isRiskCheck.value == false) {
    isRiskCheck.value = true;
  } else if (stampPageIndex == 4 && isCarCheck.value == false) {
    isCarCheck.value = true;
  }
  // 1. 向服务器同步打卡信息。这里有可能考虑先向服务器校验再出现印戳，但是可能印戳出现有延迟
  stampCheck();
}
// 查询备用方案打卡结果
const stampStatus = async () => {
  const res = await stampStatusAPI({user_id: userInfo.value.user_id})
  console.log(res);
  if (res.data.errcode == 0) {
    isNiceCheck.value = Boolean(res.data.data.position_time_1);
    isPetCheck.value = Boolean(res.data.data.position_time_2);
    isRiskCheck.value = Boolean(res.data.data.position_time_3);
    isCarCheck.value = Boolean(res.data.data.position_time_4);
  } else {
    console.log(res.data.errmsg);
  }
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
    stampStatus(); 
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
// 北方城市（百分百中奖）
const cityNorth = ref(["beijing", "shanghai", "zhengzhou"]);
// 南方城市（有谢谢参与）
const citySouth = ref(["chongqing", "guangzhou"]);
const TOTAL = 9;  // 转盘总共平均分成了9个部分
const ANGLE_PER = 360 / TOTAL;  // 每个部分所占角度：40
// 北京、上海、郑州游戏转盘布局
// '一等奖', // 0
// '五等奖', // 1
// '四等奖', // 2
// '三等奖', // 3
// '五等奖', // 4
// '二等奖', // 5
// '五等奖', // 6
// '四等奖', // 7
// '五等奖'  // 8
// 重庆、广州游戏转盘布局
// '一等奖', // 0
// '五等奖', // 1
// '四等奖', // 2
// '谢谢参与', // 3
// '五等奖', // 4
// '二等奖', // 5
// '谢谢参与', // 6
// '三等奖', // 7
// '五等奖'  // 8

const prizeIndexMapBjShZz = [ // 北京上海郑州奖项->index数组映射
  [0],  // 一等奖
  [5],  // 二等奖
  [3],  // 三等奖
  [2, 7], // 四等奖
  [1, 4, 6, 8]  // 五等奖
]
const prizeIndexMapCqGz = [ // 重庆广州奖项->index数组映射
  [0],  // 一等奖
  [5],  // 二等奖
  [7],  // 三等奖
  [2], // 四等奖
  [1, 4, 8],  // 五等奖
  [3, 6]  // 谢谢参与
]
// 随机选择一个合法的位置，因为有的奖项是多个位置
function randomFromArray<T>(arr: T[]): T {  
  return arr[Math.floor(Math.random() * arr.length)]
}
// 两段式旋转
function startSpin(prizeIndex: number) {
  const current = rotateDeg.value % 360  // 当前真实角度

  // 第一段：只做视觉加速
  phase.value = 'accelerate'
  rotateDeg.value += 360 * 2
  console.log("旋转角度：", rotateDeg.value);
  // 第二段
  setTimeout(() => {
    phase.value = 'decelerate'

    const targetAngle = 360 * 4 - prizeIndex * ANGLE_PER

    rotateDeg.value += targetAngle
  }, 1400)
}
// 抽奖
async function draw() {
  if (isSpinning.value) return; // 如果在抽奖，则点击没有反应
  console.log("开始旋转抽奖转盘");
  isSpinning.value = true;

  // 后端只返回奖项类型
  // undo
  const prizeType = 2;  // mock
  console.log("当前抽的奖项为：", prizeType);

  let indexList = [];
  // 从该奖项的多个位置中随机一个
  if (cityNorth.value.includes(currentCity.value)){
    indexList = prizeIndexMapBjShZz[prizeType - 1]; // 北方城市索引列表
  } else {
    indexList = prizeIndexMapCqGz[prizeType - 1]; // 南方城市索引列表
  }
  const prizeIndex = randomFromArray(indexList);  // 从该奖项列表里随机出转盘对应的某个索引
  console.log("当前奖项所在转盘中的索引列表为：", indexList);
  console.log("奖项随机到的索引值为：", prizeIndex);
  startSpin(prizeIndex);
}
// 旋转完回调
function onSpinEnd() {
  console.log("旋转完成");
  // 重新打开旋转开关
  isSpinning.value = false;
  // 显示中奖弹窗
}

const alreadyLucyDraw = ref(false);  // 是否已经抽奖
const isLuckyDog = ref(false);  // 是否中奖
// let enableDraw = true;// 定义是否允许点击抽奖，防止重复点击抽奖
const rotateDeg = ref(0); // 旋转角度
const isSpinning = ref(false);  // 是否开始旋转
const phase = ref<'idle' | 'accelerate' | 'decelerate'>('idle')

// function startLuckyDraw() {
//   if (!enableDraw) return;
//   console.log("开始抽奖");
// }

// 封装清除用户打卡信息函数
const clearDrawInfo = async () => {
  const res = await clearDrawInfoAPI({user_id: userInfo.value.user_id})
  if (res.data.errcode == 0) {
    Toast("用户信息清除成功");
  } else {
    Toast(res.data.errmsg);
  }
}
// 清除用户打信息并回到主页
function clearUserCheckInfo() {
  console.log("清除用户信息并回到主页");
  // 1. 清除用户打卡信息
  clearDrawInfo()
  // 2. 回到主页
  navigateToPage(0);
}

</script>

<template>
  <div class="page-body">
    <!-- 起始页面 -->
    <div v-show="pageNum==0" class="land-page">
      <!-- 活动时间和地点 -->
      <div v-show="currentCity=='beijing'" class="beijing-time-location"></div>
      <div v-show="currentCity=='shanghai'" class="shanghai-time-location"></div>
      <div v-show="currentCity=='guangzhou'" class="guangzhou-time-location"></div>
      <div v-show="currentCity=='chongqing'" class="chongqing-time-location"></div>
      <div v-show="currentCity=='zhengzhou'" class="zhengzhou-time-location"></div>
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
            <div v-if="isNiceCheck" class="nice-unlock"></div>
            <div v-else class="nice-lock"></div>
          </div>
          <!-- 马上有萌宠 -->
          <div class="btn-pet" @click="navigateToStampPage(2)">
            <div v-if="isPetCheck" class="pet-unlock"></div>
            <div v-else class="pet-lock"></div>
          </div>
          <!-- 马上大冒险 -->
          <div class="btn-risk" @click="navigateToStampPage(3)">
            <div v-if="isRiskCheck" class="risk-unlock"></div>
            <div v-else class="risk-lock"></div>
          </div>
          <!-- 马上提新车 -->
          <div class="btn-car" @click="navigateToStampPage(4)">
            <div v-if="isCarCheck" class="car-unlock"></div>
            <div v-else class="car-lock"></div>
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
      <!-- 盖章区 -->
      <div class="stamp-area">
        <div v-if="(stampPageIndex==1&&isNiceCheck)||(stampPageIndex==2&&isPetCheck)||(stampPageIndex==3&&isRiskCheck)||(stampPageIndex==4&&isCarCheck)" class="stamp-status-already"></div>
        <div v-else class="stamp-status-tip"></div>
      </div>
      <!-- 规则介绍 -->
      <div class="link-ruler" @click="switchShowCheckRule(true)"></div>
      <!-- 返回按钮 -->
      <div class="btn-back" @click="navigateToPage(2)"></div>
      <!-- 电子印章识别区，需要4个打卡点，不同的识别区对应着不同的印戳 -->
      <div class="stamped-area">
        <chapter
          :sImg="blackImg"
          :bImg="fffImg"
          :arrAy="arrAy"
          :errorNumber="errorNumber"
          @adoptFn="adoptFn"
        />
       </div>
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
        <!-- 北方城市转盘 -->
        <div v-show="cityNorth.includes(currentCity)" 
          class="turn-table" 
          :class="phase" 
          style="--bg: url('https://www.mbcstyle.cn/projects/lego2026cny/images/draw/turntable-bj-sh-zz.png')"
          :style="{transform:`rotate(${rotateDeg}deg)`}" 
          @transitionend="onSpinEnd"
          >
        </div>
        <!-- 南方城市转盘 -->
        <div v-show="citySouth.includes(currentCity)" 
          class="turn-table" 
          :class="phase" 
          style="--bg: url('https://www.mbcstyle.cn/projects/lego2026cny/images/draw/turntable-cq-gz.png')"
          :style="{transform:`rotate(${rotateDeg}deg)`}" 
          @transitionend="onSpinEnd">
        </div>
        <!-- 转盘周围的装饰 -->
        <div class="turntable-figure"></div>
        <!-- 指针 -->
        <div class="pointer" @click="draw"></div>
      </div>
      <!-- 开始抽奖按钮 -->
      <div class="btn-luckydraw" @click="draw"></div>
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
    .beijing-time-location {
      position: absolute;
      margin-top: .65rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 1.3533rem;
      height: .3066rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/index/beijing-time-location.png") top center no-repeat;
      background-size: 100% 100%;
    }
    .shanghai-time-location {
      position: absolute;
      margin-top: .65rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 1.38rem;
      height: .3266rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/index/shanghai-time-location.png") top center no-repeat;
      background-size: 100% 100%;
    }
    .guangzhou-time-location {
      position: absolute;
      margin-top: .65rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 1.38rem;
      height: .3066rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/index/guangzhou-time-location.png") top center no-repeat;
      background-size: 100% 100%;
    }
    .chongqing-time-location {
      position: absolute;
      margin-top: .65rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 1.62rem;
      height: .3066rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/index/chongqing-time-location.png") top center no-repeat;
      background-size: 100% 100%;
    }
    .zhengzhou-time-location {
      position: absolute;
      margin-top: .65rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 1.2466rem;
      height: .3066rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/index/zhengzhou-time-location.png") top center no-repeat;
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
    background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/bg.jpg") top center no-repeat;
    background-size: cover;
    .figure-bg {
      position: relative;
      width: 100%;
      height: 100%;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/map/figure-bg.png") top center no-repeat;
      background-size: cover;
      .icon-slogan {
      position: absolute;
      top: .5rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 3.1066rem;
      height: 1.1933rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/slogan.png") top center no-repeat;
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
        width: 3.68rem;
        height: 5.6266rem;
        background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/map/path.png") top center no-repeat;
        background-size: 100% 100%; 
        .btn-nice {
          position: absolute;
          top: -.28rem;
          left: -.39rem;
          width: 2rem;
          height: .8rem;
          // background-color: rgba(0, 255, 0, .5);
          .nice-unlock {
            position: absolute;
            top: 0rem;
            left: 0rem;
            width:.96rem;
            height: .78rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/map/icon-nice.png") top center no-repeat;
            background-size: 100% 100%; 
          }
          .nice-lock {
            position: absolute;
            top: 0rem;
            left: 0rem;
            width:.96rem;
            height: .78rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/map/bg-horse.png") top center no-repeat;
            background-size: 100% 100%; 
          }
        }
        .btn-pet {
          position: absolute;
          top: 1.04rem;
          right: 0rem;
          width: 2rem;
          height: .8rem;
          // background-color: rgba(0, 255, 0, .5);
          .pet-unlock {
            position: absolute;
            top: 0rem;
            left: 0rem;
            width:.96rem;
            height: .78rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/map/icon-pet.png") top center no-repeat;
            background-size: 100% 100%; 
          }
          .pet-lock {
            position: absolute;
            top: 0rem;
            left: 0rem;
            width:.96rem;
            height: .78rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/map/bg-horse.png") top center no-repeat;
            background-size: 100% 100%; 
          }
        }
        .btn-risk {
          position: absolute;
          top: 2.2rem;
          left: -.39rem;
          width: 2rem;
          height: .8rem;
          // background-color: pink;
          .risk-unlock {
            position: absolute;
            top: 0rem;
            left: 0rem;
            width:.96rem;
            height: .78rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/map/icon-risk.png") top center no-repeat;
            background-size: 100% 100%; 
          }
          .risk-lock {
            position: absolute;
            top: 0rem;
            left: 0rem;
            width:.96rem;
            height: .78rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/map/bg-horse.png") top center no-repeat;
            background-size: 100% 100%; 
          }
        }
        .btn-car {
          position: absolute;
          top: 3.65rem;
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
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/map/icon-car.png") top center no-repeat;
            background-size: 100% 100%; 
          }
          .car-lock {
            position: absolute;
            top: 0rem;
            left: 0rem;
            width:.96rem;
            height: .78rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/map/bg-horse.png") top center no-repeat;
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
        background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/map/btn-luckydraw.png") top center no-repeat;
        background-size: 100% 100%; 
        padding-left: .2rem;  // 为了把锁的状态居中后往右移一些
        .lock-status {
          position: absolute;
          top: .15rem;
          margin-left: 50%;
          transform: translateX(-50%);
          width: .18rem;
          height: .2733rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/map/icon-lock.png") top center no-repeat;
          background-size: 100% 100%; 
        }
        .unlock-status {
          position: absolute;
          top: .15rem;
          margin-left: 50%;
          transform: translateX(-50%);
          width: .4rem;
          height: .3133rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/map/icon-unlock.png") top center no-repeat;
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
    background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/bg.jpg") top center no-repeat;
    background-size: cover;
    .figure-horse {
      position: absolute;
      left: 0;
      bottom: 0;
      width: 2.9533rem;
      height: 2.9333rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/figure-horse.png") top center no-repeat;
      background-size: 100% 100%;
    }
    .icon-slogan {
      position: absolute;
      top: .5rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 3.1066rem;
      height: 1.1933rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/slogan.png") top center no-repeat;
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
      height: .42rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/btn-nice.png") top center no-repeat;
      background-size: 100% 100%; 
    }
    .btn-pet-title {
      position: absolute;
      top: 2rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 1.7266rem;
      height: .42rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/btn-pet.png") top center no-repeat;
      background-size: 100% 100%; 
    }
    .btn-risk-title {
      position: absolute;
      top: 2rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 1.7266rem;
      height: .42rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/btn-risk.png") top center no-repeat;
      background-size: 100% 100%; 
    }
    .btn-car-title {
      position: absolute;
      top: 2rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 1.7266rem;
      height: .42rem;
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
      top: 2.6rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 4.1933rem;
      height: 5.68rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/stamp-area.png") top center no-repeat;
      background-size: 100% 100%; 
      .stamp-status-already {
        position: absolute;
        bottom: .1rem;
        margin-left: 50%;
        transform: translateX(-50%);
        width: .5866rem;
        height: .1866rem;
        background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/character-stamp-already.png") top center no-repeat;
        background-size: 100% 100%; 
      } 
      .stamp-status-tip {
        position: absolute;
        bottom: .1rem;
        margin-left: 50%;
        transform: translateX(-50%);
        width: .6066rem;
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
    .stamped-area {
      position: absolute;
      top: 3.5rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 4.12rem;
      height: 4.5rem;
    }
    .stamp-nice {
      position: absolute;
      top: 4.8rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 2.3533rem;
      height: 2.1066rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/stamp-nice.png") top center no-repeat;
      background-size: 100% 100%; 
    }
    .stamp-pet {
      position: absolute;
      top: 4.8rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 2.3533rem;
      height: 2.1066rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/stamp-pet.png") top center no-repeat;
      background-size: 100% 100%; 
    }
    .stamp-risk {
      position: absolute;
      top: 4.8rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 2.3533rem;
      height: 2.1066rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/stamp-risk.png") top center no-repeat;
      background-size: 100% 100%; 
    }
    .stamp-car {
      position: absolute;
      top: 4.8rem;
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
        height: 2.8066rem;
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
        height: 2.0933rem;
        background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/ruler-risk.png") top center no-repeat;
        background-size: 100% 100%; 
      }
      .pop-car-rule {
        width: 4.2466rem;
        height: 1.86rem;
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
          width: 4.2733rem;
          height: 3.8rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/stamp/bg-qrcode.png") top center no-repeat;
          background-size: 100% 100%; 
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
    background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/bg.jpg") top center no-repeat;
    background-size: cover;
    .figure-horse {
      position: absolute;
      left: 0;
      bottom: 0;
      width: 2.9533rem;
      height: 2.9333rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/figure-horse.png") top center no-repeat;
      background-size: 100% 100%;
    }
    .icon-slogan {
      position: absolute;
      top: .5rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 3.1066rem;
      height: 1.1933rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/slogan.png") top center no-repeat;
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
      width: 4.82rem; 
      height: 4.5rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/bg-turntable.png") top center no-repeat;
      background-size: 100% 100%;
      .turn-table {
        position: absolute;
        top: .9rem;
        left: .93rem;
        width: 3.1066rem;
        height: 3.1066rem;
        // background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/turntable-bj-sh-zz.png") top center no-repeat;
        background: var(--bg) top center no-repeat;
        background-size: 100% 100%;
        transform-origin: center center;
        // transition: transform 5s cubic-bezier(0.22, 1, 0.36, 1);
        &.accelerate {
          transition: transform 1.4s cubic-bezier(0.4, 0, 1, 1);
        }
        &.decelerate {
          transition: transform 5.6s cubic-bezier(0.22, 1, 0.36, 1);
        }
      }
      .pointer {
        position: absolute;
        top: 1.88rem;
        left: 2.09rem;
        width: .7866rem;
        height: 1rem;
        background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/pointer.png") top center no-repeat;
        background-size: 100% 100%;
        z-index: 1;
      }
      .turntable-figure {
        position: absolute;
        top: 0;
        left: 0;
        width: 4.7266rem; 
        height: 4.78rem;
        background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/figure-turntable.png") top center no-repeat;
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
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/btn-start.png") top center no-repeat;
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