import { useGetUsersQuery, useArchiveUserMutation, useChangeUserMutation, useGetUserProfileQuery } from './usersApi';
import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";

type SortRole = 'all' | 'admins-first' | 'users-first';

export function Users() {
    const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
    const { data: users, isLoading, error } = useGetUsersQuery();
    const { data: currentUser } = useGetUserProfileQuery();
    const [archiveUser, { isLoading: isArchiving }] = useArchiveUserMutation();
    const [changeUserRole, { isLoading: isChangingRole }] = useChangeUserMutation();

    const [search, setSearch] = useState("");
    const [showArchive, setShowArchive] = useState(false);
    const [actionUserId, setActionUserId] = useState<number | null>(null);

    const [sortRole, setSortRole] = useState<SortRole>('all');

    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
    const [isProcessingBulk, setIsProcessingBulk] = useState(false);

    const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(20);
    const [currentPage, setCurrentPage] = useState(1);

    const activeUsers = users?.filter(user => !user.inArchive) || [];
    const archivedUsers = users?.filter(user => user.inArchive) || [];

    const currentList = showArchive ? archivedUsers : activeUsers;

    const filtered = useMemo(() => {
        return currentList
            .filter(user =>
                user.login.toLowerCase().includes(search.toLowerCase()) ||
                user.userName.toLowerCase().includes(search.toLowerCase())
            )
            .sort((a, b) => {
                if (sortRole === 'admins-first') {
                    const roleDiff = (b.isAdmin ? 1 : 0) - (a.isAdmin ? 1 : 0);
                    if (roleDiff !== 0) return roleDiff;
                } else if (sortRole === 'users-first') {
                    const roleDiff = (a.isAdmin ? 1 : 0) - (b.isAdmin ? 1 : 0);
                    if (roleDiff !== 0) return roleDiff;
                }
                return a.id - b.id;
            });
    }, [currentList, search, sortRole]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const pagedUsers = useMemo(
        () => filtered.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize),
        [filtered, pageSize, safeCurrentPage],
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [search, showArchive, sortRole, pageSize]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const adminCount = currentList.filter(u => u.isAdmin).length;
    const userCount = currentList.length - adminCount;

    const selectableUsers = pagedUsers.filter(u => u.id !== currentUser?.id);
    const isAllSelected = selectableUsers.length > 0 && selectableUsers.every(u => selectedUserIds.has(u.id));

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

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedUserIds(new Set());
    };

    const toggleUserSelection = (id: number) => {
        const newSet = new Set(selectedUserIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedUserIds(newSet);
    };

    const toggleSelectAll = () => {
        if (isAllSelected) {
            const newSet = new Set(selectedUserIds);
            selectableUsers.forEach(u => newSet.delete(u.id));
            setSelectedUserIds(newSet);
        } else {
            const newSet = new Set(selectedUserIds);
            selectableUsers.forEach(u => newSet.add(u.id));
            setSelectedUserIds(newSet);
        }
    };

    const handleBulkRoleChange = async () => {
        if (selectedUserIds.size === 0) return;
        setIsProcessingBulk(true);
        try {
            await Promise.all(Array.from(selectedUserIds).map(id => changeUserRole(id).unwrap()));
            setSelectedUserIds(new Set());
            setIsSelectionMode(false);
        } catch (error) {
            console.error("Ошибка при групповом изменении ролей:", error);
        } finally {
            setIsProcessingBulk(false);
        }
    };

    const handleBulkArchive = async () => {
        if (selectedUserIds.size === 0) return;
        setIsProcessingBulk(true);
        try {
            await Promise.all(Array.from(selectedUserIds).map(id => archiveUser(id).unwrap()));
            setSelectedUserIds(new Set());
            setIsSelectionMode(false);
        } catch (error) {
            console.error("Ошибка при групповой архивации:", error);
        } finally {
            setIsProcessingBulk(false);
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
                    <p className="text-red-400 font-medium">Ошибка загрузки данных</p>
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
                            setSelectedUserIds(new Set());
                            setIsSelectionMode(false);
                        }}
                        className={`px-5 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                            showArchive
                                ? "bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                                : "bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30"
                        }`}
                    >
                        {showArchive ? (
                            <>К действующим ({activeUsers.length})</>
                        ) : (
                            <>В архив ({archivedUsers.length})</>
                        )}
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className={`bg-gradient-to-br border rounded-xl p-5 ${
                        showArchive ? "from-orange-500/20 to-orange-500/5 border-orange-500/30" : "from-secondary/20 to-secondary/5 border-secondary/30"
                    }`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${showArchive ? "bg-orange-500/30" : "bg-secondary/30"}`}>
                                <svg className={`w-5 h-5 ${showArchive ? "text-orange-400" : "text-secondary"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-text/50 text-sm">Всего</p>
                                <p className={`text-2xl font-bold ${showArchive ? "text-orange-400" : "text-secondary"}`}>{currentList.length}</p>
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

                <div className="flex flex-col lg:flex-row gap-4 mb-4">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Поиск по логину или имени..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-4 py-3 bg-background border border-secondary/30 rounded-xl text-text placeholder-text/40 focus:outline-none focus:border-accent"
                        />
                    </div>

                    <button
                        onClick={toggleSelectionMode}
                        className={`px-4 py-3 rounded-xl font-medium transition-all border ${
                            isSelectionMode ? "bg-accent text-background border-accent" : "bg-transparent text-text border-secondary/30 hover:border-accent"
                        }`}
                    >
                        {isSelectionMode ? "Отменить выделение" : "Режим выделения"}
                    </button>
                </div>

                {isSelectionMode && (
                    <div className="mb-4 p-4 rounded-xl border border-accent/30 bg-accent/5 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={isAllSelected}
                                onChange={toggleSelectAll}
                                className="w-5 h-5 rounded border-secondary/50 bg-background text-accent"
                            />
                            <span className="text-text/80 text-sm">
                                Выделено на странице: {selectableUsers.filter(u => selectedUserIds.has(u.id)).length} из {selectableUsers.length}
                                {selectedUserIds.size > 0 && ` (всего: ${selectedUserIds.size})`}
                            </span>
                        </div>

                        {selectedUserIds.size > 0 && (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleBulkRoleChange}
                                    disabled={isProcessingBulk}
                                    className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/30 disabled:opacity-50"
                                >
                                    {isProcessingBulk ? "Смена ролей..." : "Инвертировать роли"}
                                </button>
                                <button
                                    onClick={handleBulkArchive}
                                    disabled={isProcessingBulk}
                                    className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg text-sm font-medium hover:bg-orange-500/30 disabled:opacity-50"
                                >
                                    {isProcessingBulk ? "Обработка..." : showArchive ? "Восстановить всех" : "В архив"}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="text-sm text-text/50">Сортировка:</span>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSortRole('all')}
                            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                                sortRole === 'all'
                                    ? 'bg-accent text-background'
                                    : 'bg-secondary/10 text-text/70 hover:bg-secondary/20'
                            }`}
                        >
                            Все
                        </button>
                        <button
                            onClick={() => setSortRole('admins-first')}
                            className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-all flex items-center gap-2 ${
                                sortRole === 'admins-first'
                                    ? 'bg-accent text-background'
                                    : 'bg-secondary/10 text-text/70 hover:bg-secondary/20'
                            }`}
                        >
                            Сначала админы
                        </button>
                        <button
                            onClick={() => setSortRole('users-first')}
                            className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-all flex items-center gap-2 ${
                                sortRole === 'users-first'
                                    ? 'bg-accent text-background'
                                    : 'bg-secondary/10 text-text/70 hover:bg-secondary/20'
                            }`}
                        >
                            Сначала пользователи
                        </button>
                    </div>
                </div>

                {search && (
                    <p className="text-text/50 text-sm mb-4">
                        Найдено: {filtered.length} из {currentList.length}
                    </p>
                )}

                <div className="mb-4 flex flex-col gap-3 rounded-xl border border-secondary/20 bg-secondary/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-text/60">
                        Показаны записи {filtered.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}-{Math.min(safeCurrentPage * pageSize, filtered.length)} из {filtered.length}
                    </p>

                    <div className="flex items-center gap-3">
                        <label className="text-sm text-text/60" htmlFor="users-page-size">
                            На странице
                        </label>
                        <select
                            id="users-page-size"
                            value={pageSize}
                            onChange={(event) => setPageSize(Number(event.target.value) as (typeof PAGE_SIZE_OPTIONS)[number])}
                            className="rounded-xl border border-secondary/30 bg-background px-3 py-2 text-sm text-text focus:outline-none focus:border-accent"
                        >
                            {PAGE_SIZE_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="bg-background border border-secondary/20 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="bg-secondary/10 border-b border-secondary/20">
                                {isSelectionMode && (
                                    <th className="px-6 py-4 w-10 text-left">

                                    </th>
                                )}
                                <th className="px-6 py-4 text-left text-sm font-semibold text-text/70 uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-text/70 uppercase tracking-wider">
                                    Пользователь
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
                            {pagedUsers?.map((user) => {
                                const isSelf = isCurrentUser(user.id);
                                const isProcessing = actionUserId === user.id;
                                const isSelected = selectedUserIds.has(user.id);

                                return (
                                    <tr
                                        key={user.id}
                                        className={`transition-colors ${
                                            isSelf ? "bg-primary/5 border-l-4 border-l-primary" : isSelected ? "bg-accent/5" : "hover:bg-secondary/5"
                                        }`}
                                    >
                                        {isSelectionMode && (
                                            <td className="px-6 py-4">
                                                {!isSelf && (
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleUserSelection(user.id)}
                                                        className="w-5 h-5 rounded border-secondary/50 bg-background text-accent"
                                                    />
                                                )}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-text/50 font-mono text-sm">
                                            {user.id}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-accent/30">
                                                    <span className="text-xs font-bold uppercase text-text">{user.login.charAt(0)}</span>
                                                </div>
                                                <div>
                                                    <Link to={`/users/${user.id}`} className="font-medium text-text hover:text-accent hover:underline">
                                                        {user.login} {isSelf && <span className="ml-2 px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded-full">Вы</span>}
                                                    </Link>
                                                    <p className="text-sm text-text/60">{user.userName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.isAdmin ? (
                                                <span className="px-3 py-1 bg-accent/20 text-accent text-sm font-medium rounded-full border border-accent/30">Админ</span>
                                            ) : (
                                                <span className="px-3 py-1 bg-secondary/10 text-text/50 text-sm rounded-full border border-secondary/20">Пользователь</span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4">
                                            {(isSelf || showArchive) ? (
                                                <span className="text-text/30 text-sm italic">Недоступно</span>
                                            ) : (
                                                <button
                                                    onClick={() => handleChangeRole(user.id)}
                                                    disabled={isProcessing || isChangingRole || isSelectionMode}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                                        user.isAdmin ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                                                    } disabled:opacity-30`}
                                                >
                                                    {user.isAdmin ? "Снять админа" : "Сделать админом"}
                                                </button>
                                            )}
                                        </td>

                                        <td className="px-6 py-4">
                                            {isSelf ? (
                                                <span className="text-text/30 text-sm italic">Недоступно</span>
                                            ) : (
                                                <button
                                                    onClick={() => handleArchive(user.id)}
                                                    disabled={isProcessing || isArchiving || isSelectionMode}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                                        showArchive ? "bg-green-500/10 text-green-400 hover:bg-green-500/20" : "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
                                                    } disabled:opacity-30`}
                                                >
                                                    {showArchive ? "Восстановить" : "В архив"}
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
                            <p className="text-text/50">
                                {search ? "Ничего не найдено" : "Нет пользователей"}
                            </p>
                        </div>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-text/55">
                            Страница {safeCurrentPage} из {totalPages}
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                                disabled={safeCurrentPage === 1}
                                className="rounded-xl border border-secondary/30 bg-background px-4 py-2 text-sm text-text transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Назад
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                                disabled={safeCurrentPage === totalPages}
                                className="rounded-xl border border-secondary/30 bg-background px-4 py-2 text-sm text-text transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Вперед
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}