import * as React from 'react';
import './UserList.css';

interface IUserListProps {
    users: string[], 
    currentUser: string,
    switchUser: (user: string) => void
}

const UserList: React.FunctionComponent<IUserListProps> = ({ users, currentUser, switchUser }) => {
    
    return (
        <div className='user-list'>
            <h2>
                ユーザー一覧
            </h2>
            {users.map(user => (
                <button
                    key={user}
                    onClick={() => switchUser(user)}
                    disabled={user === currentUser}
                >
                    {user}
                    {user === currentUser ? "(現在のユーザー）" : ""}
                </button>
            ))}
      </div>
  ) ;
};

export default UserList;
