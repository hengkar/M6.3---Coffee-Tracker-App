// Coffee Tracker Application
class CoffeeTracker {
    constructor() {
        this.coffeeEntries = this.loadFromStorage();
        this.caffeineData = {
            'Espresso': { small: 64, medium: 128, large: 192 },
            'Latte': { small: 63, medium: 126, large: 189 },
            'Cappuccino': { small: 63, medium: 126, large: 189 },
            'Americano': { small: 77, medium: 154, large: 231 },
            'Mocha': { small: 85, medium: 170, large: 255 },
            'Cold Brew': { small: 100, medium: 200, large: 300 },
            'Drip Coffee': { small: 95, medium: 190, large: 285 }
        };
        this.currentChart = null;
        this.activeChartType = 'trend';
        this.currentCalendarMonth = new Date();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDisplay();
        this.initializeCharts();
        this.updateCalendar();
    }

    setupEventListeners() {
        const addBtn = document.getElementById('addCoffeeBtn');
        const clearBtn = document.getElementById('clearHistoryBtn');

        addBtn.addEventListener('click', () => this.addCoffee());
        clearBtn.addEventListener('click', () => this.clearHistory());

        // Chart tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.activeChartType = e.target.dataset.chart;
                this.updateChart();
            });
        });

        // Calendar navigation
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentCalendarMonth.setMonth(this.currentCalendarMonth.getMonth() - 1);
            this.updateCalendar();
        });
        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentCalendarMonth.setMonth(this.currentCalendarMonth.getMonth() + 1);
            this.updateCalendar();
        });

        // Allow Enter key to add coffee
        document.getElementById('coffeeType').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addCoffee();
        });
        document.getElementById('coffeeSize').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addCoffee();
        });
    }

    addCoffee() {
        const type = document.getElementById('coffeeType').value;
        const size = document.getElementById('coffeeSize').value;
        
        const coffeeEntry = {
            id: Date.now(),
            type: type,
            size: size,
            timestamp: new Date().toISOString()
        };

        this.coffeeEntries.unshift(coffeeEntry);
        this.saveToStorage();
        this.updateDisplay();
        this.showAddAnimation();
    }

    showAddAnimation() {
        const addBtn = document.getElementById('addCoffeeBtn');
        addBtn.textContent = '✓ Added!';
        addBtn.style.background = '#4CAF50';
        
        setTimeout(() => {
            addBtn.textContent = 'Add Coffee';
            addBtn.style.background = '';
        }, 1000);
    }

    deleteCoffee(id) {
        if (confirm('Delete this coffee entry?')) {
            this.coffeeEntries = this.coffeeEntries.filter(entry => entry.id !== id);
            this.saveToStorage();
            this.updateDisplay();
        }
    }

    clearHistory() {
        if (this.coffeeEntries.length === 0) {
            alert('No entries to clear!');
            return;
        }

        if (confirm('Are you sure you want to clear all coffee history?')) {
            this.coffeeEntries = [];
            this.saveToStorage();
            this.updateDisplay();
        }
    }

    updateDisplay() {
        this.updateStats();
        this.updateCoffeeList();
        this.updateCaffeineTracker();
        this.updateAnalytics();
        this.updateChart();
    }

    updateStats() {
        const today = this.getTodayCount();
        const week = this.getWeekCount();
        const total = this.coffeeEntries.length;

        document.getElementById('todayCount').textContent = today;
        document.getElementById('weekCount').textContent = week;
        document.getElementById('totalCount').textContent = total;
    }

    getTodayCount() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return this.coffeeEntries.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            entryDate.setHours(0, 0, 0, 0);
            return entryDate.getTime() === today.getTime();
        }).length;
    }

    getWeekCount() {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        return this.coffeeEntries.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= weekAgo;
        }).length;
    }

    updateCoffeeList() {
        const coffeeList = document.getElementById('coffeeList');
        
        if (this.coffeeEntries.length === 0) {
            coffeeList.innerHTML = '<p class="empty-message">No coffee entries yet. Add your first cup!</p>';
            return;
        }

        coffeeList.innerHTML = this.coffeeEntries.map(entry => this.createCoffeeEntryHTML(entry)).join('');

        // Add delete button listeners
        coffeeList.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.deleteCoffee(id);
            });
        });
    }

    createCoffeeEntryHTML(entry) {
        const date = new Date(entry.timestamp);
        const timeString = this.formatTime(date);
        const dateString = this.formatDate(date);

        return `
            <div class="coffee-entry">
                <div class="coffee-info">
                    <div class="coffee-type">${entry.type}</div>
                    <div class="coffee-details">${entry.size} • ${dateString}</div>
                </div>
                <span class="coffee-time">${timeString}</span>
                <button class="btn-delete" data-id="${entry.id}" title="Delete entry">✕</button>
            </div>
        `;
    }

    formatTime(date) {
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    }

    formatDate(date) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Reset time for comparison
        const compareDate = new Date(date);
        compareDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        yesterday.setHours(0, 0, 0, 0);

        if (compareDate.getTime() === today.getTime()) {
            return 'Today';
        } else if (compareDate.getTime() === yesterday.getTime()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
            });
        }
    }

    saveToStorage() {
        localStorage.setItem('coffeeEntries', JSON.stringify(this.coffeeEntries));
    }

    loadFromStorage() {
        const data = localStorage.getItem('coffeeEntries');
        return data ? JSON.parse(data) : [];
    }

    getCaffeineAmount(type, size) {
        const sizeKey = size.toLowerCase();
        return this.caffeineData[type] ? this.caffeineData[type][sizeKey] : 0;
    }

    getTodayCaffeine() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return this.coffeeEntries
            .filter(entry => {
                const entryDate = new Date(entry.timestamp);
                entryDate.setHours(0, 0, 0, 0);
                return entryDate.getTime() === today.getTime();
            })
            .reduce((total, entry) => {
                return total + this.getCaffeineAmount(entry.type, entry.size);
            }, 0);
    }

    updateCaffeineTracker() {
        const caffeine = this.getTodayCaffeine();
        document.getElementById('todayCaffeine').textContent = caffeine;
        
        const maxSafe = 400;
        const progress = Math.min((caffeine / maxSafe) * 100, 100);
        const progressBar = document.getElementById('caffeineProgress');
        progressBar.style.width = progress + '%';
        
        const statusText = document.getElementById('caffeineStatus');
        if (caffeine <= maxSafe) {
            progressBar.style.background = '#4CAF50';
            statusText.textContent = '🟢 Healthy range';
            statusText.style.color = '#4CAF50';
        } else if (caffeine <= 600) {
            progressBar.style.background = '#FFA726';
            statusText.textContent = '🟡 Moderate - be careful';
            statusText.style.color = '#FFA726';
        } else {
            progressBar.style.background = '#EF5350';
            statusText.textContent = '🔴 High - reduce intake!';
            statusText.style.color = '#EF5350';
        }
    }

    updateAnalytics() {
        const avgPerDay = this.getAverageCupsPerDay();
        document.getElementById('avgPerDay').textContent = avgPerDay.toFixed(1);
        
        const peakTime = this.getPeakConsumptionTime();
        document.getElementById('peakTime').textContent = peakTime;
        
        const monthCount = this.getMonthCount();
        document.getElementById('monthCount').textContent = monthCount;
    }

    getAverageCupsPerDay() {
        if (this.coffeeEntries.length === 0) return 0;
        
        const dates = new Set();
        this.coffeeEntries.forEach(entry => {
            const date = new Date(entry.timestamp);
            date.setHours(0, 0, 0, 0);
            dates.add(date.getTime());
        });
        
        return this.coffeeEntries.length / dates.size;
    }

    getPeakConsumptionTime() {
        if (this.coffeeEntries.length === 0) return '--:--';
        
        const hourCounts = {};
        this.coffeeEntries.forEach(entry => {
            const hour = new Date(entry.timestamp).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        
        let peakHour = 0;
        let maxCount = 0;
        for (const [hour, count] of Object.entries(hourCounts)) {
            if (count > maxCount) {
                maxCount = count;
                peakHour = parseInt(hour);
            }
        }
        
        const ampm = peakHour >= 12 ? 'PM' : 'AM';
        const displayHour = peakHour % 12 || 12;
        return `${displayHour}:00 ${ampm}`;
    }

    getMonthCount() {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        return this.coffeeEntries.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= monthStart;
        }).length;
    }

    initializeCharts() {
        const canvas = document.getElementById('mainChart');
        this.chartCanvas = canvas;
        this.chartContext = canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = this.chartCanvas.parentElement;
        this.chartCanvas.width = container.offsetWidth - 40;
        this.chartCanvas.height = 280;
        this.updateChart();
    }

    updateChart() {
        if (!this.chartContext) return;
        
        if (this.activeChartType === 'trend') {
            this.drawTrendChart();
        } else if (this.activeChartType === 'weekly') {
            this.drawWeeklyChart();
        } else if (this.activeChartType === 'types') {
            this.drawTypesChart();
        }
    }

    drawTrendChart() {
        const ctx = this.chartContext;
        const canvas = this.chartCanvas;
        const data = this.getLast7DaysData();
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const padding = 40;
        const chartWidth = canvas.width - 2 * padding;
        const chartHeight = canvas.height - 2 * padding;
        
        const maxValue = Math.max(...data.data, 1);
        const xStep = chartWidth / (data.labels.length - 1 || 1);
        
        ctx.strokeStyle = '#6F4E37';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        data.data.forEach((value, i) => {
            const x = padding + i * xStep;
            const y = canvas.height - padding - (value / maxValue) * chartHeight;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(111, 78, 55, 0.1)';
        ctx.beginPath();
        ctx.moveTo(padding, canvas.height - padding);
        data.data.forEach((value, i) => {
            const x = padding + i * xStep;
            const y = canvas.height - padding - (value / maxValue) * chartHeight;
            ctx.lineTo(x, y);
        });
        ctx.lineTo(padding + (data.data.length - 1) * xStep, canvas.height - padding);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#6F4E37';
        data.data.forEach((value, i) => {
            const x = padding + i * xStep;
            const y = canvas.height - padding - (value / maxValue) * chartHeight;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.fillStyle = '#666';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        data.labels.forEach((label, i) => {
            const x = padding + i * xStep;
            ctx.fillText(label, x, canvas.height - 20);
        });
    }

    drawWeeklyChart() {
        const ctx = this.chartContext;
        const canvas = this.chartCanvas;
        const data = this.getLast7DaysData();
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const padding = 40;
        const chartWidth = canvas.width - 2 * padding;
        const chartHeight = canvas.height - 2 * padding;
        
        const maxValue = Math.max(...data.data, 1);
        const barWidth = chartWidth / data.labels.length - 10;
        
        ctx.fillStyle = '#6F4E37';
        data.data.forEach((value, i) => {
            const x = padding + i * (chartWidth / data.labels.length);
            const barHeight = (value / maxValue) * chartHeight;
            const y = canvas.height - padding - barHeight;
            
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, 8);
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.font = '14px bold sans-serif';
            ctx.textAlign = 'center';
            if (value > 0) {
                ctx.fillText(value, x + barWidth / 2, y - 5);
            }
            ctx.fillStyle = '#6F4E37';
        });
        
        ctx.fillStyle = '#666';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        data.labels.forEach((label, i) => {
            const x = padding + i * (chartWidth / data.labels.length) + barWidth / 2;
            ctx.fillText(label, x, canvas.height - 20);
        });
    }

    drawTypesChart() {
        const ctx = this.chartContext;
        const canvas = this.chartCanvas;
        
        const typeCounts = {};
        this.coffeeEntries.forEach(entry => {
            typeCounts[entry.type] = (typeCounts[entry.type] || 0) + 1;
        });
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const entries = Object.entries(typeCounts);
        if (entries.length === 0) {
            ctx.fillStyle = '#666';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No data to display', canvas.width / 2, canvas.height / 2);
            return;
        }
        
        const total = entries.reduce((sum, [, count]) => sum + count, 0);
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2 - 20;
        const radius = Math.min(centerX, centerY) - 40;
        
        const colors = ['#6F4E37', '#A67C52', '#D4A574', '#8B4513', '#CD853F', '#DEB887', '#F4A460'];
        
        let currentAngle = -Math.PI / 2;
        
        entries.forEach(([type, count], i) => {
            const sliceAngle = (count / total) * Math.PI * 2;
            
            ctx.fillStyle = colors[i % colors.length];
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();
            
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            currentAngle += sliceAngle;
        });
        
        let legendY = 20;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        entries.forEach(([type, count], i) => {
            ctx.fillStyle = colors[i % colors.length];
            ctx.fillRect(10, legendY, 15, 15);
            
            ctx.fillStyle = '#333';
            const percentage = ((count / total) * 100).toFixed(0);
            ctx.fillText(`${type} (${percentage}%)`, 30, legendY + 12);
            
            legendY += 20;
        });
    }

    getLast7DaysData() {
        const labels = [];
        const data = [];
        const now = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            labels.push(dayName);
            
            const count = this.coffeeEntries.filter(entry => {
                const entryDate = new Date(entry.timestamp);
                entryDate.setHours(0, 0, 0, 0);
                return entryDate.getTime() === date.getTime();
            }).length;
            
            data.push(count);
        }
        
        return { labels, data };
    }

    updateCalendar() {
        const year = this.currentCalendarMonth.getFullYear();
        const month = this.currentCalendarMonth.getMonth();
        
        document.getElementById('calendarMonth').textContent = 
            this.currentCalendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDay = firstDay.getDay();
        
        const calendar = document.getElementById('calendar');
        calendar.innerHTML = '';
        
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-day-header';
            header.textContent = day;
            calendar.appendChild(header);
        });
        
        for (let i = 0; i < startDay; i++) {
            const empty = document.createElement('div');
            empty.className = 'calendar-day empty';
            calendar.appendChild(empty);
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            date.setHours(0, 0, 0, 0);
            
            const count = this.coffeeEntries.filter(entry => {
                const entryDate = new Date(entry.timestamp);
                entryDate.setHours(0, 0, 0, 0);
                return entryDate.getTime() === date.getTime();
            }).length;
            
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            dayEl.textContent = day;
            
            let level = 0;
            if (count > 0) level = 1;
            if (count >= 2) level = 2;
            if (count >= 4) level = 3;
            if (count >= 6) level = 4;
            
            dayEl.setAttribute('data-level', level);
            dayEl.title = `${count} cup${count !== 1 ? 's' : ''} on ${date.toLocaleDateString()}`;
            
            calendar.appendChild(dayEl);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CoffeeTracker();
});
