// 获取URL参数中的目标ID
const urlParams = new URLSearchParams(window.location.search);
const goalId = urlParams.get('id');

// 当前显示的日期
let currentDate = new Date();

// 从localStorage获取目标数据
function getGoalData() {
    const goals = JSON.parse(localStorage.getItem('goals') || '[]');
    return goals.find(g => g.id === parseInt(goalId));
}

// 从localStorage获取完成记录
function getCompletionData() {
    return JSON.parse(localStorage.getItem(`goal_${goalId}_completion`) || '{}');
}

// 保存完成记录
function saveCompletionData(completionData) {
    localStorage.setItem(`goal_${goalId}_completion`, JSON.stringify(completionData));
}

// 初始化页面
function initializePage() {
    const goal = getGoalData();
    if (!goal) {
        window.location.href = 'index.html';
        return;
    }
    
    document.getElementById('goal-title').textContent = goal.content;
    updateMonthView();
    updateWeekView();
}

// 切换视图
function switchView(view) {
    const monthView = document.getElementById('month-view');
    const weekView = document.getElementById('week-view');
    const buttons = document.querySelectorAll('.view-button');
    
    buttons.forEach(btn => btn.classList.remove('active'));
    if (view === 'month') {
        monthView.style.display = 'block';
        weekView.style.display = 'none';
        buttons[0].classList.add('active');
    } else {
        monthView.style.display = 'none';
        weekView.style.display = 'block';
        buttons[1].classList.add('active');
    }
}

// 更新月视图
function updateMonthView() {
    const monthGrid = document.getElementById('month-grid');
    const currentMonthText = document.getElementById('current-month');
    
    // 更新月份标题
    currentMonthText.textContent = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`;
    
    // 清空网格
    monthGrid.innerHTML = '';
    
    // 添加星期标题
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    weekdays.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day header';
        dayHeader.textContent = day;
        monthGrid.appendChild(dayHeader);
    });
    
    // 获取当月第一天和最后一天
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // 添加空白天数
    for (let i = 0; i < firstDay.getDay(); i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        monthGrid.appendChild(emptyDay);
    }
    
    // 添加日期
    const completionData = getCompletionData();
    let monthlyCompletionCount = 0;
    
    for (let date = 1; date <= lastDay.getDate(); date++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = date;
        
        const dateString = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${date}`;
        if (completionData[dateString]) {
            dayElement.classList.add('completed');
            monthlyCompletionCount++;
        }
        
        // 标记今天
        const today = new Date();
        if (date === today.getDate() && 
            currentDate.getMonth() === today.getMonth() && 
            currentDate.getFullYear() === today.getFullYear()) {
            dayElement.classList.add('today');
        }
        
        dayElement.addEventListener('click', () => toggleCompletion(dateString));
        monthGrid.appendChild(dayElement);
    }
    
    // 更新完成率
    const totalDays = lastDay.getDate();
    const completionRate = Math.round((monthlyCompletionCount / totalDays) * 100);
    document.getElementById('month-completion-rate').textContent = `${completionRate}%`;
}

// 更新周视图
function updateWeekView() {
    const weekGrid = document.getElementById('week-grid');
    const currentWeekText = document.getElementById('current-week');
    
    // 获取本周的起始日期
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    
    // 更新周标题
    const weekNumber = getWeekNumber(currentDate);
    currentWeekText.textContent = `${currentDate.getFullYear()}年第${weekNumber}周`;
    
    // 清空网格
    weekGrid.innerHTML = '';
    
    // 添加每一天
    const completionData = getCompletionData();
    let weeklyCompletionCount = 0;
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'week-day';
        
        const dateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        
        dayElement.innerHTML = `
            <div>${weekdays[i]}</div>
            <div>${date.getDate()}日</div>
        `;
        
        if (completionData[dateString]) {
            dayElement.classList.add('completed');
            weeklyCompletionCount++;
        }
        
        dayElement.addEventListener('click', () => toggleCompletion(dateString));
        weekGrid.appendChild(dayElement);
    }
    
    // 更新完成率
    const completionRate = Math.round((weeklyCompletionCount / 7) * 100);
    document.getElementById('week-completion-rate').textContent = `${completionRate}%`;
}

// 切换日期完成状态
function toggleCompletion(dateString) {
    const completionData = getCompletionData();
    completionData[dateString] = !completionData[dateString];
    saveCompletionData(completionData);
    
    updateMonthView();
    updateWeekView();
}

// 获取周数
function getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// 上个月
function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updateMonthView();
}

// 下个月
function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updateMonthView();
}

// 上周
function previousWeek() {
    currentDate.setDate(currentDate.getDate() - 7);
    updateWeekView();
}

// 下周
function nextWeek() {
    currentDate.setDate(currentDate.getDate() + 7);
    updateWeekView();
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', initializePage);
