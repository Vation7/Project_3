import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { LIKE_THOUGHT } from '../../utils/mutations';
import { QUERY_THOUGHTS } from '../../utils/queries';

const ThoughtList = ({ thoughts, title, showTitle = true, showUsername = true, userId }) => {
  const [thoughtsState, setThoughtsState] = useState(thoughts);

  const [likeThought] = useMutation(LIKE_THOUGHT, {
    update(cache, { data: { likeThought } }) {
      try {
        // Read current cache
        const { thoughts } = cache.readQuery({ query: QUERY_THOUGHTS });

        // Find the thought and update its likes
        const updatedThoughts = thoughts.map((thought) =>
          thought._id === likeThought._id ? { ...thought, likes: likeThought.likes } : thought
        );

        // Write the updated thoughts back to the cache
        cache.writeQuery({
          query: QUERY_THOUGHTS,
          data: { thoughts: updatedThoughts },
        });
      } catch (e) {
        console.error('Error updating cache after liking/unliking', e);
      }
    },
    onError: (err) => {
      console.error("Error in Like Mutation: ", err);
    },
  });

  useEffect(() => {
    setThoughtsState(thoughts);
  }, [thoughts]);

  const handleLike = async (thoughtId) => {
    try {
      await likeThought({
        variables: { thoughtId },
      });
    } catch (err) {
      console.error('Error liking thought:', err);
    }
  };

  const hasLiked = (thought) => {
    return thought.likes?.some((like) => like._id === userId);
  };

  if (!thoughtsState.length) {
    return <h3>No Thoughts Yet</h3>;
  }

  return (
    <div>
      {showTitle && <h3>{title}</h3>}
      {thoughtsState.map((thought) => (
        <div key={thought._id} className="card mb-3">
          <h4 className="card-header bg-primary text-light p-2 m-0">
            {showUsername ? (
              <Link className="text-light" to={`/profiles/${thought.thoughtAuthor}`}>
                {thought.thoughtAuthor} <br />
                <span style={{ fontSize: '1rem' }}>
                  had this thought on {thought.createdAt}
                </span>
              </Link>
            ) : (
              <span style={{ fontSize: '1rem' }}>
                You had this thought on {thought.createdAt}
              </span>
            )}
          </h4>
          <div className="card-body bg-light p-2">
            <p>{thought.thoughtText}</p>
          </div>
          <Link
            className="btn btn-primary btn-block btn-squared"
            to={`/thoughts/${thought._id}`}
          >
            Join the discussion on this thought.
          </Link>
          <button
            className={`btn ${hasLiked(thought) ? 'btn-danger' : 'btn-secondary'} mt-2`}
            onClick={() => handleLike(thought._id)}
          >
            {hasLiked(thought) ? 'Unlike' : 'Like'} ({thought.likes?.length || 0})
          </button>
        </div>
      ))}
    </div>
  );
};

export default ThoughtList;