// 全局变量
let currentView = 'week';
let currentDate = new Date();
let currentGoalId = null;

// DOM 元素
const viewButtons = {
    week: document.getElementById('weekView'),
    month: document.getElementById('monthView'),
    year: document.getElementById('yearView')
};

const viewContents = {
    week: document.getElementById('weekViewContent'),
    month: document.getElementById('monthViewContent'),
    year: document.getElementById('yearViewContent')
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 隐藏目标详情视图
    document.getElementById('goalDetail').style.display = 'none';
    
    // 添加目标表单提交事件
    document.getElementById('goalForm').addEventListener('submit', (e) => {
        e.preventDefault();
        addNewGoal();
    });

    // 返回按钮事件
    document.getElementById('backToList').addEventListener('click', showGoalsList);

    // 视图切换事件
    Object.keys(viewButtons).forEach(view => {
        viewButtons[view].classList.toggle('active', view === currentView);
        viewButtons[view].addEventListener('click', () => switchView(view));
    });

    // 导航按钮事件
    document.getElementById('prevBtn').addEventListener('click', navigatePrevious);
    document.getElementById('todayBtn').addEventListener('click', navigateToday);
    document.getElementById('nextBtn').addEventListener('click', navigateNext);

    // 功能按钮事件
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('clearBtn').addEventListener('click', clearOldData);
    document.getElementById('pinBtn').addEventListener('click', modifyPin);

    // 显示目标列表
    displayGoals();
    
    // 设置默认视图
    switchView('week');
});

// 目标管理函数
function addNewGoal() {
    const input = document.getElementById('goalInput');
    const content = input.value.trim();

    if (content) {
        const goals = getGoals();
        const newGoal = {
            id: Date.now(),
            content: content,
            createdAt: new Date().toISOString(),
            completionData: {}
        };

        goals.push(newGoal);
        saveGoals(goals);
        input.value = '';
        displayGoals();
    }
}

function getGoals() {
    return JSON.parse(localStorage.getItem('goals') || '[]');
}

function saveGoals(goals) {
    localStorage.setItem('goals', JSON.stringify(goals));
}

function displayGoals() {
    const goalsList = document.getElementById('goalsList');
    const goals = getGoals();

    if (goals.length === 0) {
        goalsList.innerHTML = '<div class="empty-state">还没有添加任何目标，开始添加吧！</div>';
        return;
    }

    goalsList.innerHTML = goals.map(goal => `
        <div class="goal-item" id="goal-${goal.id}">
            <div class="goal-content" onclick="viewGoalDetail(${goal.id})">
                <h3>${goal.content}</h3>
                <p>创建时间: ${new Date(goal.createdAt).toLocaleDateString()}</p>
            </div>
            <div class="goal-actions">
                <button onclick="editGoal(${goal.id})" class="edit-btn">编辑</button>
                <button onclick="deleteGoal(${goal.id})" class="delete-btn">删除</button>
            </div>
        </div>
    `).join('');
}

function deleteGoal(id) {
    if (confirm('确定要删除这个目标吗？')) {
        const goals = getGoals().filter(goal => goal.id !== id);
        saveGoals(goals);
        displayGoals();
    }
}

function viewGoalDetail(id) {
    // 先重置状态
    currentView = 'week';
    currentDate = new Date();
    currentGoalId = id;
    
    const goal = getGoals().find(g => g.id === id);
    
    if (goal) {
        document.getElementById('goalTitle').textContent = goal.content;
        document.getElementById('goalsList').style.display = 'none';
        document.getElementById('goalForm').style.display = 'none';
        document.getElementById('goalDetail').style.display = 'block';
        
        // 设置默认视图为周视图并更新
        Object.keys(viewButtons).forEach(view => {
            viewButtons[view].classList.toggle('active', view === 'week');
        });
        Object.keys(viewContents).forEach(v => {
            viewContents[v].style.display = v === 'week' ? 'block' : 'none';
        });
        
        updateView();
    }
}

function showGoalsList() {
    // 重置所有状态
    currentGoalId = null;
    currentView = 'week';
    currentDate = new Date();
    
    // 重置视图按钮状态
    Object.keys(viewButtons).forEach(view => {
        viewButtons[view].classList.toggle('active', view === 'week');
    });
    
    // 重置视图内容显示状态
    Object.keys(viewContents).forEach(v => {
        viewContents[v].style.display = 'none';
    });
    
    // 显示目标列表
    document.getElementById('goalDetail').style.display = 'none';
    document.getElementById('goalsList').style.display = 'block';
    document.getElementById('goalForm').style.display = 'block';
}

