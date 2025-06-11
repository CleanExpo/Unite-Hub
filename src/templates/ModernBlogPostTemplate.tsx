const getBlogContent = async () => {
    try {
        // Code that may throw errors
        const response = await fetch(`/api/blog/${id}`);
        return await response.json();
    } catch {
        // Inadequate error handling
    }
};