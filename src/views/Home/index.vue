<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Toast } from 'vant'
import gsap from 'gsap'
import vueQr from 'vue-qr/src/packages/vue-qr.vue'
import { getUserInfoAPI, withdrawAPI, clearDrawInfoAPI } from '@/apis/user'
import type { UserInfo } from '@/types/user'
// import { configH5ToMp } from '@/utils/wechatLibrary';

// 定义页面或元素显示
const pageNum = ref(1)

// 定义是否允许点击抽奖
let isAdminDraw = false;

// 定义用户信息
let auth_code = ""
const userInfo = ref<UserInfo>()

// 定义qrcode相关信息
const qrCode = ref('')
const qrCodeSize = ref(107.5)
const qrCodeMargin = ref(0)
const flowStatus = ref('0')

const route = useRoute()
const loadUserInfo = async () => {
    console.log("获取的参数信息为：", route.query);
    if (route.query.authCode) {

        auth_code = route.query.authCode as string
        console.log("auth_code: ", auth_code)
        const res = await getUserInfoAPI({ auth_code})           
        console.log(res)
        if (res.data.errcode == 0) {
            userInfo.value = res.data.data
            qrCode.value = res.data.data.qr_code
            flowStatus.value = res.data.data.flow_status

            // 开启允许抽奖
            isAdminDraw = true;

            // 状态记录
            if ('0' == res.data.data.flow_status) { // 首次进入
                // pageNum.value = 0 // 跳转到首页面
                pageNum.value = 1   // 有Landing Page了不需要首页了
            } else {
                pageNum.value = 1 // 跳转到抽奖页面
                isLuckyDog.value = res.data.data.draw_status    // 更新抽奖结果状态
                qrCode.value = res.data.data.qr_code    // 更新二维码信息
                isShowDrawResult.value = true;  // 显示抽奖结果弹窗
            }
        } else {
            Toast(res.data.errmsg)
        }
    } else {
        Toast("参数不正确，请重新扫描太阳码进入~")
    }
}

onMounted(() => loadUserInfo())

// 下页
function goDrawPage() {
    console.log("跳转到抽奖页面")
    pageNum.value = 1;
}

// 每个数字透明度控制
const noSelect = [0, 0, 0, 0, 0, 0, 0, 0]
let selectBackground = ref(noSelect)

// 基础路径，构造时使用 import.meta.url
// const basePath = new URL('../assets/images/', import.meta.url).href;
// 数字选中进行切换
function numSwitch(num) {
    // console.log("开始切换数字：", num)
    selectBackground.value = [...noSelect]    // 全部置为未选中
    selectBackground.value[num - 1] = 1 // 切换选中的数字
}

// 模拟获得指定抽奖数字的变量及函数
const select_num = ref(0)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


// 抽奖动画数字的数组
const numbers = [   // 抽奖动画轮播的内容
    1, 2, 3, 4, 5, 6, 7, 8,
    1, 2, 3, 4, 5, 6, 7, 8,
    1, 2, 3, 4, 5, 6, 7, 8,
    1, 2, 3, 4, 5, 6, 7, 8,
    1, 2, 3, 4, 5, 6, 7, 8,
];
let numList = numbers   // 用于拼接轮播内容和实际抽中数字相关的内容

let isDrawing = false   // 抽奖状态，用于控制是否允许播放抽奖内容

// 抽奖触发函数
async function go() {
    console.log("点击了go");

    // 判断是否允许抽奖
    if (!isAdminDraw) {
        console.log("不允许抽奖");
        return;
    }

    // 动画时禁止重复点击
    if (isDrawing) {
        return;
    }

    // 初始化状态
    select_num.value = 0
    numList = numbers.slice();  // 初始化为最初的数组
    isDrawing = true    // 是否在抽奖动画中
    let previousValue = -1; // 通过对比gsap前后的值对性能进行优化。初始化为无效值

    // 模拟指定数字
    // let randomNum = getRandomInt(1, 8);   // 生成1到8之间的随机整数
    // console.log("开始抽奖，数字为：", randomNum)
    let randomNum = 1

    const res = await withdrawAPI({ user_id: userInfo.value.user_id})
    console.log(res)
    if (0 == res.data.errcode) {
        randomNum = res.data.data.lucky_num
        console.log("服务器的抽奖数字为", randomNum)
    } else {
        // 初始化状态
        select_num.value = 0
        numList = numbers.slice();  // 初始化为最初的数组
        isDrawing = false   // 是否在抽奖动画中
        previousValue = -1; // 通过对比gsap前后的值对性能进行优化。初始化为无效值
        return Toast(res.data.errmsg)
    }

    // 生成数字滚动数组
    const newArr = Array.from({ length: randomNum }, (_, i) => i + 1); // 生成新的数组
    console.log(numList)
    numList.splice(0, numList.length, ...numList, ...newArr) // 把新的数组融合进新的数组
    console.log(numList)

    // 匀减速控制数组下标变化
    gsap.to(select_num, {
        duration: 3,
        value: numList.length - 1,
        // ease: "power2.out",
        onUpdate: () => {
            // numSwitch(numList[Math.floor(select_num.value)])
            const currentValue = Math.floor(select_num.value); // 获取当前整数值
            if (currentValue !== previousValue) {
                numSwitch(numList[currentValue]);
                previousValue = currentValue; // 更新之前的值
            }
        },
        onComplete: () => {
            isDrawing = false
            // 弹中奖结果
            isShowDrawResult.value = true
            if (8 == randomNum) {
                isLuckyDog.value = true
            } else {
                isLuckyDog.value = false
            }
        }
    })
}

