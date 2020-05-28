import app from './example.ts'
import { debug } from './deps.ts'

const { env } = Deno
const logger = debug('*')

const PORT = Number(env.get('PORT')) || 8000
app.listen({ port: PORT})
logger('listening on %s', PORT)