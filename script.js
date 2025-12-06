// Coffee Tracker Application
class CoffeeTracker {
    constructor() {
        this.coffeeEntries = this.loadFromStorage();
        this.actionHistory = [];
        this.currentUser = this.loadUser();
        this.achievements = this.initializeAchievements();
        this.filters = {
            search: '',
            size: '',
            dateFrom: '',
            dateTo: '',
            costMin: '',
            costMax: '',
            sortBy: 'date-desc'
        };
        this.init();
    }

    init() {
        this.loadTheme();
        this.setupEventListeners();
        this.updateDisplay();
        this.checkAchievements();
        this.showOnboarding();
    }

    setupEventListeners() {
        // Add coffee
        document.getElementById('addCoffeeBtn').addEventListener('click', () => this.addCoffee());
        
        // Clear history
        document.getElementById('clearHistoryBtn').addEventListener('click', () => this.clearHistory());
        
        // Undo
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        
        // Export/Import
        document.getElementById('exportBtn').addEventListener('click', () => this.showExportOptions());
        document.getElementById('importBtn').addEventListener('click', () => this.importData());
        document.getElementById('importFileInput').addEventListener('change', (e) => this.handleImport(e));
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // Modal buttons
        document.getElementById('userProfileBtn').addEventListener('click', () => this.openModal('userProfileModal'));
        document.getElementById('achievementsBtn').addEventListener('click', () => this.openModal('achievementsModal'));
        document.getElementById('helpBtn').addEventListener('click', () => this.openModal('helpModal'));
        
        // Close modals
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => this.closeModal(e.target.dataset.modal));
        });
        
        // Close modal on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
        
        // Save profile
        document.getElementById('saveProfileBtn').addEventListener('click', () => this.saveProfile());
        
        // Avatar selection
        document.querySelectorAll('.avatar-option').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectAvatar(e.target.dataset.avatar));
        });
        
        // Search and filters
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e.target.value));
        document.getElementById('toggleFiltersBtn').addEventListener('click', () => this.toggleFilters());
        document.getElementById('clearFiltersBtn').addEventListener('click', () => this.clearFilters());
        
        // Filter inputs
        ['filterSize', 'filterDateFrom', 'filterDateTo', 'filterCostMin', 'filterCostMax', 'sortBy'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.applyFilters());
        });
        
        // Enter key support
        ['coffeeType', 'coffeeSize', 'coffeeCost', 'coffeeRating'].forEach(id => {
            document.getElementById(id).addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.addCoffee();
            });
        });
        
        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(modal => {
                    this.closeModal(modal.id);
                });
            }
        });
        
        // Load user profile
        this.loadUserProfile();
    }

    addCoffee() {
        const type = document.getElementById('coffeeType').value;
        const size = document.getElementById('coffeeSize').value;
        const cost = parseFloat(document.getElementById('coffeeCost').value) || 0;
        const rating = document.getElementById('coffeeRating').value;
        
        const coffeeEntry = {
            id: Date.now(),
            type: type,
            size: size,
            cost: cost,
            rating: rating ? parseInt(rating) : null,
            timestamp: new Date().toISOString()
        };

        // Store for undo
        this.actionHistory.push({
            action: 'add',
            data: coffeeEntry
        });

        this.coffeeEntries.unshift(coffeeEntry);
        this.saveToStorage();
        this.updateDisplay();
        this.showAddAnimation();
        this.showToast('Coffee added successfully!', 'success');
        this.checkAchievements();
        
        // Clear cost input
        document.getElementById('coffeeCost').value = '';
        document.getElementById('coffeeRating').value = '';
        
        // Enable undo button
        document.getElementById('undoBtn').disabled = false;
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
        const entry = this.coffeeEntries.find(e => e.id === id);
        if (!entry) return;
        
        this.showConfirmDialog('Delete this coffee entry?', () => {
            // Store for undo
            this.actionHistory.push({
                action: 'delete',
                data: entry
            });
            
            this.coffeeEntries = this.coffeeEntries.filter(e => e.id !== id);
            this.saveToStorage();
            this.updateDisplay();
            this.showToast('Coffee entry deleted', 'info');
            document.getElementById('undoBtn').disabled = false;
        });
    }

    clearHistory() {
        if (this.coffeeEntries.length === 0) {
            this.showToast('No entries to clear!', 'info');
            return;
        }

        this.showConfirmDialog('Are you sure you want to clear all coffee history?', () => {
            // Store for undo
            this.actionHistory.push({
                action: 'clear',
                data: [...this.coffeeEntries]
            });
            
            this.coffeeEntries = [];
            this.saveToStorage();
            this.updateDisplay();
            this.showToast('History cleared', 'info');
            document.getElementById('undoBtn').disabled = false;
        });
    }

    undo() {
        if (this.actionHistory.length === 0) {
            this.showToast('Nothing to undo', 'info');
            return;
        }

        const lastAction = this.actionHistory.pop();
        
        switch (lastAction.action) {
            case 'add':
                this.coffeeEntries = this.coffeeEntries.filter(e => e.id !== lastAction.data.id);
                break;
            case 'delete':
                this.coffeeEntries.unshift(lastAction.data);
                this.coffeeEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                break;
            case 'clear':
                this.coffeeEntries = lastAction.data;
                break;
        }
        
        this.saveToStorage();
        this.updateDisplay();
        this.showToast('Action undone', 'success');
        
        if (this.actionHistory.length === 0) {
            document.getElementById('undoBtn').disabled = true;
        }
    }

    updateDisplay() {
        this.updateStats();
        this.updateCoffeeList();
        this.updateAchievementsDisplay();
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
        const filteredEntries = this.getFilteredEntries();
        
        if (filteredEntries.length === 0) {
            coffeeList.innerHTML = '<p class="empty-message">No coffee entries match your filters.</p>';
            return;
        }

        coffeeList.innerHTML = filteredEntries.map(entry => this.createCoffeeEntryHTML(entry)).join('');

        // Add delete button listeners
        coffeeList.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.deleteCoffee(id);
            });
        });
    }

    getFilteredEntries() {
        let entries = [...this.coffeeEntries];
        
        // Search filter
        if (this.filters.search) {
            entries = entries.filter(e => 
                e.type.toLowerCase().includes(this.filters.search.toLowerCase())
            );
        }
        
        // Size filter
        if (this.filters.size) {
            entries = entries.filter(e => e.size === this.filters.size);
        }
        
        // Date range filter
        if (this.filters.dateFrom) {
            const fromDate = new Date(this.filters.dateFrom);
            entries = entries.filter(e => new Date(e.timestamp) >= fromDate);
        }
        if (this.filters.dateTo) {
            const toDate = new Date(this.filters.dateTo);
            toDate.setHours(23, 59, 59, 999);
            entries = entries.filter(e => new Date(e.timestamp) <= toDate);
        }
        
        // Cost range filter
        if (this.filters.costMin) {
            entries = entries.filter(e => e.cost >= parseFloat(this.filters.costMin));
        }
        if (this.filters.costMax) {
            entries = entries.filter(e => e.cost <= parseFloat(this.filters.costMax));
        }
        
        // Sort
        entries = this.sortEntries(entries, this.filters.sortBy);
        
        return entries;
    }

    sortEntries(entries, sortBy) {
        switch (sortBy) {
            case 'date-desc':
                return entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            case 'date-asc':
                return entries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            case 'type':
                return entries.sort((a, b) => a.type.localeCompare(b.type));
            case 'rating':
                return entries.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            case 'cost-high':
                return entries.sort((a, b) => b.cost - a.cost);
            case 'cost-low':
                return entries.sort((a, b) => a.cost - b.cost);
            default:
                return entries;
        }
    }

    createCoffeeEntryHTML(entry) {
        const date = new Date(entry.timestamp);
        const timeString = this.formatTime(date);
        const dateString = this.formatDate(date);
        const ratingHTML = entry.rating ? `<span class="coffee-rating">${'⭐'.repeat(entry.rating)}</span>` : '';
        const costHTML = entry.cost > 0 ? `<span class="coffee-cost">$${entry.cost.toFixed(2)}</span>` : '';

        return `
            <div class="coffee-entry">
                <div class="coffee-info">
                    <div class="coffee-type">${entry.type} ${ratingHTML}</div>
                    <div class="coffee-details">${entry.size} • ${dateString} ${costHTML ? '• ' + costHTML : ''}</div>
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

    // Search and Filter Methods
    handleSearch(query) {
        this.filters.search = query;
        this.applyFilters();
    }

    toggleFilters() {
        const filtersDiv = document.getElementById('advancedFilters');
        if (filtersDiv.style.display === 'none') {
            filtersDiv.style.display = 'grid';
        } else {
            filtersDiv.style.display = 'none';
        }
    }

    applyFilters() {
        this.filters.size = document.getElementById('filterSize').value;
        this.filters.dateFrom = document.getElementById('filterDateFrom').value;
        this.filters.dateTo = document.getElementById('filterDateTo').value;
        this.filters.costMin = document.getElementById('filterCostMin').value;
        this.filters.costMax = document.getElementById('filterCostMax').value;
        this.filters.sortBy = document.getElementById('sortBy').value;
        this.updateCoffeeList();
    }

    clearFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('filterSize').value = '';
        document.getElementById('filterDateFrom').value = '';
        document.getElementById('filterDateTo').value = '';
        document.getElementById('filterCostMin').value = '';
        document.getElementById('filterCostMax').value = '';
        document.getElementById('sortBy').value = 'date-desc';
        
        this.filters = {
            search: '',
            size: '',
            dateFrom: '',
            dateTo: '',
            costMin: '',
            costMax: '',
            sortBy: 'date-desc'
        };
        
        this.updateCoffeeList();
        this.showToast('Filters cleared', 'info');
    }

    // Export/Import Methods
    showExportOptions() {
        const choice = confirm('Click OK to export as JSON, Cancel to export as CSV');
        if (choice) {
            this.exportToJSON();
        } else {
            this.exportToCSV();
        }
    }

    exportToJSON() {
        const data = {
            coffeeEntries: this.coffeeEntries,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        this.downloadFile(blob, `coffee-tracker-${this.formatDateForFilename()}.json`);
        this.showToast('Data exported to JSON', 'success');
    }

    exportToCSV() {
        const headers = ['Date', 'Time', 'Type', 'Size', 'Cost', 'Rating'];
        const rows = this.coffeeEntries.map(entry => {
            const date = new Date(entry.timestamp);
            return [
                date.toLocaleDateString(),
                date.toLocaleTimeString(),
                entry.type,
                entry.size,
                entry.cost || 0,
                entry.rating || ''
            ];
        });
        
        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        this.downloadFile(blob, `coffee-tracker-${this.formatDateForFilename()}.csv`);
        this.showToast('Data exported to CSV', 'success');
    }

    formatDateForFilename() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importData() {
        document.getElementById('importFileInput').click();
    }

    handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                if (file.name.endsWith('.json')) {
                    this.importFromJSON(e.target.result);
                } else if (file.name.endsWith('.csv')) {
                    this.importFromCSV(e.target.result);
                } else {
                    this.showToast('Unsupported file format', 'error');
                }
            } catch (error) {
                this.showToast('Error importing file', 'error');
                console.error(error);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    importFromJSON(content) {
        const data = JSON.parse(content);
        if (data.coffeeEntries && Array.isArray(data.coffeeEntries)) {
            this.showConfirmDialog('Import will merge with existing data. Continue?', () => {
                // Merge and deduplicate by timestamp
                const existingIds = new Set(this.coffeeEntries.map(e => e.id));
                const newEntries = data.coffeeEntries.filter(e => !existingIds.has(e.id));
                this.coffeeEntries = [...this.coffeeEntries, ...newEntries];
                this.coffeeEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                this.saveToStorage();
                this.updateDisplay();
                this.showToast(`Imported ${newEntries.length} entries`, 'success');
                this.checkAchievements();
            });
        }
    }

    importFromCSV(content) {
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            this.showToast('Invalid CSV file', 'error');
            return;
        }
        
        this.showConfirmDialog('Import will merge with existing data. Continue?', () => {
            const entries = [];
            // Generate unique IDs based on timestamp and random component
            const baseTimestamp = Date.now();
            for (let i = 1; i < lines.length; i++) {
                const [date, time, type, size, cost, rating] = lines[i].split(',').map(s => s.trim());
                if (date && time && type && size) {
                    try {
                        const parsedDate = new Date(`${date} ${time}`);
                        if (isNaN(parsedDate.getTime())) {
                            console.warn(`Skipping invalid date: ${date} ${time}`);
                            continue;
                        }
                        entries.push({
                            id: baseTimestamp + i * 1000 + Math.floor(Math.random() * 1000),
                            type,
                            size,
                            cost: parseFloat(cost) || 0,
                            rating: rating ? parseInt(rating) : null,
                            timestamp: parsedDate.toISOString()
                        });
                    } catch (error) {
                        console.warn(`Error parsing row ${i}:`, error);
                    }
                }
            }
            
            this.coffeeEntries = [...this.coffeeEntries, ...entries];
            this.coffeeEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            this.saveToStorage();
            this.updateDisplay();
            this.showToast(`Imported ${entries.length} entries`, 'success');
            this.checkAchievements();
        });
    }

    // Theme Methods
    loadTheme() {
        const theme = localStorage.getItem('coffeeTrackerTheme') || 'light';
        document.documentElement.setAttribute('data-theme', theme);
        this.updateThemeIcon(theme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('coffeeTrackerTheme', newTheme);
        this.updateThemeIcon(newTheme);
        this.showToast(`${newTheme === 'dark' ? 'Dark' : 'Light'} mode enabled`, 'info');
    }

    updateThemeIcon(theme) {
        const themeBtn = document.getElementById('themeToggle');
        themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    // Modal Methods
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('active');
        
        if (modalId === 'achievementsModal') {
            this.updateAchievementsDisplay();
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('active');
    }

    // Toast Notification
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Confirmation Dialog
    showConfirmDialog(message, onConfirm) {
        if (confirm(message)) {
            onConfirm();
        }
    }

    // User Profile Methods
    loadUser() {
        const userData = localStorage.getItem('coffeeTrackerUser');
        return userData ? JSON.parse(userData) : { name: '', avatar: '☕' };
    }

    saveUser() {
        localStorage.setItem('coffeeTrackerUser', JSON.stringify(this.currentUser));
    }

    loadUserProfile() {
        document.getElementById('userName').value = this.currentUser.name || '';
        document.querySelectorAll('.avatar-option').forEach(btn => {
            if (btn.dataset.avatar === this.currentUser.avatar) {
                btn.classList.add('selected');
            }
        });
    }

    saveProfile() {
        this.currentUser.name = document.getElementById('userName').value;
        this.saveUser();
        this.closeModal('userProfileModal');
        this.showToast('Profile saved!', 'success');
    }

    selectAvatar(avatar) {
        this.currentUser.avatar = avatar;
        document.querySelectorAll('.avatar-option').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.avatar === avatar) {
                btn.classList.add('selected');
            }
        });
    }

    // Achievement System
    initializeAchievements() {
        return [
            {
                id: 'first-cup',
                name: 'First Cup',
                description: 'Log your first coffee',
                icon: '🎉',
                requirement: 1,
                unlocked: false
            },
            {
                id: 'connoisseur',
                name: 'Coffee Connoisseur',
                description: 'Try 10 different types',
                icon: '👨‍🍳',
                requirement: 10,
                unlocked: false
            },
            {
                id: 'week-streak',
                name: 'Week Streak',
                description: 'Log coffee for 7 consecutive days',
                icon: '🔥',
                requirement: 7,
                unlocked: false
            },
            {
                id: 'century-club',
                name: 'Century Club',
                description: 'Log 100 total cups',
                icon: '💯',
                requirement: 100,
                unlocked: false
            }
        ];
    }

    checkAchievements() {
        let achievementsUnlocked = 0;
        
        // Load saved achievements
        const saved = localStorage.getItem('coffeeTrackerAchievements');
        if (saved) {
            try {
                this.achievements = JSON.parse(saved);
            } catch (error) {
                console.error('Error loading achievements:', error);
                // Reset to defaults if corrupted
                this.achievements = this.initializeAchievements();
            }
        }
        
        // First Cup
        if (!this.achievements[0].unlocked && this.coffeeEntries.length >= 1) {
            this.achievements[0].unlocked = true;
            this.showToast('🎉 Achievement Unlocked: First Cup!', 'success');
            achievementsUnlocked++;
        }
        
        // Coffee Connoisseur
        const uniqueTypes = new Set(this.coffeeEntries.map(e => e.type));
        if (!this.achievements[1].unlocked && uniqueTypes.size >= 10) {
            this.achievements[1].unlocked = true;
            this.showToast('👨‍🍳 Achievement Unlocked: Coffee Connoisseur!', 'success');
            achievementsUnlocked++;
        }
        
        // Week Streak
        const streak = this.calculateStreak();
        if (!this.achievements[2].unlocked && streak >= 7) {
            this.achievements[2].unlocked = true;
            this.showToast('🔥 Achievement Unlocked: Week Streak!', 'success');
            achievementsUnlocked++;
        }
        
        // Century Club
        if (!this.achievements[3].unlocked && this.coffeeEntries.length >= 100) {
            this.achievements[3].unlocked = true;
            this.showToast('💯 Achievement Unlocked: Century Club!', 'success');
            achievementsUnlocked++;
        }
        
        // Save achievements
        localStorage.setItem('coffeeTrackerAchievements', JSON.stringify(this.achievements));
        
        return achievementsUnlocked;
    }

    calculateStreak() {
        if (this.coffeeEntries.length === 0) return 0;
        
        const dates = this.coffeeEntries.map(e => {
            const d = new Date(e.timestamp);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
        });
        
        const uniqueDates = [...new Set(dates)].sort((a, b) => b - a);
        
        let streak = 1;
        for (let i = 0; i < uniqueDates.length - 1; i++) {
            const diff = (uniqueDates[i] - uniqueDates[i + 1]) / (24 * 60 * 60 * 1000);
            if (diff === 1) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }

    updateAchievementsDisplay() {
        const list = document.getElementById('achievementsList');
        const uniqueTypes = new Set(this.coffeeEntries.map(e => e.type));
        const streak = this.calculateStreak();
        
        list.innerHTML = this.achievements.map((achievement, index) => {
            let progress = 0;
            let progressMax = achievement.requirement;
            
            switch (achievement.id) {
                case 'first-cup':
                    progress = Math.min(this.coffeeEntries.length, 1);
                    break;
                case 'connoisseur':
                    progress = uniqueTypes.size;
                    break;
                case 'week-streak':
                    progress = streak;
                    break;
                case 'century-club':
                    progress = this.coffeeEntries.length;
                    break;
            }
            
            const progressPercent = Math.min((progress / progressMax) * 100, 100);
            const lockedClass = achievement.unlocked ? '' : 'locked';
            
            return `
                <div class="achievement-card ${lockedClass}">
                    <div class="achievement-icon">${achievement.icon}</div>
                    <div class="achievement-info">
                        <h3>${achievement.name}</h3>
                        <p>${achievement.description}</p>
                        ${achievement.unlocked ? '<span style="color: #4CAF50;">✓ Unlocked</span>' : `
                            <div class="achievement-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${progressPercent}%"></div>
                                </div>
                                <small>${progress} / ${progressMax}</small>
                            </div>
                        `}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Onboarding
    showOnboarding() {
        const hasSeenOnboarding = localStorage.getItem('coffeeTrackerOnboarding');
        if (!hasSeenOnboarding && this.coffeeEntries.length === 0) {
            setTimeout(() => {
                this.openModal('helpModal');
                localStorage.setItem('coffeeTrackerOnboarding', 'true');
            }, 1000);
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

// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registered: ', registration);
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}
