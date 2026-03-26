const store = {
  token: null,

  setToken(t) {
    this.token = t
    if (t) localStorage.setItem('token', t)
    else localStorage.removeItem('token')
  },

  getToken() {
    if (!this.token) this.token = localStorage.getItem('token')
    return this.token
  },

  logout() {
    this.setToken(null)
  },

  isLoggedIn() {
    return !!this.getToken()
  },
}

export default store
