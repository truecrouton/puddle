import { graphql } from '@/generated/gql';

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
      }
    }
  `);

export const GET_CONTROLS = graphql(`
    query GetControls {
      controls {
        deviceId
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
    setDevice(input: $input)
  }
`);

export const SIGN_IN = graphql(`
  mutation SignIn($input: SignInInput!) {
    signIn(input: $input)
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
