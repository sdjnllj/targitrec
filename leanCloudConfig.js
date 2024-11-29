// LeanCloud 配置
const AV = window.AV;

// 初始化 LeanCloud
AV.init({
    appId: "pUV7zexUF7FMVZrUhnEwmkFo-gzGzoHsz",
    appKey: "8IQVvCjUNLlDftwJToOq07cF",
    serverURL: "https://puv7zexu.lc-cn-n1-shared.com",
    masterKey: "8Wr851JwP5mnK91sT2MfHicK"
});

// 设置使用 masterKey
AV._config.useMasterKey = true;

// 配置 REST API 请求头
AV._config.disableCurrentUser = true;

// 导出需要的对象和类
export const db = AV;
export const Goal = AV.Object.extend('Goal');
export const Completion = AV.Object.extend('Completion');
