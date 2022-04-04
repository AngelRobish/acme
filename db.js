const Sequelize = require('sequelize')
const jwt = require('jsonwebtoken');

// const SECRET_KEY = process.env.jwt
// const token = jwt.sign({user:"user"}, process.env.JWT);

const { STRING } = Sequelize
const config = {
  logging: false
}

if (process.env.LOGGING) {
  delete config.logging
}
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_db', config)

const User = conn.define('user', {
  username: STRING,
  password: STRING
})

User.byToken = async (token) => {
  try {
    const payload = await jwt.verify(token, process.env.JWT) //returns userid. the userid which is the payload. payload is ans object that contains whatever we put in it during sign
    console.log('payload ', payload)//payload object also called "claims"
    const user = await User.findByPk(payload.userId)
    if (user) {
      return user
    }
    const error = Error('bad credentials')
    error.status = 401
    throw error
  } catch (ex) {
    const error = Error('bad credentials')
    error.status = 401
    throw error
  }
}

User.authenticate = async ({username, password}) => { //check password and if correct, sign then user. once this runs, token ver

  const user = await User.findOne({
    where: {
      username,
      password
    }
  })
  if (user) {
    const token = await jwt.sign({userId: user.id}, process.env.JWT, {expiresIn: '5m'}) //creates a string
    console.log('token ' ,token)
    return token
  }
  const error = Error('bad credentials')
  error.status = 401
  throw error
}

const syncAndSeed = async () => {
  await conn.sync({ force: true })
  const credentials = [
    { username: 'lucy', password: 'lucy_pw' },
    { username: 'moe', password: 'moe_pw' },
    { username: 'larry', password: 'larry_pw' }
  ]
  const [lucy, moe, larry] = await Promise.all(
    credentials.map(credential => User.create(credential))
  )
  return {
    users: {
      lucy,
      moe,
      larry
    }
  }
}

module.exports = {
  syncAndSeed,
  models: {
    User
  }
}
