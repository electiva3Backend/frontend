import { useState } from 'react'

const USER_URL = 'http://localhost:8080/api/user'

const initialLoginForm = { email: '', password: '' }
const initialRegisterForm = {
  email: '',
  password: '',
  name: '',
  lastName: '',
  age: '',
}

function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [loginForm, setLoginForm] = useState(initialLoginForm)
  const [registerForm, setRegisterForm] = useState(initialRegisterForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const changeMode = (nextMode) => {
    setMode(nextMode)
    setError('')
    setSuccess('')
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    const updateForm = mode === 'login' ? setLoginForm : setRegisterForm
    updateForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    const isLogin = mode === 'login'
    const endpoint = isLogin ? `${USER_URL}/login` : USER_URL
    const body = isLogin
      ? loginForm
      : {
          ...registerForm,
          age: Number(registerForm.age),
          role: 'USER',
        }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const responseMessage = await response.text()
        throw new Error(responseMessage || `La API respondió con ${response.status}`)
      }

      const user = await response.json()

      if (isLogin) {
        onAuthenticated(user)
      } else {
        setLoginForm({ email: registerForm.email, password: registerForm.password })
        setMode('login')
        setSuccess('Cuenta creada correctamente. Ahora puedes iniciar sesión.')
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No fue posible completar la solicitud.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const isLogin = mode === 'login'

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <p className="auth-intro__eyebrow">Inventario digital</p>
        <h1>Todo tu catálogo, en un solo lugar.</h1>
        <p>Accede a tu espacio de trabajo para consultar y administrar tus productos.</p>
      </section>

      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-card__header">
          <p className="auth-card__eyebrow">Bienvenido</p>
          <h2 id="auth-title">{isLogin ? 'Inicia sesión' : 'Crea tu cuenta'}</h2>
          <p>{isLogin ? 'Ingresa tus datos para continuar.' : 'Completa tus datos para comenzar.'}</p>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Autenticación">
          <button
            className={isLogin ? 'auth-tab auth-tab--active' : 'auth-tab'}
            type="button"
            role="tab"
            aria-selected={isLogin}
            onClick={() => changeMode('login')}
          >
            Iniciar sesión
          </button>
          <button
            className={!isLogin ? 'auth-tab auth-tab--active' : 'auth-tab'}
            type="button"
            role="tab"
            aria-selected={!isLogin}
            onClick={() => changeMode('register')}
          >
            Registrarme
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="auth-form__row">
              <div className="auth-form__field">
                <label htmlFor="name">Nombre</label>
                <input id="name" name="name" value={registerForm.name} onChange={handleChange} required />
              </div>
              <div className="auth-form__field">
                <label htmlFor="lastName">Apellido</label>
                <input
                  id="lastName"
                  name="lastName"
                  value={registerForm.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          )}

          <div className="auth-form__field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              value={isLogin ? loginForm.email : registerForm.email}
              onChange={handleChange}
              placeholder="tu@correo.com"
              required
            />
          </div>

          {!isLogin && (
            <div className="auth-form__field">
              <label htmlFor="age">Edad</label>
              <input
                id="age"
                name="age"
                type="number"
                min="1"
                value={registerForm.age}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="auth-form__field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              value={isLogin ? loginForm.password : registerForm.password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              minLength="6"
              required
            />
          </div>

          {error && <p className="auth-message auth-message--error">{error}</p>}
          {success && <p className="auth-message auth-message--success">{success}</p>}

          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Procesando...' : isLogin ? 'Entrar al catálogo' : 'Crear cuenta'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default AuthPage
