import { graphql } from "puddle-graphql";

export const DELETE_AUTOMATION = graphql(`
  mutation DeleteAutomation($input: IdInput!) {
    deleteAutomation(input: $input)
  }
`);

export const DELETE_CHART = graphql(`
  mutation DeleteChart($input: IdInput!) {
    deleteChart(input: $input)
  }
`);

export const DELETE_DEVICE = graphql(`
  mutation DeleteDevice($input: IdInput!) {
    deleteDevice(input: $input)
  }
`);

export const DELETE_EXPRESSION = graphql(`
  mutation DeleteExpression($input: IdInput!) {
    deleteExpression(input: $input)
  }
`);

export const DELETE_TOPIC = graphql(`
  mutation DeleteTopic($input: IdInput!) {
    deleteTopic(input: $input)
  }
`);

export const GET_AUTOMATION = graphql(`
    query GetAutomation($id: Int!) {
      automation(id: $id) {
        id
        name
        trigger
        triggerAt
        position
        topicId
        triggerKey
        triggerValue
        expressions {
          id
          automationId
          kind
          isElseStep
          expression
          conditionalExpressionId
          topicId
          topic
          message
          deviceId
          deviceKind
          deviceName
          state
        }
      }
    }
  `);

export const GET_AUTOMATIONS = graphql(`
    query GetAutomations {
      automations {
        id
        name
        trigger
      }
    }
  `);

export const GET_CHARTS = graphql(`
    query GetCharts {
      charts {
        id
        name
        topicId
        key
        isFavorite
      }
    }
  `);

export const GET_CONTROLS = graphql(`
    query GetControls {
      controls {
        id
        name
        kind
        stateKey
        setKey
        state
        valueOn
        valueOff
        topicId
      }
    }
  `);

export const GET_DEVICE = graphql(`
    query GetDevice($id: Int!) {
      device(id: $id) {
        id
        name
        kind
        stateKey
        setKey
        setSuffix
        valueOn
        valueOff
        topicId
        topic { topic }
      }
    }
  `);

export const GET_DEVICE_STUBS = graphql(`
    query GetDeviceStubs {
      devices {
        id
        name
        kind
      }
    }
  `);

export const GET_FAVORITES = graphql(`
    query GetFavorites {
      favorites {
        name
        topicId
        stateKey
        state
      }
    }
  `);

export const GET_PAIRS = graphql(`
    query GetPairs($topicId: Int!, $name: String!, $startDate: String!, $endDate: String!) {
      pairs(topicId: $topicId, name: $name, startDate: $startDate, endDate: $endDate) {
        value
        createdAt
      }
    }
  `);

export const GET_SCHEDULE = graphql(`
    query GetSchedule {
      schedule {
        name
        runsAt
        automations {
          id
          name
          trigger
        }
      }
    }
  `);

export const GET_TOPIC_STATUS = graphql(`
    query GetTopicStatus($id: Int!) {
      topic(id: $id) {
        id
        status {
          name
          value
        }
      }
    }
  `);

export const GET_TOPICS = graphql(`
    query GetTopics {
      topics {
        id
        topic
      }
    }
  `);

export const GET_TOPIC_DETAILS = graphql(`
    query GetTopicDetails {
      topics {
        id
        topic
        devices {
          id
          name
          kind
        }
        automations {
          id
          name
          trigger
        }
        usedInAutomations {
          id
          name
          trigger
        }
      }
    }
  `);

export const SET_DEVICE = graphql(`
  mutation SetDevice($input: SetDeviceInput!) {
    setDevice(input: $input) {
      id
      state
    }
  }
`);

export const SIGN_IN = graphql(`
  mutation SignIn($input: SignInInput!) {
    signIn(input: $input)
  }
`);

export const SIGN_OUT = graphql(`
  mutation SignOut {
    signOut
  }
`);

export const SIGN_UP = graphql(`
  mutation SignUp($input: SignUpInput!) {
    signUp(input: $input)
  }
`);

export const UPSERT_DEVICE = graphql(`
  mutation UpsertDevice($input: UpsertDeviceInput!) {
    upsertDevice(input: $input) {
      id
      name
      kind
    }
  }
`);

export const UPSERT_AUTOMATION = graphql(`
  mutation UpsertAutomation($input: UpsertAutomationInput!) {
    upsertAutomation(input: $input) {
      id
      name
      trigger
      triggerAt
      position
      topicId
      triggerKey
      triggerValue
      isControlShown
    }
  }
`);

export const UPSERT_CHART = graphql(`
  mutation UpsertChart($input: UpsertChartInput!) {
    upsertChart(input: $input) {
      id
      name
      topicId
      key
      isFavorite
    }
  }
`);

export const UPSERT_EXPRESSION = graphql(`
  mutation UpsertExpression($input: UpsertExpressionInput!) {
    upsertExpression(input: $input) {
      id
      automationId
      kind
      isElseStep
      expression
      conditionalExpressionId
      topicId
      topic
      message
      deviceId
      deviceKind
      deviceName
      state
    }
  }
`);

export const UPSERT_TOPIC = graphql(`
  mutation UpsertTopic($input: UpsertTopicInput!) {
    upsertTopic(input: $input) {
      id
      topic
    }
  }
`);
