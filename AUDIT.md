# Refactoring Audit

This document lists every issue found in the Todo app, why it mattered, and how it was fixed. Each fix is a separate commit, in the order below. All 5 original tests pass after every commit, and no new features were added.

## Summary

| # | Category | Issue | Commit |
|---|---|---|---|
| 1 | Security | Hardcoded API key logged to the console | `security: remove hardcoded API key and debug console logs` |
| 2 | Security | Stored XSS through `dangerouslySetInnerHTML` | `security: render todo text as plain text to prevent XSS` |
| 3 | Bug / Error handling | Todos wiped on reload; corrupt storage crashed the app | `fix: load todos via lazy state init and handle localStorage errors` |
| 4 | Bug | `Date.now()` IDs could collide | `fix: use crypto.randomUUID for todo ids to prevent key collisions` |
| 5 | Performance | Stale state in updates, handlers recreated every render | `perf: use functional state updates and memoize handlers with useCallback` |
| 6 | Performance | Filter and stats recomputed on every keystroke | `perf: memoize filtered todos and stats with useMemo` |
| 7 | Code quality | Duplicated inline styles on filter buttons | `refactor: replace inline filter styles with CSS classes` |
| 8 | Best practice / a11y | Deprecated `onKeyPress` for Enter handling | `refactor: use form submit instead of deprecated onKeyPress` |
| 9 | Accessibility | Missing labels and ARIA state | `a11y: add accessible labels and ARIA state to controls` |
| 10 | UX / a11y | Blocking `alert()`; whitespace saved as todo text | `fix: replace alert with inline validation message and trim input` |
| 11 | UX | No empty state | `ux: show empty state when there are no todos to display` |
| 12 | Error handling | No error boundary | `fix: add error boundary to prevent a blank screen on render errors` |
| 13 | Performance / structure | Every item re-rendered on every keystroke | `perf: extract memoized TodoItem component` |
| 14 | Error handling | Malformed items in storage crashed rendering | `fix: skip malformed todo items loaded from storage` |
| 15 | Cleanup | Trailing whitespace, unused import | `chore: remove trailing whitespace and unused test import` |

## Details

### 1. Hardcoded API key and debug logs (Security)
- **Problem:** `const API_KEY = 'sk-...'` sat in `App.jsx` and was printed with `console.log` on every render, alongside a second debug log of all todos.
- **Why it matters:** everything in frontend code ships to the browser, so anyone could read the key in DevTools or in the bundle. The key was not used at all.
- **Fix:** removed the key and both logs entirely. A key that was ever committed should also be rotated, because it stays in git history. Vite `VITE_*` env vars are also embedded in the bundle, so real secrets must live behind a backend.

### 2. Stored XSS (Security)
- **Problem:** todo text was rendered with `dangerouslySetInnerHTML`.
- **Why it matters:** a todo such as `<img src=x onerror="alert(1)">` ran script. It was saved to `localStorage`, so it ran again on every page load (stored XSS).
- **Fix:** render `{todo.text}` as plain JSX text. React escapes it automatically.

### 3. Loading and saving `localStorage` (Bug + error handling)
- **Problem:** todos were loaded in a `useEffect` after the first render, and the save effect had no dependency array. In `StrictMode` the save effect wrote the initial `[]` over the stored data before it was restored, so **all todos disappeared on reload**. `JSON.parse` also had no `try/catch`, so corrupt data crashed the app with a white screen. The save effect also ran on every keystroke.
- **Fix:** load once with a lazy initializer, `useState(loadTodos)`, wrapped in `try/catch` and an `Array.isArray` check. The save effect now depends on `[todos]` and catches errors such as `QuotaExceededError`.

### 4. Colliding IDs (Bug)
- **Problem:** `id: Date.now()` gave two todos the same ID when they were created in the same millisecond. The tests showed this as an intermittent `Encountered two children with the same key` warning.
- **Why it matters:** duplicate React keys, and delete or toggle affecting several todos at once.
- **Fix:** `crypto.randomUUID()`. It is built in, so no dependency was added. It requires a secure context (HTTPS or localhost). Old numeric IDs still work.

