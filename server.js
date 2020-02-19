const fastify = require('fastify')({ logger: true })

fastify.get('/', async (request, reply) => {
  return { hello: 'world'}
})

fastify.get('/webhook', async (request, reply) => {
    return { status: 'ok'}
})

fastify.post('/webhook', async (request, reply) => {
    // console.log(request.body)
    // console.log(request.query)
    // console.log(request.params)
    // console.log(request.headers)
    // console.log(request.raw)
    // console.log(request.id)
    // console.log(request.ip)
    // console.log(request.ips)
    // console.log(request.hostname)
    try {
        const str = JSON.stringify(request.body)
        JSON.parse(str)
        const reqBody = request.body
        console.log(reqBody)
        return {secret: reqBody.secret}
    } catch (e) {
        return {Error: "Invalid body as JSON object.", Exception: e}
    }
})

const start = async () => {
  try {
    await fastify.listen(3000)
    fastify.log.info(`server listening on ${fastify.server.address().port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()