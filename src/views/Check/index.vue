<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { wechatScan } from '@/utils/wechatLibrary';
import { getLuckyNumAPI, checkPrizeAPI } from '@/apis/user'
import { Toast } from 'vant'
// 定义页面
const pageNum = ref(0)

// 扫描结果控制
const checkNum = ref(0) // 核销人数
const isCorrect = ref(false)    // 是否核销成功
const checkPrizeData = async (data) => {
    console.log("data:", data)
    const res = await checkPrizeAPI(data)
    console.log("获取到校验二维码的数据: ", res)
    if (0 == res.data.errcode) {
        checkNum.value = res.data.data.check_num
        pageNum.value = 1
        isCorrect.value = res.data.data.check_status
        if (!res.data.data.check_status){
            Toast(res.data.data.check_status_msg);
        }
    }
}

async function scanQrCode() {
    console.log("调起扫描")
    const res = await wechatScan(checkPrizeData)
    // if (0 == res.errcode) {
    //     pageNum.value = 1
    //     console.log(res.result)
    // } else {
    //     console.log(res.errmsg)
    // }
    console.log("扫描动作完成")
}

// 回到主页
function backIndex() {
    isCorrect.value = false
    pageNum.value = 0
}

// 获取已核销的中奖人数
const getLuckyNum = async () => {
    const res = await getLuckyNumAPI();
    console.log(res);
    if (res.data.errcode == 0){
        checkNum.value = res.data.data.lucky_num
    }
}
onMounted(() => getLuckyNum())

</script>

<template>
    <div class="page-body">
        <!-- 通用内容 -->
        <div class="index-logo"></div>
        <div class="statement"></div>
        <div class="lego-left"></div>
        <div class="lego-right"></div>
        <div class="slogan"></div>
        <!-- 扫描主界面 -->
        <div class="check-index" v-show="pageNum == 0">
            <div class="scan-container">
                <div class="scan-icon" @click="scanQrCode()"></div>
                <div class="scan-btn" @click="scanQrCode()"></div>
                <div class="check-num">{{ checkNum }}</div>
            </div>
        </div>
        <!-- 扫描结果页面 -->
        <div class="check-result" v-show="pageNum == 1">
            <!-- 中奖界面 -->
            <div class="status-correct" v-show="isCorrect">
                <div class="icon-bg" @click="backIndex">
                    <div class="icon"></div>
                </div>
                <div class="index-btn" @click="backIndex"></div>
            </div>
            <!-- 未中奖界面 -->
            <div class="status-error" v-show="!isCorrect">
                <div class="icon-bg"  @click="backIndex">
                    <div class="icon"></div>
                </div>
                <div class="index-btn" @click="backIndex"></div>
            </div>

        </div>
    </div>
</template>

<style lang="scss" scoped>
.page-body {
    // 通用页面
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

    // 调起扫码页面
    .check-index {
        .scan-container {
            margin-top: 4rem;
            margin-left: 50%;
            transform: translateX(-50%);

            width: 3.2rem;
            height: 3.6rem;
            // background-color: pink;

            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;

            .scan-icon {
                width: 2.04rem;
                height: 2.04rem;
                background: url("https://www.mbcstyle.cn/projects/lego/2025/images/check/icon-scan.png") top center no-repeat;
                background-size: 100% 100%;
            }

            .scan-btn {
                width: 2.0666rem;
                height: .7466rem;
                background: url("https://www.mbcstyle.cn/projects/lego/2025/images/check/btn-scan.png") top center no-repeat;
                background-size: 100% 100%;
            }
            .check-num {
                position: relative;
                // background-color: blue;
                width: 2.1rem;
                height: .4rem;
                padding-left: 1.55rem;
                text-align: left;
                line-height: .4rem;
                font-size: .24rem;
                font-weight: 700;
                color: #762a54;
            }
            .check-num::before {
                content: '';
                position: absolute;
                top: 50%;
                left: .2rem;
                transform: translateY(-50%);
                width: 1.2666rem;
                height: .2466rem;
                background: url("https://www.mbcstyle.cn/projects/lego/2025/images/check/check-num-none.png") top center no-repeat;
                background-size: 100% 100%;
            }
        }
    }

    // 扫码结果页面
    .check-result {
        margin-top: 4rem;
        margin-left: 50%;
        transform: translateX(-50%);
        width: 3.2rem;
        height: 2.5rem;
        // background-color: pink;

        // 核销成功
        .status-correct {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;

            .icon-bg {
                width: 1.6333rem;
                height: 1.6333rem;
                background: url("https://www.mbcstyle.cn/projects/lego/2025/images/check/bg-result.png") center no-repeat;
                background-size: 100% 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                .icon {
                    width: .6rem;
                    height: .4rem;
                    background: url("https://www.mbcstyle.cn/projects/lego/2025/images/check/icon-correct.png") top center no-repeat;
                    background-size: 100% 100%;
                }
            }
            .index-btn {
                width: 2.7066rem;
                height: .5866rem;
                background: url("https://www.mbcstyle.cn/projects/lego/2025/images/check/btn-success.png") top center no-repeat;
                background-size: 100% 100%;
            }
        }

        // 核销成功
        .status-error {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;

            .icon-bg {
                width: 1.6333rem;
                height: 1.6333rem;
                background: url("https://www.mbcstyle.cn/projects/lego/2025/images/check/bg-result.png") center no-repeat;
                background-size: 100% 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                .icon {
                    width: .6666rem;
                    height: .6666rem;
                    background: url("https://www.mbcstyle.cn/projects/lego/2025/images/check/icon-error.png") top center no-repeat;
                    background-size: 100% 100%;
                }
            }
            .index-btn {
                width: 2.7066rem;
                height: .5866rem;
                background: url("https://www.mbcstyle.cn/projects/lego/2025/images/check/btn-error.png") top center no-repeat;
                background-size: 100% 100%;
            }
        }
    }
}
</style>