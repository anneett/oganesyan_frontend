import './App.css'
import { store } from './app/store.ts'
import { Provider } from 'react-redux'
import { Exercises } from "./features/exercises/Exercises";

function App() {
  return (
      <Provider store={store}>
        <Exercises />
      </Provider>
  )
}

export default App
