const joi = require('@hapi/joi');

const schema = {
  event: joi.object({
    name: joi.string().min(3).max(50).required(),
    description: joi.string().min(10).max(500).required(),
    venue: joi.string().required(),
    date: joi.date().iso().required(),
    category: joi.string().valid('Comedy', 'Music', 'Theatre', 'Dance', 'Other').required(),
    ticketPrices: joi.object({
      standard: joi.number().min(0).required(),
      vip: joi.number().min(0).required(),
      student: joi.number().min(0).required(),
    }).required(),
    seatingCapacity: joi.number().min(1).max(10000).required(),
    imgUrl: joi.string().uri().allow('').optional(),
  }),
};

module.exports = { event: schema.event };