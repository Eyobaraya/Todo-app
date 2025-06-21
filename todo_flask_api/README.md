# Simple Todo API

A basic REST API built with Flask and MySQL for managing a todo list. This is my first attempt at building an API!

## What it does

- Create todos
- Get all todos  
- Update todos
- Delete todos
- Toggle todo completion

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Make sure MySQL is running and create a database called `todo_db`

3. Run the app:
```bash
python app.py
```

## API Endpoints

- `GET /api/health` - Check if API is working
- `GET /api/todos` - Get all todos
- `POST /api/todos` - Create a new todo
- `PUT /api/todos/<id>` - Update a todo
- `DELETE /api/todos/<id>` - Delete a todo
- `PATCH /api/todos/<id>/toggle` - Toggle todo completion
