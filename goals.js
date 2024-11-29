// 存储目标的数组
let goals = JSON.parse(localStorage.getItem('goals') || '[]');

// 添加新目标
function addGoal(content) {
    const goal = {
        id: Date.now(),
        content: content,
        date: new Date().toLocaleDateString(),
        completed: false
    };
    goals.push(goal);
    saveGoals();
    displayGoals();
}

// 保存目标到localStorage
function saveGoals() {
    localStorage.setItem('goals', JSON.stringify(goals));
}

// 显示所有目标
function displayGoals() {
    const goalsList = document.getElementById('goals-list');
    goalsList.innerHTML = '';
    
    if (goals.length === 0) {
        goalsList.innerHTML = '<div class="empty-state">还没有添加任何目标哦！</div>';
        return;
    }
    
    goals.forEach(goal => {
        const goalElement = document.createElement('div');
        goalElement.className = 'goal-item';
        goalElement.innerHTML = `
            <div class="goal-content ${goal.completed ? 'completed' : ''}" onclick="viewGoalDetail(${goal.id})">
                <span>${goal.content}</span>
                <small>设定日期: ${goal.date}</small>
            </div>
            <div class="goal-actions">
                <button onclick="toggleGoal(${goal.id})">${goal.completed ? '取消完成' : '完成'}</button>
                <button onclick="deleteGoal(${goal.id})">删除</button>
            </div>
        `;
        goalsList.appendChild(goalElement);
    });
}

// 查看目标详情
function viewGoalDetail(id) {
    window.location.href = `goal-detail.html?id=${id}`;
}

// 切换目标完成状态
function toggleGoal(id) {
    const goal = goals.find(g => g.id === id);
    if (goal) {
        goal.completed = !goal.completed;
        saveGoals();
        displayGoals();
    }
}

// 删除目标
function deleteGoal(id) {
    if (confirm('确定要删除这个目标吗？')) {
        goals = goals.filter(g => g.id !== id);
        saveGoals();
        displayGoals();
    }
}

// 页面加载时显示目标
document.addEventListener('DOMContentLoaded', () => {
    displayGoals();
    
    // 添加新目标的表单提交处理
    const goalForm = document.getElementById('goal-form');
    goalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const goalInput = document.getElementById('goal-input');
        const content = goalInput.value.trim();
        
        if (content) {
            addGoal(content);
            goalInput.value = '';
        }
    });
});
