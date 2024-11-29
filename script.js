import { db } from './firebaseConfig.js';
import { 
    collection, 
    addDoc, 
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

// 全局变量
let currentGoalId = null;

// 获取目标列表
async function getGoals() {
    try {
        const querySnapshot = await getDocs(collection(db, 'goals'));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('获取目标列表时出错:', error);
        showError('获取目标列表失败，请检查网络连接后重试。');
        return [];
    }
}

// 显示错误信息
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(errorDiv);
        }, 500);
    }, 3000);
}

// 添加目标
async function addGoal(content) {
    try {
        const docRef = await addDoc(collection(db, 'goals'), {
            content: content,
            createdAt: serverTimestamp(),
            completionData: {}
        });
        return docRef.id;
    } catch (error) {
        console.error('添加目标时出错:', error);
        showError('添加目标失败，请检查网络连接后重试。');
        return null;
    }
}

// 更新目标
async function updateGoal(id, goalData) {
    try {
        const goalRef = doc(db, 'goals', id);
        await updateDoc(goalRef, goalData);
        return true;
    } catch (error) {
        console.error('更新目标时出错:', error);
        showError('更新目标失败，请检查网络连接后重试。');
        return false;
    }
}

// 删除目标
async function deleteGoal(id) {
    try {
        await deleteDoc(doc(db, 'goals', id));
        return true;
    } catch (error) {
        console.error('删除目标时出错:', error);
        showError('删除目标失败，请检查网络连接后重试。');
        return false;
    }
}

// 更新目标列表视图
async function updateGoalsList(goals) {
    try {
        const goalsList = document.getElementById('goalsList');
        const goalsContainer = document.getElementById('goalsContainer');
        
        if (!goalsList || !goalsContainer) {
            console.error('找不到目标列表容器');
            return;
        }

        // 清空现有内容
        goalsContainer.innerHTML = '';

        if (!goals || goals.length === 0) {
            goalsContainer.innerHTML = '<p>还没有添加任何目标</p>';
            return;
        }

        // 创建目标列表
        goals.forEach(goal => {
            const goalElement = document.createElement('div');
            goalElement.className = 'goal-item';
            
            const goalContent = document.createElement('div');
            goalContent.className = 'goal-content';
            goalContent.textContent = goal.content;
            goalContent.onclick = () => showGoalDetail(goal.id);
            
            const goalActions = document.createElement('div');
            goalActions.className = 'goal-actions';
            
            const editButton = document.createElement('button');
            editButton.textContent = '编辑';
            editButton.onclick = () => editGoal(goal.id);
            
            const deleteButton = document.createElement('button');
            deleteButton.textContent = '删除';
            deleteButton.onclick = () => deleteGoalHandler(goal.id);
            
            goalActions.appendChild(editButton);
            goalActions.appendChild(deleteButton);
            
            goalElement.appendChild(goalContent);
            goalElement.appendChild(goalActions);
            
            goalsContainer.appendChild(goalElement);
        });
    } catch (error) {
        console.error('更新目标列表时出错:', error);
        showError('更新目标列表失败，请稍后重试');
    }
}

// 显示目标详情
async function showGoalDetail(id) {
    try {
        if (!id) {
            console.error('无效的目标ID');
            return;
        }
        
        currentGoalId = id;
        const goals = await getGoals();
        const goal = goals.find(g => g.id === id);
        
        if (!goal) {
            console.error('未找到目标:', id);
            return;
        }

        const detailTitle = document.getElementById('detailTitle');
        const goalsList = document.getElementById('goalsList');
        const goalDetail = document.getElementById('goalDetail');

        if (!detailTitle || !goalsList || !goalDetail) {
            console.error('找不到必要的DOM元素');
            return;
        }

        detailTitle.textContent = goal.content || '未命名目标';
        goalsList.style.display = 'none';
        goalDetail.style.display = 'block';

        // 确保视图按钮存在
        const weekViewBtn = document.getElementById('weekViewBtn');
        const monthViewBtn = document.getElementById('monthViewBtn');
        const yearViewBtn = document.getElementById('yearViewBtn');

        if (!weekViewBtn || !monthViewBtn || !yearViewBtn) {
            console.error('找不到视图切换按钮');
            return;
        }

        // 默认显示周视图
        switchView('week');
    } catch (error) {
        console.error('显示目标详情时出错:', error);
        showError('显示目标详情失败，请稍后重试');
    }
}

