export async function authenticatedFetch(
  url,
  options = {},
  { accessToken, tokenType = 'Bearer', onUnauthorized },
) {
  if (!accessToken) {
    throw new Error('No hay un token de acceso. Inicia sesión de nuevo.')
  }

  const headers = new Headers(options.headers)
  headers.set('Authorization', `${tokenType || 'Bearer'} ${accessToken}`)

  const response = await fetch(url, { ...options, headers })

  if (response.status === 401) {
    onUnauthorized?.()
  }

  return response
}
