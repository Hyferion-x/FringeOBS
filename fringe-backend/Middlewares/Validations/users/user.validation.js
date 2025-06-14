const { user } = require('./user.schema');

module.exports = {
  addUserValidation: (req, res, next) => {
    console.log('✅ Running user validation...');

    const { error } = user.validate(req.body, { abortEarly: false });

    if (error) {
      console.log('❌ Validation Failed:', error.details.map(err => err.message));

      return res.status(400).json({
        success: false,
        errors: error.details.map(err => err.message),
      });
    }

    console.log('✅ Validation Successful.');
    next();
  },
};
