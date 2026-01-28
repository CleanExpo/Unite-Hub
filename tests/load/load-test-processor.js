/**
 * Artillery Load Test Processor
 * Custom functions for load testing scenarios
 */

module.exports = {
  // Generate random user data
  generateUserData: function (context, events, done) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    context.vars.randomEmail = `loadtest${timestamp}${random}@example.com`;
    context.vars.randomName = `User${random}`;
    return done();
  },

  // Log response time
  logResponseTime: function (requestParams, response, context, ee, next) {
    const responseTime = response.timings.phases.total;
    console.log(`Response time: ${responseTime}ms`);
    return next();
  },

  // Custom assertion for response time
  assertResponseTime: function (requestParams, response, context, ee, next) {
    const maxResponseTime = 2000; // 2 seconds
    const responseTime = response.timings.phases.total;

    if (responseTime > maxResponseTime) {
      console.error(`Slow response detected: ${responseTime}ms (max: ${maxResponseTime}ms)`);
      ee.emit('customStat', {
        stat: 'slowResponses',
        value: 1,
      });
    }

    return next();
  },

  // Check for errors in response
  checkForErrors: function (requestParams, response, context, ee, next) {
    if (response.statusCode >= 500) {
      ee.emit('customStat', {
        stat: 'serverErrors',
        value: 1,
      });
      console.error(`Server error: ${response.statusCode} on ${requestParams.url}`);
    } else if (response.statusCode === 429) {
      ee.emit('customStat', {
        stat: 'rateLimitHits',
        value: 1,
      });
      console.warn(`Rate limit hit on ${requestParams.url}`);
    }

    return next();
  },

  // Monitor memory usage
  monitorMemory: function (context, events, done) {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memory = process.memoryUsage();
      console.log(`Memory usage: ${Math.round(memory.heapUsed / 1024 / 1024)}MB / ${Math.round(memory.heapTotal / 1024 / 1024)}MB`);
    }
    return done();
  },
};
