from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import os

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for browser testing

# Simple configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root@localhost/todo_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db = SQLAlchemy(app)

# Enhanced Todo model
class Todo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    due_date = db.Column(db.Date, nullable=True)
    priority = db.Column(db.String(20), default='medium')  # low, medium, high
    category = db.Column(db.String(50), default='other')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Create tables with migration
with app.app_context():
    # Drop existing tables to recreate with new schema
    db.drop_all()
    db.create_all()
    print("Database tables recreated successfully!")

# Serve the test page
@app.route('/')
def index():
    return render_template('index.html')

# Simple routes
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'message': 'Hey! My todo API is working! 🎉',
        'status': 'running'
    })

@app.route('/api/todos', methods=['GET'])
def get_todos():
    todos = Todo.query.order_by(Todo.created_at.desc()).all()
    todo_list = []
    for todo in todos:
        todo_list.append({
            'id': todo.id,
            'title': todo.title,
            'completed': todo.completed,
            'due_date': todo.due_date.isoformat() if todo.due_date else None,
            'priority': todo.priority,
            'category': todo.category,
            'created_at': todo.created_at.isoformat()
        })
    return jsonify(todo_list)

@app.route('/api/todos', methods=['POST'])
def create_todo():
    data = request.get_json()
    
    if not data or 'title' not in data:
        return jsonify({'error': 'Title is required'}), 400
    
    # Parse due date if provided
    due_date = None
    if data.get('due_date'):
        try:
            due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
        except:
            pass
    
    new_todo = Todo(
        title=data['title'],
        due_date=due_date,
        priority=data.get('priority', 'medium'),
        category=data.get('category', 'other')
    )
    db.session.add(new_todo)
    db.session.commit()
    
    return jsonify({
        'id': new_todo.id,
        'title': new_todo.title,
        'completed': new_todo.completed,
        'due_date': new_todo.due_date.isoformat() if new_todo.due_date else None,
        'priority': new_todo.priority,
        'category': new_todo.category,
        'message': 'Todo created!'
    }), 201

@app.route('/api/todos/<int:todo_id>', methods=['PUT'])
def update_todo(todo_id):
    todo = Todo.query.get(todo_id)
    if not todo:
        return jsonify({'error': 'Todo not found'}), 404
    
    data = request.get_json()
    if 'title' in data:
        todo.title = data['title']
    if 'completed' in data:
        todo.completed = data['completed']
    if 'priority' in data:
        todo.priority = data['priority']
    if 'category' in data:
        todo.category = data['category']
    if 'due_date' in data:
        if data['due_date']:
            try:
                todo.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
            except:
                pass
        else:
            todo.due_date = None
    
    db.session.commit()
    return jsonify({
        'id': todo.id,
        'title': todo.title,
        'completed': todo.completed,
        'due_date': todo.due_date.isoformat() if todo.due_date else None,
        'priority': todo.priority,
        'category': todo.category,
        'message': 'Todo updated!'
    })

@app.route('/api/todos/<int:todo_id>', methods=['DELETE'])
def delete_todo(todo_id):
    todo = Todo.query.get(todo_id)
    if not todo:
        return jsonify({'error': 'Todo not found'}), 404
    
    db.session.delete(todo)
    db.session.commit()
    return jsonify({'message': 'Todo deleted!'})

@app.route('/api/todos/<int:todo_id>/toggle', methods=['PATCH'])
def toggle_todo(todo_id):
    todo = Todo.query.get(todo_id)
    if not todo:
        return jsonify({'error': 'Todo not found'}), 404
    
    todo.completed = not todo.completed
    db.session.commit()
    return jsonify({
        'id': todo.id,
        'title': todo.title,
        'completed': todo.completed,
        'due_date': todo.due_date.isoformat() if todo.due_date else None,
        'priority': todo.priority,
        'category': todo.category,
        'message': f'Todo {"completed" if todo.completed else "uncompleted"}!'
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)