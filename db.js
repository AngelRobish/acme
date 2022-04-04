const Sequelize = require('sequelize')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { user } = require('pg/lib/defaults')

// const SECRET_KEY = process.env.jwt
// const token = jwt.sign({user:"user"}, process.env.JWT);

const { STRING } = Sequelize
const config = {
  logging: false
}

if (process.env.LOGGING) {
  delete config.logging
}
const conn = new Sequelize(
  process.env.DATABASE_URL || 'postgres://localhost/acme_db',
  config
)

const User = conn.define('user', {
  username: STRING,
  password: STRING
})

const Note = conn.define('note', {
  text: STRING
})

Note.belongsTo(User)
User.hasMany(Note)

User.beforeCreate(async (user) => {
  const saltRounds = 15
  const hashedPassword = await bcrypt.hash(user.password, saltRounds)
  user.password = hashedPassword
  console.log(user.password)
})

User.byToken = async (token) => {
  console.log(token, 'token in byToken')
  try {
    const payload = await jwt.verify(token, process.env.JWT) // eturns userid. the userid which is the payload. payload is ans object that contains whatever we put in it during sign
    console.log('payload ', payload) // payload object also called "claims"
    const user = await User.findByPk(payload.userId)
    if (user) {
      return user
    }
    const error = Error('bad byToken')
    error.status = 401
    throw error
  } catch (ex) {
    const error = Error('bad byToken2')
    error.status = 401
    throw error
  }
}

User.authenticate = async ({ username, password }) => {
  // check password and if correct, sign then user. once this runs, token ver
  const user = await User.findOne({
    where: {
      username
    }
  })
  try {
    const result = await bcrypt.compare(password, user.password)
    if (result === true) {
      const token = await jwt.sign({ userId: user.id }, process.env.JWT, {
        expiresIn: '5m'
      }) // creates a string
      console.log('result and userPassword ', result, user.password)
      console.log('token', token)
      return token
    }
  } catch (err) {
    console.log(err)
  }
}

const syncAndSeed = async () => {
  try {
    await conn.sync({ force: true })
    const credentials = [
      { username: 'lucy', password: 'lucy_pw' },
      { username: 'moe', password: 'moe_pw' },
      { username: 'larry', password: 'larry_pw' }
    ]
    const usersNotes = [
      { text: 'hello', userId: 1 },
      { text: 'world', userId: 2 },
      { text: 'hi', userId: 3 }
    ]
    const [lucy, moe, larry] = await Promise.all(
      credentials.map((credential) => User.create(credential))
    )
    Promise.all(usersNotes.map((note) => Note.create(note)))

    return {
      users: {
        lucy,
        moe,
        larry
      }
    }
  } catch (error) {
    console.log(error)
  }
}

module.exports = {
  syncAndSeed,
  models: {
    User
  }
}
