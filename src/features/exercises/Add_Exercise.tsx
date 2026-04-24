import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../../app/getApiErrorMessage";
import { useGetDatabaseMetasQuery } from "../databaseMetas/databaseMetasApi";
import { useCreateExerciseMutation, useTestQueryMutation, useBatchUploadExercisesMutation } from "./exercisesApi";
import type { BatchUploadResult } from "./exercisesApi";

type ExerciseTab = "single" | "batch";

const difficultyOptions = [
    { value: 0 as const, label: "Легкая", idle: "border-green-500/25 bg-green-500/10 text-green-300", active: "border-green-400 bg-green-500/20 text-green-200" },
    { value: 1 as const, label: "Средняя", idle: "border-yellow-500/25 bg-yellow-500/10 text-yellow-300", active: "border-yellow-400 bg-yellow-500/20 text-yellow-100" },
    { value: 2 as const, label: "Сложная", idle: "border-red-500/25 bg-red-500/10 text-red-300", active: "border-red-400 bg-red-500/20 text-red-100" },
];

const tabItems: { id: ExerciseTab; label: string; subtitle: string }[] = [
    { id: "single", label: "Одно задание", subtitle: "Ручное создание с тестированием" },
    { id: "batch", label: "Пакетная загрузка", subtitle: "Импорт из JSON-файла" },
];

