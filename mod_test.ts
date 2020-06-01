import {
  assert,
  assertEquals,
} from "https://deno.land/std@v0.53.0/testing/asserts.ts"
import { existsSync } from 'https://deno.land/std@0.53.0/fs/mod.ts'

const afterFile = './after.dat'

export async function test(name: string, fn: () => void | Promise<void>) {
  async function wrapped() {
    if (existsSync(afterFile)) {
      Deno.removeSync(afterFile)
    }
    try {
      await fn();
      if (existsSync(afterFile)) {
        const decoder = new TextDecoder('utf-8')
        const data = Deno.readFileSync(afterFile)
        console.log(decoder.decode(data))  
      }
    } finally {
      if (existsSync(afterFile)) {
        Deno.removeSync(afterFile)
      }
    }
  }
  Deno.test({ name, fn: wrapped })
}

test("server is created", async () => {
  const { default: app } = await import('./app_test.ts')
  assert(app, 'is not created')
})

test("simple server setup test", async () => {
  const { default: app } = await import('./app_test.ts')
  app.listen({ port: 8000})
  const response = await fetch(
    'http://localhost:8000',
    {
      method: 'POST',
      body: JSON.stringify({
        type: 'json'
      }),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }
  )
  const result = await response.json()
  app.close()
  assertEquals(result.test, 'json')
  assertEquals(result.before, true)
})

test("urlenconded request", async () => {
  const { default: app } = await import('./app_test.ts')
  app.listen({ port: 8000})
  const response = await fetch(
    'http://localhost:8000',
    {
      method: 'POST',
      body: 'type=urlencoded',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  )
  const result = await response.json()
  app.close()
  assertEquals(result.test, 'urlencoded')
})

test("test request", async () => {
  const { default: app } = await import('./app_test.ts')
  app.listen({ port: 8000})
  const response = await fetch(
    'http://localhost:8000',
    {
      method: 'POST',
      body: 'text',
      headers: {
        'Content-Type': 'text/plain'
      }
    }
  )
  const result = await response.json()
  app.close()
  assertEquals(result.test, 'text')
})

test("request with error", async () => {
  const { default: app } = await import('./app_test.ts')
  app.listen({ port: 8000})
  const response = await fetch(
    'http://localhost:8000',
    {
      method: 'POST',
      body: JSON.stringify({
        type: 'error'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
  const result = await response.text()
  app.close()
  assertEquals(result, 'error')
})

test("redirect", async () => {
  const { default: app } = await import('./app_test.ts')
  app.listen({ port: 8000})
  const response = await fetch(
    'http://localhost:8000',
    {
      method: 'POST',
      body: JSON.stringify({
        type: 'redirect'
      }),
      headers: {
        'Content-Type': 'application/json'
      },
      redirect: 'manual'
    }
  )
  app.close()
  assertEquals(response.type, 'opaqueredirect')
})

test("application closes", async () => {
  const { default: app } = await import('./app_test.ts')
  app.listen({ port: 8000})
  await app.close()
  if (app.server) {
    assert((await app.server?.[Symbol.asyncIterator]().next()).done)
  }
})