const userData: {
  [key: number]: {
    username: string,
    firstName: string,
    lastName: string
  }
} = {
  1: {
    username: 'JWebCoder',
    firstName: 'joao',
    lastName: 'Moura'
  },
  2: {
    username: 'PWebCoder',
    firstName: 'Pedro',
    lastName: 'Moura'
  }
}

export default class Users {
  static getUserById(id: number) {
    return userData[id] || null
  }

  static getUsers() {
    return userData
  }
}