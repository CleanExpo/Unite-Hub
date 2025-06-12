try {
    // Some code that may throw an error
} catch (error) {
    console.error('An error occurred:', error);
    throw error; // Proper error handling by re-throwing the error
}