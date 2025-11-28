import { useGetUserProfileQuery } from "./usersApi.ts";

export function Profile() {
    const { data: user, isLoading, error } = useGetUserProfileQuery(undefined, {
        skip: !localStorage.getItem("access_token"),
    });

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Ошибка загрузки</div>;

    return (
        <div className="profile-container">
            <div className="profile-card">
                <h2>Профиль</h2>
                <ul>
                    <li key={user.id}>{user.username}, {user.login}</li>
                </ul>
                <p>Статистика</p>
                <p>Таблица статистики</p>
            </div>
        </div>
    );
}