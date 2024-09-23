const { User, Thought } = require('../models');
const { signToken, AuthenticationError } = require('../utils/auth');

const resolvers = {
  Query: {
    users: async () => {
      return User.find().populate('thoughts friends');
    },
    user: async (parent, { username }) => {
      return User.findOne({ username }).populate('thoughts friends');
    },
    thoughts: async (parent, { username }) => {
      const params = username ? { username } : {};
      return Thought.find(params).sort({ createdAt: -1 }).populate('likes'); // Ensure 'likes' is populated
    },
    thought: async (parent, { thoughtId }) => {
      return Thought.findOne({ _id: thoughtId }).populate('likes'); // Ensure 'likes' is populated
    },
    me: async (parent, args, context) => {
      if (context.user) {
        return User.findOne({ _id: context.user._id }).populate('thoughts friends');
      }
      throw new AuthenticationError('You need to be logged in.');
    },
  },

  Mutation: {
    likeThought: async (parent, { thoughtId }, context) => {
      if (context.user) {
        const thought = await Thought.findOne({ _id: thoughtId });

        // Check if the user has already liked the thought
        const liked = thought.likes.includes(context.user._id);

        if (liked) {
          const updatedThought = await Thought.findOneAndUpdate(
            { _id: thoughtId },
            { $pull: { likes: context.user._id } }, // Remove the user's ID from the likes array
            { new: true }
          ).populate('likes'); // Ensure 'likes' is populated with full user data
          return updatedThought;
        } else {
          const updatedThought = await Thought.findOneAndUpdate(
            { _id: thoughtId },
            { $addToSet: { likes: context.user._id } }, // Add the user's ID to the likes array
            { new: true }
          ).populate('likes'); // Ensure 'likes' is populated with full user data
          return updatedThought;
        }
      }
      throw new AuthenticationError('You need to be logged in.');
    },

    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);
      return { token, user };
    },

    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('No user found with this email address');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const token = signToken(user);

      return { token, user };
    },

    addThought: async (parent, { thoughtText }, context) => {
      if (context.user) {
        const thought = await Thought.create({
          thoughtText,
          thoughtAuthor: context.user.username,
        });

        await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { thoughts: thought._id } }
        );

        return thought;
      }
      throw new AuthenticationError('You need to be logged in.');
    },

    addComment: async (parent, { thoughtId, commentText }, context) => {
      if (context.user) {
        return Thought.findOneAndUpdate(
          { _id: thoughtId },
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
      throw new AuthenticationError('You need to be logged in.');
    },

    addFriend: async (parent, { friendId }, context) => {
      if (context.user) {
        return User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { friends: friendId } }, // Add the friend
          { new: true }
        ).populate('friends');
      }
      throw new AuthenticationError('You need to be logged in to add a friend.');
    },

    removeThought: async (parent, { thoughtId }, context) => {
      if (context.user) {
        const thought = await Thought.findOneAndDelete({
          _id: thoughtId,
          thoughtAuthor: context.user.username,
        });

        await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { thoughts: thought._id } }
        );

        return thought;
      }
      throw new AuthenticationError('You need to be logged in to remove a thought.');
    },

    removeComment: async (parent, { thoughtId, commentId }, context) => {
      if (context.user) {
        return Thought.findOneAndUpdate(
          { _id: thoughtId },
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
      throw new AuthenticationError('You need to be logged in to remove a comment.');
    },

    removeFriend: async (parent, { friendId }, context) => {
      if (context.user) {
        return User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { friends: friendId } }, // Remove the friend
          { new: true }
        ).populate('friends');
      }
      throw new AuthenticationError('You need to be logged in to remove a friend.');
    },
  },
};

module.exports = resolvers;