type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
    typeof value === "object" && value !== null;

const readKnownMessage = (value: unknown): string | null => {
    if (typeof value === "string" && value.trim()) {
        return value;
    }

    if (!isRecord(value)) {
        return null;
    }

    const candidates = [value.message, value.error, value.title];

    for (const candidate of candidates) {
        if (typeof candidate === "string" && candidate.trim()) {
            return candidate;
        }
    }

    return null;
};

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
    const directMessage = readKnownMessage(error);
    if (directMessage) {
        return directMessage;
    }

    if (isRecord(error) && "data" in error) {
        const nestedMessage = readKnownMessage(error.data);
        if (nestedMessage) {
            return nestedMessage;
        }
    }

    return fallback;
};
