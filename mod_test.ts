import {
  assert,
  assertEquals,
  assertStrictEq,
} from "https://deno.land/std@v0.53.0/testing/asserts.ts"

Deno.test("server is created", async () => {
  const { default: app } = await import('./app_test.ts')
  assert(app, 'is not created')
})

Deno.test("simple server setup test", async () => {
  const { default: app } = await import('./app_test.ts')
  app.listen({ port: 8000})
  const response = await fetch(
    'http://localhost:8000',
    {
      method: 'POST',
      body: JSON.stringify({
        stuff: 'cool'
      }),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }
  )
  const result = await response.json()
  app.close()
  assertEquals(result.test, 'test')
})

Deno.test("request with error", async () => {
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

Deno.test("redirect", async () => {
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

Deno.test("application closes", async () => {
  const { default: app } = await import('./app_test.ts')
  app.listen({ port: 8000})
  await app.close()
  if (app.server) {
    assert((await app.server?.[Symbol.asyncIterator]().next()).done)
  }
})