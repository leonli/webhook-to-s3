const fastify = require('fastify')({ logger: true })
const { exec } = require("child_process");
const fs = require('fs')
const aws = require('aws-sdk')
const { Base64 } = require('js-base64')

const secret = process.env.WEBHOOK_SECRET
const api_token = process.env.API_TOKEN

fastify.get('/webhook', async (request, reply) => {
    return { status: 'ok'}
})

fastify.post('/webhook', async (request, reply) => {
    try {
        const str = JSON.stringify(request.body)
        JSON.parse(str)
        const req_body = request.body
        
        if(req_body.secret && req_body.secret == secret && 
            req_body.release && req_body.release.zipball_url) {
          // fetch the queries
          const ak = request.query.ak
          let sk = request.query.base64_sk
          const bucket = request.query.bucket

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

              // after downloading, re-zip the source file to correct the root directory issue for code build
              exec(`cd /tmp && unzip -qu ${filename} && cd /tmp/${repo} && zip -rq ${repo}.zip .`, (error) => {
                if (error) {
                  console.log(`error: ${error}`);
                  return;
                }
                console.log({rezip: "completed"})

                const zip_file = `/tmp/${repo}/${repo}.zip`

                // bucket param is required
                if(!bucket) return {bucket}
                
                // check if there is ak/sk then use them
                const s3_options = {}
                if(ak && sk) {
                  sk = Base64.decode(sk).replace('\n', '')
                  s3_options.accessKeyId = ak
                  s3_options.secretAccessKey = sk
                }
                const s3 = new aws.S3(s3_options)
                const s3_key = `${req_body.repository.full_name}.zip`
                // upload to s3
                const params = {
                  Body: fs.readFileSync(zip_file), 
                  Bucket: bucket, 
                  Key: s3_key
                };
                s3.putObject(params, (err, data) => {
                  if (err) console.log({err}) // an error occurred
                  else     console.log({s3_key, upload: 'completed'})           // successful response

                  // clear up the /tmp files
                  exec(`rm -rf /tmp/${repo} && rm -rf ${filename}`, (error) => {
                    if(error) console.log({error})
                    else {
                      console.log(filename + ' was deleted')
                      console.log(`/tmp/${repo}/` + ' was deleted')
                    }
                  })
                });

                delete s3

              })
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