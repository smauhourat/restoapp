const cleanRequestBody = (body) => {
    const cleaned = {};
    for (const [key, value] of Object.entries(body)) {
        cleaned[key] = typeof value === 'string' ? value.trim() : value;
    }
    return cleaned;
};

export default cleanRequestBody;