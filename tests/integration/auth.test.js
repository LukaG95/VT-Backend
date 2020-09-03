const request = require('supertest')
const {User} = require('../../Models/userModel')

describe('authRoutes - signup', () => {
  beforeEach(() => { server = require('../../index') })  
  afterEach(async () => { 
    server.close()
    // await GenreModel.deleteMany({}) delete the DB
  })

  let token

  const exec = () => {
    return request(server)
      .post('/api/genres/create')
      .set('x-auth-token', token)
      .send({ name: 'genre 1' })
  }

  beforeEach(() => { 
    token = new UserModel().generateAuthToken()
  })  

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