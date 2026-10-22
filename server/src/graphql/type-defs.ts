export const typeDefs = `#graphql
  input SetDeviceInput {
    deviceId: Int!
    state: String!
  }

  input SignInInput {
    username: String!
    password: String!
  }

  input SignUpInput {
    username: String!
    password: String!
    name: String!
    isAdmin: Boolean!
    authPhrase: String!
  }

  input UpsertDeviceInput {
    id: Int!
    name: String!
    kind: String!
    stateKey: String
    setKey: String
    setSuffix: String
    valueOn: String
    valueOff: String
    topicId: Int!
  }

  input UpsertTopicInput {
    id: Int!
    topic: String!
  }

  type Automation {
    id: Int!
    name: String!
    trigger: String!
    triggerAt: String
    position: String
    topicId: Int
    triggerKey: String
    triggerValue: String
    isControlShown: Boolean
    expressions: [Expression!]!
  }

  type Chart {
    id: Int!
    name: String!
    topicId: Int!
    key: String!
  }

  type Control {
    deviceId: Int!
    name: String!
    kind: String!
    setKey: String!
    state: String!
    stateKey: String!
    topicId: Int!
    valueOn: String!
    valueOff: String!
  }
  
  type Device {
    id: Int!
    name: String!
    kind: String!
    stateKey: String
    setKey: String
    setSuffix: String
    valueOn: String
    valueOff: String
    topicId: Int!
    topic: Topic
  }

  type Expression {
    id: Int!
    kind: String!
    isElseStep: Boolean!
    expression: String
    conditionalExpressionId: Int
    topicId: Int
    topic: String
    message: String
    deviceId: Int
    deviceKind: String
    deviceName: String
    state: String
  }

  type Favorite {
    name: String!
    topicId: Int!
    stateKey: String!
    state: String!
  }

  type Schedule {
    name: String!
    runsAt: String
    automations: [Automation!]!
  }

  type Topic {
    id: Int!
    topic: String!
    devices: [Device!]
    automations: [Automation!]
    usedInAutomations: [Automation!]
  }

  type User {
    id: Int!
    username: String!
    password: String!
    name: String!
    isAdmin: Boolean!
  }

  type Query {
    automation(id: Int!): Automation
    automations: [Automation!]!
    charts: [Chart!]!
    controls: [Control!]!
    device(id: Int!): Device
    devices: [Device!]!
    favorites: [Favorite!]!
    schedule: [Schedule!]!
    topics: [Topic!]!
  }

  type Mutation {
    upsertDevice(input: UpsertDeviceInput!): Device!
    upsertTopic(input: UpsertTopicInput!): Topic!
    setDevice(input: SetDeviceInput!): Boolean!
    signIn(input: SignInInput!): Boolean!
    signOut: Boolean!
    signUp(input: SignUpInput!): Boolean!
  }
`;