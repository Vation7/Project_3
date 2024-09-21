import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { LIKE_THOUGHT } from '../../utils/mutations';
import { QUERY_THOUGHTS } from '../../utils/queries';

const ThoughtList = ({ thoughts, title, showTitle = true, showUsername = true }) => {
  const [thoughtsState, setThoughtsState] = useState(thoughts); // Track local state
  const [likeThought] = useMutation(LIKE_THOUGHT);

  const handleLike = async (thoughtId) => {
    try {
      const response = await likeThought({
        variables: { thoughtId },
      });
      // Find and update the thought with the new likes count in local state
      setThoughtsState((prevThoughts) =>
        prevThoughts.map((thought) =>
          thought._id === thoughtId ? { ...thought, likes: response.data.likeThought.likes } : thought
        )
      );
    } catch (err) {
      console.error('Error liking thought:', err);
    }
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
            className="btn btn-secondary mt-2"
            onClick={() => handleLike(thought._id)}
          >
            Like ({thought.likes?.length || 0}) {/* Display updated likes */}
          </button>
        </div>
      ))}
    </div>
  );
};

export default ThoughtList;