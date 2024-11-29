import { db, Goal, Completion } from './leanCloudConfig.js';

class App {
    constructor() {
        this.currentPage = 'home';
        this.currentGoalId = null;
        this.currentDate = new Date();
        this.currentView = 'week';
        
        try {
            this.initializeElements();
            this.attachEventListeners();
            console.log('开始加载目标...');
            this.fixExistingGoalsACL().then(() => {
                this.loadGoals().catch(error => {
                    console.error('加载目标失败:', error);
                    this.showToast('加载目标失败，请检查网络连接', 'error');
                });
            });
        } catch (error) {
            console.error('初始化失败:', error);
            this.showToast('应用初始化失败', 'error');
        }
    }

    // 初始化 DOM 元素引用
    initializeElements() {
        // 页面元素
        this.pages = {
            home: document.getElementById('homePage'),
            new: document.getElementById('newGoalPage'),
            detail: document.getElementById('detailPage')
        };
        
        // 按钮和表单
        this.newGoalBtn = document.getElementById('newGoalBtn');
        this.newGoalForm = document.getElementById('newGoalForm');
        this.goalList = document.getElementById('goalList');
        this.backButtons = document.querySelectorAll('.btn.back');
        this.viewButtons = document.querySelectorAll('.view-btn');
        
        // 视图元素
        this.views = {
            week: document.getElementById('weekView'),
            month: document.getElementById('monthView'),
            year: document.getElementById('yearView')
        };
        
        // Toast 提示
        this.toast = document.getElementById('toast');
    }

