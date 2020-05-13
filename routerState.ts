const state: {
  [key: number]: string
} = {}

export const setStatePath = (id: number, path: string) => {
  return state[id] = path
}

export const getStatePath = (id: number) => {
  return state[id]
}

export const deleteStatePath = (id: number) => {
  delete state[id]
}