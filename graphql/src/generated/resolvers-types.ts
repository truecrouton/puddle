import { GraphQLResolveInfo } from 'graphql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Automation = {
  __typename?: 'Automation';
  expressions: Array<Expression>;
  id: Scalars['Int']['output'];
  isControlShown?: Maybe<Scalars['Boolean']['output']>;
  name: Scalars['String']['output'];
  position?: Maybe<Scalars['String']['output']>;
  topicId?: Maybe<Scalars['Int']['output']>;
  trigger: Scalars['String']['output'];
  triggerAt?: Maybe<Scalars['String']['output']>;
  triggerKey?: Maybe<Scalars['String']['output']>;
  triggerValue?: Maybe<Scalars['String']['output']>;
};

export type Chart = {
  __typename?: 'Chart';
  id: Scalars['Int']['output'];
  key: Scalars['String']['output'];
  name: Scalars['String']['output'];
  topicId: Scalars['Int']['output'];
};

export type Control = {
  __typename?: 'Control';
  deviceId: Scalars['Int']['output'];
  kind: Scalars['String']['output'];
  name: Scalars['String']['output'];
  setKey: Scalars['String']['output'];
  state: Scalars['String']['output'];
  stateKey: Scalars['String']['output'];
  topicId: Scalars['Int']['output'];
  valueOff: Scalars['String']['output'];
  valueOn: Scalars['String']['output'];
};

export type Device = {
  __typename?: 'Device';
  id: Scalars['Int']['output'];
  kind: Scalars['String']['output'];
  name: Scalars['String']['output'];
  setKey?: Maybe<Scalars['String']['output']>;
  setSuffix?: Maybe<Scalars['String']['output']>;
  stateKey?: Maybe<Scalars['String']['output']>;
  topic?: Maybe<Topic>;
  topicId: Scalars['Int']['output'];
  valueOff?: Maybe<Scalars['String']['output']>;
  valueOn?: Maybe<Scalars['String']['output']>;
};

export type Expression = {
  __typename?: 'Expression';
  automationId: Scalars['Int']['output'];
  conditionalExpressionId?: Maybe<Scalars['Int']['output']>;
  deviceId?: Maybe<Scalars['Int']['output']>;
  deviceKind?: Maybe<Scalars['String']['output']>;
  deviceName?: Maybe<Scalars['String']['output']>;
  expression?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  isElseStep: Scalars['Boolean']['output'];
  kind: Scalars['String']['output'];
  message?: Maybe<Scalars['String']['output']>;
  state?: Maybe<Scalars['String']['output']>;
  topic?: Maybe<Scalars['String']['output']>;
  topicId?: Maybe<Scalars['Int']['output']>;
};

export type Favorite = {
  __typename?: 'Favorite';
  name: Scalars['String']['output'];
  state: Scalars['String']['output'];
  stateKey: Scalars['String']['output'];
  topicId: Scalars['Int']['output'];
};

export type IdInput = {
  id: Scalars['Int']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  deleteAutomation: Scalars['Boolean']['output'];
  deleteDevice: Scalars['Boolean']['output'];
  deleteExpression: Scalars['Boolean']['output'];
  deleteTopic: Scalars['Boolean']['output'];
  setDevice: Scalars['Boolean']['output'];
  signIn: Scalars['Boolean']['output'];
  signOut: Scalars['Boolean']['output'];
  signUp: Scalars['Boolean']['output'];
  upsertAutomation: Automation;
  upsertDevice: Device;
  upsertExpression: Expression;
  upsertTopic: Topic;
};


export type MutationDeleteAutomationArgs = {
  input: IdInput;
};


export type MutationDeleteDeviceArgs = {
  input: IdInput;
};


export type MutationDeleteExpressionArgs = {
  input: IdInput;
};


export type MutationDeleteTopicArgs = {
  input: IdInput;
};


export type MutationSetDeviceArgs = {
  input: SetDeviceInput;
};


export type MutationSignInArgs = {
  input: SignInInput;
};


export type MutationSignUpArgs = {
  input: SignUpInput;
};


export type MutationUpsertAutomationArgs = {
  input: UpsertAutomationInput;
};


export type MutationUpsertDeviceArgs = {
  input: UpsertDeviceInput;
};


export type MutationUpsertExpressionArgs = {
  input: UpsertExpressionInput;
};


export type MutationUpsertTopicArgs = {
  input: UpsertTopicInput;
};

export type Query = {
  __typename?: 'Query';
  automation?: Maybe<Automation>;
  automations: Array<Automation>;
  charts: Array<Chart>;
  controls: Array<Control>;
  device?: Maybe<Device>;
  devices: Array<Device>;
  favorites: Array<Favorite>;
  schedule: Array<Schedule>;
  topic?: Maybe<Topic>;
  topics: Array<Topic>;
};


export type QueryAutomationArgs = {
  id: Scalars['Int']['input'];
};


export type QueryDeviceArgs = {
  id: Scalars['Int']['input'];
};


