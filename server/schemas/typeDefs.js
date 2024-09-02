const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type User {
    _id: ID
    username: String
    email: String
    thoughts: [Thought]!
  }

  type Thought {
    _id: ID
    thoughtText: String
    thoughtAuthor: String
    createdAt: String
    comments: [Comment]!
  }

  type Comment {
    _id: ID
    commentText: String
    commentAuthor: String
    createdAt: String
  }

  type Forum {
    _id: ID
    title: String
    description: String
    createdAt: String
    createdBy: User
    posts: [Post]
  }

  type Auth {
    token: ID!
    user: User
  }

  type Query {
    users: [User]
    user(username: String!): User
    thoughts(username: String): [Thought]
    thought(thoughtId: ID!): Thought
    me: User

    forums: [Forum]
    forum(forumId: ID!): Forum
  }

  type Mutation {
    addUser(username: String!, email: String!, password: String!): Auth
    login(email: String!, password: String!): Auth
    addThought(thoughtText: String!): Thought
    addComment(thoughtId: ID!, commentText: String!): Thought
    removeThought(thoughtId: ID!): Thought
    removeComment(thoughtId: ID!, commentId: ID!): Thought

    createForum(title: String!, description: String): Forum
    # Add more mutations for updating, deleting forums, etc. as needed.
  }
`;

module.exports = typeDefs;