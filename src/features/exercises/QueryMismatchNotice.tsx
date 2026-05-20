type QueryMismatchNoticeProps = {
    message: string;
    className?: string;
};

const getMismatchMeta = (message: string) => {
    if (message.startsWith("Количество столбцов не совпадает:")) {
        return {
            title: "Не совпало количество столбцов",
            details: message.replace("Количество столбцов не совпадает:", "").trim(),
        };
    }

    if (message.startsWith("Имена или порядок столбцов не совпадают.")) {
        return {
            title: "Не совпали столбцы",
            details: message.replace("Имена или порядок столбцов не совпадают.", "").trim(),
        };
    }

    if (message.startsWith("Количество строк не совпадает:")) {
        return {
            title: "Не совпало количество строк",
            details: message.replace("Количество строк не совпадает:", "").trim(),
        };
    }

    if (message.startsWith("Данные не совпадают в строке")) {
        return {
            title: "Не совпали данные",
            details: message,
        };
    }

    return {
        title: "Результат отличается от ожидаемого"
    };
};

export function QueryMismatchNotice({ message, className = "" }: QueryMismatchNoticeProps) {
    const meta = getMismatchMeta(message);

    return (
        <div className={`rounded-2xl border border-white/10 bg-black/15 px-2 py-2 ${className}`.trim()}>
            <p className="text-sm font-semibold text-text">{meta.title}</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-text/75">{meta.details}</p>
        </div>
    );
}