export type QueryTopicArgs = {
  id: Scalars['Int']['input'];
};

export type Schedule = {
  __typename?: 'Schedule';
  automations: Array<Automation>;
  name: Scalars['String']['output'];
  runsAt?: Maybe<Scalars['String']['output']>;
};

export type SetDeviceInput = {
  deviceId: Scalars['Int']['input'];
  state: Scalars['Int']['input'];
};

export type SignInInput = {
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};

export type SignUpInput = {
  authPhrase: Scalars['String']['input'];
  isAdmin: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};

export type Status = {
  __typename?: 'Status';
  name: Scalars['String']['output'];
  pairId: Scalars['Int']['output'];
  value: Scalars['String']['output'];
};

export type Topic = {
  __typename?: 'Topic';
  automations?: Maybe<Array<Automation>>;
  devices?: Maybe<Array<Device>>;
  id: Scalars['Int']['output'];
  status?: Maybe<Array<Status>>;
  topic: Scalars['String']['output'];
  usedInAutomations?: Maybe<Array<Automation>>;
};

export type UpsertAutomationInput = {
  id: Scalars['Int']['input'];
  isControlShown?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  position?: InputMaybe<Scalars['String']['input']>;
  topicId?: InputMaybe<Scalars['Int']['input']>;
  trigger: Scalars['String']['input'];
  triggerAt?: InputMaybe<Scalars['String']['input']>;
  triggerKey?: InputMaybe<Scalars['String']['input']>;
  triggerValue?: InputMaybe<Scalars['String']['input']>;
};

export type UpsertDeviceInput = {
  id: Scalars['Int']['input'];
  kind: Scalars['String']['input'];
  name: Scalars['String']['input'];
  setKey?: InputMaybe<Scalars['String']['input']>;
  setSuffix?: InputMaybe<Scalars['String']['input']>;
  stateKey?: InputMaybe<Scalars['String']['input']>;
  topicId: Scalars['Int']['input'];
  valueOff?: InputMaybe<Scalars['String']['input']>;
  valueOn?: InputMaybe<Scalars['String']['input']>;
};

export type UpsertExpressionInput = {
  automationId: Scalars['Int']['input'];
  conditionalExpressionId?: InputMaybe<Scalars['Int']['input']>;
  deviceId?: InputMaybe<Scalars['Int']['input']>;
  expression?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['Int']['input'];
  isElseStep: Scalars['Boolean']['input'];
  kind: Scalars['String']['input'];
  message?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<Scalars['String']['input']>;
  topicId?: InputMaybe<Scalars['Int']['input']>;
};

export type UpsertTopicInput = {
  id: Scalars['Int']['input'];
  topic: Scalars['String']['input'];
};

export type User = {
  __typename?: 'User';
  id: Scalars['Int']['output'];
  isAdmin: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  password: Scalars['String']['output'];
  username: Scalars['String']['output'];
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = Record<PropertyKey, never>, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;





/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Automation: ResolverTypeWrapper<Automation>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Chart: ResolverTypeWrapper<Chart>;
  Control: ResolverTypeWrapper<Control>;
  Device: ResolverTypeWrapper<Device>;
  Expression: ResolverTypeWrapper<Expression>;
  Favorite: ResolverTypeWrapper<Favorite>;
  IdInput: IdInput;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Schedule: ResolverTypeWrapper<Schedule>;
  SetDeviceInput: SetDeviceInput;
  SignInInput: SignInInput;
  SignUpInput: SignUpInput;
  Status: ResolverTypeWrapper<Status>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Topic: ResolverTypeWrapper<Topic>;
  UpsertAutomationInput: UpsertAutomationInput;
  UpsertDeviceInput: UpsertDeviceInput;
  UpsertExpressionInput: UpsertExpressionInput;
  UpsertTopicInput: UpsertTopicInput;
  User: ResolverTypeWrapper<User>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Automation: Automation;
  Boolean: Scalars['Boolean']['output'];
  Chart: Chart;
  Control: Control;
  Device: Device;
  Expression: Expression;
  Favorite: Favorite;
  IdInput: IdInput;
  Int: Scalars['Int']['output'];
  Mutation: Record<PropertyKey, never>;
  Query: Record<PropertyKey, never>;
  Schedule: Schedule;
  SetDeviceInput: SetDeviceInput;
  SignInInput: SignInInput;
  SignUpInput: SignUpInput;
  Status: Status;
  String: Scalars['String']['output'];
  Topic: Topic;
  UpsertAutomationInput: UpsertAutomationInput;
  UpsertDeviceInput: UpsertDeviceInput;
  UpsertExpressionInput: UpsertExpressionInput;
  UpsertTopicInput: UpsertTopicInput;
  User: User;
};

