import { memo } from 'react'

function TodoItem({ todo, onToggle, onDelete }) {
  return (
    <div className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        aria-label={todo.text}
        onChange={() => onToggle(todo.id)}
      />
      <span>{todo.text}</span>
      <button
        className="delete-btn"
        aria-label={`Delete "${todo.text}"`}
        onClick={() => onDelete(todo.id)}
      >
        Delete
      </button>
    </div>
  )
}

// memo skips re-rendering an item when its props are unchanged, e.g. while the
// user types in the input. This relies on onToggle/onDelete being stable
// (useCallback in App) and untouched todos keeping the same object reference.
export default memo(TodoItem)
