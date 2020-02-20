const fastify = require('fastify')({ logger: true })
const { exec } = require("child_process");

const secret = process.env.WEBHOOK_SECRET
console.log({secret})
const api_token = process.env.API_TOKEN

fastify.get('/webhook', async (request, reply) => {
    return { status: 'ok'}
})

fastify.post('/webhook', async (request, reply) => {
    try {
        const str = JSON.stringify(request.body)
        JSON.parse(str)
        const req_body = request.body
        // debug log
        // console.log(req_body)
        // console.log(req_body.release.zipball_url)
        if(req_body.secret && req_body.secret == secret && 
            req_body.release && req_body.release.zipball_url) {
          const repo_id = req_body.repository.id
          const repo = req_body.repository.name
          const tag_name = req_body.release.tag_name
          const filename = '/tmp/' + repo_id + '-' +repo + '-' + tag_name + '.zip'      // destination path or path with filenname, default is ./
          const url = `https://code.awsrun.com/api/v1/repos/${req_body.repository.full_name}/archive/${tag_name}.zip`
          
          const cmd_download = `curl -s -X GET "${url}" -o "${filename}" -H "accept: application/json" -H "Authorization: token ${api_token}"`
          console.log({executing_download: url})
          exec(cmd_download, (error, stdout, stderr) => {
              if (error) {
                  console.log(`error: ${error.message}`);
                  return;
              }
              if (stderr) {
                  console.log(`stderr: ${stderr}`);
                  return;
              }
              console.log({download: 'completed', url})
              

          })

          return {im: "in"}
        }        
        return {status: "ok"}
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