// 抽奖结果相关
const isShowDrawResult = ref(false) // 是否显示中奖弹窗
const isLuckyDog = ref(false)   // 是否中奖，默认不中奖
// const luckyDrawInfo = ref('个人二维码')   // 中奖结果信息
// 关掉抽奖弹窗
function linkToH5() {
    // window.location.href = "https://legotrademark.chic-mkt.com/index?open_id=oVw8JtxOQq2_pdoxJPzesjzvTn84#/"; // 可能要做openid的拼接
    window.location.href = "https://news.lego.cn/legotrademark"; // 可能要做openid的拼接
}

// debug
// 清除用户抽奖信息
const clearDrawInfo = async () => {
    return; // 关闭清除用户抽奖信息功能
    console.log("清除用户信息中..")
    const res = await clearDrawInfoAPI({ user_id: userInfo.value.user_id })
    console.log(res)
    if (res.data.errcode == 0) {
        console.log("清除成功")
        // luckyDrawInfo.value = "个人二维码"
        Toast("用户抽奖信息清除成功！")
    } else {
        Toast(res.data.errmsg)
        console.log("清除失败")
    }
}

</script>

<template>
    <div class="page-body">
        <div class="index-logo" @click="clearDrawInfo"></div>
        <div class="statement"></div>

        <!-- 起始页面 -->
        <div v-show="pageNum == 0" class="land-page">
            <div class="lego-left"></div>
            <div class="lego-top-right"></div>
            <div class="lego-right"></div>
            <div class="slogan"></div>
            <div class="btn-go" @click="goDrawPage"></div>

        </div>

        <!-- 抽奖页面 -->
        <div v-show="pageNum == 1" class="draw-page">
            <div class="lego-left"></div>
            <div class="lego-right"></div>
            <div class="slogan"></div>
            <div class="tips"></div>
            <div class="draw-container">
                <div class="select-container">
                    <div class="num1" :style="{opacity: selectBackground[0]}"></div>
                    <div class="num2" :style="{opacity: selectBackground[1]}"></div>
                    <div class="num3" :style="{opacity: selectBackground[2]}"></div>
                    <div class="num4" :style="{opacity: selectBackground[3]}"></div>
                    <div class="num5" :style="{opacity: selectBackground[4]}"></div>
                    <div class="num6" :style="{opacity: selectBackground[5]}"></div>
                    <div class="num7" :style="{opacity: selectBackground[6]}"></div>
                    <div class="num8" :style="{opacity: selectBackground[7]}"></div>
                </div>
                <div class="num-img"></div>
                <div class="go" @click="go"></div>
             
                <div class="dot-container">
                    <div class="dot-top"></div>
                    <div class="dot-right"></div>
                    <div class="dot-bottom"></div>
                    <div class="dot-left"></div>
                </div> 

            </div>
            <!-- 抽奖弹窗 -->
            <div class="result-container" v-show="isShowDrawResult" @click="clearDrawInfo">
                <!-- 中奖弹窗 -->
                 <div class="lucky-dog" v-show="isLuckyDog" @click.stop>
                    <div class="qrcode-container">
                        <div class="qrcode-area">
                            <vue-qr :text="qrCode" :size="qrCodeSize" :margin="qrCodeMargin"></vue-qr>
                        </div>
                    </div>
                 </div>
                <!-- 未中奖弹窗 -->
                 <div class="not-lucky-dog" v-show="!isLuckyDog" @click.stop>
                    <div class="navigate" @click="linkToH5"></div>
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
    background: url("https://www.mbcstyle.cn/projects/lego/2025/images/bg.jpg") top center no-repeat;
    background-size: cover;

    // logo加主题
    .index-logo {
        margin: .3rem 0 0 .3rem;
        width: 1.7133rem;
        height: .64rem;
        background: url("https://www.mbcstyle.cn/projects/lego/2025/images/logo.png") top center no-repeat;
        background-size: 100% 100%;
    }

    // 免责声明
    .statement {
        position: absolute;
        bottom: .5rem;
        margin-left: 50%;
        transform: translateX(-50%);
        width: 3.96rem;
        height: .19333rem;
        background: url("https://www.mbcstyle.cn/projects/lego/2025/images/text-statement.png") top center no-repeat;
        background-size: 100% 100%;
    }

    // 首次进入页面的主页
    .land-page {
        position: absolute;
        width: 100%;
        height: 100%;

        .lego-left {
            position: absolute;
            top: 3rem;;
            width: 1.3066rem;
            height: 4.3rem;
            background: url("https://www.mbcstyle.cn/projects/lego/2025/images/index/lego-left.png") top center no-repeat;
            background-size: 100% 100%;
        }
        .lego-top-right {
            position: absolute;
            top: -.3rem;
            right: 0rem;
            width: 1.6933rem;
            height: 1.64rem;
            background: url("https://www.mbcstyle.cn/projects/lego/2025/images/index/lego-top-right.png") top center no-repeat;
            background-size: 100% 100%;

        }
        .lego-right {
            position: absolute;
            top: 4.5rem;
            right: 0rem;
            width: 1.6733rem;
            height: 1.42rem;
            background: url("https://www.mbcstyle.cn/projects/lego/2025/images/index/lego-right.png") top center no-repeat;
            background-size: 100% 100%;
        }
        .slogan {
            position: absolute;
            top: 1rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 3.0866rem;
            height: 3.9666rem;
            background: url("https://www.mbcstyle.cn/projects/lego/2025/images/index/slogan.png") top center no-repeat;
            background-size: 100% 100%;

        }
        .btn-go {
            position: absolute;
            top: 6.5rem;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 2.0666rem;
            height: .7466rem;
            background: url("https://www.mbcstyle.cn/projects/lego/2025/images/index/btn-go.png") top center no-repeat;
            background-size: 100% 100%;
        }
    }

    // 主页面的设计
    .index-page {
        position: absolute;
        width: 100%;
        height: 100%;


        .qrcode-container {

            margin-top: 55vh;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 1.6rem;

            .qrcode-title {
                line-height: .4rem;
                text-align: center;
                font-size: 10px;
                font-weight: 600;
                color: black;
            }

            .qrcode-area {
                width: 1.6rem;
                height: 1.6rem;
                background-color: white;
                display: flex;
                align-items: center;
                justify-content: center;

            }
        }

    }

    // 抽奖界面的设计
    .draw-page {
        position: absolute;
        top: 0rem;
        left: 0rem;
        width: 100%;
        height: 100%;

        .lego-left {
            position: absolute;
            top: 3rem;
            width: 1.1733rem;
            height: 3.68rem;
            background: url("https://www.mbcstyle.cn/projects/lego/2025/images/luckydraw/lego-left.png") top center no-repeat;
            background-size: 100% 100%;
        }

        .lego-right {
            position: absolute;
            top: 2.8rem;
            right: 0rem;
            width: 1.7133rem;
            height: 1.4933rem;
            background: url("https://www.mbcstyle.cn/projects/lego/2025/images/luckydraw/lego-right.png") top center no-repeat;
            background-size: 100% 100%;
        }

        .slogan {
            position: absolute;
            margin-left: 50%;
            transform: translateX(-50%);
            top: .8rem;
            width: 3.8533rem;
            height: 2.3333rem;
            background: url("https://www.mbcstyle.cn/projects/lego/2025/images/luckydraw/slogan-luckydraw.png") top center no-repeat;
            background-size: 100% 100%;
        }
        
        .tips {
            position:absolute;
            margin-left: 50%;
            transform: translateX(-50%);
            top: 42vh;
            width: 2.4733rem;
            height: .6066rem;
            background: url("https://www.mbcstyle.cn/projects/lego/2025/images/luckydraw/tips.png") top center no-repeat;
            background-size: 100% 100%;

        }

        .draw-container {
            position: relative;
            margin-top: 50vh;
            margin-left: 50%;
            transform: translateX(-50%);
            width: 2.8666rem;
            height: 2.8866rem;
            background: url("https://www.mbcstyle.cn/projects/lego/2025/images/luckydraw/panel-luckydraw.png") top center no-repeat;
            background-size: 100% 100%;
            display: flex;
            align-items: center;
            justify-content: center;

            .num-img {
                position: absolute;
                width: 1.66rem;
                height: 1.7133rem;
                background: url("https://www.mbcstyle.cn/projects/lego/2025/images/luckydraw/num-img.png") top center no-repeat; 
                background-size: 100% 100%;
            }

            .select-container {
                position: absolute;
                width: 100%;
                height: 100%;
                .num1 {
                    position: absolute;
                    top: .38rem;
                    left: .35rem;
                    width: .6933rem;
                    height: .6933rem;
                    background: url("https://www.mbcstyle.cn/projects/lego/2025/images/luckydraw/selected.png") top center no-repeat;
                    background-size: 100% 100%;
                }
                .num2 {
                    position: absolute;
                    top: .38rem;
                    left: 1.09rem;
                    width: .6933rem;
                    height: .6933rem;
                    background: url("https://www.mbcstyle.cn/projects/lego/2025/images/luckydraw/selected.png") top center no-repeat;
                    background-size: 100% 100%;
                }
                .num3 {
                    position: absolute;
                    top: .38rem;
                    left: 1.84rem;
                    width: .6933rem;
                    height: .6933rem;
                    background: url("https://www.mbcstyle.cn/projects/lego/2025/images/luckydraw/selected.png") top center no-repeat;
                    background-size: 100% 100%;
                }
                .num8 {
                    position: absolute;
                    top: 1.11rem;
                    left: .35rem;
                    width: .6933rem;
                    height: .6933rem;
                    background: url("https://www.mbcstyle.cn/projects/lego/2025/images/luckydraw/selected.png") top center no-repeat;
                    background-size: 100% 100%;
                }
                .num4 {
                    position: absolute;
                    top: 1.11rem;
                    left: 1.84rem;
                    width: .6933rem;
                    height: .6933rem;
                    background: url("https://www.mbcstyle.cn/projects/lego/2025/images/luckydraw/selected.png") top center no-repeat;
                    background-size: 100% 100%;
                }
                .num7 {
                    position: absolute;
                    top: 1.85rem;
                    left: .35rem;
                    width: .6933rem;
                    height: .6933rem;
                    background: url("https://www.mbcstyle.cn/projects/lego/2025/images/luckydraw/selected.png") top center no-repeat;
                    background-size: 100% 100%;
                }
                .num6 {
                    position: absolute;
                    top: 1.85rem;
                    left: 1.09rem;
                    width: .6933rem;
                    height: .6933rem;
                    background: url("https://www.mbcstyle.cn/projects/lego/2025/images/luckydraw/selected.png") top center no-repeat;
                    background-size: 100% 100%;
                }
                .num5 {
                    position: absolute;
                    top: 1.85rem;
                    left: 1.84rem;
                    width: .6933rem;
                    height: .6933rem;
                    background: url("https://www.mbcstyle.cn/projects/lego/2025/images/luckydraw/selected.png") top center no-repeat;
                    background-size: 100% 100%;
                }
            }
            .go {
                position: absolute;
                top: 1.11rem;
                left: 1.09rem;
                width: .6933rem;
                height: .6933rem;
                // background-color: pink;
            }

        }

        // 抽奖结果容器
        .result-container {
            position: absolute;
            top: 0rem;
            left: 0rem;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, .7);    // 注意，不能用opacity，会影响到子元素也有透明度的

            // 中奖弹窗
            .lucky-dog {
                position: absolute;
                top: 40vh;
                margin-left: 50%;
                transform: translateX(-50%);
                width: 3.9066rem;
                height: 3.2933rem;
                background: url("https://www.mbcstyle.cn/projects/lego/2025/images/luckydraw/window-success.png") top center no-repeat;
                background-size: 100% 100%;
               
                .qrcode-container {
                    margin-top: 1.2rem;
                    margin-left: 50%;
                    transform: translateX(-50%);
                    width: 1.5rem;
                    background-color: black;

                    .qrcode-area {
                        width: 1.5rem;
                        height: 1.5rem;
                        background-color: white;
                        opacity: 1;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                }
            }

            // 未中奖弹窗
            .not-lucky-dog {
                position: absolute;
                top: 40vh;
                margin-left: 50%;
                transform: translateX(-50%);
                width: 3.9066rem;
                height: 3.2933rem;
                background: url("https://www.mbcstyle.cn/projects/lego/2025/images/luckydraw/window-default.png") top center no-repeat;
                background-size: 100% 100%;
                .navigate {
                    position: absolute;
                    top: 2.25rem;
                    margin-left: 50%;
                    transform: translateX(-50%);
                    width: 2.1rem;
                    height: .8rem;
                }
            }
        }




    }
}
</style>
