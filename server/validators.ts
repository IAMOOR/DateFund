import type { Request, Response, NextFunction } from "express";

const ALLOWED_MOODS = ["Romantic", "Adventurous", "Cozy", "Playful", "Luxurious", "Relaxed"];

export function validateSuggestDateRequest(req: Request, res: Response, next: NextFunction) {
  const body = req.body || {};
  const { goals = [], events = [] } = body;

  if (!Array.isArray(goals) || !Array.isArray(events)) {
    return res.status(400).json({
      error: "Invalid request format: 'goals' and 'events' must be arrays.",
      code: "INVALID_SCHEMA"
    });
  }

  if (goals.length > 15 || events.length > 15) {
    return res.status(400).json({
      error: "Array limit exceeded: maximum 15 goals and 15 events permitted.",
      code: "PAYLOAD_TOO_LARGE"
    });
  }

  for (const g of goals) {
    if (typeof g !== "object" || g === null) {
      return res.status(400).json({ error: "Each goal must be an object.", code: "INVALID_SCHEMA" });
    }
    if (g.name && (typeof g.name !== "string" || g.name.length > 150)) {
      return res.status(400).json({ error: "Goal name must be a string up to 150 characters.", code: "INVALID_SCHEMA" });
    }
    if (g.targetAmount !== undefined && (typeof g.targetAmount !== "number" || g.targetAmount < 0 || g.targetAmount > 100000000)) {
      return res.status(400).json({ error: "Goal targetAmount must be a non-negative number.", code: "INVALID_SCHEMA" });
    }
  }

  for (const e of events) {
    if (typeof e !== "object" || e === null) {
      return res.status(400).json({ error: "Each event must be an object.", code: "INVALID_SCHEMA" });
    }
    if (e.title && (typeof e.title !== "string" || e.title.length > 150)) {
      return res.status(400).json({ error: "Event title must be a string up to 150 characters.", code: "INVALID_SCHEMA" });
    }
  }

  next();
}

export function validateDiscoverSuggestionsRequest(req: Request, res: Response, next: NextFunction) {
  const body = req.body || {};
  const { goals = [] } = body;

  if (!Array.isArray(goals)) {
    return res.status(400).json({
      error: "Invalid request format: 'goals' must be an array.",
      code: "INVALID_SCHEMA"
    });
  }

  if (goals.length > 15) {
    return res.status(400).json({
      error: "Array limit exceeded: maximum 15 goals permitted.",
      code: "PAYLOAD_TOO_LARGE"
    });
  }

  next();
}

export function validateDiscoverIdeasRequest(req: Request, res: Response, next: NextFunction) {
  const body = req.body || {};
  const { query, provinceName, mood, location, goals = [], events = [] } = body;

  if (query && (typeof query !== "string" || query.length > 200)) {
    return res.status(400).json({
      error: "Query parameter must be a string under 200 characters.",
      code: "INVALID_SCHEMA"
    });
  }

  if (provinceName && (typeof provinceName !== "string" || provinceName.length > 60)) {
    return res.status(400).json({
      error: "provinceName must be a string under 60 characters.",
      code: "INVALID_SCHEMA"
    });
  }

  if (mood && (typeof mood !== "string" || !ALLOWED_MOODS.includes(mood))) {
    return res.status(400).json({
      error: `Invalid mood. Allowed moods: ${ALLOWED_MOODS.join(", ")}`,
      code: "INVALID_SCHEMA"
    });
  }

  if (location) {
    if (typeof location !== "object" || typeof location.lat !== "number" || typeof location.lng !== "number") {
      return res.status(400).json({
        error: "Location must be an object with numeric lat and lng coordinates.",
        code: "INVALID_SCHEMA"
      });
    }
    if (location.lat < -90 || location.lat > 90 || location.lng < -180 || location.lng > 180) {
      return res.status(400).json({
        error: "Coordinates out of geographic range.",
        code: "INVALID_SCHEMA"
      });
    }
  }

  if (!Array.isArray(goals) || !Array.isArray(events) || goals.length > 15 || events.length > 15) {
    return res.status(400).json({
      error: "Goals and events must be arrays with maximum 15 items each.",
      code: "INVALID_SCHEMA"
    });
  }

  next();
}

export function validateRomanticTipsRequest(req: Request, res: Response, next: NextFunction) {
  const body = req.body || {};
  const { mood } = body;

  if (mood && (typeof mood !== "string" || !ALLOWED_MOODS.includes(mood))) {
    return res.status(400).json({
      error: `Invalid mood parameter. Allowed moods are: ${ALLOWED_MOODS.join(", ")}.`,
      code: "INVALID_SCHEMA"
    });
  }

  next();
}

export function validateStreamRequest(req: Request, res: Response, next: NextFunction) {
  const body = req.body || {};
  const { prompt } = body;

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({
      error: "Missing required string parameter 'prompt'.",
      code: "MISSING_PROMPT"
    });
  }

  const trimmed = prompt.trim();
  if (trimmed.length === 0) {
    return res.status(400).json({
      error: "Prompt cannot be empty.",
      code: "EMPTY_PROMPT"
    });
  }

  if (trimmed.length > 600) {
    return res.status(400).json({
      error: "Prompt exceeds maximum allowed length of 600 characters.",
      code: "PROMPT_TOO_LONG"
    });
  }

  req.body.prompt = trimmed;
  next();
}

export function validateMapConciergeRequest(req: Request, res: Response, next: NextFunction) {
  const body = req.body || {};
  const { prompt, provinceName, location, budgetRand } = body;

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({
      error: "Missing required string parameter 'prompt'.",
      code: "MISSING_PROMPT"
    });
  }

  const trimmed = prompt.trim();
  if (trimmed.length === 0) {
    return res.status(400).json({
      error: "Prompt cannot be empty.",
      code: "EMPTY_PROMPT"
    });
  }

  if (trimmed.length > 500) {
    return res.status(400).json({
      error: "Prompt exceeds maximum allowed length of 500 characters.",
      code: "PROMPT_TOO_LONG"
    });
  }

  if (provinceName && (typeof provinceName !== "string" || provinceName.length > 60)) {
    return res.status(400).json({
      error: "provinceName must be a string under 60 characters.",
      code: "INVALID_SCHEMA"
    });
  }

  if (location) {
    if (typeof location !== "object" || typeof location.lat !== "number" || typeof location.lng !== "number") {
      return res.status(400).json({
        error: "Location must be an object with numeric lat and lng coordinates.",
        code: "INVALID_SCHEMA"
      });
    }
    if (location.lat < -90 || location.lat > 90 || location.lng < -180 || location.lng > 180) {
      return res.status(400).json({
        error: "Coordinates out of geographic range.",
        code: "INVALID_SCHEMA"
      });
    }
  }

  if (budgetRand !== undefined && (typeof budgetRand !== "number" || budgetRand < 0 || budgetRand > 1000000)) {
    return res.status(400).json({
      error: "budgetRand must be a number between 0 and 1,000,000.",
      code: "INVALID_SCHEMA"
    });
  }

  req.body.prompt = trimmed;
  next();
}

export function validateMapWeatherRequest(req: Request, res: Response, next: NextFunction) {
  const body = req.body || {};
  const { lat, lng } = body;

  if (typeof lat !== "number" || typeof lng !== "number" || Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({
      error: "Valid numeric 'lat' and 'lng' coordinates are required.",
      code: "INVALID_COORDINATES"
    });
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return res.status(400).json({
      error: "Coordinates out of geographic range.",
      code: "INVALID_COORDINATES"
    });
  }

  next();
}

