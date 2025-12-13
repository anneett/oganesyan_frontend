import { useGetUsersQuery, useArchiveUserMutation, useChangeUserMutation, useGetUserProfileQuery } from './usersApi';
import { useState } from "react";

export function Users() {
    const { data: users, isLoading, error } = useGetUsersQuery();
    const { data: currentUser } = useGetUserProfileQuery();
    const [archiveUser, { isLoading: isArchiving }] = useArchiveUserMutation();
    const [changeUserRole, { isLoading: isChangingRole }] = useChangeUserMutation();

    const [search, setSearch] = useState("");
    const [showArchive, setShowArchive] = useState(false);
    const [actionUserId, setActionUserId] = useState<number | null>(null);

    const activeUsers = users?.filter(user => !user.inArchive) || [];
    const archivedUsers = users?.filter(user => user.inArchive) || [];

    const currentList = showArchive ? archivedUsers : activeUsers;

    const filtered = currentList?.filter(user =>
        user.login.toLowerCase().includes(search.toLowerCase()) ||
        user.userName.toLowerCase().includes(search.toLowerCase())
    );

    const adminCount = currentList.filter(u => u.isAdmin).length;
    const userCount = currentList.length - adminCount;

    const handleChangeRole = async (userId: number) => {
        setActionUserId(userId);
        try {
            await changeUserRole(userId).unwrap();
        } catch (error) {
            console.error("Ошибка изменения роли:", error);
        } finally {
            setActionUserId(null);
        }
    };

    const handleArchive = async (userId: number) => {
        setActionUserId(userId);
        try {
            await archiveUser(userId).unwrap();
        } catch (error) {
            console.error("Ошибка архивации:", error);
        } finally {
            setActionUserId(null);
        }
    };

    const isCurrentUser = (userId: number) => currentUser?.id === userId;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-text/70">Загрузка пользователей...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                    <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-red-400 font-medium">Ошибка загрузки данных</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                    >
                        Попробовать снова
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-text mb-2">Управление пользователями</h1>
                        <p className="text-xl text-text/50">
                            {showArchive ? "Архив пользователей" : "Действующие пользователи"}
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            setShowArchive(!showArchive);
                            setSearch("");
                        }}
                        className={`px-5 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                            showArchive
                                ? "bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                                : "bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30"
                        }`}
                    >
                        {showArchive ? (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                К действующим ({activeUsers.length})
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                                В архив ({archivedUsers.length})
                            </>
                        )}
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className={`bg-gradient-to-br border rounded-xl p-5 ${
                        showArchive
                            ? "from-orange-500/20 to-orange-500/5 border-orange-500/30"
                            : "from-secondary/20 to-secondary/5 border-secondary/30"
                    }`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                showArchive ? "bg-orange-500/30" : "bg-secondary/30"
                            }`}>
                                <svg className={`w-5 h-5 ${showArchive ? "text-orange-400" : "text-secondary"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-text/50 text-sm">Всего</p>
                                <p className={`text-2xl font-bold ${showArchive ? "text-orange-400" : "text-secondary"}`}>
                                    {currentList.length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 rounded-xl p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-accent/30 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-text/50 text-sm">Админов</p>
                                <p className="text-2xl font-bold text-accent">{adminCount}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-xl p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/30 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-text/50 text-sm">Обычных</p>
                                <p className="text-2xl font-bold text-primary">{userCount}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-text/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Поиск по логину или имени..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-background border border-secondary/30 rounded-xl text-text placeholder-text/40 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-text/40 hover:text-text transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {search && (
                    <p className="text-text/50 text-sm mb-4">
                        Найдено: {filtered?.length || 0} из {users?.length || 0}
                    </p>
                )}

                <div className="bg-background border border-secondary/20 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-secondary/10 border-b border-secondary/20">
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-text/70 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-text/70 uppercase tracking-wider">
                                        Логин
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-text/70 uppercase tracking-wider">
                                        Имя
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-text/70 uppercase tracking-wider">
                                        Роль
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-text/70 uppercase tracking-wider">
                                        Изменить роль
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-text/70 uppercase tracking-wider">
                                        {showArchive ? "Восстановить" : "В архив"}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary/10">
                                {filtered?.map((user) => {
                                    const isSelf = isCurrentUser(user.id);
                                    const isProcessing = actionUserId === user.id;

                                    return (
                                        <tr
                                            key={user.id}
                                            className={`transition-colors ${
                                                isSelf
                                                    ? "bg-primary/5 border-l-4 border-l-primary"
                                                    : "hover:bg-secondary/5"
                                            }`}
                                        >
                                            <td className="px-6 py-4">
                                                <span className="text-text/50 font-mono text-sm">
                                                    #{user.id}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                        isSelf
                                                            ? "bg-gradient-to-br from-primary to-accent"
                                                            : "bg-gradient-to-br from-primary/30 to-accent/30"
                                                    }`}>
                                                            <span className={`text-xs font-bold uppercase ${
                                                                isSelf ? "text-background" : "text-text"
                                                            }`}>
                                                                {user.login.charAt(0)}
                                                            </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                            <span className="font-medium text-text">
                                                                {user.login}
                                                            </span>
                                                        {isSelf && (
                                                            <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded-full">
                                                                    Вы
                                                                </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-text/70">
                                                {user.userName}
                                            </td>

                                            <td className="px-6 py-4">
                                                {user.isAdmin ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/20 text-accent text-sm font-medium rounded-full border border-accent/30">
                                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                        Админ
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1 bg-secondary/10 text-text/50 text-sm rounded-full border border-secondary/20">
                                                        Пользователь
                                                </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-4">
                                                {isSelf ? (
                                                    <span className="text-text/30 text-sm italic">
                                                            Недоступно
                                                        </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleChangeRole(user.id)}
                                                        disabled={isProcessing || isChangingRole}
                                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                                            user.isAdmin
                                                                ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                                                                : "bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30"
                                                        }`}
                                                    >
                                                        {isProcessing && isChangingRole ? (
                                                            <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"></div>
                                                        ) : user.isAdmin ? (
                                                            <>
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                                Снять админа
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                                </svg>
                                                                Сделать админом
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </td>

                                            <td className="px-4 py-4">
                                                {isSelf ? (
                                                    <span className="text-text/30 text-sm italic">
                                                            Недоступно
                                                        </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleArchive(user.id)}
                                                        disabled={isProcessing || isArchiving}
                                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                                            showArchive
                                                                ? "bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30"
                                                                : "bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                                        }`}
                                                    >
                                                        {isProcessing && isArchiving ? (
                                                            <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"></div>
                                                        ) : showArchive ? (
                                                            <>
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                                </svg>
                                                                Восстановить
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                                                </svg>
                                                                В архив
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {filtered.length === 0 && (
                        <div className="text-center py-12">
                            <svg className="w-12 h-12 text-text/20 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="text-text/50">
                                {search
                                    ? "Пользователи не найдены"
                                    : showArchive
                                        ? "Архив пуст"
                                        : "Нет действующих пользователей"
                                }
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}