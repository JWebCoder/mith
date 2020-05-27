import {
  assert,
  assertEquals,
  assertStrictEq,
} from "https://deno.land/std@v0.53.0/testing/asserts.ts"
import exampleApp from './example/example.ts'
import { delay } from "https://deno.land/std@v0.53.0/async/mod.ts"
Deno.test("server is created", () => {
  assert(exampleApp, 'is not created')
})

Deno.test("simple server setup test", async () => {
  const response = await fetch('http://localhost:8000')
  const result = await response.json()
  assertEquals(result.test, '/')
})

Deno.test("application closes", async () => {
  exampleApp.close()
  if (exampleApp.server) {
    assert((await exampleApp.server?.[Symbol.asyncIterator]().next()).done)
  }
})