    // 添加事件监听器
    attachEventListeners() {
        // 新建目标
        this.newGoalBtn.addEventListener('click', () => this.showPage('new'));
        this.newGoalForm.addEventListener('submit', (e) => this.handleNewGoal(e));
        
        // 返回按钮
        this.backButtons.forEach(btn => {
            btn.addEventListener('click', () => this.showPage('home'));
        });
        
        // 视图切换
        this.viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchView(e.target.dataset.view));
        });
        
        // 日期导航
        document.getElementById('prevWeek').addEventListener('click', () => this.navigateDate('week', -1));
        document.getElementById('nextWeek').addEventListener('click', () => this.navigateDate('week', 1));
        document.getElementById('prevMonth').addEventListener('click', () => this.navigateDate('month', -1));
        document.getElementById('nextMonth').addEventListener('click', () => this.navigateDate('month', 1));
        document.getElementById('prevYear').addEventListener('click', () => this.navigateDate('year', -1));
        document.getElementById('nextYear').addEventListener('click', () => this.navigateDate('year', 1));
    }

    // 页面切换
    showPage(page) {
        Object.values(this.pages).forEach(p => p.style.display = 'none');
        this.pages[page].style.display = 'block';
        this.currentPage = page;
    }

    // 加载目标列表
    async loadGoals() {
        try {
            console.log('正在查询目标...');
            const query = new db.Query('Goal');
            const goals = await query.find();
            console.log('查询到的目标:', goals);
            
            this.goalList.innerHTML = '';
            
            if (goals.length === 0) {
                console.log('没有找到任何目标');
                this.goalList.innerHTML = '<div class="empty-state">还没有添加任何目标</div>';
                return;
            }
            
            goals.forEach(goal => {
                console.log('处理目标:', goal.id, goal.get('content') || goal.get('text'));
                const element = this.createGoalElement(goal);
                this.goalList.appendChild(element);
            });
            
            console.log('目标列表渲染完成');
        } catch (error) {
            console.error('加载目标失败:', error);
            this.showToast('加载目标失败', 'error');
        }
    }

    // 创建目标元素
    createGoalElement(goal) {
        const div = document.createElement('div');
        div.className = 'goal-item';
        
        // 获取目标内容，确保有值
        const goalText = goal.get('content') || goal.get('text') || '未命名目标';
        
        div.innerHTML = `
            <div class="goal-content">
                <h3>${goalText}</h3>
            </div>
            <div class="goal-actions">
                <button class="btn view" data-id="${goal.id}">查看详情</button>
                <button class="btn delete" data-id="${goal.id}">删除</button>
            </div>
        `;
        
        // 使用事件委托来处理按钮点击
        div.querySelector('.btn.view').addEventListener('click', () => this.viewGoalDetails(goal.id));
        div.querySelector('.btn.delete').addEventListener('click', () => this.deleteGoal(goal.id));
        
        return div;
    }

    // 处理新目标提交
    async handleNewGoal(e) {
        e.preventDefault();
        const title = document.getElementById('goalTitle').value.trim();
        
        if (!title) return;
        
        try {
            const goal = new Goal();
            goal.set('text', title);
            
            // 设置 ACL
            const acl = new db.ACL();
            acl.setPublicReadAccess(true);
            acl.setPublicWriteAccess(true);
            goal.setACL(acl);
            
            await goal.save();
            
            this.showToast('目标创建成功');
            this.newGoalForm.reset();
            await this.loadGoals();
            this.showPage('home');
        } catch (error) {
            console.error('创建目标失败:', error);
            this.showToast('创建目标失败：' + (error.message || '未知错误'), 'error');
        }
    }

    // 查看目标详情
    async viewGoalDetails(goalId) {
        try {
            const query = new db.Query('Goal');
            const goal = await query.get(goalId);
            
            this.currentGoalId = goalId;
            document.getElementById('detailTitle').textContent = goal.get('text');
            
            this.showPage('detail');
            this.switchView('week'); // 默认显示周视图
            await this.loadCompletionData();
        } catch (error) {
            this.showToast('加载详情失败', 'error');
        }
    }

    // 删除目标
    async deleteGoal(goalId) {
        if (!confirm('确定要删除这个目标吗？')) return;
        
        try {
            // 直接使用 LeanCloud SDK 删除目标
            const goalQuery = new db.Query('Goal');
            const goal = await goalQuery.get(goalId, { useMasterKey: true });
            
            // 查找并删除相关的完成记录
            const completionQuery = new db.Query('Completion');
            completionQuery.equalTo('goalId', goalId);
            const completions = await completionQuery.find({ useMasterKey: true });
            
            // 先删除完成记录
            if (completions.length > 0) {
                await Promise.all(completions.map(completion => 
                    completion.destroy({ useMasterKey: true })
                ));
            }
            
            // 最后删除目标
            await goal.destroy({ useMasterKey: true });
            
            this.showToast('目标已删除');
            await this.loadGoals();
        } catch (error) {
            console.error('删除失败:', error);
            this.showToast('删除失败: ' + error.message, 'error');
        }
    }

    // 显示提示消息
    showToast(message, type = 'success') {
        this.toast.textContent = message;
        this.toast.className = `toast ${type}`;
        this.toast.style.display = 'block';
        
        setTimeout(() => {
            this.toast.style.display = 'none';
        }, 3000);
    }

    // 切换视图（周/月/年）
    switchView(view) {
        // 更新按钮状态
        this.viewButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // 更新视图显示
        Object.entries(this.views).forEach(([key, element]) => {
            element.style.display = key === view ? 'block' : 'none';
        });

        this.currentView = view;
        this.loadCompletionData();
    }

    // 日期导航
    navigateDate(view, direction) {
        switch (view) {
            case 'week':
                this.currentDate.setDate(this.currentDate.getDate() + (direction * 7));
                break;
            case 'month':
                this.currentDate.setMonth(this.currentDate.getMonth() + direction);
                break;
            case 'year':
                this.currentDate.setFullYear(this.currentDate.getFullYear() + direction);
                break;
        }
        this.loadCompletionData();
    }

    // 加载完成数据
    async loadCompletionData() {
        if (!this.currentGoalId) return;

        try {
            const dateRange = this.getDateRange();
            const query = new db.Query('Completion');
            query.equalTo('goalId', this.currentGoalId);
            
            // 转换日期范围为 Date 对象
            const startDate = new Date(dateRange.start);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(dateRange.end);
            endDate.setHours(23, 59, 59, 999);
            
            query.greaterThanOrEqualTo('date', startDate);
            query.lessThanOrEqualTo('date', endDate);
            
            const completions = await query.find();
            
            switch (this.currentView) {
                case 'week':
                    this.updateWeekView(completions);
                    break;
                case 'month':
                    this.updateMonthView(completions);
                    break;
                case 'year':
                    this.updateYearView(completions);
                    break;
            }
        } catch (error) {
            console.error('加载完成数据失败:', error);
            this.showToast('加载完成数据失败', 'error');
        }
    }

    // 获取日期范围
    getDateRange() {
        const start = new Date(this.currentDate);
        const end = new Date(this.currentDate);

        switch (this.currentView) {
            case 'week':
                start.setDate(start.getDate() - start.getDay());
                end.setDate(end.getDate() + (6 - end.getDay()));
                break;
            case 'month':
                start.setDate(1);
                end.setMonth(end.getMonth() + 1, 0);
                break;
            case 'year':
                start.setMonth(0, 1);
                end.setMonth(11, 31);
                break;
        }

        // 设置时间为当地时间的开始和结束
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        return { start, end };
    }

    // 更新周视图
    updateWeekView(completions) {
        const weekStart = new Date(this.currentDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        
        const weekDays = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);
            return date;
        });

        document.getElementById('weekRange').textContent = 
            `${this.formatDate(weekDays[0])} - ${this.formatDate(weekDays[6])}`;

        const weekContent = document.getElementById('weekContent');
        weekContent.innerHTML = `
            <div class="completion-grid">
                ${weekDays.map(date => {
                    const dateStr = this.formatDate(date);
                    const completion = completions.find(c => {
                        const completionDate = c.get('date');
                        return this.formatDate(completionDate) === dateStr;
                    });
                    return `
                        <div class="day-item">
                            <div class="day-header">
                                <span class="day-name">${['日', '一', '二', '三', '四', '五', '六'][date.getDay()]}</span>
                                <span class="date">${date.getDate()}日</span>
                            </div>
                            <button 
                                class="completion-btn ${completion?.get('completed') ? 'completed' : ''}"
                                data-date="${dateStr}"
                                onclick="window.app.toggleCompletion('${dateStr}')"
                            >
                                ${completion?.get('completed') ? '✓' : ''}
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // 更新月视图
    updateMonthView(completions) {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        document.getElementById('monthRange').textContent = 
            `${year}年${month + 1}月`;

        const monthContent = document.getElementById('monthContent');
        let calendarHTML = '<div class="calendar">';
        
        // 添加星期头部
        calendarHTML += `
            <div class="calendar-header">
                ${['日', '一', '二', '三', '四', '五', '六'].map(day => 
                    `<div class="calendar-cell">${day}</div>`
                ).join('')}
            </div>
        `;

        // 添加日期格子
        calendarHTML += '<div class="calendar-body">';
        
        // 添加空白天数
        for (let i = 0; i < firstDay.getDay(); i++) {
            calendarHTML += '<div class="calendar-cell empty"></div>';
        }

        // 添加月份天数
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = this.formatDate(new Date(year, month, day));
            const completion = completions.find(c => {
                const completionDate = c.get('date');
                return this.formatDate(completionDate) === date;
            });
            
            calendarHTML += `
                <div class="calendar-cell">
                    <span class="date">${day}</span>
                    <button 
                        class="completion-btn ${completion?.get('completed') ? 'completed' : ''}"
                        data-date="${date}"
                        onclick="window.app.toggleCompletion('${date}')"
                    >
                        ${completion?.get('completed') ? '✓' : ''}
                    </button>
                </div>
            `;
        }

        calendarHTML += '</div></div>';
        monthContent.innerHTML = calendarHTML;
    }

    // 更新年视图
    updateYearView(completions) {
        const year = this.currentDate.getFullYear();
        document.getElementById('yearRange').textContent = `${year}年`;

        const yearContent = document.getElementById('yearContent');
        const monthsData = Array.from({ length: 12 }, (_, month) => {
            const monthCompletions = completions.filter(c => {
                const date = new Date(c.get('date'));
                return date.getMonth() === month;
            });

            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const completedDays = monthCompletions.filter(c => c.get('completed')).length;

            return {
                month: month + 1,
                total: daysInMonth,
                completed: completedDays,
                rate: ((completedDays / daysInMonth) * 100).toFixed(1)
            };
        });

        yearContent.innerHTML = `
            <div class="year-summary">
                <div class="months-grid">
                    ${monthsData.map(data => `
                        <div class="month-card">
                            <h3>${data.month}月</h3>
                            <div class="completion-rate">${data.rate}%</div>
                            <div class="completion-detail">
                                完成${data.completed}/${data.total}天
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // 切换完成状态
    async toggleCompletion(dateStr) {
        if (!this.currentGoalId) return;

        try {
            const query = new db.Query('Completion');
            query.equalTo('goalId', this.currentGoalId);
            
            // 修复时区问题
            const date = new Date(dateStr + 'T00:00:00+08:00');  // 使用北京时间
            query.equalTo('date', date);
            
            let completion = await query.first({ useMasterKey: true });
            
            if (completion) {
                completion.set('completed', !completion.get('completed'));
            } else {
                completion = new Completion();
                completion.set('goalId', this.currentGoalId);
                completion.set('date', date);
                completion.set('completed', true);
            }
            
            await completion.save(null, { useMasterKey: true });
            await this.loadCompletionData();
            this.showToast('更新成功');
        } catch (error) {
            console.error('更新完成状态失败:', error);
            this.showToast('更新完成状态失败', 'error');
        }
    }

    // 格式化日期
    formatDate(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // 添加这个方法来修复现有目标的 ACL
    async fixExistingGoalsACL() {
        try {
            // 使用 Master Key
            const query = new db.Query('Goal');
            query.equalTo('ACL', null);  // 只查找没有 ACL 的目标
            const goals = await query.find({ useMasterKey: true });
            
            console.log('需要修复 ACL 的目标数量:', goals.length);
            
            for (const goal of goals) {
                const acl = new db.ACL();
                acl.setPublicReadAccess(true);
                acl.setPublicWriteAccess(true);
                goal.setACL(acl);
                await goal.save(null, { useMasterKey: true });
            }
            
            console.log('所有目标的 ACL 已更新');
        } catch (error) {
            console.error('修复 ACL 失败:', error);
        }
    }
}

// 导出 app 实例供全局使用
window.app = new App(); 