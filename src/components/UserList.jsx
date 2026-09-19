import { useEffect, useState } from 'react'

const USERS_URL = 'http://localhost:8080/api/user'

const emptyForm = { email: '', password: '', name: '', lastName: '', age: '', role: 'USER' }

function UserList() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const loadUsers = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(USERS_URL)
      if (!response.ok) throw new Error(`La API respondió con ${response.status}`)

      const payload = await response.json()
      const userList = Array.isArray(payload) ? payload : payload.data
      setUsers(Array.isArray(userList) ? userList : [])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible cargar los usuarios.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const handleEdit = (user) => {
    const userId = user.id ?? user.idUsuario
    if (userId === undefined) return

    setEditingId(userId)
    setForm({
      email: user.email ?? '',
      password: '',
      name: user.name ?? user.nombre ?? '',
      lastName: user.lastName ?? user.apellido ?? '',
      age: user.age ?? user.edad ?? '',
      role: user.role ?? user.rol ?? 'USER',
    })
    setError('')
    setSuccessMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setSuccessMessage('')
  }

  const handleDelete = async (userId) => {
    if (!window.confirm('¿Deseas eliminar este usuario?')) return

    setDeletingId(userId)
    setError('')
    setSuccessMessage('')

    try {
      const response = await fetch(`${USERS_URL}/id/${userId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error(`La API respondió con ${response.status}`)

      if (editingId === userId) handleCancelEdit()
      setSuccessMessage('Usuario eliminado correctamente.')
      await loadUsers()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible eliminar el usuario.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccessMessage('')

    const body = {
      email: form.email,
      name: form.name,
      lastName: form.lastName,
      age: Number(form.age),
      role: form.role,
    }
    if (form.password) body.password = form.password

    try {
      const response = await fetch(
        editingId === null ? USERS_URL : `${USERS_URL}/id/${editingId}`,
        {
          method: editingId === null ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      )
      if (!response.ok) {
        const responseMessage = await response.text()
        throw new Error(responseMessage || `La API respondió con ${response.status}`)
      }

      setForm(emptyForm)
      setEditingId(null)
      setSuccessMessage(editingId === null ? 'Usuario creado correctamente.' : 'Usuario actualizado correctamente.')
      await loadUsers()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : editingId === null
            ? 'No fue posible crear el usuario.'
            : 'No fue posible actualizar el usuario.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="users-panel" aria-labelledby="users-title">
      <div className="users-panel__heading">
        <div>
          <p className="catalog__eyebrow">Directorio</p>
          <h2 id="users-title">Gestionar usuarios</h2>
        </div>
        <span className="users-count">{users.length} registrados</span>
      </div>

      <form className="user-form" onSubmit={handleSubmit}>
        <div className="user-form__field"><label htmlFor="user-name">Nombre</label><input id="user-name" name="name" value={form.name} onChange={handleChange} required /></div>
        <div className="user-form__field"><label htmlFor="user-last-name">Apellido</label><input id="user-last-name" name="lastName" value={form.lastName} onChange={handleChange} required /></div>
        <div className="user-form__field user-form__field--wide"><label htmlFor="user-email">Correo electrónico</label><input id="user-email" name="email" type="email" value={form.email} onChange={handleChange} required /></div>
        <div className="user-form__field"><label htmlFor="user-age">Edad</label><input id="user-age" name="age" type="number" min="1" value={form.age} onChange={handleChange} required /></div>
        <div className="user-form__field"><label htmlFor="user-role">Rol</label><select id="user-role" name="role" value={form.role} onChange={handleChange} required><option value="USER">Usuario</option><option value="ADMIN">Administrador</option></select></div>
        <div className="user-form__field user-form__field--wide"><label htmlFor="user-password">Contraseña {editingId !== null && '(opcional)'}</label><input id="user-password" name="password" type="password" minLength="6" value={form.password} onChange={handleChange} required={editingId === null} placeholder={editingId !== null ? 'Dejar vacía para conservarla' : 'Mínimo 6 caracteres'} /></div>
        <div className="user-form__actions">
          <button type="submit" disabled={submitting}>{submitting ? 'Guardando...' : editingId === null ? 'Crear usuario' : 'Guardar cambios'}</button>
          {editingId !== null && <button type="button" className="button-secondary" onClick={handleCancelEdit}>Cancelar</button>}
        </div>
      </form>

      {successMessage && <p className="form-message">{successMessage}</p>}
      {error && <div className="status-message status-message--error"><p>{error}</p><button type="button" onClick={loadUsers}>Reintentar</button></div>}
      {loading && <p className="status-message">Cargando usuarios...</p>}
      {!loading && !error && users.length === 0 && <p className="status-message">No hay usuarios registrados.</p>}
      {!loading && !error && users.length > 0 && (
        <div className="users-table-wrap">
          <table className="users-table">
            <thead><tr><th>Usuario</th><th>Correo</th><th>Edad</th><th>Rol</th><th>Acciones</th></tr></thead>
            <tbody>
              {users.map((user, index) => {
                const userId = user.id ?? user.idUsuario
                const role = user.role ?? user.rol ?? 'USER'
                return (
                  <tr key={userId ?? index}>
                    <td><strong>{user.name ?? user.nombre} {user.lastName ?? user.apellido}</strong><small>ID #{userId ?? 'N/D'}</small></td>
                    <td>{user.email}</td><td>{user.age ?? user.edad}</td>
                    <td><span className={`role-badge role-badge--${role.toLowerCase()}`}>{role}</span></td>
                    <td>{userId !== undefined && <div className="user-actions"><button type="button" className="button-edit" onClick={() => handleEdit(user)} disabled={deletingId !== null}>Editar</button><button type="button" className="button-delete" onClick={() => handleDelete(userId)} disabled={deletingId !== null}>{deletingId === userId ? 'Eliminando...' : 'Eliminar'}</button></div>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default UserList