// Viking Combat Tracker JavaScript

class VikingCombatTracker {
    constructor() {
        this.characters = [];
        this.currentActionCharacter = null;
        this.currentActionType = null;
        this.init();
    }

    init() {
        this.loadCharacters();
        this.setupEventListeners();
        this.updateDisplay();
    }

    setupEventListeners() {
        // Add character button
        document.getElementById('add-character-btn').addEventListener('click', () => {
            this.showAddCharacterModal();
        });

        // Character form submission
        document.getElementById('character-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCharacter();
        });

        // Action confirmation
        document.getElementById('action-confirm').addEventListener('click', () => {
            this.executeAction();
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideModals();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModals();
            }
        });
    }

    async loadCharacters() {
        try {
            const response = await fetch('/api/characters');
            this.characters = await response.json();
            this.updateDisplay();
        } catch (error) {
            console.error('Error loading characters:', error);
            this.showNotification('Fel vid laddning av karaktärer', 'error');
        }
    }

    async addCharacter() {
        const name = document.getElementById('char-name').value.trim();
        const willpower = parseInt(document.getElementById('char-willpower').value);
        const armor = parseInt(document.getElementById('char-armor').value);

        if (!name) {
            this.showNotification('Namn krävs', 'error');
            return;
        }

        try {
            const response = await fetch('/api/characters', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    willpower: willpower,
                    armor: armor
                }),
            });

            if (response.ok) {
                const character = await response.json();
                this.characters.push(character);
                this.updateDisplay();
                this.hideAddCharacterModal();
                this.resetCharacterForm();
                this.showNotification(`${name} har lagts till!`, 'success');
            } else {
                throw new Error('Failed to create character');
            }
        } catch (error) {
            console.error('Error adding character:', error);
            this.showNotification('Fel vid skapande av karaktär', 'error');
        }
    }

    async deleteCharacter(characterId) {
        const character = this.characters.find(c => c.id === characterId);
        if (!character) return;

        if (confirm(`Är du säker på att du vill ta bort ${character.name}?`)) {
            try {
                const response = await fetch(`/api/characters/${characterId}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    this.characters = this.characters.filter(c => c.id !== characterId);
                    this.updateDisplay();
                    this.showNotification(`${character.name} har tagits bort`, 'success');
                } else {
                    throw new Error('Failed to delete character');
                }
            } catch (error) {
                console.error('Error deleting character:', error);
                this.showNotification('Fel vid borttagning av karaktär', 'error');
            }
        }
    }

    async executeAction() {
        const amount = parseInt(document.getElementById('action-amount').value);
        if (!amount || amount < 0) {
            this.showNotification('Ange en giltig mängd', 'error');
            return;
        }

        const characterId = this.currentActionCharacter;
        const actionType = this.currentActionType;

        try {
            let endpoint, payload;
            
            if (actionType === 'damage') {
                const damageType = document.getElementById('damage-type').value;
                endpoint = `/api/characters/${characterId}/damage`;
                payload = {
                    damage: amount,
                    type: damageType
                };
            } else if (actionType === 'heal') {
                endpoint = `/api/characters/${characterId}/heal`;
                payload = {
                    healing: amount
                };
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const result = await response.json();
                
                // Update character in local array
                const charIndex = this.characters.findIndex(c => c.id === characterId);
                if (charIndex !== -1) {
                    this.characters[charIndex] = result.character;
                }

                this.updateDisplay();
                this.hideActionModal();
                
                // Show appropriate notification
                const character = result.character;
                if (actionType === 'damage') {
                    let message = `${character.name} tog ${result.damage_dealt} chockrutor`;
                    
                    // Show shock check results
                    if (result.shock_checks && result.shock_checks.length > 0) {
                        const failedChecks = result.shock_checks.filter(check => !check.success);
                        if (failedChecks.length > 0) {
                            message += ` - ${failedChecks.length} misslyckade chockkast!`;
                        }
                    }
                    
                    if (result.in_shock) {
                        message += ' (I CHOCK!)';
                    }
                    
                    this.showNotification(message, result.in_shock ? 'error' : 'warning');
                    
                    // Show detailed shock check results
                    if (result.shock_checks && result.shock_checks.length > 0) {
                        this.showShockCheckResults(result.shock_checks);
                    }
                } else {
                    this.showNotification(`${character.name} läktes ${result.boxes_healed} chockrutor`, 'success');
                }
            } else {
                throw new Error('Failed to execute action');
            }
        } catch (error) {
            console.error('Error executing action:', error);
            this.showNotification('Fel vid utförande av handling', 'error');
        }
    }

    showDamageModal(characterId) {
        this.currentActionCharacter = characterId;
        this.currentActionType = 'damage';
        
        document.getElementById('action-title').textContent = 'Tillämpa skada';
        document.getElementById('damage-type-group').style.display = 'block';
        document.getElementById('action-amount').placeholder = 'Antal chockrutor';
        document.getElementById('action-amount').value = '';
        document.getElementById('action-amount').max = '50';
        
        document.getElementById('action-modal').style.display = 'block';
        document.getElementById('action-amount').focus();
    }

    showHealModal(characterId) {
        this.currentActionCharacter = characterId;
        this.currentActionType = 'heal';
        
        document.getElementById('action-title').textContent = 'Läka karaktär';
        document.getElementById('damage-type-group').style.display = 'none';
        document.getElementById('action-amount').placeholder = 'Antal chockrutor att läka';
        document.getElementById('action-amount').value = '';
        document.getElementById('action-amount').max = '50';
        
        document.getElementById('action-modal').style.display = 'block';
        document.getElementById('action-amount').focus();
    }

    showAddCharacterModal() {
        document.getElementById('character-modal').style.display = 'block';
        document.getElementById('char-name').focus();
    }

    hideAddCharacterModal() {
        document.getElementById('character-modal').style.display = 'none';
    }

    hideActionModal() {
        document.getElementById('action-modal').style.display = 'none';
        this.currentActionCharacter = null;
        this.currentActionType = null;
    }

    hideModals() {
        this.hideAddCharacterModal();
        this.hideActionModal();
    }

    resetCharacterForm() {
        document.getElementById('character-form').reset();
        document.getElementById('char-willpower').value = '15';
        document.getElementById('char-armor').value = '0';
    }

    updateDisplay() {
        const characterList = document.getElementById('character-list');
        const emptyState = document.getElementById('empty-state');

        if (this.characters.length === 0) {
            characterList.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        characterList.style.display = 'grid';
        emptyState.style.display = 'none';

        characterList.innerHTML = this.characters.map(character => 
            this.createCharacterCard(character)
        ).join('');
    }

    createCharacterCard(character) {
        const filledBoxes = character.shock_boxes.filter(box => box === 1).length;
        const status = this.getCharacterStatus(character);
        const statusClass = status.toLowerCase().replace(' ', '-').replace('å', 'a').replace('ö', 'o');
        
        // Create shock grid
        const shockGrid = this.createShockGrid(character.shock_boxes);
        
        // Get recent shock checks for display
        const recentChecks = character.shock_checks ? character.shock_checks.slice(-3) : [];
        const shockCheckDisplay = recentChecks.map(check => {
            // Handle the new format
            const rollValue = check.total_roll || '?';
            const successStatus = check.success ? 'success' : 'failure';
            const title = check.complete_rows ? 
                `Skada ${check.damage_taken}: ${check.dice_rolled}T6 (${check.complete_rows} kompletta rader) = ${check.total_roll} vs ${check.willpower}` :
                `Resultat: ${rollValue}`;
            
            return `<span class="shock-check ${successStatus}" title="${title}">
                ${rollValue}
            </span>`;
        }).join('');
        
        return `
            <div class="character-card">
                <button class="delete-btn" onclick="app.deleteCharacter('${character.id}')" title="Ta bort karaktär">
                    ×
                </button>
                
                <div class="character-header">
                    <div class="character-name">${character.name}</div>
                    <div class="character-status status-${statusClass}">${status}</div>
                </div>
                
                <div class="shock-section">
                    <div class="shock-info">
                        <span>Chockrutor:</span>
                        <span>${filledBoxes}/50</span>
                    </div>
                    
                    ${shockGrid}
                    
                    <div class="shock-legend">
                        <div class="legend-item">
                            <div class="legend-box"></div>
                            <span>Tom</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-box filled"></div>
                            <span>Skadad</span>
                        </div>
                    </div>
                    
                    ${recentChecks.length > 0 ? `
                        <div class="shock-checks">
                            <strong>Senaste chockkast:</strong> ${shockCheckDisplay}
                        </div>
                    ` : ''}
                </div>
                
                <div class="armor-info">
                    <span>🛡️ Rustning: ${character.armor}</span>
                    <span>🧠 Viljestyrka: ${character.willpower}</span>
                </div>
                
                <div class="character-actions">
                    <button class="btn btn-danger btn-small" onclick="app.showDamageModal('${character.id}')">
                        ⚔️ Skada
                    </button>
                    <button class="btn btn-success btn-small" onclick="app.showHealModal('${character.id}')">
                        ❤️ Läka
                    </button>
                    ${character.in_shock ? `
                        <button class="btn btn-warning btn-small" onclick="app.attemptShockRecovery('${character.id}')">
                            🎲 Chocktest
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    createShockGrid(shockBoxes) {
        let gridHtml = '<div class="shock-grid-with-labels">';
        
        // Add row labels
        gridHtml += '<div class="shock-labels">';
        for (let row = 0; row < 5; row++) {
            gridHtml += `<div class="shock-row-label">${row + 1}</div>`;
        }
        gridHtml += '</div>';
        
        // Add shock grid
        gridHtml += '<div class="shock-grid">';
        for (let i = 0; i < 50; i++) {
            const isFilled = shockBoxes[i] === 1;
            const boxNumber = i + 1;
            gridHtml += `<div class="shock-box ${isFilled ? 'filled' : ''}" title="Ruta ${boxNumber}">
                ${isFilled ? '✗' : ''}
            </div>`;
        }
        gridHtml += '</div></div>';
        
        return gridHtml;
    }

    getCharacterStatus(character) {
        const filledBoxes = character.shock_boxes.filter(box => box === 1).length;
        
        if (character.in_shock) {
            return 'I chock';
        } else if (filledBoxes === 0) {
            return 'Oskadad';
        } else if (filledBoxes <= 10) {
            return 'Lätt skadad';
        } else if (filledBoxes <= 25) {
            return 'Skadad';
        } else if (filledBoxes <= 40) {
            return 'Svårt skadad';
        } else {
            return 'Kritiskt skadad';
        }
    }

    async attemptShockRecovery(characterId) {
        try {
            const response = await fetch(`/api/characters/${characterId}/shock_recovery`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const result = await response.json();
                
                // Update character in local array
                const charIndex = this.characters.findIndex(c => c.id === characterId);
                if (charIndex !== -1) {
                    this.characters[charIndex] = result.character;
                }

                this.updateDisplay();
                
                const message = `Chocktest: ${result.recovery_roll}/6 - ${result.message}`;
                this.showNotification(message, result.success ? 'success' : 'warning');
            }
        } catch (error) {
            console.error('Error attempting shock recovery:', error);
            this.showNotification('Fel vid chocktest', 'error');
        }
    }

    showShockCheckResults(shockChecks) {
        const results = shockChecks.map(check => {
            const diceDisplay = check.individual_rolls ? check.individual_rolls.join('+') : check.total_roll;
            return `Skada ${check.damage_taken}: ${check.dice_rolled}T6 (${check.complete_rows} kompletta rader) → ${diceDisplay} = ${check.total_roll} vs Viljestyrka ${check.willpower} ${check.success ? '✓' : '✗'}`;
        }).join('<br>');
        
        const hasChecks = shockChecks.length > 0;
        const content = hasChecks ? results : 'Inga chockkast (mindre än 10 skador)';
        
        // Create a temporary notification with detailed results
        const notification = document.createElement('div');
        notification.className = 'notification notification-info';
        notification.innerHTML = `
            <div>
                <strong>Chockkast resultat:</strong><br>
                ${content}
            </div>
            <button onclick="this.parentElement.remove()">×</button>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            background: #2196F3;
            color: white;
            font-weight: bold;
            z-index: 10000;
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            max-width: 500px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 8000);
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;

        // Add styles for notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 1rem;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease;
        `;

        // Set background color based on type
        const colors = {
            success: '#4CAF50',
            error: '#F44336',
            warning: '#FF9800',
            info: '#2196F3'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new VikingCombatTracker();
});

// Global functions for modal management
function showAddCharacterModal() {
    window.app.showAddCharacterModal();
}

function hideAddCharacterModal() {
    window.app.hideAddCharacterModal();
}

function hideActionModal() {
    window.app.hideActionModal();
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
