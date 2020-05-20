// Copied from https://github.com/defunctzombie/node-util/blob/master/test/node/format.js
import {
  assert,
  assertEquals,
  assertStrictEq,
} from "https://deno.land/std@v0.51.0/testing/asserts.ts"
import { Mith } from "./mod.ts";

Deno.test("simple server setup test", async () => {
  const app = new Mith()
  app.use((req, res, next) => {
    res.body = 'test'
    next()
  })
  
  app.listen({port: 3000})
  await fetch('http://localhost:3000').then(
    async (response) => {
      const result = await response.text()
      console.log(result)
      assertEquals(result, 'test')
      app.close()
    }
  ).catch(
    (e) => {
      console.log(e)
    }
  )
})
