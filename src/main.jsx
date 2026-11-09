import React from 'react'
import { Provider as ReduxProvider } from 'react-redux'
import { Provider as GlobalProvider } from './context/index.jsx'
import Loader from './components/shared/Loader.jsx'
import { createRoot } from 'react-dom/client'
import store from './store/index'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ReduxProvider store={store}>
      <GlobalProvider.Auth>
        <GlobalProvider.Admin>
          <Loader />
          <App />
        </GlobalProvider.Admin>
      </GlobalProvider.Auth>
    </ReduxProvider>
  </React.StrictMode>,
)
