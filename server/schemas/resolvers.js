const { AuthenticationError } = require('../utils/auth');
const { User, Post, Forum } = require('../models');

const resolvers = {
  Query: {
    // User Queries
    me: async (parent, args, context) => {
      if (context.user) {
        return User.findOne({ _id: context.user._id }).populate('thoughts');
      }
      throw AuthenticationError;
    },
    users: async () => {
      return User.find().populate('thoughts');
    },
    user: async (parent, { username }) => {
      return User.findOne({ username }).populate('thoughts');
    },

    // Post Queries
    posts: async (parent, { username }) => {
      const params = username ? { username } : {};
      return Post.find(params).sort({ createdAt: -1 });
    },
    post: async (parent, { postId }) => {
      return Post.findOne({ _id: postId });
    },

    // Forum Queries
    forums: async () => {
      return Forum.find().populate('createdBy');
    },
    forum: async (parent, { forumId }) => {
      return Forum.findById(forumId).populate('createdBy').populate('posts');
    },
  },

  Mutation: {
    // User Mutations
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);
      return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw AuthenticationError;
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw AuthenticationError;
      }

      const token = signToken(user);

      return { token, user };
    },

    // Post Mutations
    addPost: async (parent, { postText, forumId }, context) => {
      if (context.user) {
        const post = await Post.create({
          postText,
          postAuthor: context.user.username,
          forumId, // Associate the post with the specified forum
        });

        await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { thoughts: post._id } }
        );

        // Also update the Forum to include this new post
        await Forum.findOneAndUpdate(
          { _id: forumId },
          { $addToSet: { posts: post._id } }
        );

        return post;
      }
      throw AuthenticationError;
    },
    addComment: async (parent, { postId, commentText }, context) => {
      if (context.user) {
        return Post.findOneAndUpdate(
          { _id: postId },
          {
            $addToSet: {
              comments: { commentText, commentAuthor: context.user.username },
            },
          },
          {
            new: true,
            runValidators: true,
          }
        );
      }
      throw AuthenticationError;
    },
    removePost: async (parent, { postId }, context) => {
      if (context.user) {
        const post = await Post.findOneAndDelete({
          _id: postId,
          postAuthor: context.user.username,
        });

        await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { thoughts: post._id } }
        );

        // Also remove the post from the Forum it belongs to
        await Forum.findOneAndUpdate(
          { _id: post.forumId },
          { $pull: { posts: post._id } }
        );

        return post;
      }
      throw AuthenticationError;
    },
    removeComment: async (parent, { postId, commentId }, context) => {
      if (context.user) {
        return Post.findOneAndUpdate(
          { _id: postId },
          {
            $pull: {
              comments: {
                _id: commentId,
                commentAuthor: context.user.username,
              },
            },
          },
          { new: true }
        );
      }
      throw AuthenticationError;
    },

    // Forum Mutations
    createForum: async (parent, { title, description }, context) => {
      if (context.user) {
        const forum = await Forum.create({
          title,
          description,
          createdBy: context.user._id,
        });
        return forum;
      }
      throw AuthenticationError;
    },
    // Add more mutations for updating, deleting forums, etc. as needed
  },

  // ... (Your existing resolvers for User, Post, Comment) ...

  Forum: {
    posts: async (parent) => {
      return Post.find({ forumId: parent._id });
    },
  },
};

module.exports = resolvers;