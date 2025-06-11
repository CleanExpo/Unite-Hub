// ... existing code ...
    try {
        await runOrdered(allModels);
    } catch (error) {
        logger.error('Failed to run models sequentially', error);
        throw error; // Re-throw the error for higher-level handling
    }
// ... existing code ...