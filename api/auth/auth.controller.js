const authService = require('./auth.service')
const logger = require('../../services/logger.service')

async function login(req, res) {
  // === Demo mode fallback ===
  if (process.env.NODE_ENV === 'production') {
    const guestUser = { _id: 'guest', username: 'guest', fullname: 'Guest User' }
    req.session.user = guestUser
    return res.json(guestUser)
  }

  // === Normal behaviour (dev / local) ===
  const { username, password } = req.body
  try {
    const user = await authService.login(username, password)
    if (!user) return res.status(401).send({ err: 'Invalid credentials' })

    req.session.user = user
    res.json(user)
  } catch (err) {
    logger.error('Failed to Login ' + err)
    res.status(500).send({ err: 'Failed to Login' })
  }
}

async function signup(req, res) {
  try {
    const { username, password, fullname } = req.body
    const account = await authService.signup(username, password, fullname)
    logger.debug(`auth.route - new account created: ` + JSON.stringify(account))
    const user = await authService.login(username, password)
    req.session.user = user
    res.json(user)
  } catch (err) {
    logger.error('Failed to signup ' + err)
    res.status(500).send({ err: 'Failed to signup' })
  }
}

async function logout(req, res) {
  try {
    req.session.destroy()
    res.send({ msg: 'Logged out successfully' })
  } catch (err) {
    res.status(500).send({ err: 'Failed to logout' })
  }
}

module.exports = {
  login,
  signup,
  logout
}