export const Add_Exercise = () => {
    const [activeTab, setActiveTab] = useState<ExerciseTab>("single");

    const [title, setTitle] = useState("");
    const [difficulty, setDifficulty] = useState<0 | 1 | 2>(0);
    const [databaseMetaId, setDatabaseMetaId] = useState<number>(0);
    const [correctAnswer, setCorrectAnswer] = useState("");
    const [testDeploymentId, setTestDeploymentId] = useState<number>(0);
    const [isTestPanelOpen, setIsTestPanelOpen] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);
    const [isTestLoading, setIsTestLoading] = useState(false);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [batchDatabaseMetaId, setBatchDatabaseMetaId] = useState<number>(0);
    const [batchDefaultDifficulty, setBatchDefaultDifficulty] = useState<0 | 1 | 2>(1);
    const [uploadResult, setUploadResult] = useState<BatchUploadResult | null>(null);

    const [message, setMessage] = useState<string | null>(null);
    const [messageTone, setMessageTone] = useState<"success" | "error" | "info">("success");

    const { data: databaseMetas = [], isLoading: isLoadingMetas } = useGetDatabaseMetasQuery();
    const [createExercise, { isLoading }] = useCreateExerciseMutation();
    const [testQuery] = useTestQueryMutation();
    const [batchUpload, { isLoading: isUploading }] = useBatchUploadExercisesMutation();

    const effectiveDatabaseMetaId = databaseMetaId || databaseMetas[0]?.id || 0;
    const effectiveBatchDatabaseMetaId = batchDatabaseMetaId || databaseMetas[0]?.id || 0;

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        try {
            await createExercise({
                title,
                difficulty,
                databaseMetaId: effectiveDatabaseMetaId,
                correctAnswer,
            }).unwrap();

            setMessageTone("success");
            setMessage("Задание успешно создано и привязано к выбранной логической БД.");
            setTitle("");
            setDifficulty(0);
            setCorrectAnswer("");
        } catch (error) {
            setMessageTone("error");
            setMessage(getApiErrorMessage(error, "Не удалось создать задание."));
        }
    };

    const handleTestQuery = async () => {
        if (!correctAnswer.trim() || !effectiveTestDeploymentId) {
            setMessageTone("error");
            setMessage("Введите SQL-запрос и выберите развертывание для теста.");
            return;
        }

        setIsTestLoading(true);
        setTestResult(null);

        try {
            const result = await testQuery({
                deploymentId: effectiveTestDeploymentId,
                query: correctAnswer,
            }).unwrap();

            setTestResult(result);
            setIsTestPanelOpen(true);
        } catch (error) {
            setMessageTone("error");
            setMessage(getApiErrorMessage(error, "Не удалось выполнить тестовый запрос."));
        } finally {
            setIsTestLoading(false);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const ext = file.name.split('.').pop()?.toLowerCase();
            if (ext !== 'json') {
                setMessageTone("error");
                setMessage("Поддерживается только формат JSON");
                setSelectedFile(null);
                return;
            }
            setSelectedFile(file);
            setMessage(null);
            setUploadResult(null);
        }
    };

    const handleBatchSubmit = async (event: FormEvent) => {
        event.preventDefault();

        if (!selectedFile) {
            setMessageTone("error");
            setMessage("Выберите JSON-файл для загрузки");
            return;
        }

        try {
            const fileContent = await selectedFile.text();
            const parsedData = JSON.parse(fileContent);

            if (!parsedData.exercises || !Array.isArray(parsedData.exercises)) {
                throw new Error("Неверная структура JSON: отсутствует массив 'exercises'");
            }

            const payload = {
                databaseMetaId: parsedData.databaseMetaId || effectiveBatchDatabaseMetaId,
                defaultDifficulty: parsedData.defaultDifficulty ?? batchDefaultDifficulty,
                exercises: parsedData.exercises,
            };

            const result = await batchUpload(payload).unwrap();

            setUploadResult(result);

            if (result.failedCount === 0 && result.skippedCount === 0) {
                setMessageTone("success");
                setMessage(`Успешно загружено ${result.successCount} заданий`);
            } else {
                setMessageTone("info");
                setMessage(
                    `Загружено: ${result.successCount}, пропущено: ${result.skippedCount}, ошибок: ${result.failedCount}`
                );
            }

            setSelectedFile(null);
        } catch (error) {
            setMessageTone("error");
            if (error instanceof SyntaxError) {
                setMessage("Ошибка парсинга JSON: " + error.message);
            } else {
                setMessage(getApiErrorMessage(error, "Не удалось загрузить задания"));
            }
        }
    };

    const downloadTemplate = () => {
        const template = {
            databaseMetaId: effectiveBatchDatabaseMetaId || 1,
            defaultDifficulty: 1,
            exercises: [
                {
                    title: "Пример задания 1",
                    difficulty: 2,
                    correctAnswer: "SELECT * FROM table_name WHERE condition;"
                },
                {
                    title: "Пример задания 2",
                    correctAnswer: "SELECT column1, column2 FROM table_name;"
                }
            ]
        };

        const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'exercises_template.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const isFormValid = title.trim() && correctAnswer.trim() && effectiveDatabaseMetaId !== 0;
    const selectedDbMeta = databaseMetas.find((m) => m.id === effectiveDatabaseMetaId);
    const deployments = selectedDbMeta?.deployments?.filter((d) => d.isDeployed) ?? [];
    const effectiveTestDeploymentId = testDeploymentId || deployments[0]?.id || 0;

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <section className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(212,179,104,0.15),rgba(64,110,132,0.14),rgba(70,175,171,0.12))] p-6 shadow-2xl shadow-black/20 sm:p-8">
                <p className="mb-3 text-xs uppercase tracking-[0.3em] text-text/40">Exercise Builder</p>
                <h1 className="text-3xl font-semibold text-text sm:text-4xl">Создание заданий</h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-text/65">
                    Создавайте задания по одному с возможностью тестирования или загружайте несколько заданий одновременно из JSON-файла.
                </p>
            </section>

            {message && (
                <div
                    className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
                        messageTone === "success"
                            ? "border-green-500/25 bg-green-500/10 text-green-300"
                            : messageTone === "error"
                                ? "border-red-500/25 bg-red-500/10 text-red-300"
                                : "border-accent/25 bg-accent/10 text-accent"
                    }`}
                >
                    {message}
                </div>
            )}

            <section className="mb-6 grid gap-3 md:grid-cols-2">
                {tabItems.map((tab) => {
                    const isActive = tab.id === activeTab;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                                setActiveTab(tab.id);
                                setMessage(null);
                                setUploadResult(null);
                            }}
                            className={`rounded-3xl border p-5 text-left transition ${
                                isActive
                                    ? "border-accent/40 bg-accent/12 shadow-lg shadow-accent/10"
                                    : "border-white/8 bg-white/3 hover:border-white/14 hover:bg-white/5"
                            }`}
                        >
                            <p className={`text-lg font-semibold ${isActive ? "text-accent" : "text-text"}`}>
                                {tab.label}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-text/55">{tab.subtitle}</p>
                        </button>
                    );
                })}
            </section>

            {activeTab === "single" && (
                <section className="grid gap-6 xl:grid-cols-[1fr,0.9fr]">
                    <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                        <div className="mb-6">
                            <h2 className="text-2xl font-semibold text-text">Параметры задания</h2>
                            <p className="mt-1 text-sm text-text/55">Название, сложность, логическая БД и эталонный SQL-запрос.</p>
                        </div>

                        {isLoadingMetas ? (
                            <p className="text-text/55">Загружаем список логических БД...</p>
                        ) : databaseMetas.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-white/10 bg-black/15 px-5 py-10 text-center">
                                <p className="text-text/55">Сначала нужно создать хотя бы одну логическую БД.</p>
                                <Link
                                    to="/admin/databases"
                                    className="mt-4 inline-flex rounded-2xl bg-accent/15 px-4 py-2 font-medium text-accent transition hover:bg-accent/20"
                                >
                                    Перейти в раздел баз
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-text/70">Название задания</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(event) => setTitle(event.target.value)}
                                        placeholder="Например: найти всех клиентов без заказов"
                                        className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 text-text outline-none transition focus:border-accent/50"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-text/70">Логическая БД</label>
                                    <select
                                        value={effectiveDatabaseMetaId}
                                        onChange={(event) => setDatabaseMetaId(Number(event.target.value))}
                                        className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 text-text outline-none transition focus:border-accent/50"
                                    >
                                        {databaseMetas.map((databaseMeta) => (
                                            <option key={databaseMeta.id} value={databaseMeta.id}>
                                                {databaseMeta.logicalName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-3 block text-sm font-medium text-text/70">Сложность</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {difficultyOptions.map((option) => {
                                            const active = option.value === difficulty;

                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => setDifficulty(option.value)}
                                                    className={`rounded-2xl border px-4 py-4 font-medium transition ${
                                                        active ? option.active : option.idle
                                                    }`}
                                                >
                                                    {option.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-text/70">Правильный SQL-ответ</label>
                                    <textarea
                                        rows={8}
                                        value={correctAnswer}
                                        onChange={(event) => setCorrectAnswer(event.target.value)}
                                        placeholder="SELECT ..."
                                        className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 font-mono text-sm text-text outline-none transition focus:border-accent/50"
                                    />

                                    {deployments.length > 0 && (
                                        <div className="mt-4 rounded-2xl border border-white/10 bg-black/15 p-4">
                                            <div className="mb-3 flex items-center justify-between">
                                                <p className="text-sm font-medium text-text/70">
                                                    Протестировать запрос на реальной БД
                                                </p>
                                            </div>

                                            <select
                                                value={effectiveTestDeploymentId}
                                                onChange={(event) => setTestDeploymentId(Number(event.target.value))}
                                                className="mb-3 w-full rounded-xl border border-white/10 bg-[#0f1720] px-3 py-2 text-sm text-text outline-none"
                                            >
                                                {deployments.map((deployment) => (
                                                    <option key={deployment.id} value={deployment.id}>
                                                        {deployment.dbMeta?.dbType} · {deployment.physicaDatabaseName}
                                                    </option>
                                                ))}
                                            </select>

                                            <button
                                                type="button"
                                                onClick={handleTestQuery}
                                                disabled={isTestLoading || !correctAnswer.trim()}
                                                className="w-full rounded-xl border border-secondary/25 bg-secondary/10 px-4 py-2 text-sm font-medium text-secondary transition hover:bg-secondary/15 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {isTestLoading ? "Выполнение..." : "Выполнить запрос"}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <button
                                        type="submit"
                                        disabled={isLoading || !isFormValid}
                                        className="flex-1 rounded-2xl bg-gradient-to-r from-primary to-accent px-5 py-3 font-semibold text-background transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
                                    >
                                        {isLoading ? "Создание..." : "Создать задание"}
                                    </button>
                                    <Link
                                        to="/exercises"
                                        className="flex-1 rounded-2xl border border-white/10 bg-black/15 px-5 py-3 text-center font-medium text-text transition hover:bg-black/20"
                                    >
                                        Вернуться к списку
                                    </Link>
                                </div>
                            </form>
                        )}
                    </div>

                    <aside className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                        <h2 className="text-2xl font-semibold text-text">Подсказки</h2>
                        <div className="mt-5 space-y-4 text-sm leading-6 text-text/60">
                            <p>Выбирайте логическую БД внимательно: именно по ней потом ищутся развертывания для решения.</p>
                            <p>Эталонный SQL должен возвращать тот же результат, что и ожидаемый ответ студента.</p>
                            <p>Если схема еще не создана, сначала добавьте ее в разделе управления базами.</p>
                        </div>

                        {databaseMetas.length > 0 && (
                            <div className="mt-6 rounded-3xl border border-white/8 bg-black/15 p-5">
                                <p className="text-sm font-medium text-text/70">Доступные логические БД</p>
                                <div className="mt-4 space-y-3">
                                    {databaseMetas.map((databaseMeta) => (
                                        <div key={databaseMeta.id} className="rounded-2xl border border-white/8 bg-[#0f1720] px-4 py-3">
                                            <p className="font-medium text-text">{databaseMeta.logicalName}</p>
                                            <p className="mt-1 text-sm text-text/45">{databaseMeta.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {testResult && isTestPanelOpen && (
                            <div className={`mt-6 rounded-[2rem] border p-6 shadow-xl ${
                                testResult.isCorrect
                                    ? "border-green-500/25 bg-green-500/10"
                                    : "border-red-500/25 bg-red-500/10"
                            }`}>
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className={`text-xl font-semibold ${
                                        testResult.isCorrect ? "text-green-200" : "text-red-200"
                                    }`}>
                                        Результат выполнения
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setIsTestPanelOpen(false)}
                                        className="rounded-xl border border-white/10 bg-black/15 px-3 py-1 text-sm text-text transition hover:bg-black/20"
                                    >
                                        Закрыть
                                    </button>
                                </div>

                                <p className="mb-4 text-sm text-text/70">{testResult.message}</p>

                                {testResult.errorDetails && (
                                    <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                                        {testResult.errorDetails}
                                    </div>
                                )}

                                {testResult.isCorrect && testResult.userRows.length > 0 && (
                                    <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0f1720]">
                                        <table className="w-full text-sm">
                                            <thead>
                                            <tr className="border-b border-white/10">
                                                {testResult.columnNames.map((col: string, idx: number) => (
                                                    <th key={idx} className="px-3 py-2 text-left font-medium text-text/70">
                                                        {col}
                                                    </th>
                                                ))}
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {testResult.userRows.slice(0, 10).map((row: string[], rowIdx: number) => (
                                                <tr key={rowIdx} className="border-b border-white/5">
                                                    {row.map((cell: string, cellIdx: number) => (
                                                        <td key={cellIdx} className="px-3 py-2 text-text/80">
                                                            {cell}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                        {testResult.userRowCount > 10 && (
                                            <div className="border-t border-white/10 px-3 py-2 text-center text-sm text-text/50">
                                                ... и еще {testResult.userRowCount - 10} строк
                                            </div>
                                        )}
                                    </div>
                                )}

                                {testResult.isCorrect && testResult.userRows.length === 0 && (
                                    <div className="rounded-xl border border-white/10 bg-black/15 px-4 py-6 text-center text-sm text-text/55">
                                        Запрос выполнен успешно, но не вернул строк (пустой результат)
                                    </div>
                                )}
                            </div>
                        )}
                    </aside>
                </section>
            )}

            {activeTab === "batch" && (
                <section className="grid gap-6 xl:grid-cols-[1fr,0.9fr]">
                    <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                        <div className="mb-6">
                            <h2 className="text-2xl font-semibold text-text">Параметры загрузки</h2>
                            <p className="mt-1 text-sm text-text/55">
                                Выберите логическую БД, сложность по умолчанию и JSON-файл
                            </p>
                        </div>

                        {isLoadingMetas ? (
                            <p className="text-text/55">Загружаем список логических БД...</p>
                        ) : databaseMetas.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-white/10 bg-black/15 px-5 py-10 text-center">
                                <p className="text-text/55">Сначала нужно создать хотя бы одну логическую БД.</p>
                                <Link
                                    to="/admin/databases"
                                    className="mt-4 inline-flex rounded-2xl bg-accent/15 px-4 py-2 font-medium text-accent transition hover:bg-accent/20"
                                >
                                    Перейти в раздел баз
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleBatchSubmit} className="space-y-5">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-text/70">Логическая БД</label>
                                    <select
                                        value={effectiveBatchDatabaseMetaId}
                                        onChange={(e) => setBatchDatabaseMetaId(Number(e.target.value))}
                                        className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 text-text outline-none transition focus:border-accent/50"
                                    >
                                        {databaseMetas.map((meta) => (
                                            <option key={meta.id} value={meta.id}>
                                                {meta.logicalName}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-2 text-sm text-text/45">
                                        Если в JSON указан databaseMetaId, он переопределит это значение
                                    </p>
                                </div>

                                <div>
                                    <label className="mb-3 block text-sm font-medium text-text/70">
                                        Сложность по умолчанию
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {difficultyOptions.map((option) => {
                                            const active = option.value === batchDefaultDifficulty;

                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => setBatchDefaultDifficulty(option.value)}
                                                    className={`rounded-2xl border px-4 py-3 transition ${
                                                        active ? option.active : option.idle
                                                    }`}
                                                >
                                                    {option.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="mt-2 text-sm text-text/45">
                                        Применяется к заданиям без явно указанной сложности
                                    </p>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-text/70">
                                        JSON-файл с заданиями
                                    </label>
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleFileChange}
                                        className="block w-full rounded-2xl border border-dashed border-white/12 bg-[#0f1720] px-4 py-3 text-sm text-text/60 file:mr-4 file:rounded-xl file:border-0 file:bg-accent/15 file:px-4 file:py-2 file:font-medium file:text-accent"
                                    />
                                    {selectedFile && (
                                        <p className="mt-2 text-sm text-green-300">
                                            Выбран файл: {selectedFile.name}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <button
                                        type="submit"
                                        disabled={isUploading || !selectedFile}
                                        className="flex-1 rounded-2xl bg-gradient-to-r from-primary to-accent px-5 py-3 font-semibold text-background transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
                                    >
                                        {isUploading ? "Загрузка..." : "Загрузить задания"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={downloadTemplate}
                                        className="flex-1 rounded-2xl border border-secondary/25 bg-secondary/10 px-5 py-3 font-medium text-secondary transition hover:bg-secondary/15"
                                    >
                                        Скачать шаблон
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    <aside className="space-y-6">
                        <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                            <h2 className="text-2xl font-semibold text-text">Формат JSON</h2>
                            <div className="mt-4 space-y-3 text-sm text-text/60">
                                <p>• <code className="text-accent">databaseMetaId</code> — ID логической БД (опционально)</p>
                                <p>• <code className="text-accent">defaultDifficulty</code> — 0/1/2 (опционально)</p>
                                <p>• <code className="text-accent">exercises</code> — массив заданий</p>
                                <p>• <code className="text-accent">title</code> — название задания</p>
                                <p>• <code className="text-accent">difficulty</code> — сложность (опционально)</p>
                                <p>• <code className="text-accent">correctAnswer</code> — SQL-запрос</p>
                            </div>

                            <div className="mt-4 rounded-xl bg-[#0f1720] p-4">
                                <pre className="overflow-x-auto text-xs text-text/70">
{`{
  "databaseMetaId": 1,
  "defaultDifficulty": 1,
  "exercises": [
    {
      "title": "Золотые медали",
      "difficulty": 2,
      "correctAnswer": "SELECT..."
    },
    {
      "title": "Медали по годам",
      "correctAnswer": "SELECT..."
    }
  ]
}`}
                                </pre>
                            </div>
                        </div>

                        {uploadResult && (
                            <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                                <h2 className="text-2xl font-semibold text-text">Результаты загрузки</h2>

                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    <div className="rounded-2xl border border-green-500/25 bg-green-500/10 p-4 text-center">
                                        <p className="text-2xl font-bold text-green-300">{uploadResult.successCount}</p>
                                        <p className="mt-1 text-sm text-text/55">Успешно</p>
                                    </div>
                                    <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-4 text-center">
                                        <p className="text-2xl font-bold text-yellow-300">{uploadResult.skippedCount}</p>
                                        <p className="mt-1 text-sm text-text/55">Пропущено</p>
                                    </div>
                                    {uploadResult.failedCount > 0 && (
                                        <div className="col-span-2 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-center">
                                            <p className="text-2xl font-bold text-red-300">{uploadResult.failedCount}</p>
                                            <p className="mt-1 text-sm text-text/55">Ошибок</p>
                                        </div>
                                    )}
                                </div>

                                {uploadResult.errors.length > 0 && (
                                    <div className="mt-4">
                                        <p className="mb-2 font-medium text-red-300">Детали ошибок:</p>
                                        <div className="max-h-64 space-y-2 overflow-y-auto">
                                            {uploadResult.errors.map((error, idx) => (
                                                <div
                                                    key={idx}
                                                    className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm"
                                                >
                                                    <p className="font-medium text-red-200">
                                                        Строка {error.lineNumber}: {error.title}
                                                    </p>
                                                    <p className="mt-1 text-red-300/70">{error.errorMessage}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </aside>
                </section>
            )}
        </div>
    );
};