// 视图管理函数
function switchView(view) {
    currentView = view;
    
    Object.keys(viewButtons).forEach(v => {
        viewButtons[v].classList.remove('active');
    });
    
    viewButtons[view].classList.add('active');
    
    Object.keys(viewContents).forEach(v => {
        viewContents[v].style.display = v === view ? 'block' : 'none';
    });
    
    updateView();
}

function updateView() {
    updateDateRange();
    
    switch(currentView) {
        case 'week':
            updateWeekView();
            break;
        case 'month':
            updateMonthView();
            break;
        case 'year':
            updateYearView();
            break;
    }
    
    updateCompletionRate();
}

// 日期管理函数
function updateDateRange() {
    const dateRange = document.getElementById('dateRange');
    
    switch(currentView) {
        case 'week':
            const weekStart = getWeekStart(currentDate);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            dateRange.textContent = `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
            break;
        case 'month':
            dateRange.textContent = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`;
            break;
        case 'year':
            dateRange.textContent = `${currentDate.getFullYear()}年`;
            break;
    }
}

function updateWeekView() {
    const tbody = document.getElementById('weekTableBody');
    tbody.innerHTML = '';
    
    const weekStart = getWeekStart(currentDate);
    const goal = getGoals().find(g => g.id === currentGoalId);
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        const dateString = formatDate(date);
        const weekDay = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][date.getDay()];
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${dateString}</td>
            <td>${weekDay}</td>
            <td style="text-align: center">
                <div class="custom-checkbox ${goal?.completionData[dateString] ? 'checked' : ''}"
                     onclick="toggleCompletion('${dateString}')"></div>
            </td>
        `;
        tbody.appendChild(row);
    }
    
    // 更新完成率
    if (goal) {
        const dates = Object.keys(goal.completionData);
        const completedDates = dates.filter(date => goal.completionData[date]);
        const rate = dates.length > 0 ? Math.round((completedDates.length / dates.length) * 100) : 0;
        document.getElementById('completionRate').textContent = `${rate}%`;
    }
}

function updateMonthView() {
    const grid = document.getElementById('monthGrid');
    grid.innerHTML = '';
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const goal = getGoals().find(g => g.id === currentGoalId);
    
    // 添加空白天数
    for (let i = 0; i < firstDay.getDay(); i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        grid.appendChild(emptyDay);
    }
    
    // 添加日期
    for (let date = 1; date <= lastDay.getDate(); date++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        const currentDateString = formatDate(new Date(year, month, date));
        const isToday = isCurrentDate(new Date(year, month, date));
        
        if (isToday) {
            dayElement.classList.add('today');
        }
        
        dayElement.innerHTML = `
            ${date}
            <div class="custom-checkbox ${goal?.completionData[currentDateString] ? 'checked' : ''}"
                 onclick="toggleCompletion('${currentDateString}')"></div>
        `;
        
        grid.appendChild(dayElement);
    }
}

function updateYearView() {
    const grid = document.getElementById('yearGrid');
    grid.innerHTML = '';
    
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const goal = getGoals().find(g => g.id === currentGoalId);
    
    // 创建年份标题
    const yearTitle = document.createElement('div');
    yearTitle.textContent = `${currentYear}年`;
    yearTitle.style.fontSize = '16px';
    yearTitle.style.margin = '20px 0';
    yearTitle.style.textAlign = 'center';
    grid.appendChild(yearTitle);
    
    // 创建月份网格容器
    const monthsContainer = document.createElement('div');
    monthsContainer.className = 'months-grid';
    
    for (let month = 0; month < 12; month++) {
        const monthData = calculateMonthCompletion(currentYear, month, goal?.completionData || {});
        const monthCard = document.createElement('div');
        monthCard.className = `month-card ${month === currentMonth ? 'current' : ''}`;
        
        monthCard.innerHTML = `
            <div class="month-title">${month + 1}月</div>
            <div class="month-stats">
                <div>完成率: ${monthData.rate}%</div>
                <div>完成: ${monthData.completed}/${monthData.total}天</div>
            </div>
        `;
        
        monthsContainer.appendChild(monthCard);
    }
    
    grid.appendChild(monthsContainer);
    
    // 更新统计信息
    if (goal) {
        const dates = Object.keys(goal.completionData);
        const completedDates = dates.filter(date => goal.completionData[date]);
        const rate = dates.length > 0 ? Math.round((completedDates.length / dates.length) * 100) : 0;
        
        const statsSection = document.querySelector('.stats-section');
        statsSection.className = 'stats-section';  
        
        statsSection.innerHTML = `
            <h3>统计信息</h3>
            <div>总完成率：${rate}%</div>
        `;
    }
}

// 数据处理函数
function toggleCompletion(dateString) {
    const goals = getGoals();
    const goal = goals.find(g => g.id === currentGoalId);
    
    if (goal) {
        goal.completionData = goal.completionData || {};
        goal.completionData[dateString] = !goal.completionData[dateString];
        saveGoals(goals);
        updateView();
    }
}

function calculateMonthCompletion(year, month, completionData) {
    const lastDay = new Date(year, month + 1, 0).getDate();
    let completed = 0;
    
    for (let date = 1; date <= lastDay; date++) {
        const dateString = formatDate(new Date(year, month, date));
        if (completionData[dateString]) {
            completed++;
        }
    }
    
    return {
        completed,
        total: lastDay,
        rate: Math.round((completed / lastDay) * 100)
    };
}

function updateCompletionRate() {
    const goal = getGoals().find(g => g.id === currentGoalId);
    if (!goal) return;

    const completionData = goal.completionData || {};
    const dates = Object.keys(completionData);
    const completedDates = dates.filter(date => completionData[date]);
    const rate = dates.length > 0 ? Math.round((completedDates.length / dates.length) * 100) : 0;
    
    document.getElementById('completionRate').textContent = `${rate}%`;
}

// 导航函数
function navigatePrevious() {
    switch(currentView) {
        case 'week':
            currentDate.setDate(currentDate.getDate() - 7);
            break;
        case 'month':
            currentDate.setMonth(currentDate.getMonth() - 1);
            break;
        case 'year':
            currentDate.setFullYear(currentDate.getFullYear() - 1);
            break;
    }
    updateView();
}

function navigateNext() {
    switch(currentView) {
        case 'week':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
        case 'month':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        case 'year':
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
    }
    updateView();
}

function navigateToday() {
    currentDate = new Date();
    updateView();
}

// 辅助函数
function getWeekStart(date) {
    const result = new Date(date);
    result.setDate(result.getDate() - result.getDay());
    return result;
}

function formatDate(date) {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

function isCurrentDate(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

// 功能按钮函数
function exportData() {
    const data = {
        goals: getGoals(),
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `goals-data-${formatDate(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function clearOldData() {
    if (confirm('确定要清除所有旧数据吗？此操作不可恢复！')) {
        localStorage.removeItem('goals');
        showGoalsList();
        displayGoals();
    }
}

function modifyPin() {
    const currentPin = localStorage.getItem('pin');
    
    if (!currentPin) {
        const newPin = prompt('请设置新的PIN码：');
        if (newPin) {
            localStorage.setItem('pin', newPin);
            alert('PIN码设置成功！');
        }
    } else {
        const inputPin = prompt('请输入当前PIN码：');
        if (inputPin === currentPin) {
            const newPin = prompt('请设置新的PIN码：');
            if (newPin) {
                localStorage.setItem('pin', newPin);
                alert('PIN码修改成功！');
            }
        } else {
            alert('PIN码错误！');
        }
    }
}

function editGoal(id) {
    const goalElement = document.getElementById(`goal-${id}`);
    const goal = getGoals().find(g => g.id === id);
    
    if (!goal || !goalElement) return;
    
    // 阻止点击事件冒泡，避免触发 viewGoalDetail
    const originalContent = goalElement.innerHTML;
    
    goalElement.innerHTML = `
        <div class="goal-edit-form">
            <input type="text" class="goal-edit-input" value="${goal.content}">
            <div class="goal-actions">
                <button onclick="saveGoalEdit(${id})" class="edit-btn">保存</button>
                <button onclick="cancelGoalEdit(${id}, '${encodeURIComponent(originalContent)}')" class="delete-btn">取消</button>
            </div>
        </div>
    `;
    
    // 自动聚焦输入框
    const input = goalElement.querySelector('.goal-edit-input');
    input.focus();
    input.select();
    
    // 添加回车保存功能
    input.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            saveGoalEdit(id);
        } else if (e.key === 'Escape') {
            cancelGoalEdit(id, encodeURIComponent(originalContent));
        }
    });
}

function saveGoalEdit(id) {
    const goalElement = document.getElementById(`goal-${id}`);
    const input = goalElement.querySelector('.goal-edit-input');
    const newContent = input.value.trim();
    
    if (!newContent) {
        alert('目标内容不能为空！');
        return;
    }
    
    const goals = getGoals();
    const goalIndex = goals.findIndex(g => g.id === id);
    
    if (goalIndex !== -1) {
        goals[goalIndex].content = newContent;
        saveGoals(goals);
        displayGoals();
    }
}

function cancelGoalEdit(id, originalContent) {
    const goalElement = document.getElementById(`goal-${id}`);
    goalElement.innerHTML = decodeURIComponent(originalContent);
}
