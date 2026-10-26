/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  mutation DeleteAutomation($input: IdInput!) {\n    deleteAutomation(input: $input)\n  }\n": typeof types.DeleteAutomationDocument,
    "\n  mutation DeleteChart($input: IdInput!) {\n    deleteChart(input: $input)\n  }\n": typeof types.DeleteChartDocument,
    "\n  mutation DeleteDevice($input: IdInput!) {\n    deleteDevice(input: $input)\n  }\n": typeof types.DeleteDeviceDocument,
    "\n  mutation DeleteExpression($input: IdInput!) {\n    deleteExpression(input: $input)\n  }\n": typeof types.DeleteExpressionDocument,
    "\n  mutation DeleteTopic($input: IdInput!) {\n    deleteTopic(input: $input)\n  }\n": typeof types.DeleteTopicDocument,
    "\n    query GetAutomation($id: Int!) {\n      automation(id: $id) {\n        id\n        name\n        trigger\n        triggerAt\n        position\n        topicId\n        triggerKey\n        triggerValue\n        expressions {\n          id\n          automationId\n          kind\n          isElseStep\n          expression\n          conditionalExpressionId\n          topicId\n          topic\n          message\n          deviceId\n          deviceKind\n          deviceName\n          state\n        }\n      }\n    }\n  ": typeof types.GetAutomationDocument,
    "\n    query GetAutomations {\n      automations {\n        id\n        name\n        trigger\n      }\n    }\n  ": typeof types.GetAutomationsDocument,
    "\n    query GetCharts {\n      charts {\n        id\n        name\n        topicId\n        key\n        isFavorite\n      }\n    }\n  ": typeof types.GetChartsDocument,
    "\n    query GetControls {\n      controls {\n        deviceId\n        name\n        kind\n        stateKey\n        setKey\n        state\n        valueOn\n        valueOff\n        topicId\n      }\n    }\n  ": typeof types.GetControlsDocument,
    "\n    query GetDevice($id: Int!) {\n      device(id: $id) {\n        id\n        name\n        kind\n        stateKey\n        setKey\n        setSuffix\n        valueOn\n        valueOff\n        topicId\n        topic { topic }\n      }\n    }\n  ": typeof types.GetDeviceDocument,
    "\n    query GetDeviceStubs {\n      devices {\n        id\n        name\n        kind\n      }\n    }\n  ": typeof types.GetDeviceStubsDocument,
    "\n    query GetFavorites {\n      favorites {\n        name\n        topicId\n        stateKey\n        state\n      }\n    }\n  ": typeof types.GetFavoritesDocument,
    "\n    query GetPairs($topicId: Int!, $name: String!, $startDate: String!, $endDate: String!) {\n      pairs(topicId: $topicId, name: $name, startDate: $startDate, endDate: $endDate) {\n        value\n        createdAt\n      }\n    }\n  ": typeof types.GetPairsDocument,
    "\n    query GetSchedule {\n      schedule {\n        name\n        runsAt\n        automations {\n          id\n          name\n          trigger\n        }\n      }\n    }\n  ": typeof types.GetScheduleDocument,
    "\n    query GetTopicStatus($id: Int!) {\n      topic(id: $id) {\n        id\n        status {\n          name\n          value\n        }\n      }\n    }\n  ": typeof types.GetTopicStatusDocument,
    "\n    query GetTopics {\n      topics {\n        id\n        topic\n      }\n    }\n  ": typeof types.GetTopicsDocument,
    "\n    query GetTopicDetails {\n      topics {\n        id\n        topic\n        devices {\n          id\n          name\n          kind\n        }\n        automations {\n          id\n          name\n          trigger\n        }\n        usedInAutomations {\n          id\n          name\n          trigger\n        }\n      }\n    }\n  ": typeof types.GetTopicDetailsDocument,
    "\n  mutation SetDevice($input: SetDeviceInput!) {\n    setDevice(input: $input)\n  }\n": typeof types.SetDeviceDocument,
    "\n  mutation SignIn($input: SignInInput!) {\n    signIn(input: $input)\n  }\n": typeof types.SignInDocument,
    "\n  mutation SignOut {\n    signOut\n  }\n": typeof types.SignOutDocument,
    "\n  mutation SignUp($input: SignUpInput!) {\n    signUp(input: $input)\n  }\n": typeof types.SignUpDocument,
    "\n  mutation UpsertDevice($input: UpsertDeviceInput!) {\n    upsertDevice(input: $input) {\n      id\n      name\n      kind\n    }\n  }\n": typeof types.UpsertDeviceDocument,
    "\n  mutation UpsertAutomation($input: UpsertAutomationInput!) {\n    upsertAutomation(input: $input) {\n      id\n      name\n      trigger\n      triggerAt\n      position\n      topicId\n      triggerKey\n      triggerValue\n      isControlShown\n    }\n  }\n": typeof types.UpsertAutomationDocument,
    "\n  mutation UpsertChart($input: UpsertChartInput!) {\n    upsertChart(input: $input) {\n      id\n      name\n      topicId\n      key\n      isFavorite\n    }\n  }\n": typeof types.UpsertChartDocument,
    "\n  mutation UpsertExpression($input: UpsertExpressionInput!) {\n    upsertExpression(input: $input) {\n      id\n      automationId\n      kind\n      isElseStep\n      expression\n      conditionalExpressionId\n      topicId\n      topic\n      message\n      deviceId\n      deviceKind\n      deviceName\n      state\n    }\n  }\n": typeof types.UpsertExpressionDocument,
    "\n  mutation UpsertTopic($input: UpsertTopicInput!) {\n    upsertTopic(input: $input) {\n      id\n      topic\n    }\n  }\n": typeof types.UpsertTopicDocument,
};
const documents: Documents = {
    "\n  mutation DeleteAutomation($input: IdInput!) {\n    deleteAutomation(input: $input)\n  }\n": types.DeleteAutomationDocument,
    "\n  mutation DeleteChart($input: IdInput!) {\n    deleteChart(input: $input)\n  }\n": types.DeleteChartDocument,
    "\n  mutation DeleteDevice($input: IdInput!) {\n    deleteDevice(input: $input)\n  }\n": types.DeleteDeviceDocument,
    "\n  mutation DeleteExpression($input: IdInput!) {\n    deleteExpression(input: $input)\n  }\n": types.DeleteExpressionDocument,
    "\n  mutation DeleteTopic($input: IdInput!) {\n    deleteTopic(input: $input)\n  }\n": types.DeleteTopicDocument,
    "\n    query GetAutomation($id: Int!) {\n      automation(id: $id) {\n        id\n        name\n        trigger\n        triggerAt\n        position\n        topicId\n        triggerKey\n        triggerValue\n        expressions {\n          id\n          automationId\n          kind\n          isElseStep\n          expression\n          conditionalExpressionId\n          topicId\n          topic\n          message\n          deviceId\n          deviceKind\n          deviceName\n          state\n        }\n      }\n    }\n  ": types.GetAutomationDocument,
    "\n    query GetAutomations {\n      automations {\n        id\n        name\n        trigger\n      }\n    }\n  ": types.GetAutomationsDocument,
    "\n    query GetCharts {\n      charts {\n        id\n        name\n        topicId\n        key\n        isFavorite\n      }\n    }\n  ": types.GetChartsDocument,
    "\n    query GetControls {\n      controls {\n        deviceId\n        name\n        kind\n        stateKey\n        setKey\n        state\n        valueOn\n        valueOff\n        topicId\n      }\n    }\n  ": types.GetControlsDocument,
    "\n    query GetDevice($id: Int!) {\n      device(id: $id) {\n        id\n        name\n        kind\n        stateKey\n        setKey\n        setSuffix\n        valueOn\n        valueOff\n        topicId\n        topic { topic }\n      }\n    }\n  ": types.GetDeviceDocument,
    "\n    query GetDeviceStubs {\n      devices {\n        id\n        name\n        kind\n      }\n    }\n  ": types.GetDeviceStubsDocument,
    "\n    query GetFavorites {\n      favorites {\n        name\n        topicId\n        stateKey\n        state\n      }\n    }\n  ": types.GetFavoritesDocument,
    "\n    query GetPairs($topicId: Int!, $name: String!, $startDate: String!, $endDate: String!) {\n      pairs(topicId: $topicId, name: $name, startDate: $startDate, endDate: $endDate) {\n        value\n        createdAt\n      }\n    }\n  ": types.GetPairsDocument,
    "\n    query GetSchedule {\n      schedule {\n        name\n        runsAt\n        automations {\n          id\n          name\n          trigger\n        }\n      }\n    }\n  ": types.GetScheduleDocument,
    "\n    query GetTopicStatus($id: Int!) {\n      topic(id: $id) {\n        id\n        status {\n          name\n          value\n        }\n      }\n    }\n  ": types.GetTopicStatusDocument,
    "\n    query GetTopics {\n      topics {\n        id\n        topic\n      }\n    }\n  ": types.GetTopicsDocument,
    "\n    query GetTopicDetails {\n      topics {\n        id\n        topic\n        devices {\n          id\n          name\n          kind\n        }\n        automations {\n          id\n          name\n          trigger\n        }\n        usedInAutomations {\n          id\n          name\n          trigger\n        }\n      }\n    }\n  ": types.GetTopicDetailsDocument,
    "\n  mutation SetDevice($input: SetDeviceInput!) {\n    setDevice(input: $input)\n  }\n": types.SetDeviceDocument,
    "\n  mutation SignIn($input: SignInInput!) {\n    signIn(input: $input)\n  }\n": types.SignInDocument,
    "\n  mutation SignOut {\n    signOut\n  }\n": types.SignOutDocument,
    "\n  mutation SignUp($input: SignUpInput!) {\n    signUp(input: $input)\n  }\n": types.SignUpDocument,
    "\n  mutation UpsertDevice($input: UpsertDeviceInput!) {\n    upsertDevice(input: $input) {\n      id\n      name\n      kind\n    }\n  }\n": types.UpsertDeviceDocument,
    "\n  mutation UpsertAutomation($input: UpsertAutomationInput!) {\n    upsertAutomation(input: $input) {\n      id\n      name\n      trigger\n      triggerAt\n      position\n      topicId\n      triggerKey\n      triggerValue\n      isControlShown\n    }\n  }\n": types.UpsertAutomationDocument,
    "\n  mutation UpsertChart($input: UpsertChartInput!) {\n    upsertChart(input: $input) {\n      id\n      name\n      topicId\n      key\n      isFavorite\n    }\n  }\n": types.UpsertChartDocument,
    "\n  mutation UpsertExpression($input: UpsertExpressionInput!) {\n    upsertExpression(input: $input) {\n      id\n      automationId\n      kind\n      isElseStep\n      expression\n      conditionalExpressionId\n      topicId\n      topic\n      message\n      deviceId\n      deviceKind\n      deviceName\n      state\n    }\n  }\n": types.UpsertExpressionDocument,
    "\n  mutation UpsertTopic($input: UpsertTopicInput!) {\n    upsertTopic(input: $input) {\n      id\n      topic\n    }\n  }\n": types.UpsertTopicDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteAutomation($input: IdInput!) {\n    deleteAutomation(input: $input)\n  }\n"): (typeof documents)["\n  mutation DeleteAutomation($input: IdInput!) {\n    deleteAutomation(input: $input)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteChart($input: IdInput!) {\n    deleteChart(input: $input)\n  }\n"): (typeof documents)["\n  mutation DeleteChart($input: IdInput!) {\n    deleteChart(input: $input)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteDevice($input: IdInput!) {\n    deleteDevice(input: $input)\n  }\n"): (typeof documents)["\n  mutation DeleteDevice($input: IdInput!) {\n    deleteDevice(input: $input)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteExpression($input: IdInput!) {\n    deleteExpression(input: $input)\n  }\n"): (typeof documents)["\n  mutation DeleteExpression($input: IdInput!) {\n    deleteExpression(input: $input)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteTopic($input: IdInput!) {\n    deleteTopic(input: $input)\n  }\n"): (typeof documents)["\n  mutation DeleteTopic($input: IdInput!) {\n    deleteTopic(input: $input)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query GetAutomation($id: Int!) {\n      automation(id: $id) {\n        id\n        name\n        trigger\n        triggerAt\n        position\n        topicId\n        triggerKey\n        triggerValue\n        expressions {\n          id\n          automationId\n          kind\n          isElseStep\n          expression\n          conditionalExpressionId\n          topicId\n          topic\n          message\n          deviceId\n          deviceKind\n          deviceName\n          state\n        }\n      }\n    }\n  "): (typeof documents)["\n    query GetAutomation($id: Int!) {\n      automation(id: $id) {\n        id\n        name\n        trigger\n        triggerAt\n        position\n        topicId\n        triggerKey\n        triggerValue\n        expressions {\n          id\n          automationId\n          kind\n          isElseStep\n          expression\n          conditionalExpressionId\n          topicId\n          topic\n          message\n          deviceId\n          deviceKind\n          deviceName\n          state\n        }\n      }\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query GetAutomations {\n      automations {\n        id\n        name\n        trigger\n      }\n    }\n  "): (typeof documents)["\n    query GetAutomations {\n      automations {\n        id\n        name\n        trigger\n      }\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query GetCharts {\n      charts {\n        id\n        name\n        topicId\n        key\n        isFavorite\n      }\n    }\n  "): (typeof documents)["\n    query GetCharts {\n      charts {\n        id\n        name\n        topicId\n        key\n        isFavorite\n      }\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query GetControls {\n      controls {\n        deviceId\n        name\n        kind\n        stateKey\n        setKey\n        state\n        valueOn\n        valueOff\n        topicId\n      }\n    }\n  "): (typeof documents)["\n    query GetControls {\n      controls {\n        deviceId\n        name\n        kind\n        stateKey\n        setKey\n        state\n        valueOn\n        valueOff\n        topicId\n      }\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query GetDevice($id: Int!) {\n      device(id: $id) {\n        id\n        name\n        kind\n        stateKey\n        setKey\n        setSuffix\n        valueOn\n        valueOff\n        topicId\n        topic { topic }\n      }\n    }\n  "): (typeof documents)["\n    query GetDevice($id: Int!) {\n      device(id: $id) {\n        id\n        name\n        kind\n        stateKey\n        setKey\n        setSuffix\n        valueOn\n        valueOff\n        topicId\n        topic { topic }\n      }\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query GetDeviceStubs {\n      devices {\n        id\n        name\n        kind\n      }\n    }\n  "): (typeof documents)["\n    query GetDeviceStubs {\n      devices {\n        id\n        name\n        kind\n      }\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query GetFavorites {\n      favorites {\n        name\n        topicId\n        stateKey\n        state\n      }\n    }\n  "): (typeof documents)["\n    query GetFavorites {\n      favorites {\n        name\n        topicId\n        stateKey\n        state\n      }\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query GetPairs($topicId: Int!, $name: String!, $startDate: String!, $endDate: String!) {\n      pairs(topicId: $topicId, name: $name, startDate: $startDate, endDate: $endDate) {\n        value\n        createdAt\n      }\n    }\n  "): (typeof documents)["\n    query GetPairs($topicId: Int!, $name: String!, $startDate: String!, $endDate: String!) {\n      pairs(topicId: $topicId, name: $name, startDate: $startDate, endDate: $endDate) {\n        value\n        createdAt\n      }\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query GetSchedule {\n      schedule {\n        name\n        runsAt\n        automations {\n          id\n          name\n          trigger\n        }\n      }\n    }\n  "): (typeof documents)["\n    query GetSchedule {\n      schedule {\n        name\n        runsAt\n        automations {\n          id\n          name\n          trigger\n        }\n      }\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query GetTopicStatus($id: Int!) {\n      topic(id: $id) {\n        id\n        status {\n          name\n          value\n        }\n      }\n    }\n  "): (typeof documents)["\n    query GetTopicStatus($id: Int!) {\n      topic(id: $id) {\n        id\n        status {\n          name\n          value\n        }\n      }\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query GetTopics {\n      topics {\n        id\n        topic\n      }\n    }\n  "): (typeof documents)["\n    query GetTopics {\n      topics {\n        id\n        topic\n      }\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query GetTopicDetails {\n      topics {\n        id\n        topic\n        devices {\n          id\n          name\n          kind\n        }\n        automations {\n          id\n          name\n          trigger\n        }\n        usedInAutomations {\n          id\n          name\n          trigger\n        }\n      }\n    }\n  "): (typeof documents)["\n    query GetTopicDetails {\n      topics {\n        id\n        topic\n        devices {\n          id\n          name\n          kind\n        }\n        automations {\n          id\n          name\n          trigger\n        }\n        usedInAutomations {\n          id\n          name\n          trigger\n        }\n      }\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SetDevice($input: SetDeviceInput!) {\n    setDevice(input: $input)\n  }\n"): (typeof documents)["\n  mutation SetDevice($input: SetDeviceInput!) {\n    setDevice(input: $input)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SignIn($input: SignInInput!) {\n    signIn(input: $input)\n  }\n"): (typeof documents)["\n  mutation SignIn($input: SignInInput!) {\n    signIn(input: $input)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SignOut {\n    signOut\n  }\n"): (typeof documents)["\n  mutation SignOut {\n    signOut\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SignUp($input: SignUpInput!) {\n    signUp(input: $input)\n  }\n"): (typeof documents)["\n  mutation SignUp($input: SignUpInput!) {\n    signUp(input: $input)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpsertDevice($input: UpsertDeviceInput!) {\n    upsertDevice(input: $input) {\n      id\n      name\n      kind\n    }\n  }\n"): (typeof documents)["\n  mutation UpsertDevice($input: UpsertDeviceInput!) {\n    upsertDevice(input: $input) {\n      id\n      name\n      kind\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpsertAutomation($input: UpsertAutomationInput!) {\n    upsertAutomation(input: $input) {\n      id\n      name\n      trigger\n      triggerAt\n      position\n      topicId\n      triggerKey\n      triggerValue\n      isControlShown\n    }\n  }\n"): (typeof documents)["\n  mutation UpsertAutomation($input: UpsertAutomationInput!) {\n    upsertAutomation(input: $input) {\n      id\n      name\n      trigger\n      triggerAt\n      position\n      topicId\n      triggerKey\n      triggerValue\n      isControlShown\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpsertChart($input: UpsertChartInput!) {\n    upsertChart(input: $input) {\n      id\n      name\n      topicId\n      key\n      isFavorite\n    }\n  }\n"): (typeof documents)["\n  mutation UpsertChart($input: UpsertChartInput!) {\n    upsertChart(input: $input) {\n      id\n      name\n      topicId\n      key\n      isFavorite\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpsertExpression($input: UpsertExpressionInput!) {\n    upsertExpression(input: $input) {\n      id\n      automationId\n      kind\n      isElseStep\n      expression\n      conditionalExpressionId\n      topicId\n      topic\n      message\n      deviceId\n      deviceKind\n      deviceName\n      state\n    }\n  }\n"): (typeof documents)["\n  mutation UpsertExpression($input: UpsertExpressionInput!) {\n    upsertExpression(input: $input) {\n      id\n      automationId\n      kind\n      isElseStep\n      expression\n      conditionalExpressionId\n      topicId\n      topic\n      message\n      deviceId\n      deviceKind\n      deviceName\n      state\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpsertTopic($input: UpsertTopicInput!) {\n    upsertTopic(input: $input) {\n      id\n      topic\n    }\n  }\n"): (typeof documents)["\n  mutation UpsertTopic($input: UpsertTopicInput!) {\n    upsertTopic(input: $input) {\n      id\n      topic\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;