import { useGetUsersQuery } from './usersApi';

export function Users() {
    const { data: users } = useGetUsersQuery();

    return (
        <div>
            {users?.map(user => (
                <h1 key={user.id}>
                    {user.username}, {user.login}
                </h1>
            ))}
        </div>
    )
}