from flask import Flask, render_template, request, jsonify, session
import json
import uuid
import random
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'viking_secret_key_change_in_production'

# In-memory storage for demo (you might want to use a database later)
characters = {}
combat_sessions = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/characters', methods=['GET', 'POST'])
def handle_characters():
    if request.method == 'POST':
        data = request.json
        char_id = str(uuid.uuid4())
        character = {
            'id': char_id,
            'name': data.get('name'),
            'shock_boxes': [0] * 50,  # 5 rows x 10 boxes = 50 boxes, 0=empty, 1=filled
            'armor': data.get('armor', 0),
            'willpower': data.get('willpower', 15),  # Viljestyrka (default 15)
            'in_shock': False,
            'shock_checks': [],  # List of shock check results
            'created_at': datetime.now().isoformat()
        }
        characters[char_id] = character
        return jsonify(character)
    
    return jsonify(list(characters.values()))

@app.route('/api/characters/<char_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_character(char_id):
    if char_id not in characters:
        return jsonify({'error': 'Character not found'}), 404
    
    if request.method == 'GET':
        return jsonify(characters[char_id])
    
    elif request.method == 'PUT':
        data = request.json
        character = characters[char_id]
        character.update(data)
        return jsonify(character)
    
    elif request.method == 'DELETE':
        del characters[char_id]
        return jsonify({'message': 'Character deleted'})

@app.route('/api/characters/<char_id>/damage', methods=['POST'])
def apply_damage(char_id):
    if char_id not in characters:
        return jsonify({'error': 'Character not found'}), 404
    
    data = request.json
    damage = data.get('damage', 0)
    damage_type = data.get('type', 'normal')
    
    character = characters[char_id]
    
    # Apply armor reduction for physical damage
    if damage_type == 'physical':
        damage = max(0, damage - character.get('armor', 0))
    
    # Find first empty shock boxes and fill them
    shock_checks = []
    boxes_filled = 0
    
    # First, apply all the damage
    for i in range(50):  # 50 shock boxes total
        if character['shock_boxes'][i] == 0 and boxes_filled < damage:
            character['shock_boxes'][i] = 1
            boxes_filled += 1
    
    # Then, make ONE shock check based on total complete rows
    if boxes_filled > 0:
        # Count how many COMPLETE rows are filled after all damage
        complete_rows = 0
        for row in range(5):
            row_start = row * 10
            row_end = row_start + 10
            row_boxes = character['shock_boxes'][row_start:row_end]
            if all(box == 1 for box in row_boxes):  # All 10 boxes filled
                complete_rows += 1
        
        # Only make shock check if we have at least one complete row
        if complete_rows > 0:
            dice_to_roll = complete_rows
            rolls = [random.randint(1, 6) for _ in range(dice_to_roll)]
            total_roll = sum(rolls)
            
            shock_check = {
                'damage_taken': boxes_filled,
                'complete_rows': complete_rows,
                'dice_rolled': dice_to_roll,
                'individual_rolls': rolls,
                'total_roll': total_roll,
                'willpower': character['willpower'],
                'success': total_roll <= character['willpower']
            }
            shock_checks.append(shock_check)
            
            # If failed shock check, character goes into shock
            if total_roll > character['willpower']:
                character['in_shock'] = True
    
    # Add shock checks to character history
    character['shock_checks'].extend(shock_checks)
    
    # Count total filled boxes
    filled_boxes = sum(character['shock_boxes'])
    
    return jsonify({
        'character': character,
        'damage_dealt': boxes_filled,
        'shock_checks': shock_checks,
        'total_filled_boxes': filled_boxes,
        'in_shock': character['in_shock']
    })

@app.route('/api/characters/<char_id>/heal', methods=['POST'])
def heal_character(char_id):
    if char_id not in characters:
        return jsonify({'error': 'Character not found'}), 404
    
    data = request.json
    healing = data.get('healing', 0)
    
    character = characters[char_id]
    
    # Clear shock boxes from the end (last filled boxes heal first)
    boxes_healed = 0
    for i in range(49, -1, -1):  # Start from last box
        if character['shock_boxes'][i] == 1 and boxes_healed < healing:
            character['shock_boxes'][i] = 0
            boxes_healed += 1
    
    # If any boxes were healed, character might recover from shock
    if boxes_healed > 0:
        character['in_shock'] = False  # Player can choose to try to recover from shock
    
    filled_boxes = sum(character['shock_boxes'])
    
    return jsonify({
        'character': character,
        'boxes_healed': boxes_healed,
        'total_filled_boxes': filled_boxes
    })

@app.route('/api/characters/<char_id>/shock_recovery', methods=['POST'])
def shock_recovery(char_id):
    """Attempt to recover from shock"""
    if char_id not in characters:
        return jsonify({'error': 'Character not found'}), 404
    
    character = characters[char_id]
    
    if not character['in_shock']:
        return jsonify({'error': 'Character is not in shock'}), 400
    
    # Roll T6 against willpower for shock recovery
    recovery_roll = random.randint(1, 6)
    success = recovery_roll <= character['willpower']
    
    if success:
        character['in_shock'] = False
    
    return jsonify({
        'character': character,
        'recovery_roll': recovery_roll,
        'willpower': character['willpower'],
        'success': success,
        'message': f'Återhämtning {"lyckades" if success else "misslyckades"}! (Slog {recovery_roll} mot Viljestyrka {character["willpower"]})'
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