// 切换完成状态
async function toggleCompletion(dateString) {
    try {
        if (!currentGoalId) {
            showError('请先选择一个目标');
            return;
        }

        const goals = await getGoals();
        const goalIndex = goals.findIndex(g => g.id === currentGoalId);
        if (goalIndex === -1) {
            showError('目标不存在');
            return;
        }

        const goal = goals[goalIndex];
        goal.completionData = goal.completionData || {};
        goal.completionData[dateString] = !goal.completionData[dateString];

        // 更新 Firebase
        const goalRef = doc(db, 'goals', currentGoalId);
        await updateDoc(goalRef, {
            completionData: goal.completionData
        });

        // 更新界面
        const currentView = document.getElementById('monthView').style.display === 'none' ? 'week' : 'month';
        if (currentView === 'week') {
            updateWeekView();
        } else {
            updateMonthView();
        }

    } catch (error) {
        console.error('切换完成状态时出错:', error);
        showError('更新完成状态失败，请稍后重试');
    }
}

// 编辑目标
async function editGoal(id) {
    const goals = await getGoals();
    const goal = goals.find(g => g.id === id);
    if (goal) {
        const newContent = prompt('编辑目标：', goal.content);
        if (newContent && newContent !== goal.content) {
            goal.content = newContent;
            if (await updateGoal(id, goal)) {
                const updatedGoals = await getGoals();
                updateGoalsList(updatedGoals);
            }
        }
    }
}

// 显示目标列表
function showGoalsList() {
    document.getElementById('goalDetail').style.display = 'none';
    document.getElementById('goalsList').style.display = 'block';
}

// 切换视图
function switchView(view) {
    console.log('切换视图到:', view);
    const weekView = document.getElementById('weekView');
    const monthView = document.getElementById('monthView');
    const yearView = document.getElementById('yearView');
    const weekViewBtn = document.getElementById('weekViewBtn');
    const monthViewBtn = document.getElementById('monthViewBtn');
    const yearViewBtn = document.getElementById('yearViewBtn');

    if (!weekView || !monthView || !yearView || !weekViewBtn || !monthViewBtn || !yearViewBtn) {
        console.error('找不到视图元素');
        return;
    }

    // 隐藏所有视图
    weekView.style.display = 'none';
    monthView.style.display = 'none';
    yearView.style.display = 'none';
    
    // 移除所有按钮的激活状态
    weekViewBtn.classList.remove('active');
    monthViewBtn.classList.remove('active');
    yearViewBtn.classList.remove('active');

    // 显示选中的视图
    switch (view) {
        case 'week':
            weekView.style.display = 'block';
            weekViewBtn.classList.add('active');
            updateWeekView();
            break;
        case 'month':
            monthView.style.display = 'block';
            monthViewBtn.classList.add('active');
            updateMonthView();
            break;
        case 'year':
            yearView.style.display = 'block';
            yearViewBtn.classList.add('active');
            updateYearView();
            break;
    }
}

