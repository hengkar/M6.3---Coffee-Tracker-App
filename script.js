// Coffee Tracker Application
class CoffeeTracker {
    constructor() {
        this.coffeeEntries = this.loadFromStorage();
        this.customCoffeeTypes = this.loadCustomTypes();
        this.dailyGoal = this.loadDailyGoal();
        this.budget = this.loadBudget();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateCustomCoffeeTypes();
        this.updateDisplay();
    }

    setupEventListeners() {
        const addBtn = document.getElementById('addCoffeeBtn');
        const clearBtn = document.getElementById('clearHistoryBtn');

        addBtn.addEventListener('click', () => this.addCoffee());
        clearBtn.addEventListener('click', () => this.clearHistory());

        // Custom coffee type management
        const addCustomTypeBtn = document.getElementById('addCustomTypeBtn');
        const manageTypesBtn = document.getElementById('manageTypesBtn');
        if (addCustomTypeBtn) {
            addCustomTypeBtn.addEventListener('click', () => this.addCustomCoffeeType());
        }
        if (manageTypesBtn) {
            manageTypesBtn.addEventListener('click', () => this.showManageTypesModal());
        }

        // Goal and budget settings
        const setGoalBtn = document.getElementById('setGoalBtn');
        const setBudgetBtn = document.getElementById('setBudgetBtn');
        if (setGoalBtn) {
            setGoalBtn.addEventListener('click', () => this.setDailyGoal());
        }
        if (setBudgetBtn) {
            setBudgetBtn.addEventListener('click', () => this.setBudget());
        }

        // Photo upload
        const photoInput = document.getElementById('coffeePhoto');
        if (photoInput) {
            photoInput.addEventListener('change', (e) => this.handlePhotoUpload(e));
        }
    }

    addCoffee() {
        const type = document.getElementById('coffeeType').value;
        const size = document.getElementById('coffeeSize').value;
        const price = parseFloat(document.getElementById('coffeePrice')?.value) || 0;
        const notes = document.getElementById('coffeeNotes')?.value || '';
        const rating = parseInt(document.getElementById('coffeeRating')?.value) || 0;
        const location = document.getElementById('coffeeLocation')?.value || '';
        const mood = document.getElementById('coffeeMood')?.value || '';
        const temperature = document.getElementById('coffeeTemperature')?.value || 'hot';
        const milkType = document.getElementById('coffeeMilk')?.value || '';
        const brewMethod = document.getElementById('coffeeBrewMethod')?.value || '';
        const origin = document.getElementById('coffeeOrigin')?.value || '';
        const isFavorite = document.getElementById('coffeeFavorite')?.checked || false;
        
        const coffeeEntry = {
            id: Date.now(),
            type: type,
            size: size,
            price: price,
            notes: notes,
            rating: rating,
            location: location,
            mood: mood,
            temperature: temperature,
            milkType: milkType,
            brewMethod: brewMethod,
            origin: origin,
            isFavorite: isFavorite,
            photo: this.currentPhoto || null,
            timestamp: new Date().toISOString()
        };

        this.coffeeEntries.unshift(coffeeEntry);
        this.saveToStorage();
        this.updateDisplay();
        this.showAddAnimation();
        this.resetForm();
        this.checkBudgetAlert();
        this.checkDailyGoalWarning();
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

        // Update cost statistics
        const todaySpendElement = document.getElementById('todaySpend');
        const weekSpendElement = document.getElementById('weekSpend');
        const monthSpendElement = document.getElementById('monthSpend');
        const totalSpendElement = document.getElementById('totalSpend');
        const avgCostElement = document.getElementById('avgCost');

        if (todaySpendElement) todaySpendElement.textContent = '$' + this.getTodaySpending().toFixed(2);
        if (weekSpendElement) weekSpendElement.textContent = '$' + this.getWeekSpending().toFixed(2);
        if (monthSpendElement) monthSpendElement.textContent = '$' + this.getMonthlySpending().toFixed(2);
        if (totalSpendElement) totalSpendElement.textContent = '$' + this.getTotalSpending().toFixed(2);
        if (avgCostElement) avgCostElement.textContent = '$' + this.getAverageCost().toFixed(2);

        // Update goal progress
        if (this.dailyGoal > 0) {
            const goalElement = document.getElementById('goalProgress');
            const goalTextElement = document.getElementById('goalText');
            if (goalElement && goalTextElement) {
                const percentage = Math.min((today / this.dailyGoal) * 100, 100);
                goalElement.style.width = percentage + '%';
                goalTextElement.textContent = `${today}/${this.dailyGoal} cups`;
                
                // Change color based on status
                if (today > this.dailyGoal) {
                    goalElement.style.background = '#C74E4E';
                } else if (today === this.dailyGoal) {
                    goalElement.style.background = '#4CAF50';
                } else {
                    goalElement.style.background = 'var(--primary-color)';
                }
            }
        }

        // Update budget progress
        if (this.budget > 0) {
            const budgetElement = document.getElementById('budgetProgress');
            const budgetTextElement = document.getElementById('budgetText');
            if (budgetElement && budgetTextElement) {
                const monthSpending = this.getMonthlySpending();
                const percentage = Math.min((monthSpending / this.budget) * 100, 100);
                budgetElement.style.width = percentage + '%';
                budgetTextElement.textContent = `$${monthSpending.toFixed(2)}/$${this.budget.toFixed(2)}`;
                
                if (monthSpending > this.budget) {
                    budgetElement.style.background = '#C74E4E';
                } else if (monthSpending >= this.budget * 0.9) {
                    budgetElement.style.background = '#FFA500';
                } else {
                    budgetElement.style.background = '#4CAF50';
                }
            }
        }
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

    getTodaySpending() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return this.coffeeEntries
            .filter(entry => {
                const entryDate = new Date(entry.timestamp);
                entryDate.setHours(0, 0, 0, 0);
                return entryDate.getTime() === today.getTime();
            })
            .reduce((sum, entry) => sum + (entry.price || 0), 0);
    }

