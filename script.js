// ... 前面的代码保持不变 ...

// 修改初始化加载部分
async function initializeApp() {
    try {
        console.log('开始初始化应用...');
        // 确保 LeanCloud 已经初始化
        await new Promise(resolve => setTimeout(resolve, 1000)); // 给 LeanCloud SDK 一点初始化时间
        console.log('开始加载目标...');
        await loadGoals();
        console.log('目标加载完成');
    } catch (error) {
        console.error('初始化失败:', error);
        showError('应用初始化失败，请刷新页面重试');
    }
}

// 修改加载目标列表函数，添加更多日志
async function loadGoals() {
    try {
        console.log('正在查询目标...');
        const query = new db.Query('Goal');
        const goals = await query.find();
        console.log('查询到的目标:', goals);
        
        goalsContainer.innerHTML = '';
        
        if (goals.length === 0) {
            console.log('没有找到任何目标');
            goalsContainer.innerHTML = '<div class="no-goals">还没有添加任何目标</div>';
            return;
        }
        
        goals.forEach(goal => {
            const goalElement = createGoalElement(goal);
            goalsContainer.appendChild(goalElement);
        });
        console.log('目标列表渲染完成');
    } catch (error) {
        console.error('加载目标失败:', error);
        showError('加载目标失败，请重试');
    }
}

// 修改初始化调用
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM加载完成，开始初始化...');
    initializeApp();
});

// ... 其他代码保持不变 ... 