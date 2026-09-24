import { useState, useEffect, useCallback, useMemo } from 'react'

const STORAGE_KEY = 'todos'

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' }
]

function loadTodos() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return []
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Failed to load todos from localStorage:', error)
    return []
  }
}

function App() {
  const [todos, setTodos] = useState(loadTodos)
  const [input, setInput] = useState('')
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
    } catch (error) {
      console.error('Failed to save todos to localStorage:', error)
    }
  }, [todos])

  const addTodo = useCallback(() => {
    const text = input.trim()
    if (text === '') {
      setError('Please enter a todo')
      return
    }

    const newTodo = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdAt: new Date().toISOString()
    }

    setTodos(prev => [...prev, newTodo])
    setInput('')
    setError('')
  }, [input])
  
  const deleteTodo = useCallback((id) => {
    setTodos(prev => prev.filter(todo => todo.id !== id))
  }, [])

  const toggleTodo = useCallback((id) => {
    setTodos(prev => prev.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }, [])
  
  const filteredTodos = useMemo(() => {
    if (filter === 'active') {
      return todos.filter(todo => !todo.completed)
    }
    if (filter === 'completed') {
      return todos.filter(todo => todo.completed)
    }
    return todos
  }, [todos, filter])
  
  const stats = useMemo(() => {
    const completed = todos.filter(todo => todo.completed).length
    return {
      total: todos.length,
      completed,
      active: todos.length - completed
    }
  }, [todos])
  
  const handleSubmit = (e) => {
    e.preventDefault()
    addTodo()
  }

  const handleInputChange = (e) => {
    setInput(e.target.value)
    if (error) setError('')
  }

  // Issue 10: Inline event handler dengan arrow function (re-create setiap render)
  return (
    <div className="app">
      <h1>My Todo List</h1>

      <form className="input-section" onSubmit={handleSubmit}>
        <input
          type="text"
          aria-label="New todo"
          aria-invalid={error !== ''}
          aria-describedby={error ? 'todo-error' : undefined}
          value={input}
          onChange={handleInputChange}
          placeholder="What needs to be done?"
        />
        <button type="submit">Add</button>
      </form>

      {error && (
        <p id="todo-error" className="error-message" role="alert">
          {error}
        </p>
      )}

      <div className="filters" role="group" aria-label="Filter todos">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={`filter-btn ${filter === value ? 'selected' : ''}`}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="todo-list">
        {/* Issue 13: Tidak ada handling untuk empty state */}
        {filteredTodos.map((todo) => (
          <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
            <input 
              type="checkbox"
              checked={todo.completed}
              aria-label={todo.text}
              onChange={() => toggleTodo(todo.id)}
            />
            {/* Issue 15: Potential XSS jika text dari user input */}
            <span>{todo.text}</span>
            <button
              className="delete-btn"
              aria-label={`Delete "${todo.text}"`}
              onClick={() => deleteTodo(todo.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
      
      <div className="stats" aria-live="polite">
        <p>Total: {stats.total} | Active: {stats.active} | Completed: {stats.completed}</p>
      </div>
    </div>
  )
}

export default App
