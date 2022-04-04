const express = require('express')
const app = express()
app.use(express.json())
const { models: { User, Notes } } = require('./db')
const path = require('path')


app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')))

app.post('/api/auth', async (req, res, next) => {
  try {
    res.send({ token: await User.authenticate(req.body) })  //req body has username password, then sends
  } catch (ex) {
    next(ex)
  }
})//hitting login button runs post,
//this runs authenticate method
//auth checks poassword and creates token and send that token back to browser
//browser stores token in local storage
//browser makes a get request to api which VERIFIES that the token is legit

app.get('/api/auth', async (req, res, next) => {
  try {
    res.send(await User.byToken(req.headers.authorization)) //header sent by browser,
  } catch (ex) {
    next(ex)
  }
})

app.get(`/api/user/${id}`, async (req, res, next) => {
  try {
    const user = await Notes.findOne({
      where: {
        userId: req.params.id }
      }
    )
  } catch (err) {
    next(err)
  }
})

app.use((err, req, res, next) => {
  console.log(err)
  res.status(err.status || 500).send({ error: err.message })
})

module.exports = app