// 更新周视图
function updateWeekView() {
    try {
        const weekViewData = document.getElementById('weekViewData');
        if (!weekViewData) {
            console.error('找不到周视图数据容器');
            return;
        }

        weekViewData.innerHTML = '';
        
        // 生成最近7天的数据
        const dates = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            dates.push(date);
        }

        // 获取当前目标
        getGoals().then(goals => {
            const goal = goals.find(g => g.id === currentGoalId);
            if (!goal) {
                console.error('找不到当前目标');
                return;
            }

            // 确保 completionData 存在
            goal.completionData = goal.completionData || {};
            
            // 创建表格行
            dates.forEach(date => {
                const dateString = date.toISOString().split('T')[0];
                const weekDay = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
                const tr = document.createElement('tr');
                
                // 日期单元格
                const dateCell = document.createElement('td');
                dateCell.textContent = dateString;
                tr.appendChild(dateCell);
                
                // 星期单元格
                const weekDayCell = document.createElement('td');
                weekDayCell.textContent = `星期${weekDay}`;
                tr.appendChild(weekDayCell);
                
                // 完成状态单元格
                const statusCell = document.createElement('td');
                const isCompleted = goal.completionData[dateString] || false;
                
                const button = document.createElement('button');
                button.className = isCompleted ? 'completed' : 'not-completed';
                button.textContent = isCompleted ? '✓' : '✗';
                button.onclick = () => toggleCompletion(dateString);
                
                statusCell.appendChild(button);
                tr.appendChild(statusCell);
                
                weekViewData.appendChild(tr);
            });
        }).catch(error => {
            console.error('获取目标数据时出错:', error);
            showError('获取目标数据失败，请稍后重试');
        });
    } catch (error) {
        console.error('更新周视图时出错:', error);
        showError('更新周视图失败，请稍后重试');
    }
}

// 更新月视图
function updateMonthView() {
    try {
        const monthViewData = document.getElementById('monthViewData');
        if (!monthViewData) {
            console.error('找不到月视图数据容器');
            return;
        }

        monthViewData.innerHTML = '';
        
        // 生成最近30天的数据
        const dates = [];
        const today = new Date();
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            dates.push(date);
        }

        // 获取当前目标
        getGoals().then(goals => {
            const goal = goals.find(g => g.id === currentGoalId);
            if (!goal) {
                console.error('找不到当前目标');
                return;
            }

            // 确保 completionData 存在
            goal.completionData = goal.completionData || {};
            
            // 创建表格行
            dates.forEach(date => {
                const dateString = date.toISOString().split('T')[0];
                const weekDay = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
                const tr = document.createElement('tr');
                
                // 日期单元格
                const dateCell = document.createElement('td');
                dateCell.textContent = dateString;
                tr.appendChild(dateCell);
                
                // 星期单元格
                const weekDayCell = document.createElement('td');
                weekDayCell.textContent = `星期${weekDay}`;
                tr.appendChild(weekDayCell);
                
                // 完成状态单元格
                const statusCell = document.createElement('td');
                const isCompleted = goal.completionData[dateString] || false;
                
                const button = document.createElement('button');
                button.className = isCompleted ? 'completed' : 'not-completed';
                button.textContent = isCompleted ? '✓' : '✗';
                button.onclick = () => toggleCompletion(dateString);
                
                statusCell.appendChild(button);
                tr.appendChild(statusCell);
                
                monthViewData.appendChild(tr);
            });
        }).catch(error => {
            console.error('获取目标数据时出错:', error);
            showError('获取目标数据失败，请稍后重试');
        });
    } catch (error) {
        console.error('更新月视图时出错:', error);
        showError('更新月视图失败，请稍后重试');
    }
}