export type AutomationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Automation'] = ResolversParentTypes['Automation']> = {
  expressions?: Resolver<Array<ResolversTypes['Expression']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  isControlShown?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  position?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  topicId?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  trigger?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  triggerAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  triggerKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  triggerValue?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type ChartResolvers<ContextType = any, ParentType extends ResolversParentTypes['Chart'] = ResolversParentTypes['Chart']> = {
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  topicId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type ControlResolvers<ContextType = any, ParentType extends ResolversParentTypes['Control'] = ResolversParentTypes['Control']> = {
  deviceId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  kind?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  setKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  state?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  stateKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  topicId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  valueOff?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  valueOn?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type DeviceResolvers<ContextType = any, ParentType extends ResolversParentTypes['Device'] = ResolversParentTypes['Device']> = {
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  kind?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  setKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  setSuffix?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  stateKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  topic?: Resolver<Maybe<ResolversTypes['Topic']>, ParentType, ContextType>;
  topicId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  valueOff?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  valueOn?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type ExpressionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Expression'] = ResolversParentTypes['Expression']> = {
  automationId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  conditionalExpressionId?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  deviceId?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  deviceKind?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  deviceName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  expression?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  isElseStep?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  kind?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  state?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  topic?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  topicId?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
};

export type FavoriteResolvers<ContextType = any, ParentType extends ResolversParentTypes['Favorite'] = ResolversParentTypes['Favorite']> = {
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  state?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  stateKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  topicId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  deleteAutomation?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteAutomationArgs, 'input'>>;
  deleteDevice?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteDeviceArgs, 'input'>>;
  deleteExpression?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteExpressionArgs, 'input'>>;
  deleteTopic?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteTopicArgs, 'input'>>;
  setDevice?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSetDeviceArgs, 'input'>>;
  signIn?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSignInArgs, 'input'>>;
  signOut?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  signUp?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSignUpArgs, 'input'>>;
  upsertAutomation?: Resolver<ResolversTypes['Automation'], ParentType, ContextType, RequireFields<MutationUpsertAutomationArgs, 'input'>>;
  upsertDevice?: Resolver<ResolversTypes['Device'], ParentType, ContextType, RequireFields<MutationUpsertDeviceArgs, 'input'>>;
  upsertExpression?: Resolver<ResolversTypes['Expression'], ParentType, ContextType, RequireFields<MutationUpsertExpressionArgs, 'input'>>;
  upsertTopic?: Resolver<ResolversTypes['Topic'], ParentType, ContextType, RequireFields<MutationUpsertTopicArgs, 'input'>>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  automation?: Resolver<Maybe<ResolversTypes['Automation']>, ParentType, ContextType, RequireFields<QueryAutomationArgs, 'id'>>;
  automations?: Resolver<Array<ResolversTypes['Automation']>, ParentType, ContextType>;
  charts?: Resolver<Array<ResolversTypes['Chart']>, ParentType, ContextType>;
  controls?: Resolver<Array<ResolversTypes['Control']>, ParentType, ContextType>;
  device?: Resolver<Maybe<ResolversTypes['Device']>, ParentType, ContextType, RequireFields<QueryDeviceArgs, 'id'>>;
  devices?: Resolver<Array<ResolversTypes['Device']>, ParentType, ContextType>;
  favorites?: Resolver<Array<ResolversTypes['Favorite']>, ParentType, ContextType>;
  schedule?: Resolver<Array<ResolversTypes['Schedule']>, ParentType, ContextType>;
  topic?: Resolver<Maybe<ResolversTypes['Topic']>, ParentType, ContextType, RequireFields<QueryTopicArgs, 'id'>>;
  topics?: Resolver<Array<ResolversTypes['Topic']>, ParentType, ContextType>;
};

export type ScheduleResolvers<ContextType = any, ParentType extends ResolversParentTypes['Schedule'] = ResolversParentTypes['Schedule']> = {
  automations?: Resolver<Array<ResolversTypes['Automation']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  runsAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type StatusResolvers<ContextType = any, ParentType extends ResolversParentTypes['Status'] = ResolversParentTypes['Status']> = {
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  pairId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type TopicResolvers<ContextType = any, ParentType extends ResolversParentTypes['Topic'] = ResolversParentTypes['Topic']> = {
  automations?: Resolver<Maybe<Array<ResolversTypes['Automation']>>, ParentType, ContextType>;
  devices?: Resolver<Maybe<Array<ResolversTypes['Device']>>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  status?: Resolver<Maybe<Array<ResolversTypes['Status']>>, ParentType, ContextType>;
  topic?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  usedInAutomations?: Resolver<Maybe<Array<ResolversTypes['Automation']>>, ParentType, ContextType>;
};

export type UserResolvers<ContextType = any, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  isAdmin?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  password?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  username?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  Automation?: AutomationResolvers<ContextType>;
  Chart?: ChartResolvers<ContextType>;
  Control?: ControlResolvers<ContextType>;
  Device?: DeviceResolvers<ContextType>;
  Expression?: ExpressionResolvers<ContextType>;
  Favorite?: FavoriteResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Schedule?: ScheduleResolvers<ContextType>;
  Status?: StatusResolvers<ContextType>;
  Topic?: TopicResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
};

