// Coffee Tracker Application
class CoffeeTracker {
    constructor() {
        this.coffeeEntries = this.loadFromStorage();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDisplay();
    }

    setupEventListeners() {
        const addBtn = document.getElementById('addCoffeeBtn');
        const clearBtn = document.getElementById('clearHistoryBtn');

        addBtn.addEventListener('click', () => this.addCoffee());
        clearBtn.addEventListener('click', () => this.clearHistory());

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
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CoffeeTracker();
});
