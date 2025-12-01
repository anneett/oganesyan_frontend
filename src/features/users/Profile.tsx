import { useGetUserProfileQuery, useGetUserStatsQuery } from "./usersApi.ts";
import "./Profile.css";

export function Profile() {
    const { data: user, isLoading: loadingUser, error: errorUser } = useGetUserProfileQuery();
    const { data: stats, isLoading: loadingStats, error: errorStats } = useGetUserStatsQuery();

    if (loadingUser || loadingStats) return <div>Загрузка...</div>;
    if (errorUser || errorStats) return <div>Ошибка загрузки</div>;

    return (
        <div className="profile-page">
            <div className="profile-header">
                <h2>Профиль пользователя</h2>
                <p><strong>Имя:</strong> {user.username}</p>
                <p><strong>Логин:</strong> {user.login}</p>
            </div>

            <div className="stats-section">
                <h3>Статистика решённых задач</h3>

                <table className="stats-table">
                    <thead>
                    <tr>
                        <th>Название задания</th>
                        <th>Сложность</th>
                        <th>Правильный ответ</th>
                        <th>Ответ пользователя</th>
                        <th>Правильность</th>
                        <th>Дата отправки</th>
                        <th>Результат</th>
                    </tr>
                    </thead>

                    <tbody>
                        {stats.map((solution) => (
                            <tr key={solution.solutionId}>
                                <td>{solution.exerciseTitle}</td>
                                <td>{["Легкий", "Средний", "Сложный"][solution.exerciseDifficulty]}</td>
                                <td>{solution.correctAnswer}</td>
                                <td>{solution.userAnswer}</td>
                                <td style={{ color: solution.isCorrect ? "green" : "red" }}>
                                    {solution.isCorrect ? "Да" : "Нет"}
                                </td>
                                <td>{new Date(solution.submittedAt).toLocaleString()}</td>
                                <td style={{ color: solution.isCorrect? "green" : "red" }}>
                                    {solution.result}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}