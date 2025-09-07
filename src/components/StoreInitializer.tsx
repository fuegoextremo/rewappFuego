'use client'

import { useEffect } from 'react'

/**
 * 🔧 INICIALIZADOR DEL STORE REDUX
 * 
 * Este componente ya no es necesario con Redux Toolkit y redux-persist
 * Redux persist maneja automáticamente la hidratación del estado
 * Se mantiene por compatibilidad con componentes que lo importen
 */
export function StoreInitializer() {
  useEffect(() => {
    // Redux persist maneja automáticamente la hidratación
    console.log('🔄 Redux store initialized with redux-persist')
  }, [])

  return null // No necesita renderizar nada
}
