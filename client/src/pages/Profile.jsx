import { Navigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';

import ThoughtForm from '../components/ThoughtForm';
import ThoughtList from '../components/ThoughtList';
import { QUERY_USER, QUERY_ME } from '../utils/queries';
import { ADD_FRIEND, REMOVE_FRIEND } from '../utils/mutations';
import Auth from '../utils/auth';

const Profile = () => {
  const { username: userParam } = useParams();
  const [addFriend] = useMutation(ADD_FRIEND);
  const [removeFriend] = useMutation(REMOVE_FRIEND);

  // Fetch the user data and provide a refetch function to update the data after a mutation
  const { loading, data, refetch } = useQuery(userParam ? QUERY_USER : QUERY_ME, {
    variables: { username: userParam },
  });

  const user = data?.me || data?.user || {};
  
  // Navigate to personal profile page if username is yours
  if (Auth.loggedIn() && Auth.getProfile().data.username === userParam) {
    return <Navigate to="/me" />;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user?.username) {
    return (
      <h4>
        You need to be logged in to see this. Use the navigation links above to
        sign up or log in!
      </h4>
    );
  }

  // Function to handle adding a friend and refetch the data afterward
  const handleAddFriend = async () => {
    try {
      await addFriend({
        variables: { friendId: user._id },
      });
      await refetch(); // Refetch the user data after adding a friend
      console.log('Friend added!');
    } catch (err) {
      console.error('Error adding friend:', err);
    }
  };

  // Function to handle removing a friend and refetch the data afterward
  const handleRemoveFriend = async () => {
    try {
      await removeFriend({
        variables: { friendId: user._id },
      });
      await refetch(); // Refetch the user data after removing a friend
      console.log('Friend removed!');
    } catch (err) {
      console.error('Error removing friend:', err);
    }
  };

  // Check if the logged-in user is a friend
  const isFriend = user.friends?.some((friend) => friend._id === Auth.getProfile().data._id);

  return (
    <div>
      <div className="flex-row justify-center mb-3">
        <h2 className="col-12 col-md-10 bg-dark text-light p-3 mb-5">
          Viewing {userParam ? `${user.username}'s` : 'your'} profile.
        </h2>

        {userParam && (
          <div className="col-12 col-md-10 mb-5">
            {isFriend ? (
              <button className="btn btn-danger" onClick={handleRemoveFriend}>
                Unfriend
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleAddFriend}>
                Add Friend
              </button>
            )}
          </div>
        )}

        <div className="col-12 col-md-10 mb-5">
          <ThoughtList
            thoughts={user.thoughts}
            title={`${user.username}'s thoughts...`}
            showTitle={false}
            showUsername={false}
          />
        </div>
        {!userParam && (
          <div
            className="col-12 col-md-10 mb-3 p-3"
            style={{ border: '1px dotted #1a1a1a' }}
          >
            <ThoughtForm />
          </div>
        )}
      </div>

      <div className="col-12 col-md-10">
        <h3>Friends List</h3>
        <ul>
          {user.friends?.map((friend) => (
            <li key={friend._id}>{friend.username}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Profile;