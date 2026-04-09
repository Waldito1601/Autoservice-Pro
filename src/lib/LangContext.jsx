import { createContext, useContext, useState } from 'react'
import { translations } from './i18n'

const LangContext = createContext()

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('autoservice_lang') || 'en')

  const switchLang = (code) => {
    setLang(code)
    localStorage.setItem('autoservice_lang', code)
  }

  const t = (key) => translations[lang]?.[key] ?? translations['en']?.[key] ?? key

  return (
    <LangContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