    getWeekSpending() {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        return this.coffeeEntries
            .filter(entry => new Date(entry.timestamp) >= weekAgo)
            .reduce((sum, entry) => sum + (entry.price || 0), 0);
    }

    getMonthlySpending() {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        return this.coffeeEntries
            .filter(entry => new Date(entry.timestamp) >= firstDayOfMonth)
            .reduce((sum, entry) => sum + (entry.price || 0), 0);
    }

    getTotalSpending() {
        return this.coffeeEntries.reduce((sum, entry) => sum + (entry.price || 0), 0);
    }

    getAverageCost() {
        const entriesWithPrice = this.coffeeEntries.filter(entry => entry.price > 0);
        if (entriesWithPrice.length === 0) return 0;
        
        const total = entriesWithPrice.reduce((sum, entry) => sum + entry.price, 0);
        return total / entriesWithPrice.length;
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

        // Build details array
        const details = [entry.size];
        if (entry.temperature) details.push(entry.temperature === 'hot' ? '🔥 Hot' : '🧊 Iced');
        if (entry.brewMethod) details.push(entry.brewMethod);
        if (entry.milkType) details.push(entry.milkType);
        details.push(dateString);
        
        const detailsString = details.join(' • ');

        // Rating stars
        const starsHTML = entry.rating > 0 ? 
            `<div class="coffee-rating">${'⭐'.repeat(entry.rating)}</div>` : '';

        // Mood indicator
        const moodEmoji = {
            'happy': '😊',
            'neutral': '😐',
            'tired': '😴',
            'energized': '⚡'
        };
        const moodHTML = entry.mood && moodEmoji[entry.mood] ? 
            `<span class="coffee-mood" title="${entry.mood}">${moodEmoji[entry.mood]}</span>` : '';

        // Favorite indicator
        const favoriteHTML = entry.isFavorite ? 
            `<span class="coffee-favorite" title="Favorite">❤️</span>` : '';

        // Additional info
        const additionalInfo = [];
        if (entry.location) additionalInfo.push(`📍 ${entry.location}`);
        if (entry.origin) additionalInfo.push(`☕ ${entry.origin}`);
        if (entry.price > 0) additionalInfo.push(`💵 $${entry.price.toFixed(2)}`);
        
        const additionalInfoHTML = additionalInfo.length > 0 ? 
            `<div class="coffee-additional">${additionalInfo.join(' • ')}</div>` : '';

        // Notes
        const notesHTML = entry.notes ? 
            `<div class="coffee-notes">📝 ${entry.notes}</div>` : '';

        // Photo
        const photoHTML = entry.photo ? 
            `<img src="${entry.photo}" class="coffee-photo" alt="Coffee photo">` : '';

        return `
            <div class="coffee-entry">
                <div class="coffee-info">
                    <div class="coffee-header">
                        <div class="coffee-type">${entry.type} ${favoriteHTML} ${moodHTML}</div>
                        ${starsHTML}
                    </div>
                    <div class="coffee-details">${detailsString}</div>
                    ${additionalInfoHTML}
                    ${notesHTML}
                    ${photoHTML}
                </div>
                <div class="coffee-meta">
                    <span class="coffee-time">${timeString}</span>
                    <button class="btn-delete" data-id="${entry.id}" title="Delete entry">✕</button>
                </div>
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
        try {
            localStorage.setItem('coffeeEntries', JSON.stringify(this.coffeeEntries));
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
            alert('Warning: Unable to save data. Your storage may be full.');
        }
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem('coffeeEntries');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to load from localStorage:', e);
            return [];
        }
    }

    loadCustomTypes() {
        try {
            const data = localStorage.getItem('customCoffeeTypes');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to load custom types:', e);
            return [];
        }
    }

    loadDailyGoal() {
        try {
            const goal = localStorage.getItem('dailyGoal');
            return goal ? parseInt(goal) : 0;
        } catch (e) {
            console.error('Failed to load daily goal:', e);
            return 0;
        }
    }

    loadBudget() {
        try {
            const budget = localStorage.getItem('monthlyBudget');
            return budget ? parseFloat(budget) : 0;
        } catch (e) {
            console.error('Failed to load budget:', e);
            return 0;
        }
    }

    saveCustomTypes() {
        try {
            localStorage.setItem('customCoffeeTypes', JSON.stringify(this.customCoffeeTypes));
        } catch (e) {
            console.error('Failed to save custom types:', e);
            alert('Warning: Unable to save custom types. Your storage may be full.');
        }
    }

    saveDailyGoal() {
        try {
            localStorage.setItem('dailyGoal', this.dailyGoal.toString());
        } catch (e) {
            console.error('Failed to save daily goal:', e);
        }
    }

    saveBudget() {
        try {
            localStorage.setItem('monthlyBudget', this.budget.toString());
        } catch (e) {
            console.error('Failed to save budget:', e);
        }
    }

    addCustomCoffeeType() {
        const input = document.getElementById('customCoffeeType');
        const typeName = input?.value.trim();
        
        if (!typeName) {
            alert('Please enter a coffee type name');
            return;
        }
        
        if (this.customCoffeeTypes.includes(typeName)) {
            alert('This coffee type already exists');
            return;
        }
        
        this.customCoffeeTypes.push(typeName);
        this.saveCustomTypes();
        this.updateCustomCoffeeTypes();
        input.value = '';
    }

    deleteCustomCoffeeType(typeName) {
        if (confirm(`Delete "${typeName}" from custom coffee types?`)) {
            this.customCoffeeTypes = this.customCoffeeTypes.filter(t => t !== typeName);
            this.saveCustomTypes();
            this.updateCustomCoffeeTypes();
        }
    }

    updateCustomCoffeeTypes() {
        const select = document.getElementById('coffeeType');
        if (!select) return;
        
        // Get default options
        const defaultTypes = ['Espresso', 'Latte', 'Cappuccino', 'Americano', 'Mocha', 'Cold Brew', 'Drip Coffee'];
        
        // Clear and rebuild options
        select.innerHTML = '';
        
        // Add default types
        defaultTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            select.appendChild(option);
        });
        
        // Add custom types
        this.customCoffeeTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type + ' (Custom)';
            select.appendChild(option);
        });
    }

    showManageTypesModal() {
        if (this.customCoffeeTypes.length === 0) {
            alert('No custom coffee types to manage');
            return;
        }
        
        const typesList = this.customCoffeeTypes.map(t => `• ${t}`).join('\n');
        alert(`Custom Coffee Types:\n\n${typesList}\n\nTo delete a type, use the delete button next to each custom type in the dropdown.`);
    }

    setDailyGoal() {
        const goal = prompt('Set your daily coffee consumption goal (number of cups):', this.dailyGoal || '4');
        
        if (goal !== null) {
            const goalNum = parseInt(goal);
            if (isNaN(goalNum) || goalNum < 0) {
                alert('Please enter a valid number');
                return;
            }
            this.dailyGoal = goalNum;
            this.saveDailyGoal();
            this.updateDisplay();
        }
    }

    setBudget() {
        const budget = prompt('Set your monthly coffee budget ($):', this.budget || '100');
        
        if (budget !== null) {
            const budgetNum = parseFloat(budget);
            if (isNaN(budgetNum) || budgetNum < 0) {
                alert('Please enter a valid amount');
                return;
            }
            this.budget = budgetNum;
            this.saveBudget();
            this.updateDisplay();
        }
    }

    checkDailyGoalWarning() {
        if (this.dailyGoal > 0) {
            const todayCount = this.getTodayCount();
            if (todayCount > this.dailyGoal) {
                alert(`⚠️ Warning: You've exceeded your daily goal of ${this.dailyGoal} cups!`);
            } else if (todayCount === this.dailyGoal) {
                alert(`✓ You've reached your daily goal of ${this.dailyGoal} cups!`);
            }
        }
    }

    checkBudgetAlert() {
        if (this.budget > 0) {
            const monthlySpending = this.getMonthlySpending();
            if (monthlySpending > this.budget) {
                alert(`⚠️ Budget Alert: You've exceeded your monthly budget of $${this.budget.toFixed(2)}!`);
            }
        }
    }

    handlePhotoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        
        // Check file size (max 5MB before compression)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image file is too large. Please select an image under 5MB.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                try {
                    // Compress image
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    if (!ctx) {
                        alert('Unable to process image. Please try a different image.');
                        return;
                    }
                    
                    const maxSize = 400;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height) {
                        if (width > maxSize) {
                            height *= maxSize / width;
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width *= maxSize / height;
                            height = maxSize;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    this.currentPhoto = canvas.toDataURL('image/jpeg', 0.7);
                } catch (error) {
                    console.error('Error processing image:', error);
                    alert('Error processing image. Please try a different image.');
                }
            };
            img.onerror = () => {
                alert('Unable to load image. Please try a different file.');
            };
            img.src = e.target.result;
        };
        reader.onerror = () => {
            alert('Error reading file. Please try again.');
        };
        reader.readAsDataURL(file);
    }

    resetForm() {
        // Reset photo
        this.currentPhoto = null;
        const photoInput = document.getElementById('coffeePhoto');
        if (photoInput) photoInput.value = '';
        
        // Reset other fields
        const noteField = document.getElementById('coffeeNotes');
        if (noteField) noteField.value = '';
        
        const priceField = document.getElementById('coffeePrice');
        if (priceField) priceField.value = '';
        
        const locationField = document.getElementById('coffeeLocation');
        if (locationField) locationField.value = '';
        
        const originField = document.getElementById('coffeeOrigin');
        if (originField) originField.value = '';
        
        const favoriteField = document.getElementById('coffeeFavorite');
        if (favoriteField) favoriteField.checked = false;
        
        // Reset selects to default values
        const ratingField = document.getElementById('coffeeRating');
        if (ratingField) ratingField.value = '0';
        
        const moodField = document.getElementById('coffeeMood');
        if (moodField) moodField.value = '';
        
        const milkField = document.getElementById('coffeeMilk');
        if (milkField) milkField.value = '';
        
        const brewField = document.getElementById('coffeeBrewMethod');
        if (brewField) brewField.value = '';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CoffeeTracker();
});