// 更新年视图
function updateYearView() {
    try {
        const yearViewData = document.getElementById('yearViewData');
        if (!yearViewData) {
            console.error('找不到年视图数据容器');
            return;
        }

        yearViewData.innerHTML = '';
        
        // 获取当前目标
        getGoals().then(goals => {
            const goal = goals.find(g => g.id === currentGoalId);
            if (!goal) {
                console.error('找不到当前目标');
                return;
            }

            // 确保 completionData 存在
            goal.completionData = goal.completionData || {};
            
            // 生成12个月的卡片
            const months = [];
            const today = new Date();
            const currentYear = today.getFullYear();
            
            for (let month = 0; month < 12; month++) {
                const monthCard = document.createElement('div');
                monthCard.className = 'month-card';
                
                // 月份标题
                const monthTitle = document.createElement('h4');
                monthTitle.textContent = `${month + 1}月`;
                monthCard.appendChild(monthTitle);
                
                // 天数网格
                const monthDays = document.createElement('div');
                monthDays.className = 'month-days';
                
                // 获取该月的第一天
                const firstDay = new Date(currentYear, month, 1);
                const lastDay = new Date(currentYear, month + 1, 0);
                
                // 添加空白单元格直到第一天
                for (let i = 0; i < firstDay.getDay(); i++) {
                    const emptyCell = document.createElement('div');
                    emptyCell.className = 'day-cell empty';
                    monthDays.appendChild(emptyCell);
                }
                
                // 添加天数单元格
                for (let day = 1; day <= lastDay.getDate(); day++) {
                    const date = new Date(currentYear, month, day);
                    const dateString = date.toISOString().split('T')[0];
                    
                    const dayCell = document.createElement('div');
                    dayCell.className = 'day-cell';
                    dayCell.textContent = day;
                    
                    // 如果日期在今天之后，添加empty类
                    if (date > today) {
                        dayCell.className += ' empty';
                    } else {
                        const isCompleted = goal.completionData[dateString] || false;
                        dayCell.className += isCompleted ? ' completed' : ' not-completed';
                        dayCell.onclick = () => toggleCompletion(dateString);
                    }
                    
                    monthDays.appendChild(dayCell);
                }
                
                monthCard.appendChild(monthDays);
                yearViewData.appendChild(monthCard);
            }
        }).catch(error => {
            console.error('获取目标数据时出错:', error);
            showError('获取目标数据失败，请稍后重试');
        });
    } catch (error) {
        console.error('更新年视图时出错:', error);
        showError('更新年视图失败，请稍后重试');
    }
}

// 将函数暴露到全局作用域
window.addGoal = addGoal;
window.editGoal = editGoal;
window.toggleCompletion = toggleCompletion;
window.showGoalsList = showGoalsList;
window.switchView = switchView;
window.showGoalDetail = showGoalDetail;
window.deleteGoalHandler = deleteGoalHandler;

// 添加目标处理函数
async function addGoalHandler() {
    try {
        const form = document.getElementById('goalForm');
        const input = document.getElementById('goalInput');

        if (!form || !input) {
            console.error('找不到表单元素');
            return;
        }

        form.onsubmit = async (e) => {
            e.preventDefault();
            const content = input.value.trim();
            
            if (content) {
                const goalId = await addGoal(content);
                if (goalId) {
                    input.value = '';
                    const goals = await getGoals();
                    updateGoalsList(goals);
                }
            }
        };
    } catch (error) {
        console.error('设置添加目标处理函数时出错:', error);
        showError('设置添加目标功能失败，请刷新页面重试');
    }
}

// 删除目标处理函数
async function deleteGoalHandler(id) {
    try {
        if (confirm('确定要删除这个目标吗？')) {
            if (await deleteGoal(id)) {
                const goals = await getGoals();
                updateGoalsList(goals);
            }
        }
    } catch (error) {
        console.error('删除目标时出错:', error);
        showError('删除目标失败，请稍后重试');
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('正在初始化应用...');

        // 初始化 Firebase
        // initializeApp(firebaseConfig);
        // db = getFirestore();
        console.log('Firebase 初始化完成');

        // 初始化视图状态
        const goalDetailElement = document.getElementById('goalDetail');
        const goalsListElement = document.getElementById('goalsList');
        
        if (!goalDetailElement || !goalsListElement) {
            throw new Error('找不到必要的DOM元素');
        }

        // 显示目标列表
        goalDetailElement.style.display = 'none';
        goalsListElement.style.display = 'block';

        // 获取并显示目标列表
        const goals = await getGoals();
        updateGoalsList(goals);

        // 初始化添加目标处理
        addGoalHandler();

        // 添加视图切换按钮的事件监听器
        document.getElementById('weekViewBtn').addEventListener('click', () => switchView('week'));
        document.getElementById('monthViewBtn').addEventListener('click', () => switchView('month'));
        document.getElementById('yearViewBtn').addEventListener('click', () => switchView('year'));

        console.log('应用初始化完成');
    } catch (error) {
        console.error('初始化应用时出错:', error);
        showError('初始化应用失败，请刷新页面重试');
    }
});
