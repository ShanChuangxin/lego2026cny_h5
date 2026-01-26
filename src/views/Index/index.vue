<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Toast } from 'vant'
import vueQr from 'vue-qr/src/packages/vue-qr.vue'
import { getUserInfoAPI, stampCheckAPI, stampStatusAPI, withdrawAPI, clearDrawInfoAPI } from '@/apis/user'
import type { UserInfo } from '@/types/user'
import chapter from "../../components/chapter.vue";

// 城市信息相关
const cityCodeList = {
  "beijing": "LCS016-HTD",
  "shanghai": "LCS277-EBT",
  "zhengzhou": "LCS052-XJMZZ",
  "chongqing": "897_LBR_Store",
  "guangzhou": "LCS059-MCSZ"
}

const currentCity = ref("beijing");
// 定义用户信息
// let user_id = "";
// let uqr_code = ""; // 注意这是用户的qrcode，不是打卡页面的qrcode
// let draw_time = "";
// let draw_status = 0;  // 所抽的奖品等级，1-5代表着1-5等奖

const userInfo = ref<UserInfo>()

// 通过url参数获取用户信息
const route = useRoute();
const loadUserInfo = async () => {
    console.log("获取的参数信息为：", route.query);
    // 需要获取authCode用于获取用户信息，需要utmChannel_var用于获取城市信息
    if (route.query.authCode && route.query.utmChannel_var) {
        // 选择城市信息
        const cityCode = route.query.utmChannel_var as string;
        console.log("city: ", cityCode);
        if (cityCode == cityCodeList["beijing"]) {
          currentCity.value = "beijing";
        } else if (cityCode == cityCodeList["shanghai"]) {
          currentCity.value = "shanghai";
        } else if (cityCode == cityCodeList["zhengzhou"]) {
          currentCity.value = "zhengzhou";
        } else if (cityCode == cityCodeList["chongqing"]) {
          currentCity.value = "chongqing";
        } else if (cityCode == cityCodeList["guangzhou"]) {
          currentCity.value = "guangzhou";
        } else {
          Toast("城市参数错误");
        }
        const auth_code = route.query.authCode as string;
        console.log("auth_code: ", auth_code);
        const res = await getUserInfoAPI({ auth_code, city: currentCity.value});           
        console.log("服务器信息：", res);
        if (res.data.errcode == 0) {
            userInfo.value = res.data.data;
            // 状态记录
            userInfo.value.user_id = res.data.data.user_id;
            userInfo.value.qr_code = res.data.data.qr_code;
            userInfo.value.draw_time = res.data.data.draw_time;
            userInfo.value.prize_code = res.data.data.prize_code; // 所抽的奖品等级，1-5代表着1-5等奖
            // userInfo.value.verify_status = res.data.data.verify_status; // 是否核销
            isNiceCheck.value = Boolean(res.data.data.position_time_1);
            isPetCheck.value = Boolean(res.data.data.position_time_2);
            isRiskCheck.value = Boolean(res.data.data.position_time_3);
            isCarCheck.value = Boolean(res.data.data.position_time_4);
            console.log(isNiceCheck.value);
            console.log(isPetCheck.value);
            console.log(isRiskCheck.value);
            console.log(isCarCheck.value);
            // 更新用户二维码，用于最后核销奖品显示
            userQrCode.value = userInfo.value.qr_code;  // 最后抽奖弹窗的二维码
            // 页面记录同步
            if (userInfo.value.prize_code != 0) {  // 百分百中奖，0为未抽奖
              console.log("已抽过奖，跳转到抽奖结果页面");
              // 1. 更新中奖弹窗信息
              alreadyLucyDraw.value = true; // 打开中奖弹窗
              if (userInfo.value.prize_code == 6 && currentCity.value != "chongqing" && currentCity.value != "guangzhou"){
                prizeNum.value = 5; // 防止重庆或者广州的人中了无限量奖，又跑到了北方城市，直接升一等级（防止北方城市的UI没有6这个奖项）
              } else {
                prizeNum.value = userInfo.value.prize_code;// 更新中奖结果, 弹窗内容
              }
              // 2. 跳转到抽奖页面
              navigateToPage(4);
            } else if (!isCarCheck.value && !isPetCheck.value && !isRiskCheck.value && !isCarCheck.value) { // 没有打过任何打卡点，跳到首页
              console.log("未打卡，跳到首页");
              navigateToPage(0);  // 跳转到首页
            } else {
              console.log("未打完所有卡，跳到打卡地图页面");
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
const isNiceCheck = ref(false); //   已盖章-有好事
const isPetCheck = ref(false); //   已盖章-有宠物
const isRiskCheck = ref(false); //   已盖章-大冒险
const isCarCheck = ref(false); //   已盖章-提新车
// 定义备用方案的qrcode相关信息
const qrCodeBackup = ref('')  // 二维码的值
const qrCodeBackupSize = ref(180) // 码的黑色块尺寸
const qrCodeBackupMargin = ref(0)
const isShowBackupQrCode = ref(false); // 是否显示备用打卡二维码
// 电子印章相关信息
const fffImg = ref<string>(""); // 未盖章完成的图片
const blackImg = ref<string>("");  // 印戳图片，但是设置为空，因为不使用电子印章SDK组件的印戳渲染，只使用盖章成功的回调函数
const errorNumber = ref(0.1); // 0-1，数字越小，检查越严格。一般0.1
const arrAy = ref<any>([1, 1.0075192724740782, 1.0111229484707331, 1.069166113052584, 1.1348035748452034, 1.4507467151160764, 1.5075372936197426, 1.7161704869389864, 1.754161213064937, 1.9332532130008513]);  // 电子印章数据特征

// 盖章完成方法
// 先往服务器校验，校验成功了才会显示印戳
const adoptFn = async () => {
  // 判断是不是已经盖过章了，已经盖过章，则不允许重复盖章
  if ((stampPageIndex == 1 && isNiceCheck.value == true) || (stampPageIndex == 2 && isPetCheck.value == true) || (stampPageIndex == 3 && isRiskCheck.value == true) || (stampPageIndex == 4 && isCarCheck.value == true)){
    console.log("该页面已经盖过章了，无需重复盖章");
    return;
  } 
  // 向服务器请求盖章
  const res = await stampCheckAPI({user_id: userInfo.value.user_id, position_num: stampPageIndex})
  console.log("盖章结果服务器反馈反馈：", res);
  if (res.data.errcode == 0) {  // 盖章成功
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
    console.log("盖章完成");
  } else {
    console.log("盖章失败：", res.data.errmsg);
  }
};
// 切换到印章页面函数
function navigateToStampPage(page) {
  console.log("stamp page：" + page)
  // 当前所在页面印章状态记录
  stampPageIndex = page;
  navigateToPage(3);
}
// 切换显示打卡规则弹窗函数
function switchShowCheckRule(isShowRule) {
  console.log("打开规则介绍");
  isShowCheckRule.value = isShowRule;
}

// 显示备用扫码打卡二维码
const showBackupQrCode = async (isShowCode) => {
  isShowBackupQrCode.value = isShowCode;
  if (isShowCode) { // 显示二维码
    console.log("显示备用打卡二维码");
    // 更新二维码的值
    qrCodeBackup.value = userInfo.value.user_id + "_" + stampPageIndex.toString();
    console.log("备用方案二维码为：", qrCodeBackup.value);
  } else {  // 隐藏二维码
    // 如果当前页面已经盖过章了
    if ((stampPageIndex == 1 && isNiceCheck.value == true) || (stampPageIndex == 2 && isPetCheck.value == true) || (stampPageIndex == 3 && isRiskCheck.value == true) || (stampPageIndex == 4 && isCarCheck.value == true)){
      console.log("该页面已经盖过章了，无需重新拉取打卡状态");
      return;
    } else {
      // 重新从服务器拉取是否已经打卡状态
      console.log("隐藏二维码并从服务器拉取最新的打卡状态");
      // stampStatus();
      const res = await stampStatusAPI({user_id: userInfo.value.user_id})
      console.log("同步的最新打卡结果：", res);
      if (res.data.errcode == 0) {
        isNiceCheck.value = Boolean(res.data.data.position_time_1);
        isPetCheck.value = Boolean(res.data.data.position_time_2);
        isRiskCheck.value = Boolean(res.data.data.position_time_3);
        isCarCheck.value = Boolean(res.data.data.position_time_4);
      } else {
        console.log("同步备用打卡信息失败：", res.data.errmsg);
      }
    }
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
const prizeNum = ref(0);  // 抽到的几等奖，0为起始值，1-5为五等奖，6为谢谢参与（仅限重庆和广州）
const rotateDeg = ref(0); // 旋转角度
const isSpinning = ref(false);  // 是否开始旋转
// const canEnd = ref(false);  // 旋转结束回调状态锁
const ACC_DURATION = 1400; // 加速 ms
const DEC_DURATION = 5600; // 减速 ms
const TOTAL_DURATION = ACC_DURATION + DEC_DURATION;

// 定义备用方案的qrcode相关信息
const userQrCode = ref('')  // 二维码的值
const userQrCodeSize = ref(200) // 码的黑色块尺寸
const userQrCodeMargin = ref(0)
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
  // canEnd.value = true;
  const targetAngle = 360 * 7 - prizeIndex * ANGLE_PER;
  rotateDeg.value = targetAngle;
  return;
}
// 抽奖
async function draw() {
  if (isSpinning.value) {
    console.log("转盘旋转中..");
    return; // 如果在抽奖，则点击没有反应
  }
  // prizeNum.value = 1;  // mock
  // 向服务器请求抽奖结果
  const res = await withdrawAPI({user_id: userInfo.value.user_id, city: currentCity.value});  // 注意，这是城只能用网页的城市，不能用用户首次登录的城市
  console.log("获取的抽奖结果为：", res);
  if (0 == res.data.errcode) {
    prizeNum.value = res.data.data.prize_code;
    console.log("当前抽的奖项为：", prizeNum.value);
  } else {
    console.log("抽奖失败：", res.data.errmsg);
    return;
  }
  console.log("开始旋转抽奖转盘");
  isSpinning.value = true;

  let indexList = [];
  // 从该奖项的多个位置中随机一个
  console.log("当前城市：", currentCity.value);
  if (cityNorth.value.includes(currentCity.value)){
    indexList = prizeIndexMapBjShZz[prizeNum.value - 1]; // 北方城市索引列表
    console.log("北方城市：", indexList);
  } else {
    indexList = prizeIndexMapCqGz[prizeNum.value - 1]; // 南方城市索引列表
    console.log("南方城市：", indexList);
  }
  const prizeIndex = randomFromArray(indexList);  // 从该奖项列表里随机出转盘对应的某个索引
  console.log("当前奖项所在转盘中的索引列表为：", indexList);
  console.log("奖项随机到的索引值为：", prizeIndex);
  startSpin(prizeIndex);
}
// 旋转完回调
function onSpinEnd(e: TransitionEvent) {
  if (e.propertyName !== 'transform') return;
  console.log("旋转完成");
  // 重新打开旋转开关
  isSpinning.value = false;
  // 显示中奖弹窗
  alreadyLucyDraw.value = true;
}

// 清除用户打信息并回到主页
const clearUserInfo = async () => {
  return;
  console.log("清除用户信息并回到主页");
  // 1. 向服务器请求清除打卡和抽奖信息
  const res = await clearDrawInfoAPI({user_id: userInfo.value.user_id})
  if (res.data.errcode == 0) {
    // 2. 本地数据清空
    isNiceCheck.value = false;
    isPetCheck.value = false;
    isRiskCheck.value = false;
    isCarCheck.value =false;
    userInfo.value.prize_code = 0;
    userInfo.value.draw_time = 0;
    prizeNum.value = 0;
    alreadyLucyDraw.value = false;
    rotateDeg.value = 0;
    isSpinning.value = false;

    // 3. 重新加载用户信息
    loadUserInfo();
    Toast("用户信息清除成功");
    // 4. 返回主页
    navigateToPage(0);
  } else {
    Toast(res.data.errmsg);
  }
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
      <div class="ruler-content">
        <div class="scroll">
          <!-- 规则内容 -->
          <div v-show="currentCity=='beijing'" class="beijing-ruler-content"></div>
          <div v-show="currentCity=='shanghai'" class="shanghai-ruler-content"></div>
          <div v-show="currentCity=='guangzhou'" class="guangzhou-ruler-content"></div>
          <div v-show="currentCity=='chongqing'" class="chongqing-ruler-content"></div>
          <div v-show="currentCity=='zhengzhou'" class="zhengzhou-ruler-content"></div>
        </div>
      </div>
      <!-- 规则标题 -->
      <div class="ruler-title"></div>
      <!-- 按钮-马上开始 -->
      <div class="btn-start" @click="navigateToPage(2)"></div>
    </div>

    <!-- 打卡地图页面 -->
    <div v-show="pageNum==2" class="map-page">
      <div class="figure-bg">
        <!-- icon和slogan -->
        <div class="icon-slogan">
          <!-- 隐藏按钮-清除用户信息 -->
          <div class="btn-clear" @click="clearUserInfo()"></div>
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
            <vue-qr :text="qrCodeBackup" :size="qrCodeBackupSize" :margin="qrCodeBackupMargin"></vue-qr>
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
          <div class="btn-clear" @click="clearUserInfo()"></div>
      </div>
      <!-- 游戏转盘 -->
      <div class="turntable-container">
        <!-- 转盘 -->
        <!-- 北方城市转盘 -->
        <div v-show="cityNorth.includes(currentCity)" 
          class="turn-table" 
          style="--bg: url('https://www.mbcstyle.cn/projects/lego2026cny/images/draw/turntable-bj-sh-zz.png')"
          :style="{transform:`rotate(${rotateDeg}deg)`}" 
          @transitionend="onSpinEnd"
          >
        </div>
        <!-- 南方城市转盘 -->
        <div v-show="citySouth.includes(currentCity)" 
          class="turn-table" 
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
      <div v-show="alreadyLucyDraw" class="pop-container" @click="clearUserInfo()">
        <div class="content-container">
          <!-- 北京中奖弹窗 -->
          <div v-if="currentCity=='beijing' && prizeNum == 1" class="beijing-prize-1">
            <div class="tips"></div>
            <!-- 显示当前打卡点的二维码 -->
            <div class="qrcode-area">
                <vue-qr :text="userQrCode" :size="userQrCodeSize" :margin="userQrCodeMargin"></vue-qr>
            </div>
          </div>
          <div v-if="currentCity=='beijing' && prizeNum == 2" class="beijing-prize-2">
            <div class="tips"></div>
            <!-- 显示当前打卡点的二维码 -->
            <div class="qrcode-area">
                <vue-qr :text="userQrCode" :size="userQrCodeSize" :margin="userQrCodeMargin"></vue-qr>
            </div>
          </div>
          <div v-if="currentCity=='beijing' && prizeNum == 3" class="beijing-prize-3">
            <div class="tips"></div>
            <!-- 显示当前打卡点的二维码 -->
            <div class="qrcode-area">
                <vue-qr :text="userQrCode" :size="userQrCodeSize" :margin="userQrCodeMargin"></vue-qr>
            </div>
          </div>
          <div v-if="currentCity=='beijing' && prizeNum == 4" class="beijing-prize-4">
            <div class="tips"></div>
            <!-- 显示当前打卡点的二维码 -->
            <div class="qrcode-area">
                <vue-qr :text="userQrCode" :size="userQrCodeSize" :margin="userQrCodeMargin"></vue-qr>
            </div>
          </div>
          <div v-if="currentCity=='beijing' && prizeNum == 5" class="beijing-prize-5">
            <div class="tips"></div>
            <!-- 显示当前打卡点的二维码 -->
            <div class="qrcode-area">
                <vue-qr :text="userQrCode" :size="userQrCodeSize" :margin="userQrCodeMargin"></vue-qr>
            </div>
          </div>

          <!-- 上海中奖弹窗 -->
          <div v-if="currentCity=='shanghai' && prizeNum == 1" class="shanghai-prize-1">
            <div class="tips"></div>
            <!-- 显示当前打卡点的二维码 -->
            <div class="qrcode-area">
                <vue-qr :text="userQrCode" :size="userQrCodeSize" :margin="userQrCodeMargin"></vue-qr>
            </div>
          </div>
          <div v-if="currentCity=='shanghai' && prizeNum == 2" class="shanghai-prize-2">
            <div class="tips"></div>
            <!-- 显示当前打卡点的二维码 -->
            <div class="qrcode-area">
                <vue-qr :text="userQrCode" :size="userQrCodeSize" :margin="userQrCodeMargin"></vue-qr>
            </div>
          </div>
          <div v-if="currentCity=='shanghai' && prizeNum == 3" class="shanghai-prize-3">
            <div class="tips"></div>
            <!-- 显示当前打卡点的二维码 -->
            <div class="qrcode-area">
                <vue-qr :text="userQrCode" :size="userQrCodeSize" :margin="userQrCodeMargin"></vue-qr>
            </div>
          </div>
          <div v-if="currentCity=='shanghai' && prizeNum == 4" class="shanghai-prize-4">
            <div class="tips"></div>
            <!-- 显示当前打卡点的二维码 -->
            <div class="qrcode-area">
                <vue-qr :text="userQrCode" :size="userQrCodeSize" :margin="userQrCodeMargin"></vue-qr>
            </div>
          </div>
          <div v-if="currentCity=='shanghai' && prizeNum == 5" class="shanghai-prize-5">
            <div class="tips"></div>
            <!-- 显示当前打卡点的二维码 -->
            <div class="qrcode-area">
                <vue-qr :text="userQrCode" :size="userQrCodeSize" :margin="userQrCodeMargin"></vue-qr>
            </div>
          </div>

          <!-- 郑州中奖弹窗 -->
          <div v-if="currentCity=='zhengzhou' && prizeNum == 1" class="zhengzhou-prize-1">
            <div class="tips"></div>
            <!-- 显示当前打卡点的二维码 -->
            <div class="qrcode-area">
                <vue-qr :text="userQrCode" :size="userQrCodeSize" :margin="userQrCodeMargin"></vue-qr>
            </div>
          </div>
          <div v-if="currentCity=='zhengzhou' && prizeNum == 2" class="zhengzhou-prize-2">
            <div class="tips"></div>
            <!-- 显示当前打卡点的二维码 -->
            <div class="qrcode-area">
                <vue-qr :text="userQrCode" :size="userQrCodeSize" :margin="userQrCodeMargin"></vue-qr>
            </div>
          </div>
          <div v-if="currentCity=='zhengzhou' && prizeNum == 3" class="zhengzhou-prize-3">
            <div class="tips"></div>
            <!-- 显示当前打卡点的二维码 -->
            <div class="qrcode-area">
                <vue-qr :text="userQrCode" :size="userQrCodeSize" :margin="userQrCodeMargin"></vue-qr>
            </div>
          </div>
          <div v-if="currentCity=='zhengzhou' && prizeNum == 4" class="zhengzhou-prize-4">
            <div class="tips"></div>
            <!-- 显示当前打卡点的二维码 -->
            <div class="qrcode-area">
                <vue-qr :text="userQrCode" :size="userQrCodeSize" :margin="userQrCodeMargin"></vue-qr>
            </div>
          </div>
          <div v-if="currentCity=='zhengzhou' && prizeNum == 5" class="zhengzhou-prize-5">
            <div class="tips"></div>
            <!-- 显示当前打卡点的二维码 -->
            <div class="qrcode-area">
                <vue-qr :text="userQrCode" :size="userQrCodeSize" :margin="userQrCodeMargin"></vue-qr>
            </div>
          </div>

          <!-- 重庆中奖弹窗 -->
          <div v-if="currentCity=='chongqing' && prizeNum == 1" class="chongqing-prize-1">
            <div class="tips"></div>
            <!-- 显示当前打卡点的二维码 -->
            <div class="qrcode-area">
                <vue-qr :text="userQrCode" :size="userQrCodeSize" :margin="userQrCodeMargin"></vue-qr>
            </div>
          </div>
          <div v-if="currentCity=='chongqing' && prizeNum == 2" class="chongqing-prize-2">
            <div class="tips"></div>
            <!-- 显示当前打卡点的二维码 -->
            <div class="qrcode-area">
                <vue-qr :text="userQrCode" :size="userQrCodeSize" :margin="userQrCodeMargin"></vue-qr>
            </div>
          </div>
          <div v-if="currentCity=='chongqing' && prizeNum == 3" class="chongqing-prize-3">
            <div class="tips"></div>
            <!-- 显示当前打卡点的二维码 -->
            <div class="qrcode-area">
                <vue-qr :text="userQrCode" :size="userQrCodeSize" :margin="userQrCodeMargin"></vue-qr>
            </div>
          </div>
          <div v-if="currentCity=='chongqing' && prizeNum == 4" class="chongqing-prize-4">
            <div class="tips"></div>
            <!-- 显示当前打卡点的二维码 -->
            <div class="qrcode-area">
                <vue-qr :text="userQrCode" :size="userQrCodeSize" :margin="userQrCodeMargin"></vue-qr>
            </div>
          </div>
          <div v-if="currentCity=='chongqing' && prizeNum == 5" class="chongqing-prize-5">
            <div class="tips"></div>
            <!-- 显示当前打卡点的二维码 -->
            <div class="qrcode-area">
                <vue-qr :text="userQrCode" :size="userQrCodeSize" :margin="userQrCodeMargin"></vue-qr>
            </div>
          </div>
          <div v-if="currentCity=='chongqing' && prizeNum == 6" class="chongqing-prize-6"></div>

          <!-- 广州中奖弹窗 -->
          <div v-if="currentCity=='guangzhou' && prizeNum == 1" class="guangzhou-prize-1">
            <div class="tips"></div>
            <!-- 显示当前打卡点的二维码 -->
            <div class="qrcode-area">
                <vue-qr :text="userQrCode" :size="userQrCodeSize" :margin="userQrCodeMargin"></vue-qr>
            </div>
          </div>
          <div v-if="currentCity=='guangzhou' && prizeNum == 2" class="guangzhou-prize-2">
            <div class="tips"></div>
            <!-- 显示当前打卡点的二维码 -->
            <div class="qrcode-area">
                <vue-qr :text="userQrCode" :size="userQrCodeSize" :margin="userQrCodeMargin"></vue-qr>
            </div>
          </div>
          <div v-if="currentCity=='guangzhou' && prizeNum == 3" class="guangzhou-prize-3">
            <div class="tips"></div>
            <!-- 显示当前打卡点的二维码 -->
            <div class="qrcode-area">
                <vue-qr :text="userQrCode" :size="userQrCodeSize" :margin="userQrCodeMargin"></vue-qr>
            </div>
          </div>
          <div v-if="currentCity=='guangzhou' && prizeNum == 4" class="guangzhou-prize-4">
            <div class="tips"></div>
            <!-- 显示当前打卡点的二维码 -->
            <div class="qrcode-area">
                <vue-qr :text="userQrCode" :size="userQrCodeSize" :margin="userQrCodeMargin"></vue-qr>
            </div>
          </div>
          <div v-if="currentCity=='guangzhou' && prizeNum == 5" class="guangzhou-prize-5">
            <div class="tips"></div>
            <!-- 显示当前打卡点的二维码 -->
            <div class="qrcode-area">
                <vue-qr :text="userQrCode" :size="userQrCodeSize" :margin="userQrCodeMargin"></vue-qr>
            </div>
          </div>
          <div v-if="currentCity=='guangzhou' && prizeNum == 6" class="guangzhou-prize-6"></div>

          <div class="tips-container">
            <div v-if="currentCity=='beijing'" class="beijing-tips">
              <div>中奖奖品以实际库存为准</div>
              <div>奖品核销地址：北京荟聚中心LCS016-HTD乐高门店</div>
            </div>
            <div v-if="currentCity=='shanghai'" class="shanghai-tips">
              <div>中奖奖品以实际库存为准</div>
              <div>奖品核销地址：环贸iapm商场 LG1-161乐高门店</div>
            </div>
            <div v-if="currentCity=='zhengzhou'" class="zhengzhou-tips">
              <div>中奖奖品以实际库存为准</div>
              <div>奖品核销地址：郑州正弘城L319乐高门店</div>
            </div>
            <div v-if="currentCity=='chongqing' && prizeNum != 6" class="chongqing-tips">
              <div>中奖奖品以实际库存为准</div>
              <div>奖品核销地址：重庆来福士01-108/02-113乐高品牌旗舰店</div>
            </div>
            <div v-if="currentCity=='guangzhou' && prizeNum != 6" class="guangzhou-tips">
              <div>中奖奖品以实际库存为准</div>
              <div>奖品核销地址：广州凯德乐峰广场B1层-S35乐高门店</div>
            </div>
          </div>
        </div>
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
    background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/bg.jpg") top center no-repeat;
    background-size: cover;
    .figure-horse {
      position: absolute;
      left: 0;
      bottom: 0;
      width: 2.94rem;
      height: 2.9266rem;
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
    }
    .ruler-title {
      position: absolute;
      top: 2rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 1.7266rem;
      height: .42rem;
      background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/ruler/title.png") top center no-repeat;
      background-size: 100% 100%;
    }
    .ruler-content {
      position: absolute;
      top: 2.23rem;
      margin-left: 50%;
      transform: translateX(-50%);
      width: 4.1rem;
      height: 6rem;
      border: 2px solid #e5bc66;
      border-radius: 15px;
      overflow: hidden;
      background-color: rgba(0, 0, 0, .1);
      padding: .3rem .2rem;
      .scroll {
        height: 100%;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;  // 微信 + ios滚动优化
        padding-left: .05rem;
        // // 隐藏滚动条
        // scrollbar-width: none;  // Firefox
        // -ms-overflow-style: none; // IE / Edge
        // &::-webkit-scrollbar {
        //   width: 0;
        //   height: 0;
        //   display: none;
        // }
        .beijing-ruler-content {
          width: 3.52rem;
          height: 23.04rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/ruler/ruler-beijing.png") top center no-repeat;
          background-size: 100% 100%;
        }
        .shanghai-ruler-content {
          width: 3.52rem;
          height: 22.62rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/ruler/ruler-shanghai.png") top center no-repeat;
          background-size: 100% 100%;
        }
        .zhengzhou-ruler-content {
          width: 3.52rem;
          height: 22.8333rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/ruler/ruler-zhengzhou.png") top center no-repeat;
          background-size: 100% 100%;
        }
        .chongqing-ruler-content {
          width: 3.52rem;
          height: 24.3rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/ruler/ruler-chongqing.png") top center no-repeat;
          background-size: 100% 100%;
        }
        .guangzhou-ruler-content {
          width: 3.52rem;
          height: 22.4133rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/ruler/ruler-guangzhou.png") top center no-repeat;
          background-size: 100% 100%;
        }
      }
    }
    .btn-start {
      position: absolute;
      bottom: .8rem;
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
        // top: 8rem;
        bottom: .8rem;
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
      // top: 8.5rem;
      bottom: .8rem;
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
    .turntable-container { 
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
        transition: transform 6.8s cubic-bezier(0.25, 0.05, 0.25, 1);
        will-change: transform;
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
      // top: 7.5rem;
      bottom: .8rem;
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
      .content-container {
        width: 5.0133rem;
        // background-color: pink;
        display: flex;
        flex-direction: column;
        align-items: center;
        // 北京不同的礼物弹窗
        .beijing-prize-1 {
          position: relative;
          width: 4.0133rem;
          height: 5.8666rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/bg-pop-prize.png") top center no-repeat;
          background-size: 100% 100%; 
          .tips {
            position: absolute;
            top: 1rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 1.9533rem;
            height: 1.1266rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/bj-prize-1.png") top center no-repeat;
            background-size: 100% 100%;
          }
          .qrcode-area {
            position: absolute;
            top: 2.25rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 3.1rem;
            height: 3.1rem;
            // background-color: rgba(255, 0, 0, .5);
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
        .beijing-prize-2 {
          position: relative;
          width: 4.0133rem;
          height: 5.8666rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/bg-pop-prize.png") top center no-repeat;
          background-size: 100% 100%; 
          .tips {
            position: absolute;
            top: 1rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 1.5733rem;
            height: 1.1266rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/bj-prize-2.png") top center no-repeat;
            background-size: 100% 100%;
          }
          .qrcode-area {
            position: absolute;
            top: 2.25rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 3.1rem;
            height: 3.1rem;
            // background-color: rgba(255, 0, 0, .5);
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
        .beijing-prize-3 {
          position: relative;
          width: 4.0133rem;
          height: 5.8666rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/bg-pop-prize.png") top center no-repeat;
          background-size: 100% 100%; 
          .tips {
            position: absolute;
            top: 1rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 1.72rem;
            height: 1.1266rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/bj-prize-3.png") top center no-repeat;
            background-size: 100% 100%;
          }
          .qrcode-area {
            position: absolute;
            top: 2.25rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 3.1rem;
            height: 3.1rem;
            // background-color: rgba(255, 0, 0, .5);
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
        .beijing-prize-4 {
          position: relative;
          width: 4.0133rem;
          height: 5.8666rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/bg-pop-prize.png") top center no-repeat;
          background-size: 100% 100%; 
          .tips {
            position: absolute;
            top: 1rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 1.5066rem;
            height: .9533rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/bj-prize-4.png") top center no-repeat;
            background-size: 100% 100%;
          }
          .qrcode-area {
            position: absolute;
            top: 2.25rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 3.1rem;
            height: 3.1rem;
            // background-color: rgba(255, 0, 0, .5);
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
        .beijing-prize-5 {
          position: relative;
          width: 4.0133rem;
          height: 5.8666rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/bg-pop-prize.png") top center no-repeat;
          background-size: 100% 100%; 
          .tips {
            position: absolute;
            top: 1rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 2.9266rem;
            height: 1.0533rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/bj-prize-5.png") top center no-repeat;
            background-size: 100% 100%;
          }
          .qrcode-area {
            position: absolute;
            top: 2.25rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 3.1rem;
            height: 3.1rem;
            // background-color: rgba(255, 0, 0, .5);
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
        // 上海礼物弹窗
        .shanghai-prize-1 {
          position: relative;
          width: 4.0133rem;
          height: 5.8666rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/bg-pop-prize.png") top center no-repeat;
          background-size: 100% 100%; 
          .tips {
            position: absolute;
            top: 1rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 1.9533rem;
            height: 1.1266rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/sh-prize-1.png") top center no-repeat;
            background-size: 100% 100%;
          }
          .qrcode-area {
            position: absolute;
            top: 2.25rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 3.1rem;
            height: 3.1rem;
            // background-color: rgba(255, 0, 0, .5);
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
        .shanghai-prize-2 {
          position: relative;
          width: 4.0133rem;
          height: 5.8666rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/bg-pop-prize.png") top center no-repeat;
          background-size: 100% 100%; 
          .tips {
            position: absolute;
            top: 1rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 1.5733rem;
            height: 1.1266rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/sh-prize-2.png") top center no-repeat;
            background-size: 100% 100%;
          }
          .qrcode-area {
            position: absolute;
            top: 2.25rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 3.1rem;
            height: 3.1rem;
            // background-color: rgba(255, 0, 0, .5);
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
        .shanghai-prize-3 {
          position: relative;
          width: 4.0133rem;
          height: 5.8666rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/bg-pop-prize.png") top center no-repeat;
          background-size: 100% 100%; 
          .tips {
            position: absolute;
            top: 1rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 1.72rem;
            height: 1.1266rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/sh-prize-3.png") top center no-repeat;
            background-size: 100% 100%;
          }
          .qrcode-area {
            position: absolute;
            top: 2.25rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 3.1rem;
            height: 3.1rem;
            // background-color: rgba(255, 0, 0, .5);
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
        .shanghai-prize-4 {
          position: relative;
          width: 4.0133rem;
          height: 5.8666rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/bg-pop-prize.png") top center no-repeat;
          background-size: 100% 100%; 
          .tips {
            position: absolute;
            top: 1rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 1.5066rem;
            height: .9533rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/sh-prize-4.png") top center no-repeat;
            background-size: 100% 100%;
          }
          .qrcode-area {
            position: absolute;
            top: 2.25rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 3.1rem;
            height: 3.1rem;
            // background-color: rgba(255, 0, 0, .5);
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
        .shanghai-prize-5 {
          position: relative;
          width: 4.0133rem;
          height: 5.8666rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/bg-pop-prize.png") top center no-repeat;
          background-size: 100% 100%; 
          .tips {
            position: absolute;
            top: 1rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 2.9466rem;
            height: 1.0533rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/sh-prize-5.png") top center no-repeat;
            background-size: 100% 100%;
          }
          .qrcode-area {
            position: absolute;
            top: 2.25rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 3.1rem;
            height: 3.1rem;
            // background-color: rgba(255, 0, 0, .5);
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
        // 郑州礼物弹窗
        .zhengzhou-prize-1 {
          position: relative;
          width: 4.0133rem;
          height: 5.8666rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/bg-pop-prize.png") top center no-repeat;
          background-size: 100% 100%; 
          .tips {
            position: absolute;
            top: 1rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 2.8133rem;
            height: 1.1533rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/zz-prize-1.png") top center no-repeat;
            background-size: 100% 100%;
          }
          .qrcode-area {
            position: absolute;
            top: 2.25rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 3.1rem;
            height: 3.1rem;
            // background-color: rgba(255, 0, 0, .5);
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
        .zhengzhou-prize-2 {
          position: relative;
          width: 4.0133rem;
          height: 5.8666rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/bg-pop-prize.png") top center no-repeat;
          background-size: 100% 100%; 
          .tips {
            position: absolute;
            top: 1rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 2.7333rem;
            height: 1.1266rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/zz-prize-2.png") top center no-repeat;
            background-size: 100% 100%;
          }
          .qrcode-area {
            position: absolute;
            top: 2.25rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 3.1rem;
            height: 3.1rem;
            // background-color: rgba(255, 0, 0, .5);
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
        .zhengzhou-prize-3 {
          position: relative;
          width: 4.0133rem;
          height: 5.8666rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/bg-pop-prize.png") top center no-repeat;
          background-size: 100% 100%; 
          .tips {
            position: absolute;
            top: 1rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 1.72rem;
            height: 1.1266rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/zz-prize-3.png") top center no-repeat;
            background-size: 100% 100%;
          }
          .qrcode-area {
            position: absolute;
            top: 2.25rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 3.1rem;
            height: 3.1rem;
            // background-color: rgba(255, 0, 0, .5);
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
        .zhengzhou-prize-4 {
          position: relative;
          width: 4.0133rem;
          height: 5.8666rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/bg-pop-prize.png") top center no-repeat;
          background-size: 100% 100%; 
          .tips {
            position: absolute;
            top: 1rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 1.5066rem;
            height: .9533rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/zz-prize-4.png") top center no-repeat;
            background-size: 100% 100%;
          }
          .qrcode-area {
            position: absolute;
            top: 2.25rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 3.1rem;
            height: 3.1rem;
            // background-color: rgba(255, 0, 0, .5);
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
        .zhengzhou-prize-5 {
          position: relative;
          width: 4.0133rem;
          height: 5.8666rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/bg-pop-prize.png") top center no-repeat;
          background-size: 100% 100%; 
          .tips {
            position: absolute;
            top: 1rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 1.62rem;
            height: 1.0533rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/zz-prize-5.png") top center no-repeat;
            background-size: 100% 100%;
          }
          .qrcode-area {
            position: absolute;
            top: 2.25rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 3.1rem;
            height: 3.1rem;
            // background-color: rgba(255, 0, 0, .5);
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
        // 重庆礼物弹窗
        .chongqing-prize-1 {
          position: relative;
          width: 4.0133rem;
          height: 5.8666rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/bg-pop-prize.png") top center no-repeat;
          background-size: 100% 100%; 
          .tips {
            position: absolute;
            top: 1rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 1.9533rem;
            height: 1.1266rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/cq-prize-1.png") top center no-repeat;
            background-size: 100% 100%;
          }
          .qrcode-area {
            position: absolute;
            top: 2.25rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 3.1rem;
            height: 3.1rem;
            // background-color: rgba(255, 0, 0, .5);
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
        .chongqing-prize-2 {
          position: relative;
          width: 4.0133rem;
          height: 5.8666rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/bg-pop-prize.png") top center no-repeat;
          background-size: 100% 100%; 
          .tips {
            position: absolute;
            top: 1rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 1.5733rem;
            height: 1.1266rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/cq-prize-2.png") top center no-repeat;
            background-size: 100% 100%;
          }
          .qrcode-area {
            position: absolute;
            top: 2.25rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 3.1rem;
            height: 3.1rem;
            // background-color: rgba(255, 0, 0, .5);
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
        .chongqing-prize-3 {
          position: relative;
          width: 4.0133rem;
          height: 5.8666rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/bg-pop-prize.png") top center no-repeat;
          background-size: 100% 100%; 
          .tips {
            position: absolute;
            top: 1rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 1.72rem;
            height: 1.1266rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/cq-prize-3.png") top center no-repeat;
            background-size: 100% 100%;
          }
          .qrcode-area {
            position: absolute;
            top: 2.25rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 3.1rem;
            height: 3.1rem;
            // background-color: rgba(255, 0, 0, .5);
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
        .chongqing-prize-4 {
          position: relative;
          width: 4.0133rem;
          height: 5.8666rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/bg-pop-prize.png") top center no-repeat;
          background-size: 100% 100%; 
          .tips {
            position: absolute;
            top: 1rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 1.5066rem;
            height: .9533rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/cq-prize-4.png") top center no-repeat;
            background-size: 100% 100%;
          }
          .qrcode-area {
            position: absolute;
            top: 2.25rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 3.1rem;
            height: 3.1rem;
            // background-color: rgba(255, 0, 0, .5);
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
        .chongqing-prize-5 {
          position: relative;
          width: 4.0133rem;
          height: 5.8666rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/bg-pop-prize.png") top center no-repeat;
          background-size: 100% 100%; 
          .tips {
            position: absolute;
            top: 1rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 2.4666rem;
            height: .9466rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/cq-prize-5.png") top center no-repeat;
            background-size: 100% 100%;
          }
          .qrcode-area {
            position: absolute;
            top: 2.25rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 3.1rem;
            height: 3.1rem;
            // background-color: rgba(255, 0, 0, .5);
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
        .chongqing-prize-6 {
          width: 2.9066rem;
          height: 2.2733rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/cq-prize-6.png") top center no-repeat;
          background-size: 100% 100%; 
        }
        // 广州礼物弹窗
        .guangzhou-prize-1 {
          position: relative;
          width: 4.0133rem;
          height: 5.8666rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/bg-pop-prize.png") top center no-repeat;
          background-size: 100% 100%; 
          .tips {
            position: absolute;
            top: 1rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 3.72rem;
            height: 1.1266rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/gz-prize-1.png") top center no-repeat;
            background-size: 100% 100%;
          }
          .qrcode-area {
            position: absolute;
            top: 2.25rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 3.1rem;
            height: 3.1rem;
            // background-color: rgba(255, 0, 0, .5);
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
        .guangzhou-prize-2 {
          position: relative;
          width: 4.0133rem;
          height: 5.8666rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/bg-pop-prize.png") top center no-repeat;
          background-size: 100% 100%; 
          .tips {
            position: absolute;
            top: 1rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 2.7466rem;
            height: 1.1266rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/gz-prize-2.png") top center no-repeat;
            background-size: 100% 100%;
          }
          .qrcode-area {
            position: absolute;
            top: 2.25rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 3.1rem;
            height: 3.1rem;
            // background-color: rgba(255, 0, 0, .5);
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
        .guangzhou-prize-3 {
          position: relative;
          width: 4.0133rem;
          height: 5.8666rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/bg-pop-prize.png") top center no-repeat;
          background-size: 100% 100%; 
          .tips {
            position: absolute;
            top: 1rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 1.72rem;
            height: 1.1266rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/gz-prize-3.png") top center no-repeat;
            background-size: 100% 100%;
          }
          .qrcode-area {
            position: absolute;
            top: 2.25rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 3.1rem;
            height: 3.1rem;
            // background-color: rgba(255, 0, 0, .5);
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
        .guangzhou-prize-4 {
          position: relative;
          width: 4.0133rem;
          height: 5.8666rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/bg-pop-prize.png") top center no-repeat;
          background-size: 100% 100%; 
          .tips {
            position: absolute;
            top: 1rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 1.5066rem;
            height: .9533rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/gz-prize-4.png") top center no-repeat;
            background-size: 100% 100%;
          }
          .qrcode-area {
            position: absolute;
            top: 2.25rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 3.1rem;
            height: 3.1rem;
            // background-color: rgba(255, 0, 0, .5);
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
        .guangzhou-prize-5 {
          position: relative;
          width: 4.0133rem;
          height: 5.8666rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/bg-pop-prize.png") top center no-repeat;
          background-size: 100% 100%; 
          .tips {
            position: absolute;
            top: 1rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 2.4266rem;
            height: .96rem;
            background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/gz-prize-5.png") top center no-repeat;
            background-size: 100% 100%;
          }
          .qrcode-area {
            position: absolute;
            top: 2.25rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 3.1rem;
            height: 3.1rem;
            // background-color: rgba(255, 0, 0, .5);
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
        .guangzhou-prize-6 {
          width: 2.9066rem;
          height: 2.2733rem;
          background: url("https://www.mbcstyle.cn/projects/lego2026cny/images/draw/gz-prize-6.png") top center no-repeat;
          background-size: 100% 100%; 
        }

        .tips-container {
          margin-top: .3rem;
          color: white;
          font-size: .19rem;
          .beijing-tips {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .shanghai-tips {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .zhengzhou-tips {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .chongqing-tips {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .guangzhou-tips {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
        }
      }
      
    }
  }
}
</style>