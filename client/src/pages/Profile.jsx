import { Navigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import ThoughtForm from '../components/ThoughtForm';
import ThoughtList from '../components/ThoughtList';
import { QUERY_USER, QUERY_ME } from '../utils/queries';
import { ADD_FRIEND, REMOVE_FRIEND } from '../utils/mutations';
import Auth from '../utils/auth';

const Profile = () => {
  const { username: userParam } = useParams();
  const { loading, data, refetch } = useQuery(userParam ? QUERY_USER : QUERY_ME, {
    variables: { username: userParam },
  });

  const [addFriend] = useMutation(ADD_FRIEND, {
    refetchQueries: [{ query: QUERY_ME }, { query: QUERY_USER, variables: { username: userParam } }],
    onCompleted: (data) => {
      console.log("Friend added successfully:", data.addFriend);
      refetch();
    },
    onError: (err) => {
      console.error("Error adding friend:", err);
    },
  });

  const [removeFriend] = useMutation(REMOVE_FRIEND, {
    refetchQueries: [{ query: QUERY_ME }, { query: QUERY_USER, variables: { username: userParam } }],
    onCompleted: (data) => {
      console.log("Friend removed successfully:", data.removeFriend);
      refetch();
    },
    onError: (err) => {
      console.error("Error removing friend:", err);
    },
  });

  const user = data?.me || data?.user || {};
  console.log('Current user data:', user); // Debugging the user object

  if (Auth.loggedIn() && Auth.getProfile().data.username === userParam) {
    return <Navigate to="/me" />;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user?.username) {
    return (
      <h4>
        You need to be logged in to see this. Use the navigation links above to sign up or log in!
      </h4>
    );
  }

  const handleAddFriend = async () => {
    try {
      console.log("Adding friend:", user._id);
      await addFriend({
        variables: { friendId: user._id },
      });
    } catch (err) {
      console.error('Error adding friend:', err);
    }
  };

  const handleRemoveFriend = async () => {
    try {
      console.log("Removing friend:", user._id);
      await removeFriend({
        variables: { friendId: user._id },
      });
    } catch (err) {
      console.error('Error removing friend:', err);
    }
  };

  const isFriend = data?.me?.friends?.some((friend) => friend._id === user._id);
  console.log("Is friend:", isFriend); // Debugging if the friend status is correct

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
                Remove Friend
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