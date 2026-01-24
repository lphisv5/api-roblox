import { AppError } from '../utils/errors.js';

const VALID_TIMEZONES = [
  'Asia/Bangkok',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Asia/Tokyo',
  'Australia/Sydney',
  'UTC'
];

export const validateTimezone = (req, res, next) => {
  const tz = req.query.tz;

  if (tz && !VALID_TIMEZONES.includes(tz)) {
    throw new AppError(
      `Invalid timezone. Valid options: ${VALID_TIMEZONES.join(', ')}`,
      400,
      { validTimezones: VALID_TIMEZONES }
    );
  }

  next();
};
