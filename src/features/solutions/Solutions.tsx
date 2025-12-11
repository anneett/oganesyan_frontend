import { useGetSolutionsQuery } from './solutionsApi.ts';

export function Solutions() {

    const { data: solutions, isLoading, error } = useGetSolutionsQuery();

    // const filtered = users?.filter(user =>
    //     user.login.toLowerCase().includes(search.toLowerCase())
    // );

    if (isLoading) return <div>Загрузка...</div>;
    if (error) return <div>Ошибка загрузки</div>;

    return (
        <div className="users-page">
            <h1>Решения</h1>
            <table className="users-table">
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Логин</th>
                    <th>Имя</th>
                    <th>Админ</th>
                </tr>
                </thead>

                <tbody>
                {filtered?.map(user => (
                    <tr key={user.id} className="user-card">
                        <td>{user.id}</td>
                        <td>{user.login}</td>
                        <td>{user.username}</td>
                        <td>{user.isAdmin ? "Да" : "Нет"}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    )
}