### 5. Functional updates and `useCallback` (Performance)
- **Problem:** `setTodos([...todos, x])` read a possibly stale `todos` snapshot from the closure, and every handler was a new function on each render.
- **Fix:** `setTodos(prev => ...)` everywhere. Because `deleteTodo` and `toggleTodo` no longer read `todos`, they are wrapped in `useCallback` with `[]`, and `addTodo` with `[input]`. The stable references pay off in #13.

### 6. `useMemo` for filter and stats (Performance)
- **Problem:** the filtered list and stats were recomputed on every render, including every keystroke. Stats also ran `filter` twice.
- **Fix:** `useMemo` with `[todos, filter]` for the list and `[todos]` for stats. `active` is now `total - completed`, so only one pass is needed.

### 7. Inline styles (Code quality)
- **Problem:** the filter buttons used inline styles with hardcoded colors, duplicated three times. They were inconsistent with `index.css`, and they also overrode `button:hover`, so the filter buttons had no hover effect.
- **Fix:** a `FILTERS` constant rendered with `.map()`, plus `.filters` and `.filter-btn.selected` classes. The look is unchanged, and hover works again.

### 8. Deprecated `onKeyPress` (Best practice)
- **Problem:** Enter was detected manually through the deprecated `keypress` event, which also misfires while composing text with an IME (for example Japanese or Chinese input).
- **Fix:** the input and button are now a `<form>` with `onSubmit` and `preventDefault()`, so Enter and clicking Add take the same native path.

### 9. Labels and ARIA (Accessibility)
- **Problem:** the input only had a placeholder, which is not a label. Every delete button was announced only as "Delete", and the selected filter was conveyed by color alone.
- **Fix:** `aria-label` on the input, each checkbox (the todo text), and each delete button (`Delete "<text>"`). The filter buttons are a labelled `role="group"` with `aria-pressed`, and the stats are an `aria-live` region.

### 10. `alert()` and untrimmed text (UX / a11y)
- **Problem:** empty input triggered a blocking `alert()`, and text was saved untrimmed (`"  milk  "`).
- **Fix:** an inline `role="alert"` message linked to the input with `aria-describedby` and `aria-invalid`. It clears when the user types. Text is trimmed before saving.

### 11. Empty state (UX)
- **Problem:** an empty list, or a filter with no matches, showed a blank area.
- **Fix:** a short message that tells the two cases apart ("No todos yet" and "No todos match this filter").

### 12. Error boundary (Error handling)
- **Problem:** any render error unmounted the whole app, leaving a white screen.
- **Fix:** `ErrorBoundary` (a class component, since React has no hook for this) wraps `<App />` in `main.jsx`. It logs the error and shows a fallback with a Reload button.

### 13. `TodoItem` with `React.memo` (Performance / structure)
- **Problem:** all items were inline JSX in `App`, so every keystroke re-rendered every item.
- **Fix:** extracted a memoized `TodoItem`. Combined with the stable handlers from #5, typing re-renders no items, and toggling re-renders only the changed item. This was verified with a render counter.

### 14. Malformed items in storage (Error handling)
- **Problem:** `loadTodos` checked only that the data was an array. Data such as `[null]` passed the check, then crashed on `todo.completed`.
- **Fix:** an `isValidTodo` filter that checks `id`, `text` and `completed`, so invalid items are skipped.

### 15. Cleanup
- Removed whitespace-only lines in `App.jsx`, and an unused `expect` import in `src/test/setup.js` (Vitest `globals` is enabled).

## Not changed, on purpose
- **TypeScript and PropTypes:** the project is plain JSX. Adding TypeScript would be a rewrite, and PropTypes would add a dependency.
- **New tests:** the task requires the existing tests to pass. Behaviour of the new code (inline error, empty state, error boundary, memoization, storage validation) was verified with temporary tests that were not committed.
