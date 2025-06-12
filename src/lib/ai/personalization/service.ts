try {
    // ... code that may throw an error ...
} catch (error) {
    // Handle errors properly by logging them and exiting
    console.error(`Failed to process data: ${error.message}`, error);
    process.exit(1);
}