const { event } = require('./event.schema');

module.exports = {
  validateEvent: async (req, res, next) => {
    console.log('Event validation running...'.blue);
    const value = await event.validate(req.body);
    if (value.error) {
      console.log('Event validation failed!'.red);
      return res.status(400).json({
        success: 0,
        message: value.error.details[0].message,
      });
    }
    console.log('Event validation successful.'.green);
    next();
  },
};