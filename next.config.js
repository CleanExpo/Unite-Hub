module.exports = {
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  },
}
