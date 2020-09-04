const request = require('supertest')
const {User} = require('../../Models/userModel')
const {createToken} = require('../../Controllers/authController')

describe('authRoutes - protect', () => {
  beforeEach(() => { server = require('../../index'); token = createToken('5f49163b5519cb996a1c9e14')  })  // has to be a valid objectID
  afterEach(async () => { 
    server.close()
    // await GenreModel.deleteMany({}) delete the DB
  })

  let token

  const exec = () => {
    return request(server)
      .get('/api/auth/getUser')
      .set('Cookie', [`jwt = ${token}`])
      // .send({ username: 'Ryu', email: "test@gmail.com", password: "123456", passwordConfirm: "123456" })
  }



  it('should return 401 if no token is provided', async () => {
    token = ''

    const res = await exec()
    
    expect(res.status).toBe(401)
  })

  it('should return 400 if token is invalid', async () => {
    token = "a"

    const res = await exec()
    
    expect(res.status).toBe(400)
  })
  
  it('should return 200 if token is valid', async () => {
    const res = await exec()
    
    expect(res.status).toBe(200)
  })

})  